# Company Portal — build plan

The recruiter-facing portal. Demand side of the marketplace: vetted recruiters
search verified students, post jobs, run a hiring pipeline, and contact
candidates through a consent gate.

## Locked decisions

- **Scope:** full hiring pipeline (search + post jobs + applications + messaging + stage tracking).
- **Recruiter access:** vetted — signup lands in an admin approval queue; no searching until approved.
- **PII:** verified data + name visible; **contact (phone / emails) revealed only after the student accepts the recruiter's inquiry** (mirrors the freelance accept-flow). Unverified data stays hidden.
- **Monetization:** free during beta (no billing).
- **Signup:** separate `/company/signup` page.
- **Teams:** one recruiter per company in v1 (Employer ↔ RecruiterProfile is 1:1).
- **Apply gate:** a student must be **L3+ (L3_PROVEN or L4_EXPERT)** to apply to a job.

## Lives in

`apps/web/app/(company)/company/**`, role-gated to `RECRUITER`. Reuses auth,
UI kit, `api()` client, `DirectMessage`, and the admin/audit patterns.

## Reuse map

| Need                        | Reused asset                                                                     |
| --------------------------- | -------------------------------------------------------------------------------- |
| Job posting                 | `PlacementDrive` (+ `employerId`)                                                |
| Application pipeline        | `PlacementApplication` (+ stages, + `sourcedBy`)                                 |
| Gated contact + accept-flow | `FreelanceInquiry` pattern → new `RecruiterInquiry`                              |
| Recruiter approval queue    | verification-queue + `VerificationAudit` (`targetType: 'recruiter'`)             |
| 1:1 chat after accept       | `DirectMessage`                                                                  |
| Candidate data              | public-profile + `LayerEngine`, new search endpoint with PII-stripped projection |

## New data models

- `Employer` — company org (name, website, domain?, logoUrl?, description?, verified, createdById)
- `RecruiterProfile` — userId(unique), employerId(unique), title?, status(pending/approved/rejected), approvedAt, rejection reason
- `RecruiterInquiry` — recruiter→student contact request (+ driveId?), accept reveals contact
- `SavedCandidate` — recruiter shortlist bookmark
- extend `PlacementDrive` (+employerId) and `PlacementApplication` (+stages, +sourcedBy)

## Tracks (sequential)

1. **C1** — Data model + migration (Employer, RecruiterProfile, RecruiterInquiry, SavedCandidate; extend drive/application)
2. **C2** — Recruiter auth: `/company/signup` (role RECRUITER + Employer), login routing, pending gate
3. **C3** — Admin recruiter-approval queue (+ audit log + approve/reject emails)
4. **C4** — Candidate search API (filters + verified-only projection + PII strip) + shortlist endpoints
5. **C5** — Company route-group shell (layout, sidebar, role guard, onboarding/pending screen)
6. **C6** — Candidate search UI + profile view + "Request contact" + shortlist UI
7. **C7** — Job postings: recruiter create/edit/list (via PlacementDrive) + student-facing visibility + **L3+ apply gate**
8. **C8** — Application pipeline: stages, kanban board, source a searched candidate into a job
9. **C9** — Contact-requests inbox + messaging; student-side "recruiter wants to connect" + accept-reveals-contact
10. **C10** — Notifications + transactional emails (approved, new application, contact accepted) + analytics events
11. **C11** — Tests (PII-projection unit + recruiter signup→approve→search→inquiry→accept e2e) + polish

## After Company

→ Institution / TPO portal → Interviewer portal.
