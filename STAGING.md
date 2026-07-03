# Staging environment

A staging stack is a full copy of production (web + API + database) that
deploys from the `staging` branch instead of `main`. It exists so risky
changes can be tested against real infra before they touch prod:

- **Refresh-token rotation** (shrinking the 30-day access token) — needs a real
  login -> expiry -> refresh cycle to verify nobody gets logged out.
- **Redis-backed throttling / idempotency** — needs a real Redis instance.
- **CSP tightening** — a wrong policy silently breaks pages; needs a live site to
  click through.

The golden rule: **staging is isolated**. Its database is a Neon branch (a
copy), its secrets are its own (a token signed in staging must never be valid on
prod), and its OAuth redirects are separate.

---

## One-time setup

### 1. Database — a Neon branch

In the Neon console, open the project and create a branch named `staging` off
`main`. Neon gives you a separate connection string; the branch starts as a
copy-on-write clone of prod data, fully isolated. Copy that `?sslmode=require`
URL for step 2.

> Migrations run automatically on deploy (`migrate:deploy` in the start
> command), so the staging DB stays in sync with the `staging` branch's schema.

### 2. API — the Render staging service

`render.yaml` already defines `skillverify-api-staging` (branch: `staging`).
In the Render dashboard, sync the Blueprint so Render creates it, then fill the
`sync: false` env vars for that service:

| Var                           | Value                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL`                | the Neon **staging branch** URL from step 1                                               |
| `NEXTAUTH_URL`                | the staging web URL from step 3 (e.g. `https://skillverify-git-staging-<you>.vercel.app`) |
| `CORS_ORIGINS`                | same as `NEXTAUTH_URL`                                                                    |
| `GOOGLE_CLIENT_ID` / `SECRET` | staging OAuth app, or reuse prod + add the staging redirect (step 4)                      |
| `GITHUB_CLIENT_ID` / `SECRET` | same                                                                                      |

`JWT_SECRET` and `ENCRYPTION_KEY` are auto-generated per service, so staging
gets its own. Optional feature vars (`S3_*`, `RESEND_API_KEY`, `SENTRY_DSN`,
`RAZORPAY_*`, `OPENROUTER_API_KEY`, `REDIS_URL`) no-op if unset — add only the
ones you need to exercise.

### 3. Web — Vercel preview

Vercel already builds a **Preview deployment** for every branch, so the
`staging` branch gets a URL automatically once it exists (step: "Create the
branch" below). To point that preview at the staging API, set these as
**Preview-scoped** env vars in Vercel (Project -> Settings -> Environment
Variables -> Preview):

| Var                   | Value                                                                           |
| --------------------- | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | the staging API URL, e.g. `https://skillverify-api-staging.onrender.com/api/v1` |
| `NEXTAUTH_URL`        | the staging web preview URL                                                     |
| `NEXTAUTH_SECRET`     | a staging-only secret (any strong random string)                                |

`NEXT_PUBLIC_*` is baked at build time, so redeploy the `staging` branch after
setting it.

### 4. OAuth redirect URIs

Add the staging callbacks so Google/GitHub login works on the preview:

- Google Cloud Console -> Credentials -> add `https://<staging-web-url>/api/auth/callback/google`
- GitHub -> OAuth App -> add `https://<staging-web-url>/api/auth/callback/github`

---

## Everyday workflow

```bash
# branch off main for a risky change
git checkout staging
git merge main          # keep staging current
git checkout -b feature/refresh-tokens
# ... build the change ...
git checkout staging && git merge feature/refresh-tokens
git push origin staging # -> Render + Vercel deploy staging automatically
```

Test on the staging URLs. When it's proven, merge `staging` (or the feature
branch) into `main`:

```bash
git checkout main && git merge staging && git push origin main
```

## Testing refresh-token rotation here (the reason this exists)

1. Log in on the staging web URL.
2. Temporarily set the staging API's access-token TTL short (e.g. 60s).
3. Wait past expiry, then make an authenticated action.
4. Confirm the client silently refreshes and the action succeeds — no logout.
5. Only once that round-trips cleanly on staging, port the change to `main`.
