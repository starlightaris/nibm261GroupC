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

export async function sendPush(to: string, title: string, body: string, data: object) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, title, body, sound: 'default', channelId: 'default', data }),
  });
}