/**
 * Pure helper for removing a passenger from a community document's two
 * membership fields. `memberIds` (flat uid list, used for array-contains
 * queries) and `members` (full objects with locations) must always change
 * together, so both are computed in one place.
 */
export function withoutMember<M extends { userId: string }>(
  members: M[] | undefined,
  memberIds: string[] | undefined,
  uid: string
): { members: M[]; memberIds: string[]; wasMember: boolean } {
  const currentMembers = members ?? [];
  const currentIds     = memberIds ?? [];

  const wasMember =
    currentMembers.some((m) => m.userId === uid) || currentIds.includes(uid);

  return {
    members:   currentMembers.filter((m) => m.userId !== uid),
    memberIds: currentIds.filter((id) => id !== uid),
    wasMember,
  };
}
