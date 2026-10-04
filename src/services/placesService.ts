// Places API (New) — https://places.googleapis.com/v1
//
// This project's Google Cloud project cannot enable legacy "Places API"
// (Google stopped allowing that on new projects from March 2025), only
// "Places API (New)". The two are different products with different
// request/response shapes, so this talks to the new REST endpoints
// directly rather than using a library built for the legacy one.

const PLACES_API_BASE = 'https://places.googleapis.com/v1';
const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceLocation {
  latitude: number;
  longitude: number;
}

/**
 * Autocomplete (New) — https://places.googleapis.com/v1/places:autocomplete
 * POST + JSON body, auth via X-Goog-Api-Key header (not a ?key= query param
 * like the legacy API). Scoped to Sri Lanka via includedRegionCodes, since
 * this app only serves passengers/drivers there.
 */
export async function searchPlaces(input: string): Promise<PlaceSuggestion[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const response = await fetch(`${PLACES_API_BASE}/places:autocomplete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
    },
    body: JSON.stringify({
      input: trimmed,
      languageCode: 'en',
      includedRegionCodes: ['lk'],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[placesService] searchPlaces failed:', data?.error?.message ?? data);
    throw new Error(data?.error?.message ?? 'Search failed.');
  }

  const suggestions = data.suggestions ?? [];

  return suggestions
    .filter((s: any) => s.placePrediction)
    .map((s: any) => {
      const prediction = s.placePrediction;
      return {
        placeId: prediction.placeId,
        mainText: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? '',
        secondaryText: prediction.structuredFormat?.secondaryText?.text ?? '',
      };
    });
}

/**
 * Place Details (New) — https://places.googleapis.com/v1/places/{placeId}
 * X-Goog-FieldMask is required here (unlike Autocomplete, where it's
 * optional) — Google rejects the request outright without it. Only
 * requesting `location`, since MapPicker just re-centers the map on the
 * selected place and lets the existing reverse-geocode flow confirm the
 * exact pin and address from there.
 */
export async function getPlaceLocation(placeId: string): Promise<PlaceLocation> {
  const response = await fetch(`${PLACES_API_BASE}/places/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'location',
    },
  });

  const data = await response.json();

  if (!response.ok || !data.location) {
    console.error('[placesService] getPlaceLocation failed:', data?.error?.message ?? data);
    throw new Error(data?.error?.message ?? 'Could not resolve that place.');
  }

  return {
    latitude: data.location.latitude,
    longitude: data.location.longitude,
  };
}