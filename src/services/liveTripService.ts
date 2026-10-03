import { collection, limit, query, where, type Firestore } from 'firebase/firestore';

/** Query constraints must match the active-trip member access rule. */
export function passengerActiveTripQuery(
  database: Firestore, communityId: string, driverId: string, date: string,
) {
  return query(
    collection(database, 'trips'),
    where('communityId', '==', communityId),
    where('driverId', '==', driverId),
    where('date', '==', date),
    where('status', '==', 'active'),
    where('schemaVersion', '==', 2),
    limit(50),
  );
}
