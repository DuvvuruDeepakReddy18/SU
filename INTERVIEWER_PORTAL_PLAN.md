# Interviewer Portal — build plan

The portal that powers **L4 — the top verification layer**. Invited expert
interviewers conduct 1:1 interviews, score them, and on a pass promote the
student's booked skill to L4_EXPERT. This closes the L1→L4 ladder — today
nothing can actually award L4.

## Locked decisions

- **Access:** invite-only. An admin creates interviewer accounts (no public signup). Invited = pre-approved, so **no pending-approval gate**.
- **Routing:** shared pool. Open bookings (`status: scheduled`, no interviewer) sit in a queue; any interviewer **claims** one.
- **Conduct:** off-platform via the booking's existing Jitsi `meetingUrl`. No video infra.
- **Scoring:** pass/fail + overall score + notes.
- **Award:** passing promotes the booked skill (`booking.skillId`) → **L4_EXPERT**. Interview-granted L4 is a floor the layer engine won't recompute away.

## Lives in

`apps/web/app/(interviewer)/interviewer/**`, role-gated to `INTERVIEWER`.
Reuses auth, UI kit, the shell pattern, `InterviewBooking` + Jitsi `meetingUrl`,
the layer engine, and the admin/audit/email patterns.

## New data

- `InterviewerProfile` — userId(unique), fullName, bio?, expertise(string[]), active(bool), createdAt
- add `interviewerId` + `score` to `InterviewBooking`

## Tracks (sequential)

1. **V1** — Data model + migration (`InterviewerProfile`; `interviewerId`/`score` on booking) + layer-engine L4-floor guard
2. **V2** — Admin "invite interviewer" + list (create INTERVIEWER user + temp-password email) in the admin portal
3. **V3** — Interviewer API: `me`, open pool + claim, my interviews, score-and-award (promotes skill to L4)
4. **V4** — Interviewer route-group shell (layout, role guard) + home
5. **V5** — Pool UI (claim) + my-interviews UI (join link + score form)
6. **V6** — L4 promotion through the layer engine; student sees L4 on the skill; login routing
7. **V7** — Tests (L4-award unit + interviewer e2e: invite→claim→pass→skill is L4) + polish

## After Interviewer

All five portals complete (Student, Admin, Company, Institution, Interviewer).
Next focus: cross-cutting hardening (seed mojibake cleanup, secret rotation,
deploy pipeline).
