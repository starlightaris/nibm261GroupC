export type DriverShift = 'morning' | 'evening';
export type DriverAttendanceStatus = 'present' | 'absent' | 'unmarked';

export type AttendanceMember = { userId: string; name: string };
export type AttendanceRecord = {
  userId: string;
  shift: DriverShift;
  status: DriverAttendanceStatus;
};

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function currentDriverShift(date: Date): DriverShift {
  return date.getHours() < 12 ? 'morning' : 'evening';
}

export function summarizeShift(
  members: AttendanceMember[],
  records: AttendanceRecord[],
  shift: DriverShift,
) {
  const presentIds = new Set(records.filter((record) => record.shift === shift && record.status === 'present').map((record) => record.userId));
  const confirmed = members.filter((member) => presentIds.has(member.userId));
  const total = members.length;
  const percent = total === 0 ? 0 : Math.round((confirmed.length / total) * 100);
  return {
    confirmed,
    total,
    percent,
    progressColor: total === 0 ? '#CBD5E1' : confirmed.length / total > 0.75 ? '#16A34A' : confirmed.length / total >= 0.4 ? '#F59E0B' : '#EF4444',
  };
}
