# Deploy SkillVerify (free tier, no credit card)

| Piece            | Where                  | Free tier                               |
| ---------------- | ---------------------- | --------------------------------------- |
| Next.js frontend | **Vercel**             | Free, no card                           |
| NestJS API       | **Render** Web Service | Free, no card, sleeps after 15 min idle |
| Postgres         | **Supabase**           | 500 MB, never sleeps                    |
| Redis (BullMQ)   | **Upstash** Redis      | 10k commands/day                        |
| File storage     | **Supabase Storage**   | 1 GB                                    |

**Total time:** ~30 minutes the first time. All accounts are free.

> Heads-up: Render's free Web Service sleeps after 15 minutes of no traffic.
> The first request after a sleep takes ~30 seconds to wake. For a demo this is
> fine; if you ever need always-on, upgrade Render to the $7/mo Starter plan
> or swap to Railway.

---

## Prerequisites

1. **A GitHub account** with this repo pushed to it.
2. Decide a project name slug. Examples below use `skillverify` — replace as you like.

If you haven't pushed yet:

```powershell
# create a new empty repo on github.com first, then:
git remote add origin https://github.com/<you>/skillverify.git
git push -u origin main
```

---

## Step 1 — Postgres on Supabase (5 min)

1. Go to **https://supabase.com/dashboard** and sign in with GitHub.
2. **New project** → name `skillverify` → choose a strong DB password (save it!) → region closest to you → Create.
3. Wait ~2 minutes for provisioning.
4. Sidebar → **Settings** → **Database** → scroll to **Connection string** → choose **URI** mode → copy. It looks like:

   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres
   ```

   Replace `[YOUR-PASSWORD]` with the password you set.
   This is your **`DATABASE_URL`**. Save it.

5. **Enable pgvector** (we use it for embeddings):
   - Sidebar → **Database** → **Extensions** → search `vector` → toggle on.

---

## Step 2 — File storage on Supabase Storage (3 min)

Stays inside the same Supabase project.

1. Sidebar → **Storage** → **New bucket** → name it `skillverify` → toggle **Public** ON → Create.
2. Sidebar → **Settings** → **Storage** → scroll to **S3 Connection** section.
3. Click **Enable connection** (if not already), then **New access key** → name `skillverify-api` → copy:
   - **Access key ID** → this is your `S3_KEY`
   - **Secret access key** → this is your `S3_SECRET` (shown ONLY once)
4. The S3 endpoint shown is your `S3_ENDPOINT`. It looks like:
   ```
   https://xxxxx.supabase.co/storage/v1/s3
   ```
5. Save these values:
   ```
   S3_ENDPOINT=https://xxxxx.supabase.co/storage/v1/s3
   S3_REGION=us-east-1            # any region works, Supabase ignores it
   S3_BUCKET=skillverify
   S3_KEY=...
   S3_SECRET=...
   S3_PUBLIC_URL=https://xxxxx.supabase.co/storage/v1/object/public/skillverify
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
# Replace with your Supabase URL
$env:DATABASE_URL = "postgresql://postgres.xxxxx:....pooler.supabase.com:6543/postgres"
pnpm --filter @skillverify/db seed:prod
pnpm --filter @skillverify/api exec dotenv -e ../../.env -- tsx scripts/seed-domains.ts
# (the domain seed reads .env — set it temporarily or copy the SQL)
```

---

## Verifying

1. Visit your Vercel URL → should load the landing page.
2. Visit `/u/arjun-mehta` (if you seeded) → should load the public portfolio fetched from the Render API.
3. Sign up with a real institution email or use a demo account (`arjun@iimu.ac.in` / `password123` if seeded).
4. Once signed in, try uploading a resume → it should land in Supabase Storage and parse via OpenRouter.

## Troubleshooting

| Symptom                                                       | Cause                                                   | Fix                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| Frontend loads but `/dashboard` shows "Couldn't load profile" | API not reachable from browser, or CORS                 | Check `NEXT_PUBLIC_API_URL` in Vercel + `CORS_ORIGINS` in Render |
| `/api/auth/signin` fails with "Configuration"                 | `NEXTAUTH_URL` or `NEXTAUTH_SECRET` missing on Vercel   | Set both, redeploy                                               |
| Sign-in via Google/GitHub → "redirect_uri_mismatch"           | Callback URL not registered on the OAuth provider       | Add the Vercel URL as authorized callback (Step 6)               |
| API healthcheck 502 / not loading                             | Render service is asleep (cold start)                   | Hit it once and wait 30s                                         |
| Resume upload returns 500 with "File storage not configured"  | S3 env vars wrong on Render                             | Re-paste Supabase Storage credentials                            |
| Database migrations don't run                                 | First deploy needed Render to be live before migrations | Trigger a manual deploy from Render dashboard                    |

## Costs to be aware of

- **OpenRouter** — free models have rate limits (~50 req/day per model). For heavy use, the fallback chain keeps things working but very heavy resume parsing volume needs paid models. Set a usage cap at openrouter.ai/settings/limits.
- **Supabase** — 500 MB Postgres + 1 GB storage covers thousands of resumes. Bandwidth is 5 GB/mo on free.
- **Upstash** — 10k commands/day. Each background job is a few commands; comfortable for hundreds of submissions/day.
- **Render** — free Web Service has a 750 hour/month cap. Single service is well under the limit.
- **Vercel** — Hobby plan covers personal projects. Watch for bandwidth on free tier (100 GB/mo).
