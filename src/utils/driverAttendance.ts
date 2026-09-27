export type DriverShift = 'morning' | 'evening';
export type DriverAttendanceStatus = 'present' | 'absent' | 'unmarked';

export type AttendanceMember = { userId: string; name: string };
export type AttendanceRecord = {
  userId: string;
  shift: DriverShift;
  status: DriverAttendanceStatus;
};

export const DEFAULT_CUTOFFS: Record<DriverShift, string> = {
  morning: '09:00',
  evening: '17:00',
};

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function currentDriverShift(date: Date): DriverShift {
  return date.getHours() < 12 ? 'morning' : 'evening';
}

export function cutoffLabel(date: Date, cutoff: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(cutoff);
  if (!match) return 'Cutoff not set';
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  if (date.getHours() * 60 + date.getMinutes() >= minutes) return 'Closed';
  return `Cutoff ${new Date(2000, 0, 1, Number(match[1]), Number(match[2]))
    .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
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
