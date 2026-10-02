import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';

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
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [mapInstanceKey, setMapInstanceKey] = useState(0);
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

  // Request foreground location permission once on mount. Denial isn't
  // fatal — the passenger can still search or drop a pin manually — so
  // this only toggles showsUserLocation and a small heads-up banner,
  // it never blocks the picker.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermissionDenied(status !== 'granted');
      } catch (err) {
        console.error('[MapPicker] permission request failed', err);
        setLocationPermissionDenied(true);
      }
    })();
  }, []);

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
        <GooglePlacesAutocomplete
          placeholder={`Search ${mode} Location...`}
          fetchDetails={true}
          onPress={(data, details = null) => {
            if (details?.geometry?.location) {
              const newRegion = {
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              };
              mapRef.current?.animateToRegion(newRegion, 1000);
            }
          }}
          query={{ key: apiKey, language: 'en' }}
          styles={{ textInput: styles.searchInput, listView: styles.searchListView }}
          enablePoweredByContainer={false}
        />
      </View>

      {locationPermissionDenied && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionBannerText}>
            Location access is off — search for an address or drag the pin manually.
          </Text>
        </View>
      )}

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
        showsUserLocation={!locationPermissionDenied}
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
  searchContainer: { position: 'absolute', top: 10, width: '90%', alignSelf: 'center', zIndex: 1 },
  searchInput: { height: 45, borderRadius: 8, paddingHorizontal: 15, backgroundColor: '#FFF', elevation: 3 },
  searchListView: { backgroundColor: '#FFF', borderRadius: 8, marginTop: 5, elevation: 3 },
  centerPinContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -15, marginTop: -30, alignItems: 'center' },
  pin: { width: 30, height: 30, backgroundColor: '#E63946', borderRadius: 15, borderWidth: 2, borderColor: '#FFF' },
  pinPoint: { width: 4, height: 10, backgroundColor: '#1D3557' },
  addressDisplayCard: { position: 'absolute', bottom: 10, width: '90%', alignSelf: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 8, elevation: 2, alignItems: 'center' },
  addressText: { fontSize: 14, fontWeight: '600', color: '#1D3557', textAlign: 'center' },
  permissionBanner: { position: 'absolute', top: 58, width: '90%', alignSelf: 'center', zIndex: 1, backgroundColor: '#FFF3CD', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  permissionBannerText: { fontSize: 12, color: '#8A6D1D', textAlign: 'center' },
  mapErrorContainer: { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FFF' },
  mapErrorTitle: { fontSize: 16, fontWeight: '700', color: '#1D3557', marginBottom: 6 },
  mapErrorSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 18 },
  retryButton: { backgroundColor: '#1D3557', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
});