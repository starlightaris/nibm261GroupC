export type LocationRole = 'driver' | 'passenger';

/**
 * checking     - first check not finished yet
 * undetermined - never asked; show the pre-permission screen
 * granted      - foreground location allowed
 * denied       - refused, but the system dialog can still be shown again
 * blocked      - refused for good; only the device Settings can change it
 */
export type LocationPermissionState =
  | 'checking'
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'blocked';

interface RawPermission {
  status: string;
  canAskAgain: boolean;
}

/** Maps an expo-location permission response onto our five states. */
export function toPermissionState(
  permission: RawPermission
): Exclude<LocationPermissionState, 'checking'> {
  if (permission.status === 'granted') return 'granted';
  if (permission.status === 'denied') {
    return permission.canAskAgain ? 'denied' : 'blocked';
  }
  return 'undetermined';
}

export const PRE_PERMISSION_COPY: Record<LocationRole, { title: string; body: string }> = {
  driver: {
    title: 'Allow location access',
    body: 'Your location is used to share your position with passengers during a trip.',
  },
  passenger: {
    title: 'Allow location access',
    body: 'Your location helps you set your pickup and dropoff points accurately.',
  },
};

/** What stops working when permission is refused - shown in the non-blocking banner. */
export const DENIED_COPY: Record<LocationRole, string> = {
  driver:
    "Location is off. Your stops won't be ordered by distance from you, and route directions and trip navigation won't work.",
  passenger:
    "Location is off. Your position won't show on the map. You can still search for an address or drag the map to set your point.",
};
