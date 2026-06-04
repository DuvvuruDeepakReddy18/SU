# SkillVerify — Phase 5: Fix the operational layer

This phase is **not** new features. It's hardening the foundations of what's already built so the platform survives contact with real users and human reviewers.

Brand decisions baked into this plan:

- The product is **SkillVerify** everywhere. The "Orbie" name is dropped.
- The community section is just **"Community"**. The spider mascot stays (rename file `orbie-mascot.tsx` → `community-mascot.tsx`).
- Verification chips read **"Pending institutional review"** instead of **"Pending review"** until DigiLocker is live.

Tracks ordered by priority. Each track lists: problem, files to touch, acceptance test, estimated effort. Tracks 1–8 are blockers for letting real users in. Tracks 9–18 are polish + tech debt.

---

## Track 1 — Drop the "Orbie" brand (½ day)

**Problem**: The community page is currently branded as "Orbie", which is a separate product reference. Confusing.

**Changes**:

- `apps/web/components/orbie-mascot.tsx` → rename file to `community-mascot.tsx`; rename export `OrbieMascot` → `CommunityMascot`. Keep the SVG intact.
- `apps/web/app/(student)/dashboard/community/page.tsx`:
  - Hero badge: `"Orbie · powered by SkillVerify"` → `"Community · SkillVerify"`
  - Headline: `"Welcome to Orbie"` → `"Welcome to your community"` (no gradient on the word "Community" — keep gradient on a different word like "community" stays plain, or use the SkillVerify primary color on "community")
  - Tagline: leave intact, drop the word "Orbie".
- `apps/web/components/sidebar.tsx`: Nav item label `"Orbie"` → `"Community"`.
- Search-and-replace `Orbie` across the codebase — should land in ~5 files.

**Acceptance**: `git grep -i orbie` returns zero matches except in `RECREATE_PROMPT.md` (which is historical) and this file.

---

## Track 2 — Rotate every secret pasted in chat (1 hour, do today)

**Problem**: OpenRouter API key, Neon password, Google OAuth secret, GitHub OAuth secret, NextAuth secret, Razorpay test keys were all visible in chat history early in the build. If chat logs sync anywhere external, those leak.

**Action**:

1. **Neon**: change DB password via Neon dashboard → update `DATABASE_URL` in `.env`.
2. **OpenRouter**: revoke key at openrouter.ai/keys, generate new one → update `OPENROUTER_API_KEY`.
3. **Google OAuth**: regenerate client secret at console.cloud.google.com → update `GOOGLE_CLIENT_SECRET`.
4. **GitHub OAuth**: regenerate at github.com/settings/developers → update `GITHUB_CLIENT_SECRET`.
5. **NextAuth**: generate new `NEXTAUTH_SECRET` via `openssl rand -base64 32`.
6. **Razorpay**: if test keys were shared, rotate via dashboard.razorpay.com → update `RAZORPAY_KEY_SECRET`.
7. Run `pnpm dev`, sign in, smoke-test signup + AI call.

**Acceptance**: Old keys return 401 when curl'd directly. New keys boot the app.

---

## Track 3 — Bootstrap admin script + audit log + structured rejection reasons (1 day)

**Problem**:

- No way to grant `PLATFORM_ADMIN` role except editing the DB by hand.
- When admins approve/reject verifications, there's no record of who did what or when. First dispute → no investigation possible.
- Rejection reasons are free-text — can't analyze patterns.

### 3a. Bootstrap-admin script

New file `apps/api/scripts/make-admin.ts`:

```ts
// Usage: pnpm tsx apps/api/scripts/make-admin.ts <email>
// Promotes the given email to PLATFORM_ADMIN. Idempotent.
```

Add to root `package.json` scripts: `"make:admin": "tsx apps/api/scripts/make-admin.ts"`.

### 3b. New `VerificationAudit` model

Add to `packages/db/prisma/schema.prisma`:

```prisma
model VerificationAudit {
  id            String   @id @default(cuid())
  actorUserId   String
  actor         User     @relation(fields: [actorUserId], references: [id])
  targetType    String   // "college_id" | "academic_record" | "institution" | "community_post" | "community_comment"
  targetId      String
  action        String   // "approve" | "reject" | "edit" | "hide" | "unhide" | "delete"
  reasonCode    String?  // structured code (see 3c)
  reasonNote    String?  // optional free-text supplement
  previousState Json?    // snapshot of fields that changed
  createdAt     DateTime @default(now())

  @@index([targetType, targetId, createdAt])
  @@index([actorUserId, createdAt])
}
```

Add reverse relation on `User`: `verificationAudits VerificationAudit[]`.
Migration: `audit_log`.

### 3c. Structured rejection reason enum

In `packages/shared/src/schemas/verification.ts` (new file):

```ts
export const REJECTION_REASONS = [
  'BLURRY_IMAGE',
  'NAME_MISMATCH',
  'INSTITUTION_MISMATCH',
  'DATE_MISSING',
  'SUSPECTED_EDIT',
  'WRONG_DOCUMENT',
  'EXPIRED',
  'OTHER',
] as const;
```

Update admin reject DTOs in `admin.controller.ts` to require `reasonCode` enum + optional `reasonNote`.

### 3d. Wire audit log to admin actions

Every admin write endpoint writes to `VerificationAudit`:

- `approveCollegeId` → `{ action: 'approve', targetType: 'college_id' }`
- `rejectCollegeId` → `{ action: 'reject', targetType: 'college_id', reasonCode, reasonNote }`
- Same for academic records, institutions, community posts/comments.

Frontend admin pages: replace free-text reject prompt with a `<select>` of `REJECTION_REASONS` + optional notes textarea.

**Acceptance**: After approving and rejecting a few uploads, `SELECT * FROM "VerificationAudit"` shows the trail. Trying to reject without a reasonCode returns 400.

---

## Track 4 — Move AI pre-screen to BullMQ job (½ day)

**Problem**: `auth.service.signup()` calls `void this.collegeId.screen(user.id)` — the `void` is non-blocking but the work still happens in the same Node process. If OpenRouter rate-limits, the API process is tied up. With 100 simultaneous signups, the server stalls.

**Changes**:

- `apps/api/src/infra/queue/queue.module.ts` already has BullMQ registered. Add a new queue:
  ```ts
  BullModule.registerQueue({ name: 'verification' });
  ```
- New file `apps/api/src/modules/verifications/verification.processor.ts`:

  ```ts
  @Processor('verification')
  export class VerificationProcessor {
    constructor(private readonly collegeId: CollegeIdService) {}

    @Process('college-id-screen')
    async screenCollegeId(job: Job<{ userId: string }>) {
      await this.collegeId.screen(job.data.userId);
    }
  }
  ```

- `AuthService.signup`: replace `void this.collegeId.screen(user.id)` with:
  ```ts
  await this.verificationQueue.add('college-id-screen', { userId: user.id });
  ```
- Same pattern for `AcademicRecordService.uploadSemester` — extract OCR call into a `process-marksheet` job, return the record immediately as `pending`, let the worker fill in the OCR result.
- Worker bootstraps with the API (NestJS pulls Processor decorators in automatically).

**Acceptance**: `POST /auth/signup` returns < 500ms even when OpenRouter is throttled. Job runs to completion in the background. Visible in Redis queue dashboard if you wire one up.

---

## Track 5 — Razorpay webhook (½ day)

**Problem**: Payment flow is client-driven. Browser closes between Razorpay debit and our `/verify-and-book` call → money taken, no booking. Customer angry, no audit trail.

**Changes**:

- New file `apps/api/src/modules/interviews/razorpay-webhook.controller.ts`:
  ```ts
  @Controller('webhooks/razorpay')
  export class RazorpayWebhookController {
    @Public() // public — but HMAC-validated
    @Post()
    async handle(@Headers('x-razorpay-signature') sig: string, @RawBody() body: Buffer) {
      const expected = createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(body)
        .digest('hex');
      if (sig !== expected) throw new UnauthorizedException();
      const event = JSON.parse(body.toString());
      if (event.event === 'payment.captured') {
        await this.razorpay.reconcileFromWebhook(event.payload.payment.entity);
      }
      return { ok: true };
    }
  }
  ```
- `RazorpayService.reconcileFromWebhook(payment)`: looks up the InterviewBooking by `razorpayOrderId = payment.order_id`. If exists with `paidAt` already set, no-op (client got there first). If not, create the booking using the data stored in `payment.notes` (which we set when creating the order — include `scheduledAt`, `userId`, `notes`).
- Update `RazorpayService.createInterviewOrder` to stash `scheduledAt` in `notes`:
  ```ts
  notes: { product: 'l4_interview', userId, scheduledAt: scheduledAt.toISOString() }
  ```
  (means we need to ask for `scheduledAt` at order-creation time too — slight UX flow change: pick slot first, then click "Pay", not the current "click Pay then pick slot").
- Configure webhook in Razorpay dashboard → `POST {API_PUBLIC_URL}/api/v1/webhooks/razorpay` with the secret stored as `RAZORPAY_WEBHOOK_SECRET`.
- Add `app.use(bodyParser.raw({ type: 'application/json' }))` for that route only (the rest of the API needs parsed JSON — use raw-body middleware scoped to the webhook path).

**Acceptance**: Razorpay test webhook delivers → booking created server-side without frontend involvement. Trigger via `razorpay test webhook` CLI or the dashboard's "Test webhook" button.

---

## Track 6 — Sentry + PostHog (½ day)

**Problem**: When prod breaks, you learn from a tweet. No analytics → no signal on where users drop off.

### 6a. Sentry

- `pnpm --filter @skillverify/api add @sentry/nestjs @sentry/profiling-node`
- `pnpm --filter @skillverify/web add @sentry/nextjs`
- API: wire in `main.ts` before `app.listen`:
  ```ts
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1, profilesSampleRate: 0.1 });
  ```
- Web: run `npx @sentry/wizard@latest -i nextjs` (creates `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`). Skip the Vercel binding when prompted.
- Add `SENTRY_DSN` to `.env` (one DSN per app, get from sentry.io free tier).

### 6b. PostHog

- `pnpm --filter @skillverify/web add posthog-js`
- New `apps/web/components/posthog-provider.tsx`:
  ```ts
  'use client';
  import posthog from 'posthog-js';
  import { useEffect } from 'react';
  export function PostHogProvider() {
    useEffect(() => {
      if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
      });
    }, []);
    return null;
  }
  ```
- Mount in `apps/web/app/layout.tsx` next to `<SmoothScrollProvider />`.
- Track 5 events with `posthog.capture(name, props)`:
  - `signup_completed` (in signup page after redirect)
  - `college_id_uploaded` (after upload presign success)
  - `marksheet_uploaded` (after semester upload)
  - `first_problem_solved` (in submit handler when verdict === 'AC' and it's the user's first AC — check via /me endpoint)
  - `dm_sent` (in messages composer)
- Identify user on session change: `posthog.identify(session.user.email, { name, institution })`.

**Acceptance**: Sentry dashboard receives a test error (`throw new Error('sentry test')` from a temporary endpoint, delete after). PostHog live dashboard shows real events firing.

---

## Track 7 — Transactional email via Resend (½ day)

**Problem**: User uploads college ID → status changes server-side → user has no idea unless they refresh the dashboard. Silent UX = users assume broken.

**Changes**:

- `pnpm --filter @skillverify/api add resend`
- New `apps/api/src/infra/email/email.module.ts` + `email.service.ts`:
  ```ts
  @Injectable()
  export class EmailService {
    private readonly resend = process.env.RESEND_API_KEY
      ? new Resend(process.env.RESEND_API_KEY)
      : null;
    async send(to: string, subject: string, html: string) {
      if (!this.resend) {
        Logger.warn(`Email skipped (no RESEND_API_KEY): ${subject} → ${to}`);
        return;
      }
      return this.resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'SkillVerify <noreply@skillverify.in>',
        to,
        subject,
        html,
      });
    }
  }
  ```
- Mark `EmailModule` as `@Global()` so any service can inject it.
- 4 transactional emails to start:
  1. **Welcome** — after signup, "Your account is created. We received your college ID and you'll hear from us within 24 hours."
  2. **College-ID approved** — fired from `CollegeIdService.approve` (admin action).
  3. **College-ID rejected** — fired from `CollegeIdService.reject` with the rejection reason.
  4. **Marksheet approved/rejected** — same pattern from `AcademicRecordService`.
- HTML templates — keep them simple (string templates inline). When you need fancier templates later, use React Email.
- `.env`: add `RESEND_API_KEY` + `EMAIL_FROM`. Resend's free tier is 3K emails/month.
- Domain verification: until you set up your domain in Resend (1-time SPF/DKIM), use Resend's `onboarding@resend.dev` sender for testing.

**Acceptance**: Sign up with a real email → receive the welcome email. Approve a college ID in admin → receive the approval email.

---

## Track 8 — Surface review SLA + "action required" banner (½ day)

**Problem**: Students upload, then wait indefinitely. Rejected status is buried in the verifications page — easy to miss.

**Changes**:

- `apps/web/app/(student)/dashboard/page.tsx`: at the top of the dashboard (above the 3D avatar), add an `<ActionRequiredBanner />` component that:
  - Queries `/verifications/me/status`.
  - If `collegeId === 'rejected'` → render a red banner: **"Action required: your college ID was rejected. Re-upload to continue."** with a button linking to `/dashboard/verifications`.
  - If `collegeId === 'pending'` or `'pending_review'` → render an amber info banner: **"College ID under review. Usually reviewed within 24 hours."** + queue-position pill.
  - Else → render nothing.
- New endpoint `GET /verifications/queue-position` (public-ish, requires auth):
  ```ts
  // Returns how many pending college-IDs were uploaded before yours.
  async queuePosition(userId: string) {
    const me = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { collegeIdUploadedAt: true, collegeIdStatus: true },
    });
    if (me?.collegeIdStatus !== 'pending_review' || !me.collegeIdUploadedAt) return { position: null };
    const ahead = await this.prisma.studentProfile.count({
      where: {
        collegeIdStatus: 'pending_review',
        collegeIdUploadedAt: { lt: me.collegeIdUploadedAt },
      },
    });
    return { position: ahead + 1 };
  }
  ```
- Verifications page: above each pending tile, add "ETA: usually < 24h · You're #N in queue".

**Acceptance**: Upload an ID → dashboard immediately shows amber banner with queue position. Admin rejects → next page load shows red action-required banner.

---

## Track 9 — Sidebar consolidation + onboarding wizard (2 days)

**Problem**: 14 sidebar items overwhelm new users. No guidance on what to do first → poor activation.

### 9a. Sidebar consolidation

New nav (7 items):
| Item | Route | Contains |
|---|---|---|
| Home | `/dashboard` | the overview (unchanged) |
| Profile | `/dashboard/profile` | tabs inside: **Profile / Skills / Verifications / Integrations** |
| Practice | `/dashboard/practice` | unchanged |
| Opportunities | `/dashboard/opportunities` | tabs inside: **Freelance / Placements / Compete / Interviews** |
| Community | `/dashboard/community` | unchanged (Messages stays a separate route but shares the icon family) |
| Messages | `/dashboard/messages` | unchanged |
| Leaderboard | `/dashboard/leaderboard` | unchanged |

The pages themselves don't move — we just add tab navigation inside Profile and Opportunities that route to the existing pages with the appropriate styling.

- New components: `apps/web/components/profile-tabs.tsx` and `opportunities-tabs.tsx` — both client components that render a horizontal tab bar using `usePathname()` to highlight the active tab.
- Mount in each respective page's layout file (`apps/web/app/(student)/dashboard/profile/layout.tsx`, new `layout.tsx` for opportunities subroutes).
- Update sidebar nav array in `apps/web/components/sidebar.tsx` to the 7 items.
- Keep deep-link redirects: anyone hitting `/dashboard/skills` should redirect to `/dashboard/profile/skills` (use Next middleware or `redirect()` in the page).

### 9b. Onboarding wizard

- New table `OnboardingProgress` on StudentProfile: `onboardingStep Int @default(0)` (0 = not started, 1 = uploaded-ID, 2 = added-skill, 3 = solved-problem, 4 = done).
- Migration `onboarding_progress`.
- New component `apps/web/components/onboarding-wizard.tsx`:
  - Renders a dismissable modal if `onboardingStep < 4`.
  - 3 steps:
    1. **Upload college ID** (we have it from signup; this step shows "✓ Done" if `collegeIdUrl` exists)
    2. **Add your first skill** — links to `/dashboard/profile/skills`
    3. **Solve a practice problem** — links to `/dashboard/practice`
  - Persists step via `PATCH /profile/me { onboardingStep }`.
- Mount in `(student)/dashboard/layout.tsx`.
- Auto-increment on relevant actions: when first skill is added, when first AC submission lands, etc. (handled in the existing service methods — add a one-line `if (profile.onboardingStep < N) updateStep(N+1)`).

**Acceptance**: New signup sees the wizard within 2 seconds. Completing each step advances the badge. Dismissing reappears on next session until completed.

---

## Track 10 — Mobile pass (1 day)

**Problem**: Untested on phones. The sidebar vanishes at `md` (768px) with no replacement nav. 3D scenes will eat batteries.

**Changes**:

- New component `apps/web/components/mobile-nav.tsx`: a burger menu that opens a full-screen drawer with the same nav items. Use Radix UI Dialog or just a simple state-driven overlay.
- Add to `(student)/dashboard/layout.tsx`: show the burger in a small mobile top bar, hidden at `md+`.
- In `landing-hero-3d.tsx` and `dashboard-avatar-3d.tsx`: add a `useMediaQuery('(max-width: 768px)')` check. On mobile, replace the 3D Canvas with a static gradient + icon hero. Saves ~250KB JS and the battery.
- Walk every dashboard page in Chrome DevTools at 360px:
  - Practice problem page: editor too narrow — collapse the leaderboard panel below.
  - Verifications page: semester tile grid → 2 columns on mobile, not 4.
  - Freelance grid: 1 column on mobile (currently looks OK but verify).
  - Community: subreddit rail should collapse into a horizontal scroller above the feed on mobile.
- Run Lighthouse mobile audit on `/` and `/dashboard` — target ≥ 80 performance score.

**Acceptance**: Open `localhost:3000` in mobile-mode Chrome devtools. Every dashboard page is usable with thumb taps. No 3D Canvas on small screens.

---

## Track 11 — OG image generation for public profiles (1 day)

**Problem**: `/u/[slug]` shared on LinkedIn → blank preview card. The single biggest viral surface, totally wasted.

**Changes**:

- `pnpm --filter @skillverify/web add @vercel/og`
- New file `apps/web/app/api/og/[slug]/route.tsx`:
  ```tsx
  import { ImageResponse } from 'next/og';
  export const runtime = 'edge';
  export async function GET(req: Request, { params }: { params: { slug: string } }) {
    const profile = await fetchProfileForOg(params.slug);
    return new ImageResponse(
      <div style={/* big card with name, headline, institution, L1-L4 chips, SkillVerify logo */}>
        ...
      </div>,
      { width: 1200, height: 630 },
    );
  }
  ```
- Update `(public)/u/[slug]/page.tsx` `generateMetadata`:
  ```ts
  openGraph: {
    images: [{ url: `/api/og/${params.slug}`, width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', images: [`/api/og/${params.slug}`] },
  ```
- Test by pasting a profile URL into the LinkedIn post composer (which previews OG live) and into https://opengraph.xyz.

**Acceptance**: A pasted public-profile URL shows a beautiful 1200×630 preview card with the student's name + headline + verification chip.

---

## Track 12 — Honest scope labels in marketing (½ day)

**Problem**: Landing page claims "1700+ Practice Problems" and "500+ Colleges". Real numbers: 170 universal exercises across 5 languages, 254 institutions. Misleading copy = first-impression trust hit when users count.

**Changes**:

- `apps/web/app/(public)/page.tsx`:
  - `<CountStat n={1700} suffix="+" ...>` → `<CountStat n={170} ...>` with label "Practice Problems"
  - `<CountStat n={500} suffix="+" ...>` → `<CountStat n={254} ...>` with label "Colleges"
- Replace every UI use of the word "Verified" (chips, public profile, integration tiles) with **"Pending institutional review"** until DigiLocker integration is live OR the L1+L2 chain is fully institution-API-backed.
  - Exception: when a marksheet/college-ID is _actually approved by a human reviewer_ (not just OCR-passed), it can say **"Reviewer-verified"** with a "(method)" tooltip.
- Audit `RECREATE_PROMPT.md` and update the numbers there too.

**Acceptance**: Marketing copy reflects real counts. No "Verified" label shows on a profile that hasn't been touched by a human reviewer.

---

## Track 13 — PII isolation (1 day)

**Problem**: College IDs + marksheets are stored in S3 with the URL exposed directly in `StudentProfile.collegeIdUrl` and `AcademicRecord.docUrl`. Any logged-in user (including reviewers without a real audit trail) could spread these.

**Changes**:

- New endpoint `GET /files/:fileId`:
  - Looks up the file's owner + checks the requester is either: (a) the owner, (b) `PLATFORM_ADMIN`, (c) `VERIFICATION_REVIEWER`.
  - Generates a short-lived signed S3 URL (60s expiry) using `storage.getSignedDownloadUrl(key)`.
  - Returns a 302 redirect.
  - **Writes to `VerificationAudit`** every time a reviewer/admin accesses a file (so you can prove who saw what).
- Stop storing the public URL in DB. Store only the S3 key (e.g. `temp/college-ids/abc.jpg`).
- Frontend: instead of `<img src={profile.collegeIdUrl}>`, use `<img src={`/api/v1/files/${profile.collegeIdKey}`}>`.
- Update the resume preview iframe similarly.
- Migration `pii_isolation_keys`: rename `collegeIdUrl` → `collegeIdKey`, `docUrl` → `docKey`. Backfill keys from URLs by stripping the public-URL prefix.

**Acceptance**: Direct S3 URLs in DB get 403'd by S3 bucket policy. Authorized users still see files via the proxy. Audit log shows file access events.

---

## Track 14 — Soft-delete users (½ day)

**Problem**: Account deletion cascades and nukes posts/comments/submissions, wiping community state.

**Changes**:

- Add `deletedAt DateTime?` to `User` model. Migration `soft_delete_users`.
- New endpoint `DELETE /me` that sets `deletedAt = now()`, clears PII (email, passwordHash, profile.fullName → "Deleted User"), keeps user record + foreign keys intact.
- Update `auth.service.login` to reject login when `deletedAt != null`.
- Community + DM responses: when a user has `deletedAt`, render their author as "Deleted user" with no link.
- 30-day grace period: a cron job hard-deletes rows where `deletedAt < now() - 30 days` (compliant with DPDP "right to erasure").

**Acceptance**: Delete an account → posts say "Deleted user" but still display. 30 days later they're gone for real.

---

## Track 15 — Idempotency keys on POST endpoints (1 day)

**Problem**: Double-click "Pay" → two bookings. Same for "Apply", "Send inquiry", "List service".

**Changes**:

- New decorator + interceptor in `apps/api/src/common/interceptors/idempotency.interceptor.ts`:
  - Reads `Idempotency-Key` header.
  - If present, caches `{ userId, endpoint, key } → response` in Redis for 24h.
  - On retry with same key, returns cached response without re-running the handler.
- Apply to: `POST /interviews/payments/order`, `/payments/verify-and-book`, `/placements/:id/apply`, `/freelance/services/:id/inquiries`, `/freelance/services` (listing creation).
- Frontend: generate a UUID per click, send in header.

**Acceptance**: `curl -X POST ... -H 'Idempotency-Key: abc'` twice in 1 second → both return same response, only one DB row created.

---

## Track 16 — Test infrastructure (2 days)

**Problem**: Zero tests. When you let volunteer reviewers in, you NEED tests that prove admin endpoints can't be hit unauthenticated, can't accidentally approve everyone, etc.

**Changes**:

- `pnpm --filter @skillverify/api add -D vitest @nestjs/testing supertest @types/supertest`
- `pnpm --filter @skillverify/web add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom playwright`
- New `apps/api/vitest.config.ts`, `apps/web/vitest.config.ts`.
- Add `"test": "vitest run"`, `"test:watch": "vitest"` to each package.json.
- Initial tests:
  - `apps/api/src/modules/admin/admin.controller.spec.ts` — 5 tests: unauthenticated → 401, non-admin → 403, admin-approve writes to audit, admin-reject requires reasonCode, admin-reject writes to audit.
  - `apps/api/src/modules/interviews/razorpay.service.spec.ts` — 4 tests: order creation with valid keys, signature verification valid, signature verification invalid, webhook reconciles unstamped booking.
  - `apps/api/src/modules/auth/auth.service.spec.ts` — 3 tests: signup creates user, signup rejects duplicate email, login returns valid JWT.
  - `apps/api/src/modules/community/community.service.spec.ts` — 4 tests: vote toggles correctly, vote switch swings score by 2, hidden post body returns "[removed]", listSubreddits returns counts.
- New GitHub Actions workflow `.github/workflows/ci.yml`:
  ```yaml
  on: [push, pull_request]
  jobs:
    ci:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20, cache: pnpm }
        - run: pnpm install --frozen-lockfile
        - run: pnpm --filter @skillverify/shared build
        - run: pnpm --filter @skillverify/db generate
        - run: pnpm -r typecheck
        - run: pnpm -r lint
        - run: pnpm -r test
  ```

**Acceptance**: `pnpm -r test` passes locally. CI runs green on every PR.

---

## Track 17 — SkillBot persistence + global polling dedup (1 day)

**Problem**: SkillBot resets every navigation; sidebar/topbar/widget each poll separately for the same data.

### 17a. Persist chat history

- Add `ChatSession` + `ChatMessage` models. Migration `chat_persistence`.
- `ChatService.chat()`: ensure a session for the user (one session per user per day, or always reuse a single "main" session for simplicity), append the new user message + assistant reply.
- `GET /chat/history` returns the user's last 50 messages.
- Widget hydrates from `/chat/history` on first open instead of always starting fresh.

### 17b. Polling dedup

- Create `apps/web/lib/use-realtime.ts` — a single hook that queries `/config`, `/messages/unread-count`, and `/verifications/me/status` once per minute and exposes them via React Query cache.
- Replace per-component polling with reads from the shared store.
- Reduces sustained request rate from ~5/min/user to 3/min/user.

**Acceptance**: SkillBot widget reopens with prior conversation. Network tab shows the 3 polling endpoints called exactly once per minute (not per component mount).

---

## Track 18 — Demote 3D dashboard avatar (½ day)

**Problem**: The 3D avatar with bubble nav duplicates the sidebar, doesn't help users find what they need, adds bundle weight to every dashboard load.

**Changes**:

- Replace `DashboardAvatarWrapper` with a smaller hero strip (180px tall instead of 360px).
- Remove the orbiting nav bubbles entirely. Keep the glass icosahedron as a calm visual centerpiece + the user's name overlay.
- On mobile (`<md`), don't render the 3D Canvas at all — show a flat emerald gradient banner with a `<Sparkles>` icon.
- Move the verification status pill + CTAs (Complete verification, Open practice) into the hero strip so it actually serves a purpose.

**Acceptance**: Dashboard above-the-fold shows the user's actual status + next action, not just a decoration. Mobile dashboard loads ~250KB lighter.

---

## Phase 5 timeline summary

| Week       | Tracks             | Outcome                                                                                |
| ---------- | ------------------ | -------------------------------------------------------------------------------------- |
| **Week 1** | 1, 2, 3, 4, 5      | Brand cleaned, secrets safe, audit + reviewer-role + webhook live, AI off the hot path |
| **Week 2** | 6, 7, 8, 9         | Monitoring + emails + onboarding + sidebar consolidation shipped                       |
| **Week 3** | 10, 11, 12, 13     | Mobile + OG + copy + PII proxy                                                         |
| **Week 4** | 14, 15, 16, 17, 18 | Soft-delete, idempotency, tests + CI, chat persistence, dashboard hero                 |

**Total**: ~4 weeks of focused work for one engineer, ~2 weeks for two.

After Phase 5: the platform is operationally trustworthy. **Then** build the company portal and posting portal you have planned. Doing the new portals on an operationally weak base means you fix double the surface area later.

---

## Acceptance gate for "Phase 5 done"

Before declaring Phase 5 complete, all of the following must pass:

- [ ] `git grep -i orbie` returns 0 matches in source code.
- [ ] All secrets rotated. Old keys return 401 when hit directly.
- [ ] Every admin write action creates a `VerificationAudit` row.
- [ ] Signup completes in < 1s P95 regardless of OpenRouter health.
- [ ] Razorpay webhook reconciles a booking when the frontend skips `/verify-and-book`.
- [ ] Sentry dashboard receives errors from both apps in prod.
- [ ] PostHog dashboard shows ≥ 5 signed-up users with funnel events.
- [ ] Every status-change email lands in the user's inbox within 60s.
- [ ] New signup sees the 3-step wizard.
- [ ] Sidebar has 7 items max.
- [ ] All dashboard pages usable at 360px width.
- [ ] Sharing a `/u/[slug]` URL on LinkedIn shows a custom OG card.
- [ ] Landing page numbers match reality.
- [ ] All file access goes via `/files/:id` proxy; direct S3 URLs in DB removed.
- [ ] `pnpm -r test` passes locally and in GitHub Actions CI.
- [ ] Dashboard above-the-fold tells the user what to do next.
