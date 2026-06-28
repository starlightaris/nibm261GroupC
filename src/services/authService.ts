import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

type Role = 'driver' | 'passenger';

export async function loginUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  phone: string,
  licenseNumber: string,
  vehicleType: string,
  vehiclePlate: string
): Promise<DriverProfile> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  const profile: DriverProfile = {
    uid: cred.user.uid,
    email,
    name,
    phone,
    role: 'driver',
    licenseNumber,
    vehicleType,
    vehiclePlate,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', cred.user.uid), profile);


  await setDoc(doc(db, 'vehicles', cred.user.uid), {
    driverId: cred.user.uid,
    vehicleName: `${name}'s Vehicle`,
    plateNumber: vehiclePlate,
    capacity: 10, // default; editable in Profile
    inviteCode: generateInviteCode(),
    shiftTimes: {
      morningCutoff: '06:00', // HH:MM 24-hour; editable in Profile
      eveningCutoff: '17:00',
    },
  });

  return profile;
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: any; profile: AuthUser }> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  const snap = await getDoc(doc(db, 'users', cred.user.uid));

  if (!snap.exists()) {
    throw new Error('User profile not found. Please sign up.');
  }

  const profile = snap.data() as AuthUser;

  return { user: cred.user, profile };
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};