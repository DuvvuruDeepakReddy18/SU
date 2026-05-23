# Deploy SkillVerify (free tier, no credit card)

| Piece            | Where                  | Free tier                               |
| ---------------- | ---------------------- | --------------------------------------- |
| Next.js frontend | **Vercel**             | Free, no card                           |
| NestJS API       | **Render** Web Service | Free, no card, sleeps after 15 min idle |
| Postgres         | **Neon**               | 0.5 GB, never sleeps, no project limit  |
| Redis (BullMQ)   | **Upstash** Redis      | 10k commands/day                        |
| File storage     | **Cloudflare R2**      | 10 GB, S3-compatible                    |

**Total time:** ~30 minutes the first time. All accounts are free, none require a credit card.

> Heads-up: Render's free Web Service sleeps after 15 minutes of no traffic.
> The first request after a sleep takes ~30 seconds to wake. For a demo this is
> fine; if you ever need always-on, upgrade Render to the $7/mo Starter plan
> or swap to Railway.

---

## Prerequisites

1. **A GitHub account** with this repo pushed to it (already done — https://github.com/DuvvuruDeepakReddy18/SU).

---

## Step 1 — Postgres on Neon (5 min)

1. Go to **https://console.neon.tech/** and sign in with GitHub.
2. The first signup auto-creates a project. If not, click **New Project** → name `skillverify` → Postgres 17 → region close to you → **Create**.
3. After ~30 seconds the project is ready. You'll see a **Connection string** card. Copy the value (toggle "Show password" first). It looks like:

   ```
   postgresql://neondb_owner:xxxxxxx@ep-something-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

   This is your **`DATABASE_URL`**. Save it.

4. **Enable pgvector** (we use it for AI features):
   - Sidebar → **SQL Editor** → paste `CREATE EXTENSION IF NOT EXISTS vector;` → **Run**.
   - You should see "CREATE EXTENSION".

> Tip: Neon auto-suspends idle projects after 5 min on free tier, but wakes in
> under a second on the next query — much faster than Render's wake time.

---

## Step 2 — File storage on Cloudflare R2 (5 min)

1. Go to **https://dash.cloudflare.com/sign-up** and create an account (no card needed).
2. Verify your email if asked.
3. Left sidebar → **R2 Object Storage** → if it's your first time, click **Enable R2** (this is the page that _might_ show a "Subscribe to Plan" button — choose the **Free** plan, it does not ask for a card).
4. **Create bucket** → name it `skillverify` → choose a location close to you → **Create**.
5. **Settings tab** of the bucket → scroll to **Public access** → click **Allow Access** → confirm. Cloudflare gives you a **Public R2.dev URL** that looks like:

   ```
   https://pub-abc123def456.r2.dev
   ```

   Copy this — it's your `S3_PUBLIC_URL` (append `/skillverify` per bucket access).

6. Back to the main **R2** page → **Manage R2 API Tokens** (top right) → **Create API token**:
   - Token name: `skillverify-api`
   - Permissions: **Object Read & Write**
   - Specify bucket: `skillverify`
   - TTL: forever
   - Create
7. You now see **Access Key ID** and **Secret Access Key**. **Copy both immediately** (the secret is shown only once). Also note the **S3 API endpoint** below them, which looks like:

   ```
   https://<accountid>.r2.cloudflarestorage.com
   ```

8. Save these values:
   ```
   S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
   S3_REGION=auto
   S3_BUCKET=skillverify
   S3_KEY=<access key id>
   S3_SECRET=<secret access key>
   S3_PUBLIC_URL=https://pub-xxxxxx.r2.dev/skillverify
   ```

---

## Step 3 — Redis on Upstash (2 min)

1. Go to **https://console.upstash.com/** → sign in with GitHub.
2. **Create database** → name `skillverify` → **Regional** → region close to you → **TLS Enabled** ✓ → Create.
3. Scroll to **Connect to your database** → copy the **redis://** URL (the one starting `rediss://`).
   This is your **`REDIS_URL`**.

---

## Step 4 — Deploy the API on Render (10 min)

1. Go to **https://render.com/** → sign in with GitHub.
2. Dashboard → **New +** → **Blueprint**.
3. **Connect a repository** → select your `skillverify` repo → **Connect**.
4. Render auto-detects [`render.yaml`](render.yaml). Click **Apply**.
5. Render now asks you to fill in the `sync: false` env vars (the ones it can't generate). Fill these in:

| Env var                                                            | Value                                                                   |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `DATABASE_URL`                                                     | (from Step 1)                                                           |
| `REDIS_URL`                                                        | (from Step 3)                                                           |
| `S3_ENDPOINT`, `S3_REGION`, `S3_KEY`, `S3_SECRET`, `S3_PUBLIC_URL` | (from Step 2)                                                           |
| `OPENROUTER_API_KEY`                                               | https://openrouter.ai/settings/keys                                     |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                         | https://console.cloud.google.com/apis/credentials                       |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`                         | https://github.com/settings/developers                                  |
| `NEXTAUTH_URL`                                                     | **Leave blank for now** — you'll come back after Vercel gives you a URL |
| `CORS_ORIGINS`                                                     | **Leave blank for now** — same reason                                   |

6. Click **Apply** → Render starts building. Watch the build log. First build takes ~5 min.

7. When the service shows **Live**, copy the API URL — it looks like:
   ```
   https://skillverify-api.onrender.com
   ```
   This is your **`API_URL`**. Save it. Test it:
   ```
   https://skillverify-api.onrender.com/api/v1/health
   ```
   Should return `{"status":"ok",...}`.

---

## Step 5 — Deploy the frontend on Vercel (5 min)

1. Go to **https://vercel.com/** → sign in with GitHub.
2. **Add New** → **Project** → import your `skillverify` repo.
3. **Configure project**:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** click **Edit** → set to `apps/web`
   - **Build & Output Settings:** leave defaults (the [`apps/web/vercel.json`](apps/web/vercel.json) overrides them correctly for our monorepo)
   - **Environment Variables:** add these:

| Name                   | Value                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | your Render API URL from Step 4                                       |
| `NEXTAUTH_URL`         | leave blank for first deploy — Vercel gives you a URL, then come back |
| `NEXTAUTH_SECRET`      | run `openssl rand -hex 32` in any terminal, paste output              |
| `GOOGLE_CLIENT_ID`     | same as Render                                                        |
| `GOOGLE_CLIENT_SECRET` | same as Render                                                        |
| `GITHUB_CLIENT_ID`     | same as Render                                                        |
| `GITHUB_CLIENT_SECRET` | same as Render                                                        |

4. **Deploy**. First build takes ~3 min.

5. When done, copy the Vercel URL (e.g. `https://skillverify-xxx.vercel.app`).

---

## Step 6 — Wire frontend ↔ backend (3 min)

You now have both URLs. Connect them:

### On Vercel

- **Settings** → **Environment Variables** → set `NEXTAUTH_URL` to your Vercel URL.
- **Deployments** → ⋯ on the latest → **Redeploy**.

### On Render

- **Environment** tab → set:
  - `NEXTAUTH_URL` = your Vercel URL (e.g. `https://skillverify.vercel.app`)
  - `CORS_ORIGINS` = same Vercel URL (comma-separated if you have more)
- Render auto-redeploys.

### Update OAuth callbacks

- Google Cloud Console → Credentials → your OAuth client → **Authorized redirect URIs** → add:
  ```
  https://<your-vercel-url>/api/auth/callback/google
  ```
- GitHub → Settings → Developer settings → OAuth App → **Authorization callback URL** → set to:
  ```
  https://<your-vercel-url>/api/auth/callback/github
  ```

---

## Step 7 — Seed the production database (optional, 1 min)

To pre-load the 17 domains, 200+ skills, 100 problems, 5 demo users:

In your local terminal, set the production `DATABASE_URL` temporarily and seed:

```powershell
# Replace with your Neon URL
$env:DATABASE_URL = "postgresql://neondb_owner:xxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
pnpm --filter @skillverify/db migrate:deploy
pnpm --filter @skillverify/db seed:prod
pnpm --filter @skillverify/api exec tsx scripts/seed-domains.ts
```

---

## Verifying

1. Visit your Vercel URL → should load the landing page.
2. Visit `/u/arjun-mehta` (if you seeded) → should load the public portfolio fetched from the Render API.
3. Sign up with a real institution email or use a demo account (`arjun@iimu.ac.in` / `password123` if seeded).
4. Once signed in, try uploading a resume → it should land in Cloudflare R2 and parse via OpenRouter.

## Troubleshooting

| Symptom                                                       | Cause                                                   | Fix                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| Frontend loads but `/dashboard` shows "Couldn't load profile" | API not reachable from browser, or CORS                 | Check `NEXT_PUBLIC_API_URL` in Vercel + `CORS_ORIGINS` in Render |
| `/api/auth/signin` fails with "Configuration"                 | `NEXTAUTH_URL` or `NEXTAUTH_SECRET` missing on Vercel   | Set both, redeploy                                               |
| Sign-in via Google/GitHub → "redirect_uri_mismatch"           | Callback URL not registered on the OAuth provider       | Add the Vercel URL as authorized callback (Step 6)               |
| API healthcheck 502 / not loading                             | Render service is asleep (cold start)                   | Hit it once and wait 30s                                         |
| Resume upload returns 500 with "File storage not configured"  | S3 env vars wrong on Render                             | Re-paste R2 credentials, ensure S3_REGION=auto                   |
| Database migrations don't run                                 | First deploy needed Render to be live before migrations | Trigger a manual deploy from Render dashboard                    |

## Costs to be aware of

- **OpenRouter** — free models have rate limits (~50 req/day per model). For heavy use, the fallback chain keeps things working but very heavy resume parsing volume needs paid models. Set a usage cap at openrouter.ai/settings/limits.
- **Neon** — 0.5 GB Postgres covers thousands of users. Compute is metered as "compute hours" — free tier gives 191 h/mo, more than enough for one always-on project.
- **Cloudflare R2** — 10 GB storage, 1M Class A operations/month, 10M Class B. Egress is FREE (this is R2's killer feature).
- **Upstash** — 10k commands/day. Each background job is a few commands; comfortable for hundreds of submissions/day.
- **Render** — free Web Service has a 750 hour/month cap. Single service is well under the limit.
- **Vercel** — Hobby plan covers personal projects. Watch for bandwidth on free tier (100 GB/mo).
