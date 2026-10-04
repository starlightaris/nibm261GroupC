import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { toPermissionState, type LocationPermissionState } from '@utils/locationPermission';

interface UseLocationPermissionResult {
  state: LocationPermissionState;
  /** True while the system permission dialog is open. */
  requesting: boolean;
  /** Shows the system dialog (foreground location only). */
  request: () => Promise<void>;
  /** Opens the device Settings page for this app. */
  openSettings: () => void;
}

/**
 * Live foreground-location permission state.
 *
 * The state is re-read from the OS every time the screen gains focus and every
 * time the app returns to the foreground, so it is never assumed from an
 * earlier request - the user may have changed it in Settings in the meantime.
 * Only foreground access is ever asked for.
 */
export function useLocationPermission(): UseLocationPermissionResult {
  const [state, setState] = useState<LocationPermissionState>('checking');
  const [requesting, setRequesting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setState(toPermissionState(await Location.getForegroundPermissionsAsync()));
    } catch (err) {
      console.warn('[useLocationPermission] could not read permission', err);
      setState('denied');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const request = useCallback(async () => {
    setRequesting(true);
    try {
      setState(toPermissionState(await Location.requestForegroundPermissionsAsync()));
    } catch (err) {
      console.warn('[useLocationPermission] request failed', err);
      setState('denied');
    } finally {
      setRequesting(false);
    }
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings().catch((err) =>
      console.warn('[useLocationPermission] could not open settings', err)
    );
  }, []);

  return { state, requesting, request, openSettings };
}
