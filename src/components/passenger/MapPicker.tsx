import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const INITIAL_REGION = {
  latitude: 6.9271, 
  longitude: 79.8612,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

interface MapPickerProps {
  mode: 'Pickup' | 'Drop-off';
  onLocationConfirmed: (address: string, latitude: number, longitude: number) => void;
}

export default function MapPicker({ mode, onLocationConfirmed }: MapPickerProps) {
  const mapRef = useRef<MapView>(null);
  const [readableAddress, setReadableAddress] = useState<string>('Dragging map to pick...');
  const [loadingAddress, setLoadingAddress] = useState<boolean>(false);
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

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

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={true}
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
  addressText: { fontSize: 14, fontWeight: '600', color: '#1D3557', textAlign: 'center' }
});