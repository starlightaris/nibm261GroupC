import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import type { profileUpdateData } from '../utils/profileDetails';

export async function updateUserProfile(
  uid: string,
  data: ReturnType<typeof profileUpdateData>,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data);
}
