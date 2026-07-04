import { useState } from 'react';
import { auth } from '../../firebaseConfig';
import { updateUserLocation, LocationData } from '@services/userService';

interface SaveLocationResult {
  success: boolean;
  error?: string;
}

/**
 * Handles saving a passenger's pickup/drop-off location to Firestore.
 * Extracted from EditLocations screen so the screen only renders.
 */
export function useUpdateLocation() {
  const [isSaving, setIsSaving] = useState(false);

  const saveLocation = async (
    mode: 'Pickup' | 'Drop-off',
    location: LocationData
  ): Promise<SaveLocationResult> => {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      return { success: false, error: 'You must be logged in to save locations.' };
    }

    setIsSaving(true);
    try {
      await updateUserLocation(uid, mode, location);
      return { success: true };
    } catch (err) {
      console.error('[useUpdateLocation]', err);
      return { success: false, error: 'Could not save your location. Try again.' };
    } finally {
      setIsSaving(false);
    }
  };

  return { saveLocation, isSaving };
}