import { PassengerAttendanceData, ShiftType, AttendanceStatus } from '../types/attendance';

const MOCK_PROFILES: Record<string, PassengerAttendanceData> = {
  'mock-user-1': {
    passengerId: 'mock-user-1',
    date: new Date().toISOString().split('T')[0],
    morningShift: 'pending',
    eveningShift: 'pending',
  }
};

export const getMockProfile = (id: string): PassengerAttendanceData => {
  return MOCK_PROFILES[id] || {
    passengerId: id,
    date: new Date().toISOString().split('T')[0],
    morningShift: 'pending',
    eveningShift: 'pending',
  };
};

// Simulate Firestore delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchPassengerAttendance = async (passengerId: string, date: string): Promise<PassengerAttendanceData> => {
  // In a real app: const docSnap = await getDoc(doc(db, 'attendance', `${passengerId}_${date}`));
  // For now, simulate network and return mock or default
  await delay(600);
  return getMockProfile(passengerId);
};

export const updateShiftStatus = async (
  passengerId: string,
  date: string,
  shift: ShiftType,
  status: AttendanceStatus
): Promise<void> => {
  // In a real app: await setDoc(doc(db, 'attendance', `${passengerId}_${date}`), { [`${shift}Shift`]: status }, { merge: true });
  // For now, simulate update
  await delay(400);
  const profile = getMockProfile(passengerId);
  if (shift === 'morning') profile.morningShift = status;
  if (shift === 'evening') profile.eveningShift = status;
  MOCK_PROFILES[passengerId] = profile;
};
