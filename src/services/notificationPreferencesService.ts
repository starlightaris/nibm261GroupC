import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { preferenceFieldPath, type NotificationType } from '../utils/notificationPreferences';

/** Saves one preference to users/{uid}, leaving the others untouched. */
export async function setNotificationPreference(
  uid: string,
  type: NotificationType,
  enabled: boolean,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { [preferenceFieldPath(type)]: enabled });
}
