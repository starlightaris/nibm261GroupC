import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';

import { doc, setDoc, getDoc } from 'firebase/firestore';

import { auth, db } from '../../firebaseConfig';

import {
  AuthUser,
  DriverProfile,
  PassengerProfile,
} from '../types/auth';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateInviteCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

// ─── Passenger ───────────────────────────────────────────────────────────────

export const registerPassenger = async (
  email: string,
  password: string,
  name: string,
  phone: string
): Promise<PassengerProfile> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  const profile: PassengerProfile = {
    uid: cred.user.uid,
    email,
    name,
    phone,
    role: 'passenger',
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', cred.user.uid), profile);

  return profile;
};

// ─── Driver ──────────────────────────────────────────────────────────────────

export const registerDriver = async (
  email: string,
  password: string,
  name: string,
  phone: string,
  vehicleType: string,
  vehiclePlate: string,
  vehicleName: string,
  description: string = '',
  routeTags: string[] = [],
  whatsappLink?: string,
): Promise<DriverProfile> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  const profile: DriverProfile = {
    uid: cred.user.uid,
    email,
    name,
    phone,
    role: 'driver',
    vehicleType,
    vehiclePlate,
    createdAt: new Date().toISOString(),
  };

  // 1. Write users/{uid}
  await setDoc(doc(db, 'users', cred.user.uid), profile);

  // 2. Write vehicles/{uid}
  await setDoc(doc(db, 'vehicles', cred.user.uid), {
    driverId:    cred.user.uid,
    vehicleName,
    plateNumber: vehiclePlate,
    vehicleType,
    description,
    routeTags,
    ...(whatsappLink ? { whatsappLink } : {}),
    capacity:    4,              // editable later in Settings → Vehicle Details
    inviteCode:  generateInviteCode(),
    shiftTimes: {
      morningCutoff: '09:00',   // editable later in Settings → Shift Times
      eveningCutoff: '17:00',
    },
  });

  return profile;
};

// ─── Login ───────────────────────────────────────────────────────────────────

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

// ─── Logout ──────────────────────────────────────────────────────────────────

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

// ─── Reset password ───────────────────────────────────────────────────────────

export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};