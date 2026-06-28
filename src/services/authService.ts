import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';

import { doc, setDoc, getDoc } from 'firebase/firestore';

import { auth, db } from '@config/firebaseConfig';

import {
  AuthUser,
  DriverProfile,
  PassengerProfile,
} from '../types/auth';

export const registerPassenger = async (
  email: string,
  password: string,
  name: string,
  phone: string
): Promise<PassengerProfile> => {
  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

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

export const registerDriver = async (
  email: string,
  password: string,
  name: string,
  phone: string,
  licenseNumber: string,
  vehicleType: string,
  vehiclePlate: string
): Promise<DriverProfile> => {
  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

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

  return profile;
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: any; profile: AuthUser }> => {
  const cred = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const snap = await getDoc(doc(db, 'users', cred.user.uid));

  if (!snap.exists()) {
    throw new Error(
      'User profile not found. Please sign up.'
    );
  }

  const profile = snap.data() as AuthUser;

  return {
    user: cred.user,
    profile,
  };
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const resetPassword = async (
  email: string
): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

type Role = 'driver' | 'passenger';

export async function registerUser(
  email: string,
  password: string,
  profile: { name: string; mobile: string; role: Role }
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid; 

  await setDoc(doc(db, 'users', uid), {
    uid,
    name: profile.name,
    email,
    mobile: profile.mobile,
    role: profile.role,
    createdAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
  });
}