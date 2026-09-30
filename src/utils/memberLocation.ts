/**
 * Text shown under a community member's name on the driver's Community tab.
 * Members store a human-readable `address` alongside their coordinates; raw
 * lat/long is never shown to the driver. `pickupLocation` is null until the
 * passenger has set it after joining.
 */
export function pickupLabel(
  location: { address?: string | null } | null | undefined
): string {
  const address = location?.address?.trim();
  if (address) return `Pickup: ${address}`;
  return location ? 'Pickup: address unavailable' : 'Pickup: not set yet';
}
