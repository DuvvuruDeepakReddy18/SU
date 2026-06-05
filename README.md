# SkillVerify

AI-aggregated, four-layer-verified skill portfolios for Indian college students —
with a full hiring loop on top (recruiters, placement cells, and expert interviewers).

This monorepo contains:

| Package           | Description                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| `apps/web`        | Next.js 14 frontend — five role-gated portals (App Router, Auth.js, TanStack Query) |
| `apps/api`        | NestJS REST API (JWT, Prisma, BullMQ, OpenRouter, Judge0)                           |
| `packages/db`     | Prisma schema, migrations, seed data                                                |
| `packages/shared` | Zod schemas + constants shared across web/api                                       |
| `packages/ui`     | Shared UI utilities                                                                 |

## Portals

One Next.js app, five role-gated portals (route groups under `apps/web/app/`),
all behind a global JWT + roles guard:

| Portal      | Route group     | Who                 | What                                                         |
| ----------- | --------------- | ------------------- | ------------------------------------------------------------ |
| Student     | `(student)`     | `STUDENT`           | Profile, skills, verifications, practice, community, jobs    |
| Company     | `(company)`     | `RECRUITER`         | Vetted hiring — candidate search, jobs, gated contact reveal |
| Institution | `(institution)` | `INSTITUTION_ADMIN` | Placement-cell oversight — roster, drives, analytics         |
| Interviewer | `(interviewer)` | `INTERVIEWER`       | Shared-pool expert screens that award L4                     |
| Admin       | `(admin)`       | `PLATFORM_ADMIN`    | Verification queue + recruiter/TPO/interviewer approvals     |

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env and edit if needed
cp .env.example .env

# 3. Start backing services (Postgres, Redis, MinIO, Meili, Judge0)
docker compose up -d

# 4. Generate Prisma client and migrate
pnpm db:generate
pnpm db:migrate

# 5. Seed (200+ skills, cert rules, curriculum problems, 250+ institutions, demo users)
pnpm db:seed

# 6. Run everything (web on :3000, api on :4000)
pnpm dev
```

## URLs

| Service       | URL                                             |
| ------------- | ----------------------------------------------- |
| Web           | http://localhost:3000                           |
| API           | http://localhost:4000/api/v1                    |
| API health    | http://localhost:4000/api/v1/health             |
| MinIO console | http://localhost:9001 (minioadmin / minioadmin) |
| Meilisearch   | http://localhost:7700                           |
| Judge0        | http://localhost:2358                           |
| Prisma Studio | `pnpm db:studio`                                |

## Demo users

All demo accounts are seeded with `password123` and verified institution emails.

| Email                            | Slug              |
| -------------------------------- | ----------------- |
| `arjun@iimu.ac.in`               | `/u/arjun-mehta`  |
| `priya@iimu.ac.in`               | `/u/priya-sharma` |
| `rohan@pilani.bits-pilani.ac.in` | `/u/rohan-gupta`  |
| `kavya@pilani.bits-pilani.ac.in` | `/u/kavya-iyer`   |
| `aditya@vitstudent.ac.in`        | `/u/aditya-singh` |

## Architecture

```
        ┌──────────────────────┐
        │   apps/web (Next 14) │
        │   Auth.js · TanStack │
        └────────┬─────────────┘
                 │ Bearer JWT
                 ▼
        ┌──────────────────────┐
        │   apps/api (NestJS)  │
        │   Passport JWT       │
        │   class-validator    │
        └──┬─────┬──────┬──────┘
           │     │      │
           ▼     ▼      ▼
       Postgres Redis  S3 (MinIO/R2)
       (Prisma) (BullMQ)
                │
                ▼
            Judge0  OpenRouter  Resend
```

## Verification layers

| Layer           | Trigger                                                      |
| --------------- | ------------------------------------------------------------ |
| L0 — Unverified | Skill claimed, no proof                                      |
| L1 — Academic   | ≥1 verified academic record                                  |
| L2 — Certified  | L1 + verified cert linked to skill (admin-curated tier rule) |
| L3 — Proven     | L2 + project tagged with skill, public repo URL              |
| L4 — Expert     | Live expert interview (interviewer portal) → pass awards L4  |

State recomputed in [`apps/api/src/modules/verifications/layer-engine.ts`](apps/api/src/modules/verifications/layer-engine.ts) whenever a child entity changes. L4 is floor-protected — an interview-granted L4 is never recomputed back down.

## Accounts & security

- **Auth:** email/password + Google/GitHub OAuth (Auth.js → API JWT).
- **Email verification** (soft-nudge) + **password reset** + **change password**, via single-use, SHA-256-hashed, expiring tokens (`apps/api/src/modules/auth/auth-token.service.ts`).
- **In-app notifications:** topbar bell across the student/company/institution portals, emitted on the events that matter (contact reveal, verification decision, interview result, account approval).
- **Rate limiting:** global throttle (120/min/IP) with tighter per-route budgets on auth endpoints; webhooks/health exempt.
- **Secrets:** `pnpm gen:secrets` mints prod values; the API fail-fasts in production if a secret is missing or left at its dev default.

## Background jobs (BullMQ)

| Queue                    | Trigger                        | Job                                                             |
| ------------------------ | ------------------------------ | --------------------------------------------------------------- |
| `resume-parse`           | Resume upload                  | PDF text → OpenRouter (DeepSeek V4 Flash, free) → profile merge |
| `github-sync`            | Connect + daily cron           | GitHub repos → Project rows                                     |
| `judge-run`              | Submission created             | Code → Judge0 → verdict                                         |
| `ai-feedback`            | AC submission                  | OpenRouter (Qwen3 Coder, free) code review → JSON feedback      |
| `verification-recompute` | Any verification entity change | LayerEngine.recomputeAllForUser                                 |
| `leaderboard-build`      | Every 5 min                    | Rebuild LeaderboardSnapshot                                     |
| `notification-fanout`    | Domain events                  | Notification row + Resend email                                 |

## Scripts

```
pnpm dev          # web + api in parallel
pnpm build        # build everything
pnpm lint         # ESLint across all packages
pnpm typecheck    # tsc --noEmit across all packages
pnpm test         # Vitest unit tests
pnpm db:generate  # generate Prisma client
pnpm db:migrate   # apply migrations
pnpm db:seed      # seed catalog data + demo users
pnpm db:studio    # open Prisma Studio
pnpm make:admin   # promote a user to PLATFORM_ADMIN
pnpm gen:secrets  # print fresh JWT / NextAuth / encryption secrets for prod
```

## Deployment

A free-tier, no-credit-card stack (Vercel + Render + Neon + Upstash + Cloudflare R2)
is documented step-by-step in [`DEPLOY.md`](DEPLOY.md). Infra-as-code lives in
[`render.yaml`](render.yaml) (API + env) and [`apps/web/vercel.json`](apps/web/vercel.json)
(web). CI runs lint/typecheck/unit/e2e on every push; [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
adds opt-in, test-gated deploys.

## Roadmap (not yet built)

- **Content depth** — expand the practice library toward 200–300 problems per domain.
- **DigiLocker** — real Govt-of-India OAuth (currently a `503` stub until onboarding).
- **Richer competitions** — multi-round, jury-scored contests.
