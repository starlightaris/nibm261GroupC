export const PROXIMITY_THRESHOLD_METERS = 500;
const AVG_SPEED_M_PER_MIN = 500; // about 30 km/h

type Coord = { latitude: number; longitude: number };

export function distanceMeters(a: Coord, b: Coord): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function etaMinutes(meters: number) {
  return Math.max(1, Math.round(meters / AVG_SPEED_M_PER_MIN));
}

/**
 * Sends through Expo's push service, which relays to FCM (Android) and APNs (iOS).
 * Android sound is controlled by the channel, so a muted alert uses the 'silent' one.
 */
export async function sendPush(
  to: string,
  title: string,
  body: string,
  data: object,
  { sound = true }: { sound?: boolean } = {},
) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to, title, body, data,
      sound: sound ? 'default' : null,
      channelId: sound ? 'default' : 'silent',
    }),
  });
}
