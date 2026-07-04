import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { PassengerPreview } from '../types/trip';

// Live-listens to the waiting passengers on a trip
export function subscribeToWaitingPassengers(
  tripId: string,
  onUpdate: (passengers: PassengerPreview[]) => void
) {
  const passengersRef = collection(db, 'trips', tripId, 'passengers');
  const q = query(passengersRef, where('status', '==', 'waiting'));

  return onSnapshot(q, (snapshot) => {
    const list: PassengerPreview[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<PassengerPreview, 'id'>),
    }));
    onUpdate(list);
  });
}