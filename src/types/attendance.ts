export type ShiftType = 'morning' | 'evening';
export type AttendanceStatus = 'present' | 'absent' | 'pending';

export interface PassengerAttendance {
  passengerId: string;
  date: string; // YYYY-MM-DD
  morningShift: AttendanceStatus;
  eveningShift: AttendanceStatus;
  updatedAt?: number;
}
