import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Show notifications while the app is in the foreground too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type NotificationType = 'attendance_reminder' | 'driver_approaching';

async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1D4ED8',
  });
}

function explainPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Stay in the loop',
      'TransportApp uses notifications to remind you to mark attendance before the cutoff and to tell you when your driver is nearby.',
      [
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Continue', onPress: () => resolve(true) },
      ],
      { cancelable: false },
    );
  });
}

/** Returns true if notifications are allowed. Never throws; denial is silent. */
export async function ensureNotificationPermission(): Promise<boolean> {
  await setupAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const agreed = await explainPermission();
  if (!agreed) return false;

  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

/** Gets the Expo push token and saves it to users/{uid}.pushToken. */
export async function registerForPushNotifications(uid: string): Promise<string | null> {
  try {
    const allowed = await ensureNotificationPermission();
    if (!allowed) return null;
    if (!Device.isDevice) return null; // push tokens need a physical device

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    await setDoc(doc(db, 'users', uid), { pushToken: token }, { merge: true });
    return token;
  } catch (err) {
    console.warn('[notifications] push registration failed:', err);
    return null; // app keeps working, notifications silently disabled
  }
}