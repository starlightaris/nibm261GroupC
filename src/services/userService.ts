import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

// 1. Update either Pickup or Drop-off location dynamically
export const updateUserLocation = async (
  uid: string,
  mode: 'Pickup' | 'Drop-off',
  location: LocationData
): Promise<void> => {
  const userRef = doc(db, 'users', uid);

  // Map 'Pickup' to 'pickupLocation' and 'Drop-off' to 'dropoffLocation'
  const fieldToUpdate = mode === 'Pickup' ? 'pickupLocation' : 'dropoffLocation';

  await updateDoc(userRef, {
    [fieldToUpdate]: location,
  });
};

// 2. Fetch the entire passenger profile to display live data on the UI
export const getUserProfile = async (uid: string): Promise<any> => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data();
  } else {
    throw new Error('User profile not found.');
  }
};