# SkillVerify — One-shot recreate prompt

Paste this whole document into a fresh agent and tell it: **"build this end-to-end."** It captures every decision baked into the current `main` branch and the order to land them in.

---

## 0. What you're building

**SkillVerify** is a verified-skill portfolio platform for college students in India. It replaces scattered resumes / LeetCode profiles / LinkedIn endorsements with **one institutionally-verified profile** that recruiters can trust.

Tagline: **"Upskill. Get Verified. Get Deployed."**

The product wedge is a **4-layer verification ladder** every skill goes through:

- **L1 — Academic**: SGPA/CGPA proven via uploaded semester marksheets (OCR'd + anti-tamper checked).
- **L2 — Certified**: course completions matched against a curated tier table (AWS/Google/Coursera/NPTEL/etc.).
- **L3 — Proof-of-Work**: GitHub repos / hackathon wins / live URLs / freelance reviews.
- **L4 — Expert Screen**: live panel interview with domain experts (paid via Razorpay).

A profile that hasn't completed verification is shown as **UNVERIFIED INFO** in red on the dashboard and _not_ recommended to recruiters or freelance clients. Verified profiles get a green **VERIFIED** chip.

---

## 1. Tech stack — non-negotiable

- **Monorepo**: pnpm workspaces + Turborepo
- **Web**: Next.js 14 (App Router, React 18, server components), TypeScript strict, Tailwind, shadcn/ui primitives, lucide-react icons, TanStack Query, Auth.js (NextAuth) with Google + GitHub + Credentials providers
- **API**: NestJS 10, Passport JWT, Zod via `nestjs-zod`, BullMQ + Redis, `@nestjs/schedule` cron
- **DB**: PostgreSQL with `pgvector` extension, Prisma ORM
- **Storage**: S3-compatible (MinIO local, Cloudflare R2 / Supabase Storage in prod)
- **AI**: OpenRouter (OpenAI-compatible SDK pointed at `openrouter.ai`), free models only — fallback chain on 429/402
  - Resume parsing + chat: `openai/gpt-oss-120b:free` → `openai/gpt-oss-20b:free` → `meta-llama/llama-3.3-70b-instruct:free`
  - Vision (college-ID + marksheet OCR): `google/gemini-2.0-flash-exp:free` → `meta-llama/llama-3.2-90b-vision-instruct:free` → `qwen/qwen2.5-vl-72b-instruct:free`
- **3D**: `@react-three/fiber@^8.18.0` + `@react-three/drei@^9.122.0` + `three@^0.168.0` (DO NOT install fiber v9 — needs React 19, will break Next 14)
- **Payments**: `razorpay` SDK, server-side. Feature-flagged via `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`
- **Code execution**: child_process LocalRunner for Python/JS/C/C++/Java (Judge0 fails on Windows Docker)
- **Auth deps**: `bcryptjs` (not `bcrypt` — native bindings break on Windows)
- **Env**: `dotenv-cli` because Prisma needs `.env` from monorepo root

Repo layout:

```
apps/
  api/         (NestJS — port 4000)
  web/         (Next.js — port 3000)
packages/
  db/          (Prisma schema + migrations + seeds)
  shared/      (Zod schemas + constants shared between web + api)
  ui/          (shared shadcn primitives)
```

All routes are prefixed `/api/v1/...` on the API side.

---

## 2. The data model (Prisma)

Critical models (full schema lives in `packages/db/prisma/schema.prisma`):

- **User** — `email`, `passwordHash`, `role` (STUDENT / RECRUITER / INSTITUTION_ADMIN / INTERVIEWER / PLATFORM_ADMIN), `institutionId`
- **Institution** — `name`, optional `domain` (nullable + unique), `shortName`, `category` (engineering/management/law/science/commerce/arts/medical/other), `nirfRank`, `state`, `city`, `verified` (false for user-suggested rows), `addedByUserId`
- **StudentProfile** — `governmentName`, `fullName`, `phoneNumber` (+91 format), `instituteEmail`, `courseProgram`, `cgpa`, `cgpaVerifiedAt`, `collegeIdUrl`, `collegeIdStatus` (pending_review / verified / rejected), `collegeIdRejectionReason`, `collegeIdOcrExtracted` (JSON), social URLs (linkedin/github/leetcode/codechef/portfolio), `customLinks` (JSON), `shareTheme` (default / midnight / minimal), `shareSectionsOrder` (string[])
- **AcademicRecord** — `semester`, `cgpa`, `sgpa`, `docUrl`, `extractedName`, `extractedInstitution`, `examDate`, `fileSha256` (for dedup-fraud detection), `verificationStatus`, `ocrExtracted` (JSON), `rejectionReason`, `verifiedVia` (digilocker/institution/manual/ai_ocr), `verifiedAt`
- **UserSkill** — `skillId`, `selfRatedLevel`, `highestVerificationLayer` (L0/L1/L2/L3/L4)
- **Certification** — `issuer`, `courseName`, `tier` (TIER_1/2/3/UNRANKED), `verificationStatus`
- **Project** — `source`, `title`, `repoUrl`, `liveUrl`, `techStack`, `linkedSkills` (skill IDs as String[])
- **Problem** — `title`, `slug`, `difficulty`, `topics`, `description`, `examplesJson`, `starterCode` (per-language), `points`, many-to-many to `PracticeDomain`
- **Submission** — `verdict` (AC/WA/TLE/CE/RE/PENDING), `runtimeMs`, `memoryKb`, `aiFeedback`, `failedTest` (JSON), `testsPassed`, `testsTotal`
- **PracticeDomain** — 17 of them: algorithms, data-structures, mathematics, ai, python, java, javascript, c, cpp, sql, databases, linux-shell, functional-prog, regex, react, ruby, data-science, competitive-prog
- **InterviewBooking** — `scheduledAt`, `status`, `meetingUrl` (auto-generated Jitsi room), `razorpayOrderId`, `razorpayPaymentId`, `amountInrPaise`, `paidAt`
- **PlacementDrive** + **PlacementApplication** — campus placement listings, gated by `minLevel`
- **Competition** + **CompetitionEntry** — Unstop-style contests across categories
- **FreelanceService** + **FreelanceInquiry** + **FreelanceMessage** — service marketplace with inquiry / chat / order workflow + geocoded Leaflet map
- **CommunityPost** — `title` (optional), `body`, `subreddit` (default "general"), `score`, `upvotes`, `downvotes`, `hiddenByMod`, `commentsCount`, `visibility` (public / college_only)
- **CommunityComment** — `body`, `parentCommentId` (self-relation for threading), `hiddenByMod`
- **CommunityVote** — `value` 1 or -1
- **LeaderboardSnapshot** — `scope` ("global" or "college:<id>"), rebuilt every 5 minutes via cron

---

## 3. The four phases — build in this order

### Phase 1 — Trust foundation

Land these together as one PR.

**Track 1: Institutions data**

- Curated seed of ~250 Indian institutions in `packages/db/prisma/seed-data/institutions.ts`. Must cover: all 23 IITs, all 31 NITs, all 26 IIITs, all 20 IIMs, all 25 NLUs, all 7 IISERs + IISc, SRCC + ~22 DU constituent colleges (Hindu, Stephens, LSR, Hansraj, Miranda, KMC, etc.), top NIRF commerce (Loyola, St. Xavier's K/M, Christ, MCC), top medical (AIIMS Delhi, PGIMER, CMC Vellore, NIMHANS, JIPMER, AFMC, +AIIMS regionals), top general universities (JNU, BHU, JU, Anna, Madras, Calcutta), and other top NIRF engineering (BITS, VIT, DTU, NSUT, JMI, AMU, MAHE, Thapar, etc.).
- New endpoints: `GET /institutions/search?q=&category=&limit=` (typeahead), `GET /institutions/categories`, `POST /institutions/suggest` (public — creates row with `verified=false`).
- Frontend: `<InstitutionPicker>` combobox with category chips (All / IIT-NIT-IIIT / IIM / NLU / IISER / Commerce / DU-Arts / Medical / Other) + inline "Don't see your college? Add it" form.

**Track 2: Signup overhaul**

- Required fields: `governmentName`, `phoneNumber` (regex `^\+91\d{10}$`), institution (from picker, `institutionId`), `courseProgram` (enum: B.Tech, M.Tech, MBA, B.Com, BBA, BCA, MBBS, LLB, ...), `instituteEmail` (must match institution's domain when one exists), auth `email`, `password`, **mandatory `collegeIdFileKey`** (S3 key from a pre-signup upload).
- Two-step: `POST /auth/upload-college-id` (public multipart) → returns `{ key, url }` → `POST /auth/signup` with the key.
- Signup page is a single-screen form (no multi-step — fewer drop-offs).

**Track 3: College-ID AI pre-screen + admin queue**

- New `CollegeIdService` fires post-signup. Downloads the upload, sends to OpenRouter vision (fallback chain), extracts `{ extractedName, extractedInstitution, issueOrExpiryDate, hasOfficialStamp, isLikelyEdited, confidence }`.
- Fuzzy-match: name (Levenshtein ≥75% of word tokens), institution (substring or acronym match). Auto-verify if name+institution match, confidence ≥ 0.6, not edited. Otherwise → `collegeIdStatus = pending_review`.
- `AdminController` (role-gated to `PLATFORM_ADMIN`): `GET/POST /admin/verifications/college-ids` with approve/reject + reason.
- Admin UI at `/admin/verifications` showing image preview + extracted-vs-claimed comparison.

**Track 4: Semester-wise CGPA verification with anti-tamper**

- `AcademicRecordService.uploadSemester`:
  - SHA-256 of file → reject if another user already uploaded the same bytes (fraud signal).
  - OCR via vision model → extract student name, institution, semester, sgpa, cgpa, exam date, hasOfficialStamp, isLikelyEdited, confidence.
  - Auto-verify only when name matches profile, institution matches, confidence ≥ 0.6, not edited, has stamp, and a grade was readable.
- `LayerEngine.computeLayer` updated: L1 requires `verificationStatus='verified'` (NOT just `verifiedAt`). Manual entries no longer count.
- **Verifications page** shows a "Required in each document" callout (5 musts: student name match, institute name match, exam date, SGPA/CGPA visible, stamp/watermark preferred) and a dynamic grid of N semester upload tiles based on `courseProgram` (B.Tech=8, MBA=4, B.Com=6, etc.).

**Track 5: UNVERIFIED / VERIFIED badge system**

- `GET /verifications/me/status` returns per-field state + overall (`verified` / `partial` / `unverified`).
- `<VerificationPill>` component, rendered next to CGPA stat, next to dashboard greeting, and on the public profile.
- Free-text CGPA stays editable but shows red UNVERIFIED until backed by a verified `AcademicRecord`.

**Track 6: Profile link validation + auto-hyperlink**

- Shared `urlForService(label, allowedHosts)` Zod refine. Each profile URL field is restricted to its expected host:
  - LinkedIn → `linkedin.com`, `lnkd.in`
  - GitHub → `github.com`
  - LeetCode → `leetcode.com`
  - CodeChef → `codechef.com`
  - Portfolio → any https URL
- `LinkRow` auto-prefixes `https://` on blur, shows inline error if host mismatches, renders "Open →" link when valid.

**Track 7: Per-institute community + dual leaderboards**

- `GET /community/posts?scope=all|mine` — `mine` filters to authors from same institution.
- `GET /leaderboard?scope=global` and `?scope=college&id=<institutionId>`.
- New per-problem leaderboard: `GET /practice/problems/:slug/leaderboard?scope=global|institute&institutionId=...` — best AC per user sorted by `runtimeMs`.
- Leaderboard page has Global / institute-name tabs. Community page has All / institute tabs. Problem page has a right-rail `<ProblemLeaderboard>` panel with the same two scopes.

**Track 8: Feature flags + Razorpay placeholder**

- `GET /api/v1/config` returns `{ storage, ai, github, google, razorpay, digiLocker, expertScreen }` driven by env-var presence.
- `useConfig()` hook on the frontend.
- `POST /interviews/payments/order` returns 503 until env vars set.

**Track 9: Support page**

- `/support` route with placeholder `SUPPORT_PHONE` / `SUPPORT_EMAIL` constants (left null — "Coming soon" until provisioned) + FAQ for common signup/verification issues. Linked from signup error toast.

### Phase 2 — Visual layer + AI chat + builder + share customization

**Track A: 3D animated landing page (THIS IS THE HEADLINE FEATURE)**

The landing page must be **immediately impressive**. Static marketing pages don't cut it. Use real WebGL — `@react-three/fiber` + `@react-three/drei`. The hero sets the entire product tone.

Required components and behavior:

1. **Hero section** (full viewport height, min 88vh):
   - Background: gradient wash from `emerald-50` (top-left) through `background` to `primary/5` (bottom-right), with two large blurred radial blobs (one emerald, one primary) for depth. Dark-mode variants too.
   - **3D scene** absolutely positioned behind the text (`-z-10`, `pointer-events-none`):
     - A central **glass icosahedron** (1.2 radius, detail level 1) using `<MeshTransmissionMaterial>` — `samples=8`, `thickness=0.6`, `transmission=1`, `ior=1.3`, `chromaticAberration=0.06`, color `#a7f3d0` (emerald-200).
     - **4 orbiting verification pins**: spheres labeled "L1" / "L2" / "L3" / "L4" using drei `<Text>`, colored blue / amber / emerald / violet respectively. Each pin orbits at radius 2.6–2.9 with its own phase offset and a slight vertical sinusoidal wobble. Pins gently emissive (`emissiveIntensity=0.45`).
     - Distant `<Stars>` field — 1500 stars, radius 50, factor 2, slow fade.
     - `<Environment preset="city">` for realistic reflections on the glass.
     - Slow `autoRotate` (0.5°/s). Disable drag/zoom so it doesn't fight scrolling.
   - **Text overlay** (z-index above scene):
     - Pill: "✨ Verified Skill Portfolio" (rounded-full, backdrop-blur).
     - Headline (text-7xl bold, leading-tight): **"Upskill. <em class='emerald'>Get Verified.</em> Get Deployed."**
     - Sub: "Build an institutionally-verified digital portfolio. Practice, compete, and connect with companies for hiring and freelance."
     - CTAs: "Build Your Vault →" (primary, links to /signup) + "How It Works" (outline, anchors to #how).

2. **Stats strip** (border-y, secondary/30 background): "1700+ Practice Problems · 17 Domains · 500+ Colleges · 4-Layer Verification".

3. **4-Layer Verification section** (`#how` anchor): four large cards in a grid, each with the L1/L2/L3/L4 number in big tinted font, an icon (GraduationCap / Award / Github / Users), title (Academic / Certified / Proof-of-Work / Expert Screen), and one-sentence body. Top border colored per layer.

4. **"Everything you need"** grid: 6 feature cards (4-Layer Verification, Practice Arena, Competitions, Community, AI Analysis, Freelance & Jobs) each with a colored icon tile.

5. **"Integration Ecosystem"** section with 4 columns: Coding & Tech (GitHub/LeetCode/HackerRank), Professional (LinkedIn/Resume/Unstop), Certifications (Coursera/AWS/NPTEL), Institutional (DigiLocker/LMS/College ID). Each item tagged with type pill: OAUTH (blue) / API (emerald) / SCRAPE (orange) / UPLOAD (violet). Below: a single dark "SCCTS Central Verification Engine" pill.

6. **"Built for everyone"**: 4 audience cards (Students / Institutions / Recruiters / Faculty), each with a tinted left border.

7. **"For Recruiters"** strip (different background `secondary/40`): 3 cards (Search by Verified Level / Direct Hiring Pipeline / Freelance Matching).

8. **Final CTA**: large centered "Ready to vault your skills?" + "Get Started Free" button.

9. **Footer**: logo on left, copyright center, "Skill Credit & Competency Transcript System" tagline on right.

The 3D scene must be `dynamic(() => ..., { ssr: false })` because Three.js touches `window`. Put it in `<Suspense fallback={null}>` so marketing copy doesn't block on shader compilation.

**Track B: 3D dashboard avatar**

- `<DashboardAvatarWrapper>` (client component shim because Next 14 forbids `ssr:false` imports inside Server Components) renders a 360px-tall canvas at the top of `/dashboard`.
- Same glass icosahedron core.
- **8 orbiting bubble nav** spheres around the core, each with a lucide icon + label rendered via drei `<Html>`, navigating to: Profile, Verify, Practice, Interview, Freelance, Placements, Compete, Community. Each sphere clickable (router push), scales up on hover.

**Track C: AI chatbot ("SkillBot")**

- Floating bottom-right widget on every dashboard page (mounted in `(student)/dashboard/layout.tsx`).
- `POST /chat` accepts message history. Detects "find me X" intent via regex on the latest user message and runs an SQL lookup over `UserSkill` rows filtered to same institution, returning verified peers. Injects results as a `RETRIEVAL CONTEXT` block in the system prompt.
- **No embeddings / pgvector needed for v1** — direct SQL retrieval handles the use case ("find me a verified product manager in my college") cleanly. Document pgvector readiness for future RAG over institutional PDFs.
- System prompt makes the bot SkillVerify-aware: explains 4-layer verification, points to right pages, never invents URLs.
- Suggestion chips on first turn.

**Track D: Resume builder**

- `/dashboard/profile/resume-builder` — pre-fills from `/profile/me` + `/verifications/me/summary`, lets user override any field.
- **3 templates** as React components rendering the same `ResumeData` shape: `Modern` (emerald sidebar + serif body), `Classic` (centered serif), `Compact` (single-column dense).
- A4 preview pinned right. **Download as PDF via `window.print()`** + print-only stylesheet in `globals.css` that hides everything outside `.resume-preview` and sets `@page { size: A4; margin: 0; }`. No PDF library needed.

**Track E: Customizable shareable profile**

- Schema: `StudentProfile.shareTheme` (default / midnight / minimal) + `shareSectionsOrder` (string[]).
- Public `/u/[slug]` page applies the theme + renders sections in the saved order.
- `/dashboard/profile/share` has a theme picker with mini-previews + a section reorder list (chevron up/down — no DnD library) + copy-public-link.

**Track F: DigiLocker stub**

- `POST /integrations/digilocker/connect` returns OAuth authorize URL when `DIGILOCKER_CLIENT_ID` is set, else 503. Integrations tile flips between "Connect DigiLocker" and "Coming soon" based on the config flag.

### Phase 3 — Payments + Reddit-style community + content

**Track A: Razorpay live**

- `RazorpayService` initialized only when both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are present.
- `POST /interviews/payments/order` creates Razorpay order (price defaults to ₹499 = 49900 paise, override via `RAZORPAY_INTERVIEW_PRICE_PAISE`).
- `POST /interviews/payments/verify-and-book` verifies HMAC-SHA256 signature against `orderId|paymentId`, then atomically creates the InterviewBooking with `razorpayOrderId`, `razorpayPaymentId`, `amountInrPaise`, `paidAt` stamped on it.
- Frontend dynamically loads `https://checkout.razorpay.com/v1/checkout.js` on first click. Button shows "Pay & book" when `config.razorpay = true`, else "Confirm booking" (free).

**Track B: Reddit-style community**

- Schema additions: `CommunityPost.title?`, `subreddit` (default "general"), `score`, `hiddenByMod`; `CommunityComment.parentCommentId` (self-relation), `hiddenByMod`.
- 9 default subreddits in `@skillverify/shared`: general, internships, placements, freelance, academic, rant, ama, showcase, help.
- Community page rebuilt with:
  - **Left rail of subreddit chips** (with post counts) — clicking filters the feed.
  - **Hot / New / Top sort tabs** — hot uses `score / age_hours^1.5` ranked in-app after a wider DB fetch.
  - **Vote rails** per post (up + score + down) with optimistic UI that mirrors server math exactly (extract `computeVoteDelta` helper used by both sides).
  - **Threaded replies**: flat list from API stitched into a tree by `parentCommentId`, indented per depth (capped at 6 levels).
  - **Admin hide/unhide endpoints** for posts and comments. Hidden bodies render as `[removed by moderator]` (italic, muted).

**Track C: Curriculum expansion**

- Maintain `apps/api/scripts/curriculum-data.ts` (130 universal exercises across all 5 supported languages) + `curriculum-data-v2.ts` (40 more covering advanced strings, DP, graphs, number theory).
- Each exercise has: title, slug (namespaced `curr-` and `curr2-`), difficulty, section, topics, description, examples, tests (stdin→stdout pairs), starters for all 5 languages.
- Seeder concatenates v1+v2, tags each problem into all 5 language `PracticeDomain`s.
- **Honest scope note**: hitting "200–300 problems × 17 domains" is a content-curation task, not engineering. Document in the commit that specialty domains (SQL / Regex / Data Science / AI / Linux Shell / React / Ruby / Functional) need (a) a non-stdin runner per category and (b) curated content. Don't AI-generate 4000 stubs — they'll be broken.

---

## 4. Things to NOT miss (these tripped us up)

1. **fiber + drei version pinning** — use `@react-three/fiber@^8.18.0` + `@react-three/drei@^9.122.0` + `three@^0.168.0`. fiber v9 / drei v10 require React 19 and crash Next 14 with `Cannot read properties of undefined (reading 'S')`.
2. **bcryptjs not bcrypt** — native bindings break on Windows.
3. **Prisma client regen on Windows** — the query engine DLL is held by any running node process. Kill API dev server (`Stop-Process -Id <pid> -Force`) before `pnpm db:generate`.
4. **dotenv-cli** — Prisma needs the monorepo-root `.env`. Scripts: `dotenv -e ../../.env -- prisma <cmd>`.
5. **NestJS DI strict on imports** — every injected class must be a _value_ import, not `import type`. Disable `@typescript-eslint/consistent-type-imports` rule globally.
6. **JWT TTL** — 7d in non-prod (matches NextAuth session), 15m in prod.
7. **`ssr: false` dynamic imports** can only be used in Client Components in Next 14 — wrap with a thin client component.
8. **Resume parser Zod schema must be lenient** — free vision models return slightly off-shape data. Use preprocess helpers (`looseString`, `looseNumber`, `looseSkills`, `looseDescription`).
9. **Lint rule `no-useless-assignment`** — use `let x: T` (not `let x = 0`) or refactor into a helper returning the value.
10. **Print-to-PDF needs `@page { size: A4; margin: 0; }`** in globals.css to avoid the browser adding margins.

---

## 5. The vibe of the UI

- **Cards everywhere** — every grouping is a shadcn `<Card>` with a `<CardHeader>` and `<CardContent>`.
- **Inline pills** for state — `VERIFIED` (green), `UNVERIFIED INFO` (red), `PENDING` (amber). Always with icon (`ShieldCheck`, `ShieldX`, `Clock`).
- **Lucide icons** for every label. Never raw emoji.
- **Tabs** for binary scopes (Global / My Institute, All / My Institute, Hot / New / Top).
- **Floating right-rail panels** for context (leaderboard on problem page, resume preview on profile page).
- **Tooltips on hover** for verification badges explaining why a chip is the color it is.
- The 3D scenes should feel **calm, premium, slightly slow** — not flashy or busy. Auto-rotate at ~0.5°/s. No user dragging. Glass material + soft city environment.

---

## 6. Build order summary

1. `pnpm init` + workspaces + Prisma + Postgres + the schema in section 2.
2. Seed institutions + skills + problems + practice domains + cert rules.
3. Phase 1, Tracks 1–9 in order. End-state: a student can sign up, upload college ID + semester marksheets, see VERIFIED pills, browse dual leaderboards.
4. Phase 2, Tracks A–F. End-state: stunning 3D landing, 3D dashboard, SkillBot in bottom-right, resume builder + share customization both shipped.
5. Phase 3, Tracks A–C. End-state: payments live (with env flip), Reddit-style community, 170 universal exercises in curriculum.

---

## 7. Verification checklist (smoke test before declaring done)

- [ ] Landing page at `/` shows the 3D scene with 4 orbiting L1–L4 pins, auto-rotating, no console errors.
- [ ] `/signup` requires all 8 fields including college-ID upload; submitting works and lands on dashboard.
- [ ] Dashboard shows the 3D avatar with 8 clickable nav bubbles. Each navigates correctly.
- [ ] `/dashboard/verifications` shows semester tiles sized to the user's `courseProgram`. Upload flips status to pending or verified.
- [ ] Dashboard CGPA shows red UNVERIFIED until a marksheet is verified, then green VERIFIED.
- [ ] Pasting `https://github.com/x` into the GitHub field works; pasting a LinkedIn URL there shows inline error.
- [ ] `/dashboard/leaderboard` has Global / institute tabs that change the rankings.
- [ ] Problem page shows the right-rail leaderboard panel with Global / My Institute toggle.
- [ ] Floating SkillBot opens, answers "How does verification work?", and (with a few peers seeded) returns matches for "find me a verified Python developer in my college".
- [ ] `/dashboard/profile/resume-builder` picks template, edits inline, Download triggers print dialog showing only the resume.
- [ ] `/dashboard/profile/share` picks midnight theme + reorders sections; `/u/<slug>` reflects both.
- [ ] `/dashboard/community` has subreddit rail + Hot/New/Top tabs + working up/down votes + threaded replies.
- [ ] With Razorpay keys unset, interviews booking is "Free during beta"; with keys set, it opens checkout.
- [ ] All typecheck + lint passes: `pnpm -r typecheck && pnpm -r lint`.

---

## 8. Environment variables checklist

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...

# OpenRouter — all AI features depend on this
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=SkillVerify

# Storage (MinIO local; R2 / Supabase / Backblaze in prod)
S3_ENDPOINT=http://localhost:9000
S3_KEY=...
S3_SECRET=...
S3_BUCKET=skillverify
S3_PUBLIC_URL=http://localhost:9000/skillverify

# Redis (Upstash in prod)
REDIS_URL=redis://localhost:6379

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Phase 2/3 feature flags (set to enable)
DIGILOCKER_CLIENT_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_INTERVIEW_PRICE_PAISE=49900
EXPERT_SCREEN_ENABLED=false
```

---

Build this, push to GitHub, deploy frontend to Vercel + API to Render + DB to Neon. The first thing the user sees must be that 3D landing.
