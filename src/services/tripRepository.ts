import {
  collection, deleteField, doc, getDoc, getDocs, limit, orderBy, query, where, writeBatch, type Firestore,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import type { PrivateTripRoute, StoredTrip, TripDocument } from '../types/trip';
import type { TripRepository } from '@services/tripService';

export const TRIP_HISTORY_LIMIT = 50;

export function createTripRepository(database: Firestore): TripRepository {
  const db = database;
  return {
    findActive: async (uid, date, shift) => {
      // Only read this driver's trips for today, rather than their entire history.
      const snapshot = await getDocs(query(
        collection(db, 'trips'),
        where('driverId', '==', uid),
        where('date', '==', date),
        where('shift', '==', shift),
        where('status', 'in', ['pending', 'active']),
        limit(TRIP_HISTORY_LIMIT),
      ));
      const records = snapshot.docs.map((record) => ({ id: record.id, data: record.data() as TripDocument }));
      return records.find(({ data }) => data.shift === shift && ['pending', 'active'].includes(data.status)) ?? null;
    },
    community: async (id) => {
      const snapshot = await getDoc(doc(db, 'communities', id));
      if (!snapshot.exists()) throw new Error('Community not found.');
      const data = snapshot.data();
      return {
        driverId: data.driverId,
        memberIds: [...new Set<string>([
          ...(data.memberIds ?? []),
          ...(data.members ?? []).map((member: { userId: string }) => member.userId),
        ])].filter((id) => typeof id === 'string' && id.length > 0),
      };
    },
    create: async (data, route) => {
      const reference = doc(collection(db, 'trips'));
      const batch = writeBatch(db);
      batch.set(reference, data);
      batch.set(doc(reference, 'private', 'route'), route);
      await batch.commit();
      return reference.id;
    },
    update: async (id, data, route) => {
      const reference = doc(db, 'trips', id);
      const batch = writeBatch(db);
      batch.update(reference, {
        ...data,
        // Clean up the older shared fields when an active trip is resumed.
        ...(data.schemaVersion === 2 ? { plannedStops: deleteField(), completedStops: deleteField() } : {}),
        // Stop sharing GPS in the same atomic write that publishes completion.
        ...(data.status === 'completed' ? { driverLocation: deleteField() } : {}),
      });
      if (route) batch.set(doc(reference, 'private', 'route'), route);
      await batch.commit();
    },
    getRoute: async (id) => {
      const snapshot = await getDoc(doc(db, 'trips', id, 'private', 'route'));
      return snapshot.exists() ? snapshot.data() as PrivateTripRoute : null;
    },
    get: async (id) => {
      const snapshot = await getDoc(doc(db, 'trips', id));
      return snapshot.exists() ? { id: snapshot.id, data: snapshot.data() as TripDocument } : null;
    },
    byDriver: async (uid) => {
      const snapshot = await getDocs(query(
        collection(db, 'trips'),
        where('driverId', '==', uid),
        where('status', '==', 'completed'),
        orderBy('endedAt', 'desc'),
        limit(TRIP_HISTORY_LIMIT),
      ));
      return snapshot.docs.map((record) => ({ id: record.id, data: record.data() as TripDocument }));
    },
    byParticipant: async (uid) => {
      const snapshot = await getDocs(query(
        collection(db, 'trips'),
        where('schemaVersion', '==', 2),
        where('participantIds', 'array-contains', uid),
        where('status', '==', 'completed'),
        orderBy('endedAt', 'desc'),
        limit(TRIP_HISTORY_LIMIT),
      ));
      return snapshot.docs.map((record) => ({ id: record.id, data: record.data() as TripDocument }));
    },
  };
}

export const tripRepository = createTripRepository(db);
