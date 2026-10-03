import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { searchPlaces, getPlaceLocation, PlaceSuggestion } from '@services/placesService';

// How long to wait after the last keystroke before searching — avoids
// firing a request on every character typed.
const SEARCH_DEBOUNCE_MS = 350;

const INITIAL_REGION = {
  latitude: 6.9271, 
  longitude: 79.8612,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

// If the native map hasn't fired onMapReady within this window, treat it
// as failed to load (bad network, missing/invalid Maps API key, etc.)
// rather than leaving the passenger staring at a blank screen forever.
const MAP_READY_TIMEOUT_MS = 10000;

interface MapPickerProps {
  mode: 'Pickup' | 'Drop-off';
  onLocationConfirmed: (address: string, latitude: number, longitude: number) => void;
  /** Previously saved location for this mode, if any — used to open the map centered on it instead of the hardcoded default. */
  initialLocation?: { address: string; latitude: number; longitude: number } | null;
}

export default function MapPicker({ mode, onLocationConfirmed, initialLocation }: MapPickerProps) {
  const mapRef = useRef<MapView>(null);
  const [readableAddress, setReadableAddress] = useState<string>(
    initialLocation?.address ?? 'Dragging map to pick...'
  );
  const [loadingAddress, setLoadingAddress] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [mapInstanceKey, setMapInstanceKey] = useState(0);
  // Still used by fetchReadableAddress below, for the Geocoding API
  // (reverse-geocoding the dragged pin) — unrelated to placesService.ts,
  // which handles the search box's own auth separately.
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Set right before we programmatically update searchQuery after a
  // selection, so the debounce effect below knows this particular change
  // didn't come from typing and shouldn't trigger another search.
  const skipNextSearchRef = useRef(false);

  // Debounced place search as the user types.
  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    if (!searchQuery.trim()) {
      setSuggestions([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const results = await searchPlaces(searchQuery);
        setSuggestions(results);
        setSearchError(null);
      } catch (err) {
        console.error('[MapPicker] search failed', err);
        setSuggestions([]);
        setSearchError('Search unavailable right now.');
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    Keyboard.dismiss();
    skipNextSearchRef.current = true;
    setSearchQuery(suggestion.mainText);
    setSuggestions([]);
    try {
      const { latitude, longitude } = await getPlaceLocation(suggestion.placeId);
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 },
        1000
      );
      // onRegionChangeComplete (fired once the animation settles) re-runs
      // the existing reverse-geocode flow, which confirms the exact pin
      // and updates readableAddress — same as dragging the map manually.
    } catch (err) {
      console.error('[MapPicker] place details failed', err);
      setSearchError('Could not load that location. Try again.');
    }
  };

  // If the map doesn't become ready in time, surface a retry state
  // instead of a silent blank screen.
  useEffect(() => {
    if (mapReady) return;
    const timeout = setTimeout(() => {
      setMapLoadFailed(true);
    }, MAP_READY_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [mapReady, mapInstanceKey]);

  const handleRetryMap = () => {
    setMapLoadFailed(false);
    setMapReady(false);
    setMapInstanceKey((k) => k + 1);
  };

  const fetchReadableAddress = async (latitude: number, longitude: number) => {
    setLoadingAddress(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        setReadableAddress(address);
        // Pass the updated data back up to the parent screen instantly
        onLocationConfirmed(address, latitude, longitude);
      } else {
        setReadableAddress('Unknown Location');
      }
    } catch (error) {
      console.error(error);
      setReadableAddress('Error fetching address');
    } finally {
      setLoadingAddress(false);
    }
  };

  const onRegionChangeComplete = (region: Region) => {
    fetchReadableAddress(region.latitude, region.longitude);
  };

  if (mapLoadFailed) {
    return (
      <View style={[styles.container, styles.mapErrorContainer]}>
        <Text style={styles.mapErrorTitle}>Map failed to load</Text>
        <Text style={styles.mapErrorSubtitle}>
          Check your connection and try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetryMap}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${mode} Location...`}
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searching && (
          <View style={styles.searchLoadingIndicator}>
            <ActivityIndicator size="small" color="#1D3557" />
          </View>
        )}
        {suggestions.length > 0 && (
          <View style={styles.searchListView}>
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.placeId}
                style={styles.suggestionRow}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Text style={styles.suggestionMainText} numberOfLines={1}>
                  {item.mainText}
                </Text>
                {item.secondaryText ? (
                  <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
                    {item.secondaryText}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {searchError && (
          <View style={styles.searchErrorBanner}>
            <Text style={styles.searchErrorText}>{searchError}</Text>
          </View>
        )}
      </View>

      <MapView
        key={mapInstanceKey}
        ref={mapRef}
        style={styles.map}
        initialRegion={
          initialLocation
            ? {
                latitude: initialLocation.latitude,
                longitude: initialLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : INITIAL_REGION
        }
        onRegionChangeComplete={onRegionChangeComplete}
        onMapReady={() => setMapReady(true)}
        // Permission is owned by LocationPermissionGate, which wraps every
        // screen this component is used in — if it isn't actually granted,
        // the native map simply shows no blue dot, no error. No local
        // permission state needed here.
        showsUserLocation
      />

      <View style={styles.centerPinContainer} pointerEvents="none">
        <View style={styles.pin} />
        <View style={styles.pinPoint} />
      </View>

      <View style={styles.addressDisplayCard}>
        {loadingAddress ? (
          <ActivityIndicator size="small" color="#1D3557" />
        ) : (
          <Text style={styles.addressText} numberOfLines={2}>{readableAddress}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  // On Android the native MapView can visually sit above regular React
  // views even when they're positioned on top of it in the tree — both
  // zIndex and elevation need to be set, and set high, for the
  // autocomplete dropdown to reliably render above the map instead of
  // being hidden behind it.
  // left/right (rather than width + alignSelf: 'center') so the bar
  // always leaves room on the right for Android's native "center on my
  // location" button, which renders in that corner whenever
  // showsUserLocation is on and isn't something we control the layout of.
  searchContainer: { position: 'absolute', top: 10, left: 10, right: 64, zIndex: 20, elevation: 20 },
  searchInput: { height: 45, borderRadius: 8, paddingHorizontal: 15, backgroundColor: '#FFF', elevation: 3, fontSize: 14, color: '#1D3557' },
  searchLoadingIndicator: { position: 'absolute', right: 14, top: 12 },
  searchListView: { backgroundColor: '#FFF', borderRadius: 8, marginTop: 5, elevation: 20, zIndex: 20, overflow: 'hidden' },
  suggestionRow: { paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  suggestionMainText: { fontSize: 14, fontWeight: '600', color: '#1D3557' },
  suggestionSecondaryText: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  searchErrorBanner: { marginTop: 5, backgroundColor: '#FEE2E2', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  searchErrorText: { fontSize: 12, color: '#991B1B', textAlign: 'center' },
  centerPinContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -15, marginTop: -30, alignItems: 'center' },
  pin: { width: 30, height: 30, backgroundColor: '#E63946', borderRadius: 15, borderWidth: 2, borderColor: '#FFF' },
  pinPoint: { width: 4, height: 10, backgroundColor: '#1D3557' },
  addressDisplayCard: { position: 'absolute', bottom: 10, width: '90%', alignSelf: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 8, elevation: 2, alignItems: 'center' },
  addressText: { fontSize: 14, fontWeight: '600', color: '#1D3557', textAlign: 'center' },
  mapErrorContainer: { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FFF' },
  mapErrorTitle: { fontSize: 16, fontWeight: '700', color: '#1D3557', marginBottom: 6 },
  mapErrorSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 18 },
  retryButton: { backgroundColor: '#1D3557', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
});