import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapPicker from '../../components/passenger/MapPicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParams } from '@navigation/types';
import { useUpdateLocation } from '@hooks/useUpdateLocation';
import { usePassengerCommunity } from '@hooks/usePassengerCommunity';

type Props = NativeStackScreenProps<SettingsStackParams, 'EditLocations'>;

export default function EditLocations({ route, navigation }: Props) {
  const { mode } = route.params;
  const { saveLocation, isSaving } = useUpdateLocation();
  const { community, loading: communityLoading } = usePassengerCommunity();

  const existingLocation =
    mode === 'Pickup' ? community?.member.pickupLocation : community?.member.dropoffLocation;

  const [currentSelection, setCurrentSelection] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  const handleSaveToBackend = async () => {
    if (!currentSelection) return;

    const { success, error } = await saveLocation(
      community?.communityId,
      mode,
      currentSelection
    );

    if (success) {
      // During onboarding the passenger is walked through both points —
      // if they just confirmed Pickup and Drop-off isn't set yet, carry
      // straight on instead of dropping them back to a half-set screen.
      const dropoffStillNeeded = mode === 'Pickup' && community?.member.dropoffLocation == null;

      if (dropoffStillNeeded) {
        navigation.replace('EditLocations', { mode: 'Drop-off' });
      } else {
        navigation.goBack();
      }
    } else if (error === 'You must be logged in to save locations.') {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Save Failed', error ?? 'Could not save your location. Try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Set {mode} Point</Text>
      </View>

      <View style={styles.mapWrapper}>
        {communityLoading ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator color="#1D3557" />
          </View>
        ) : (
          <MapPicker
            mode={mode}
            initialLocation={existingLocation ?? null}
            onLocationConfirmed={(address, latitude, longitude) => {
              setCurrentSelection({ address, latitude, longitude });
            }}
          />
        )}
      </View>

      <View style={styles.actionPanel}>
        <TouchableOpacity
          style={[styles.confirmButton, (!currentSelection || isSaving) && styles.disabledButton]}
          onPress={handleSaveToBackend}
          disabled={!currentSelection || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm & Save Location</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1D3557' },
  mapWrapper: { flex: 1 },
  mapLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionPanel: { padding: 20, backgroundColor: '#FFF' },
  confirmButton: { backgroundColor: '#1D3557', padding: 16, borderRadius: 10, alignItems: 'center', height: 55, justifyContent: 'center' },
  disabledButton: { backgroundColor: '#A0A0A0' },
  confirmButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
