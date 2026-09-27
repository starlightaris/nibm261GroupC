import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

// ───  Push Notification Setup ────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Registration ───────────────────────────────────────────────────────────


export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1D4ED8',
    });
  }

  if (!Device.isDevice) {
    console.log('[notifications] Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[notifications] Permission not granted.');
    return null;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    return tokenResponse.data;
  } catch (err) {
    console.error('[notifications] getExpoPushTokenAsync failed:', err);
    return null;
  }
}

export async function savePushTokenForCurrentUser(token: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    await updateDoc(doc(db, 'users', uid), { expoPushToken: token });
  } catch (err) {
    console.error('[notifications] savePushTokenForCurrentUser failed:', err);
  }
}

// ─── Sending pushes ─────────────────────────────────────────────────────────

export interface PushPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Sends a push notification via Expo's push API. This is a direct client
 * call, which is fine for a student project — in production this should be
 * moved to a Cloud Function so the sending logic isn't exposed client-side.
 */
export async function sendPushNotification(payload: PushPayload): Promise<void> {
  const targets = (Array.isArray(payload.to) ? payload.to : [payload.to]).filter(Boolean);
  if (targets.length === 0) return;

  const messages = targets.map((to) => ({
    to,
    sound: 'default' as const,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  }));

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('[notifications] sendPushNotification failed:', err);
  }
}

// ─── Trip Started Notification ──────────────────────────────────


export async function notifyTripStarted(communityId: string, shift: string): Promise<void> {
  try {
    const commSnap = await getDoc(doc(db, 'communities', communityId));
    if (!commSnap.exists()) return;

    const members: Array<{ userId: string }> = commSnap.data().members ?? [];
    const tokens = await collectEnabledTokens(
      members.map((m) => m.userId),
      'tripStarted'
    );

    if (tokens.length === 0) return;

    await sendPushNotification({
      to: tokens,
      title: 'Trip started 🚌',
      body: `Your driver just started the ${shift} trip. Tap to track it live.`,
      data: { type: 'TRIP_STARTED', communityId },
    });
  } catch (err) {
    console.error('[notifications] notifyTripStarted failed:', err);
  }
}

//  Driver Approaching Notification ────────────────────────────


export async function notifyDriverApproaching(passengerIds: string[]): Promise<void> {
  try {
    const tokens = await collectEnabledTokens(passengerIds, 'driverApproaching');
    if (tokens.length === 0) return;

    await sendPushNotification({
      to: tokens,
      title: 'Driver approaching 📍',
      body: 'Your driver is close to your pickup point. Get ready!',
      data: { type: 'DRIVER_APPROACHING' },
    });
  } catch (err) {
    console.error('[notifications] notifyDriverApproaching failed:', err);
  }
}

// ─── Local (on-device) notifications ────────────────────────────────────────

/** Schedules (or replaces, if `identifier` repeats) a local notification. */
export async function scheduleLocalNotification(
  identifier: string,
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
  data?: Record<string, unknown>
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body, data, sound: 'default' },
    trigger,
  });
}

export async function cancelScheduledNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
   
  }
}


async function collectEnabledTokens(
  userIds: string[],
  prefKey: keyof import('../types/notifications').NotificationPrefs
): Promise<string[]> {
  const tokens: string[] = [];

  await Promise.all(
    userIds.map(async (uid) => {
      const [userSnap, prefSnap] = await Promise.all([
        getDoc(doc(db, 'users', uid)),
        getDoc(doc(db, 'notificationPrefs', uid)),
      ]);

      const enabled = prefSnap.exists() ? prefSnap.data()[prefKey] !== false : true;
      const token = userSnap.exists() ? (userSnap.data().expoPushToken as string | undefined) : undefined;

      if (token && enabled) tokens.push(token);
    })
  );

  return tokens;
}