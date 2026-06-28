export type ShiftType = 'morning' | 'evening';
export type AttendanceStatus = 'present' | 'absent' | 'unmarked';

export interface AttendanceRecord {
  userId: string;
  communityId: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  status: AttendanceStatus;
  markedAt: string | null;
}

export interface PassengerAttendanceView {
  userId: string;
  date: string; // YYYY-MM-DD
  morningShift: AttendanceStatus;
  eveningShift: AttendanceStatus;
  morningMarkedAt: string | null;
  eveningMarkedAt: string | null;
}
