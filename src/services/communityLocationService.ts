import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export interface MemberLocation {
  address: string;
  latitude: number;
  longitude: number;
}

/**
 * Updates a single member's pickup or drop-off location inside
 * communities/{communityId}.members[].
 *
 * Firestore can't patch one element of an array field in place — the
 * whole array has to be read and rewritten. Doing that with a plain
 * getDoc + updateDoc is unsafe here: two passengers in the same
 * community editing their locations around the same time could read
 * the same array and one write would silently clobber the other's
 * (lost update). runTransaction re-reads inside the transaction and
 * retries on conflict, so concurrent edits to different members'
 * entries can't stomp on each other.
 *
 * This is the single write path for member locations — both the
 * "set locations" onboarding prompt and the Settings > Edit Locations
 * screen call this, so there's one place that keeps
 * communities.members[] as the source of truth.
 */
export const updateMemberLocation = async (
  communityId: string,
  uid: string,
  mode: 'Pickup' | 'Drop-off',
  location: MemberLocation
): Promise<void> => {
  const field = mode === 'Pickup' ? 'pickupLocation' : 'dropoffLocation';
  const communityRef = doc(db, 'communities', communityId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(communityRef);
    if (!snap.exists()) {
      throw new Error('Community not found.');
    }

    const members: any[] = snap.data().members ?? [];
    const idx = members.findIndex((m) => m.userId === uid);

    if (idx === -1) {
      throw new Error('You are not a member of this community.');
    }

    const updatedMembers = members.map((m, i) =>
      i === idx ? { ...m, [field]: location } : m
    );

    tx.update(communityRef, { members: updatedMembers });
  });
};
