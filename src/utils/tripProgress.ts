/**
 * True once the driver has completed a stop that picked this passenger up.
 * Reads trips/{id}.completedStops, as written by useActiveTrip.completeStop.
 */
export function isPickedUp(completedStops: unknown, userId: string | null): boolean {
  if (!userId || !Array.isArray(completedStops)) return false;
  return completedStops.some(
    (stop) =>
      Array.isArray(stop?.pickedUp) &&
      stop.pickedUp.some((p: any) => p?.userId === userId)
  );
}

/** Whole seconds between an ISO timestamp and `nowMs`; null if unparseable. */
export function secondsSince(isoTimestamp: string | null | undefined, nowMs: number): number | null {
  if (!isoTimestamp) return null;
  const written = Date.parse(isoTimestamp);
  if (isNaN(written)) return null;
  return Math.max(0, Math.round((nowMs - written) / 1000));
}
