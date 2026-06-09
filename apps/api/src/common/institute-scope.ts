/**
 * Whether a user may act on an institute-scoped resource (a placement drive or
 * competition). Public resources are open to everyone; institute-only ones are
 * limited to students of the posting institution.
 *
 * This is the privacy boundary that hiding a row from a list does NOT enforce —
 * mutations (apply / enter) must call it so a known resource ID can't be used
 * to bypass the scope.
 */
export function instituteScopeAllows(
  scope: string,
  resourceInstitutionId: string | null,
  userInstitutionId: string | null,
): boolean {
  if (scope !== 'institute_only') return true;
  return !!userInstitutionId && userInstitutionId === resourceInstitutionId;
}
