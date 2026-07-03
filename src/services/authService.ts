import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

type Role = 'driver' | 'passenger';

// ─── Login ────────────────────────────────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

// ─── Register basic user ──────────────────────────────────────────────────────
export async function registerUser(
  email: string,
  password: string,
  profile: {
    name: string;
    mobile: string;
    role: Role;
  }
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid  = cred.user.uid;

  await setDoc(doc(db, 'users', uid), {
    uid,
    name:      profile.name,
    email,
    mobile:    profile.mobile,
    role:      profile.role,
    createdAt: serverTimestamp(),
  });

  return uid;
}

// ─── Register Driver (users + vehicles in one call) ───────────────────────────
export async function registerDriver(
  email:        string,
  password:     string,
  name:         string,
  phone:        string,
  vehicleType:  string,
  plateNumber:  string,
  vehicleName:  string,
  description:  string,
  routeTags:    string[],
  whatsappLink?: string,
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid  = cred.user.uid;

  // Save user profile
  await setDoc(doc(db, 'users', uid), {
    uid,
    name,
    email,
    mobile:    phone,
    role:      'driver',
    createdAt: serverTimestamp(),
  });

  // Save vehicle profile — same uid links them together
  await setDoc(doc(db, 'vehicles', uid), {
    driverId:    uid,
    plateNumber,
    nickname:    vehicleName,
    vehicleType,
    description,
    routeTags,
    whatsappLink: whatsappLink ?? null,
    shiftTimes: {
      morningCutoff: '09:00',
      eveningCutoff: '17:00',
    },
    createdAt: serverTimestamp(),
  });

  return uid;
}

// ─── Save Passenger Profile ───────────────────────────────────────────────────
export async function savePassengerProfile(
  uid: string,
  passenger: {
    name:            string;
    email?:          string;
    phone?:          string;
    pickupLocation?: string;
    dropLocation?:   string;
  }
) {
  await setDoc(doc(db, 'passengers', uid), {
    uid,
    ...passenger,
    createdAt: serverTimestamp(),
  });
}