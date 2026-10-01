import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import type { StoredTrip, TripDocument } from '../types/trip';
import type { TripRepository } from './tripService';

async function findTrips(field: string, operator: '==' | 'array-contains', value: string): Promise<StoredTrip[]> {
  const snapshot = await getDocs(query(collection(db, 'trips'), where(field, operator, value)));
  return snapshot.docs.map((record) => ({ id: record.id, data: record.data() as TripDocument }));
}

export const tripRepository: TripRepository = {
  // Single-field ownership queries avoid requiring new composite indexes.
  findActive: async (uid, date, shift) => (await findTrips('driverId', '==', uid))
    .find(({ data }) => data.date === date && data.shift === shift && ['pending', 'active'].includes(data.status)) ?? null,
  community: async (id) => {
    const snapshot = await getDoc(doc(db, 'communities', id));
    if (!snapshot.exists()) throw new Error('Community not found.');
    const data = snapshot.data();
    return {
      driverId: data.driverId,
      memberIds: [...new Set<string>([
        ...(data.memberIds ?? []),
        ...(data.members ?? []).map((member: { userId: string }) => member.userId),
      ])],
    };
  },
  create: async (data) => (await addDoc(collection(db, 'trips'), data)).id,
  update: async (id, data) => updateDoc(doc(db, 'trips', id), data),
  get: async (id) => {
    const snapshot = await getDoc(doc(db, 'trips', id));
    return snapshot.exists() ? { id: snapshot.id, data: snapshot.data() as TripDocument } : null;
  },
  byDriver: (uid) => findTrips('driverId', '==', uid),
  byParticipant: (uid) => findTrips('participantIds', 'array-contains', uid),
  legacyByPassenger: async (uid) => {
    const communities = await getDocs(query(collection(db, 'communities'), where('memberIds', 'array-contains', uid)));
    const trips = (await Promise.all(communities.docs.map((community) => findTrips('communityId', '==', community.id)))).flat();
    return trips.filter(({ data }) => !Array.isArray(data.participantIds));
  },
};
