export type NotificationType = 'attendanceReminder' | 'tripStarted' | 'driverApproaching';
export type NotificationRole = 'passenger' | 'driver';
export type NotificationPreferences = Record<NotificationType, boolean>;

interface NotificationTypeInfo {
  key: NotificationType;
  label: string;
  description: string;
  roles: NotificationRole[];
}

/**
 * Every alert the app can send. `roles` decides who sees the toggle, so
 * adding a type (or giving drivers one) is a one-line change here.
 */
export const NOTIFICATION_TYPES: NotificationTypeInfo[] = [
  {
    key: 'attendanceReminder',
    label: 'Attendance reminders',
    description: 'A reminder to confirm whether you are riding.',
    roles: ['passenger'],
  },
  {
    key: 'tripStarted',
    label: 'Trip started',
    description: 'When your driver starts the trip.',
    roles: ['passenger'],
  },
  {
    key: 'driverApproaching',
    label: 'Driver approaching',
    description: 'When your driver is close to your pickup point.',
    roles: ['passenger'],
  },
];

export function typesForRole(role: string | null | undefined): NotificationTypeInfo[] {
  return NOTIFICATION_TYPES.filter((type) => (type.roles as string[]).includes(role ?? ''));
}

/**
 * Stored value -> a full set of booleans. Anything missing or not a real
 * boolean counts as ON, so existing users keep getting alerts until they
 * switch one off. The sender (push function) must apply this same rule.
 */
export function resolvePreferences(stored: unknown): NotificationPreferences {
  const raw = (stored && typeof stored === 'object' ? stored : {}) as Record<string, unknown>;
  const pick = (key: NotificationType) => (typeof raw[key] === 'boolean' ? (raw[key] as boolean) : true);
  return {
    attendanceReminder: pick('attendanceReminder'),
    tripStarted: pick('tripStarted'),
    driverApproaching: pick('driverApproaching'),
  };
}

/** Use this before sending any notification of `type` to a user. */
export function isNotificationEnabled(stored: unknown, type: NotificationType): boolean {
  return resolvePreferences(stored)[type];
}

/** Firestore field path for one preference, so toggles never overwrite each other. */
export function preferenceFieldPath(type: NotificationType): string {
  return `notificationPreferences.${type}`;
}

type SaveResult = { ok: true } | { ok: false; error: unknown };

/** Runs a save and reports success/failure instead of throwing. */
export async function saveToggle(
  uid: string,
  type: NotificationType,
  enabled: boolean,
  save: (uid: string, type: NotificationType, enabled: boolean) => Promise<void>,
): Promise<SaveResult> {
  try {
    await save(uid, type, enabled);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
