# Track 2 — Secret rotation checklist

**Why this matters**: every secret you pasted into chat early in this build is potentially exposed if chat logs sync anywhere external. Rotate the lot. Should take ~30 minutes.

For each item: revoke at the provider's dashboard → generate a new one → paste into `.env` → test the smoke-test command in this folder.

---

## 1. Neon (Postgres)

- **Dashboard**: https://console.neon.tech → your project → **Roles** tab → click your role → **Reset password**
- Copy the new connection string (it includes `?sslmode=require`)
- Update `.env`:
  ```
  DATABASE_URL=postgresql://neondb_owner:NEW_PASSWORD@ep-xxx.neon.tech/neondb?sslmode=require
  ```
- **Smoke-test**: `pnpm db:studio` should open without error.

## 2. OpenRouter (AI calls)

- **Dashboard**: https://openrouter.ai/keys → revoke the old key → **Create Key**
- Update `.env`:
  ```
  OPENROUTER_API_KEY=sk-or-v1-NEW_KEY
  ```
- **Smoke-test**: upload a college-ID via /signup → check the API logs show OCR firing without 401.

## 3. Google OAuth

- **Dashboard**: https://console.cloud.google.com/apis/credentials → click your OAuth 2.0 Client → **Reset Client Secret**
- Update `.env`:
  ```
  GOOGLE_CLIENT_SECRET=GOCSPX-NEW_SECRET
  ```
  (Client ID stays the same.)
- **Smoke-test**: sign in with Google on /login.

## 4. GitHub OAuth

- **Dashboard**: https://github.com/settings/developers → your OAuth App → **Generate a new client secret** → confirm
- Update `.env`:
  ```
  GITHUB_CLIENT_SECRET=ghp_NEW_SECRET
  ```
- **Smoke-test**: sign in with GitHub on /login.

## 5. NextAuth signing secret

- **No dashboard** — generate locally:
  ```powershell
  # Run in PowerShell:
  $bytes = New-Object byte[] 32
  (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
  [System.Convert]::ToBase64String($bytes)
  ```
  Or with Node:
  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- Update `.env`:
  ```
  NEXTAUTH_SECRET=NEW_BASE64_STRING
  ```
- **Note**: this signs JWTs. Rotating invalidates every active session — every signed-in user gets logged out on next request. That's the intended behavior.

## 6. Razorpay (only if you shared test keys earlier)

- **Dashboard**: https://dashboard.razorpay.com/app/keys → **Regenerate Test Key**
- Update `.env`:
  ```
  RAZORPAY_KEY_ID=rzp_test_NEW_ID
  RAZORPAY_KEY_SECRET=NEW_SECRET
  ```
- **Smoke-test**: hit POST /api/v1/interviews/payments/order from a Razorpay-enabled session.

---

## Post-rotation

After all 6 are rotated:

```powershell
# Stop everything, restart fresh
Get-NetTCPConnection -State Listen -LocalPort 3000,4000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Remove-Item -Recurse -Force "C:\Users\duvvu\Desktop\Startup\startup website\apps\web\.next" -ErrorAction SilentlyContinue
cd "C:\Users\duvvu\Desktop\Startup\startup website"
pnpm dev
```

Wait for both `web:dev: ✓ Ready` and `api:dev: 🚀 ... 4000`. Then run through the smoke-tests above one by one.

If anything 401s or 403s, you missed a paste — re-check.

## After this is done

Delete this file (`TRACK_2_SECRET_ROTATION.md`). The rotation checklist is one-time. If a future agent needs the procedure, regenerate from `PHASE_5_PLAN.md` § Track 2.
