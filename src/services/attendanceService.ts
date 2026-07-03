import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@config/firebaseConfig';
import {
  AttendanceRecord,
  AttendanceStatus,
  PassengerAttendanceView,
  ShiftType,
} from '../types/attendance';

const DEFAULT_COMMUNITY_ID = 'default';

const toIsoString = (value: any): string | null => {
  if (!value) return null;

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  return null;
};

export const getCommunityIdForUser = async (userId: string): Promise<string> => {
  const userSnap = await getDoc(doc(db, 'users', userId));

  if (userSnap.exists()) {
    const communityId = userSnap.data().communityId;

    if (typeof communityId === 'string' && communityId.trim()) {
      return communityId;
    }
  }

  const passengerSnap = await getDoc(doc(db, 'passengers', userId));

  if (passengerSnap.exists()) {
    const communityId = passengerSnap.data().communityId;

    if (typeof communityId === 'string' && communityId.trim()) {
      return communityId;
    }
  }

  return DEFAULT_COMMUNITY_ID;
};

export const fetchAttendance = async (
  userId: string,
  date: string
): Promise<PassengerAttendanceView> => {
  try {
    const morningDocRef = doc(db, 'attendance', `${userId}_${date}_morning`);
    const eveningDocRef = doc(db, 'attendance', `${userId}_${date}_evening`);

    const [morningSnap, eveningSnap] = await Promise.all([
      getDoc(morningDocRef),
      getDoc(eveningDocRef),
    ]);

    let morningShift: AttendanceStatus = 'unmarked';
    let eveningShift: AttendanceStatus = 'unmarked';
    let morningMarkedAt: string | null = null;
    let eveningMarkedAt: string | null = null;

    if (morningSnap.exists()) {
      const data = morningSnap.data();

      morningShift = (data.status as AttendanceStatus) ?? 'unmarked';
      morningMarkedAt = toIsoString(data.markedAt ?? data.updatedAt);
    }

    if (eveningSnap.exists()) {
      const data = eveningSnap.data();

      eveningShift = (data.status as AttendanceStatus) ?? 'unmarked';
      eveningMarkedAt = toIsoString(data.markedAt ?? data.updatedAt);
    }

    return {
      userId,
      date,
      morningShift,
      eveningShift,
      morningMarkedAt,
      eveningMarkedAt,
    };
  } catch (error) {
    console.error('Error fetching attendance:', error);

    return {
      userId,
      date,
      morningShift: 'unmarked',
      eveningShift: 'unmarked',
      morningMarkedAt: null,
      eveningMarkedAt: null,
    };
  }
};

export const updateAttendance = async (
  userId: string,
  date: string,
  shift: ShiftType,
  status: AttendanceStatus,
  communityId?: string
): Promise<void> => {
  try {
    const docId = `${userId}_${date}_${shift}`;
    const docRef = doc(db, 'attendance', docId);

    const resolvedCommunityId =
      communityId ?? (await getCommunityIdForUser(userId));

    const payload: AttendanceRecord = {
      userId,
      communityId: resolvedCommunityId,
      date,
      shift,
      status,
      markedAt: status === 'unmarked' ? null : new Date().toISOString(),
    };

    await setDoc(docRef, payload);
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw error;
  }
};
