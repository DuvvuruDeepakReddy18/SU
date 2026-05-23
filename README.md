# SkillVerify — Student Portal (Phase 1)

AI-aggregated, four-layer-verified skill portfolios for students.

This monorepo contains:

| Package           | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `apps/web`        | Next.js 14 student portal (App Router, Auth.js, TanStack Query) |
| `apps/api`        | NestJS REST API (JWT, Prisma, BullMQ, OpenRouter, Judge0)       |
| `packages/db`     | Prisma schema, migrations, seed data                            |
| `packages/shared` | Zod schemas + constants shared across web/api                   |
| `packages/ui`     | Shared UI utilities (extension point for future portals)        |

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

# 5. Seed (200+ skills, 50 cert rules, 100 problems, 3 institutions, 5 demo users)
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
            Judge0  Anthropic  Resend
```

## Verification layers

| Layer           | Trigger                                                      |
| --------------- | ------------------------------------------------------------ |
| L0 — Unverified | Skill claimed, no proof                                      |
| L1 — Academic   | ≥1 verified academic record                                  |
| L2 — Certified  | L1 + verified cert linked to skill (admin-curated tier rule) |
| L3 — Proven     | L2 + project tagged with skill, public repo URL              |
| L4 — Expert     | Expert screening — stubbed in Phase 1                        |

State recomputed in [`apps/api/src/modules/verifications/layer-engine.ts`](apps/api/src/modules/verifications/layer-engine.ts) whenever a child entity changes.

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
```

## Phase 1 acceptance (from spec §12)

- [ ] M0 — Foundation: monorepo boots, DB seeded
- [ ] M1 — Auth: sign up + sign in via Google/GitHub/email
- [ ] M2 — Profile + resume parsing + public portfolio
- [ ] M3 — Skills + L1/L2 verifications
- [ ] M4 — GitHub integration + L3
- [ ] M5 — Practice IDE (Monaco + Judge0 + AI feedback)
- [ ] M6 — Leaderboard + Community + Notifications + polish

## Out of scope (Phase 2+)

Recruiter, Institution, Interviewer, and Platform-Admin portals. Schema is already in place — only endpoints are gated. Don't build them in this phase.
