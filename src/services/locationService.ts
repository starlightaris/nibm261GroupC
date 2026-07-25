import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Saves driver's live location to Firestore
export async function updateDriverLocation(
  uid: string,
  coords: {
    latitude: number;
    longitude: number;
    heading?: number | null;
  }
) {
  await setDoc(
    doc(db, 'liveLocations', uid),
    {
      driverId: uid,
      latitude: coords.latitude,
      longitude: coords.longitude,
      heading: coords.heading ?? null,
      isSharing: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Called when driver stops sharing
export async function stopDriverLocation(uid: string) {
  await setDoc(
    doc(db, 'liveLocations', uid),
    {
      isSharing: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}