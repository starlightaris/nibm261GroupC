import { useState } from 'react';
import { auth } from '../../firebaseConfig';
import { updateMemberLocation, MemberLocation } from '@services/communityLocationService';

interface SaveLocationResult {
  success: boolean;
  error?: string;
}

/**
 * Handles saving a passenger's pickup/drop-off location to Firestore.
 * Writes into communities/{communityId}.members[] — that's the store
 * the join flow, the driver's route, and this screen all read from.
 * Extracted from EditLocations screen so the screen only renders.
 */
export function useUpdateLocation() {
  const [isSaving, setIsSaving] = useState(false);

  const saveLocation = async (
    communityId: string | null | undefined,
    mode: 'Pickup' | 'Drop-off',
    location: MemberLocation
  ): Promise<SaveLocationResult> => {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      return { success: false, error: 'You must be logged in to save locations.' };
    }
    if (!communityId) {
      return { success: false, error: 'Join a community before setting locations.' };
    }

    setIsSaving(true);
    try {
      await updateMemberLocation(communityId, uid, mode, location);
      return { success: true };
    } catch (err: any) {
      console.error('[useUpdateLocation]', err);
      return { success: false, error: err?.message ?? 'Could not save your location. Try again.' };
    } finally {
      setIsSaving(false);
    }
  };

  return { saveLocation, isSaving };
}
