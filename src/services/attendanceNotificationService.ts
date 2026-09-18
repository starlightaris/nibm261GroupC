import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

type AttendanceStatus = 'present' | 'absent' | 'unmarked';
type ShiftType = 'morning' | 'evening';

const REMINDER_TYPE = 'attendance-reminder';
const CHANNEL_ID = 'attendance-reminders';

interface ReminderInput {
  userId: string;
  communityId: string;
  date: string;
  shift: ShiftType;
  cutoffTime: string;
  status: AttendanceStatus;
}

const getReminderDate = (date: string, cutoffTime: string): Date | null => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = cutoffTime.split(':').map(Number);

  if ([year, month, day, hour, minute].some((value) => !Number.isFinite(value))) {
    return null;
  }

  const reminder = new Date(year, month - 1, day, hour, minute, 0, 0);
  reminder.setMinutes(reminder.getMinutes() - 15);
  return reminder;
};

const isMatchingReminder = (
  request: Notifications.NotificationRequest,
  input: Pick<ReminderInput, 'userId' | 'date' | 'shift'>
) => {
  const data = request.content.data;
  return (
    data?.type === REMINDER_TYPE &&
    data?.userId === input.userId &&
    data?.date === input.date &&
    data?.shift === input.shift
  );
};

export const initializeAttendanceNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web') return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Attendance reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
};

export const cancelAttendanceReminder = async (
  input: Pick<ReminderInput, 'userId' | 'date' | 'shift'>
): Promise<void> => {
  if (Platform.OS === 'web') return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matching = scheduled.filter((request) => isMatchingReminder(request, input));
  await Promise.all(
    matching.map((request) =>
      Notifications.cancelScheduledNotificationAsync(request.identifier)
    )
  );
};

export const syncAttendanceReminder = async (
  input: ReminderInput
): Promise<void> => {
  if (Platform.OS === 'web') return;

  await cancelAttendanceReminder(input);
  if (input.status !== 'unmarked') return;

  const reminderDate = getReminderDate(input.date, input.cutoffTime);
  if (!reminderDate || reminderDate.getTime() <= Date.now()) return;

  const currentPermission = await Notifications.getPermissionsAsync();
  const permission = currentPermission.granted
    ? currentPermission
    : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return;

  const shiftLabel = input.shift === 'morning' ? 'Morning' : 'Evening';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${shiftLabel} attendance reminder`,
      body: 'Mark yourself present or absent before the cutoff.',
      sound: 'default',
      data: {
        type: REMINDER_TYPE,
        screen: 'PassengerHome',
        userId: input.userId,
        communityId: input.communityId,
        date: input.date,
        shift: input.shift,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
  });
};

export const isAttendanceReminderResponse = (
  response: Notifications.NotificationResponse | null | undefined
): boolean => response?.notification.request.content.data?.type === REMINDER_TYPE;
