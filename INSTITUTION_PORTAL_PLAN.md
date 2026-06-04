# Institution / TPO Portal — build plan

The college-side portal. Placement cells (TPOs) and faculty get read-only
oversight of their students' verification, can post institute-scoped campus
drives + competitions, and see verified placement analytics. This is the
supply/trust side that anchors the marketplace.

## Locked decisions

- **Access:** invite-only / vetted — a TPO requests access, an admin approves (mirrors the recruiter flow). Multiple admins per institution allowed.
- **Verification power:** **read-only oversight only.** A TPO can see each student's layer + ID/CGPA status but cannot approve anything. Verification authority stays 100% with the platform (no conflict-of-interest rubber-stamping).
- **V1 features:** student roster + verified analytics dashboard + post institute-only drives & competitions.
- **Roster scope:** every student whose `User.institutionId` matches the TPO's institution.
- **Contact:** TPO sees verification + academic status, **not** personal phone / login email. (College already has contact via its own systems.)
- **"Placed":** students with a `hired` PlacementApplication — a real verified stat, not self-reported.

## Lives in

`apps/web/app/(institution)/institution/**`, role-gated to `INSTITUTION_ADMIN`.
Reuses auth, UI kit, `api()`, and the recruiter approval / pending-gate / audit
/ email patterns.

## Reuse map

| Need                                | Reused asset                                                                |
| ----------------------------------- | --------------------------------------------------------------------------- |
| TPO approval queue + audit + emails | recruiter-approval pattern (`targetType: 'institution_admin'`)              |
| Campus drives                       | `PlacementDrive` (`scope: institute_only`, `institutionId` — already wired) |
| Roster cards                        | candidate-card projection (verification-status variant)                     |
| Pending-gate shell                  | the company `CompanyShell` pattern                                          |

## New data

- `InstitutionAdminProfile` — userId(unique), institutionId, fullName, title, status(pending/approved/rejected), approvedAt, rejection reason
- add `institutionId` + `scope` to `Competition` (institute-scoped competitions, mirroring `PlacementDrive`)

## Tracks (sequential)

1. **I1** — Data model + migration (`InstitutionAdminProfile`; competition scoping)
2. **I2** — TPO request-access signup (`/institution/signup`) + login routing + pending gate
3. **I3** — Admin approval queue for institution admins (+ audit + emails)
4. **I4** — Roster API (students by `institutionId`, verification-status projection) + analytics aggregates
5. **I5** — Institution route-group shell (layout, guard, pending screen)
6. **I6** — Roster UI (filter by layer / verification status; read-only student detail)
7. **I7** — Analytics dashboard (layer distribution, verified %, placements-hired, CSV export)
8. **I8** — Post institute drives + competitions; surface institute competitions to students
9. **I9** — Tests (roster-scope unit + TPO e2e: request→approve→roster→analytics) + polish

## After Institution

→ Interviewer portal (L4 expert interviews).
