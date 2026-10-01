import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { withoutMember } from '@utils/communityMembers';

/**
 * Removes a passenger from communities/{communityId}. Used both when a
 * passenger leaves on their own and when a driver removes a member, so
 * memberIds and members[] can never drift apart.
 *
 * Like updateMemberLocation, this rewrites the members[] array, so it runs in
 * a transaction to avoid clobbering a concurrent join / location edit by
 * another passenger in the same community. memberIds and members are updated
 * together so the passenger's usePassengerCommunity query stops matching.
 *
 * Past attendance records are intentionally left in place — they are the
 * driver's trip history and aren't tied to current membership.
 */
export const removeCommunityMember = async (
  communityId: string,
  uid: string
): Promise<void> => {
  const communityRef = doc(db, 'communities', communityId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(communityRef);
    if (!snap.exists()) {
      throw new Error('Community not found.');
    }

    const data = snap.data();
    const next = withoutMember(data.members, data.memberIds, uid);

    if (!next.wasMember) {
      throw new Error('This passenger is not a member of the community.');
    }

    tx.update(communityRef, { members: next.members, memberIds: next.memberIds });
  });
};
