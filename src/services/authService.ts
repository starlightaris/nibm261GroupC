import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

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
  profile: {
    name: string;
    mobile: string;
    role: Role;
    licenseNumber?: string;
  }
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  await setDoc(doc(db, 'users', uid), {
    uid,
    name: profile.name,
    email,
    mobile: profile.mobile,
    role: profile.role,
    licenseNumber: profile.licenseNumber ?? null,
    createdAt: serverTimestamp(),
  });

  return uid;
}

export async function saveVehicleProfile(
  uid: string,
  vehicle: {
    vehicleNumber: string;
    nickname: string;
    routeTags: string[];
    contactNumber: string;
    whatsappLink?: string;
  }
) {
  await setDoc(doc(db, 'vehicles', uid), {
    driverId: uid,
    ...vehicle,
    createdAt: serverTimestamp(),
  });
}

export async function savePassengerProfile(
  uid: string,
  passenger: {
    name: string;
    email?: string;
    phone?: string;
    pickupLocation?: string;
    dropLocation?: string;
  }
) {
  await setDoc(doc(db, 'passengers', uid), {
    uid,
    ...passenger,
    createdAt: serverTimestamp(),
  });
}