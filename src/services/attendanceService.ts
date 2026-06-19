import { PassengerAttendance, ShiftType, AttendanceStatus } from '../types/attendance';

// Mock passenger data layer
export const MOCK_ATTENDANCE_DB: Record<string, PassengerAttendance> = {
  'mock-passenger-1': {
    passengerId: 'mock-passenger-1',
    date: new Date().toISOString().split('T')[0],
    morningShift: 'pending',
    eveningShift: 'pending',
  }
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const fetchAttendance = async (passengerId: string, date: string): Promise<PassengerAttendance> => {
  // Real implementation: const docRef = doc(db, 'attendance', `${passengerId}_${date}`);
  await delay(500);
  return MOCK_ATTENDANCE_DB[passengerId] || {
    passengerId,
    date,
    morningShift: 'pending',
    eveningShift: 'pending'
  };
};

export const updateAttendance = async (
  passengerId: string, 
  date: string, 
  shift: ShiftType, 
  status: AttendanceStatus
): Promise<void> => {
  // Real implementation: await setDoc(docRef, { [`${shift}Shift`]: status }, { merge: true });
  await delay(500);
  if (!MOCK_ATTENDANCE_DB[passengerId]) {
    MOCK_ATTENDANCE_DB[passengerId] = { passengerId, date, morningShift: 'pending', eveningShift: 'pending' };
  }
  if (shift === 'morning') MOCK_ATTENDANCE_DB[passengerId].morningShift = status;
  if (shift === 'evening') MOCK_ATTENDANCE_DB[passengerId].eveningShift = status;
};
