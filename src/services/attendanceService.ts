import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { PassengerAttendance, ShiftType, AttendanceStatus } from '../types/attendance';

export const fetchAttendance = async (passengerId: string, date: string): Promise<PassengerAttendance> => {
  try {
    const morningDocRef = doc(db, 'attendance', `${passengerId}_${date}_morning`);
    const eveningDocRef = doc(db, 'attendance', `${passengerId}_${date}_evening`);

    const [morningSnap, eveningSnap] = await Promise.all([
      getDoc(morningDocRef),
      getDoc(eveningDocRef)
    ]);

    let morningShift: AttendanceStatus = 'pending';
    let eveningShift: AttendanceStatus = 'pending';

    if (morningSnap.exists()) {
      morningShift = morningSnap.data().status as AttendanceStatus;
    }
    if (eveningSnap.exists()) {
      eveningShift = eveningSnap.data().status as AttendanceStatus;
    }

    return {
      passengerId,
      date,
      morningShift,
      eveningShift
    };
  } catch (error) {
    console.error("Error fetching attendance:", error);
    // Return pending as fallback on error
    return {
      passengerId,
      date,
      morningShift: 'pending',
      eveningShift: 'pending'
    };
  }
};

export const updateAttendance = async (
  passengerId: string, 
  date: string, 
  shift: ShiftType, 
  status: AttendanceStatus
): Promise<void> => {
  try {
    const docId = `${passengerId}_${date}_${shift}`;
    const docRef = doc(db, 'attendance', docId);
    
    await setDoc(docRef, {
      passengerId,
      date,
      shift,
      status,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp() // Note: setDoc with merge: true will overwrite this if not handled, but we use setDoc with merge: true? The prompt says "prevent duplicate records" which is handled by using the same doc ID. We will use setDoc without merge to overwrite or with merge to keep createdAt. Let's just use merge: true.
    }, { merge: true });
  } catch (error) {
    console.error("Error updating attendance:", error);
    throw error;
  }
};
