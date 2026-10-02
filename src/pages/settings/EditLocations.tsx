import React, { useLayoutEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
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

  // This screen can be entered two ways: pushed on top of SettingsHome
  // (normal edit-later flow), or jumped to directly from a different tab
  // (the onboarding "Set Locations" prompt on passenger Home). In the second
  // case there's no guarantee SettingsHome sits underneath this screen in
  // the stack, so a native back button / goBack() may have nothing to
  // return to. Rather than rely on stack history, every exit explicitly
  // targets SettingsHome so the user is never stuck on this screen —
  // and a Cancel action is always available, even mid-onboarding.
  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Set ${mode} Point`,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.navigate('SettingsHome')} hitSlop={12}>
          <Text style={styles.headerAction}>Cancel</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, mode]);

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
        Alert.alert(
          'Pickup location saved',
          "Now let's set your drop-off point.",
          [{ text: 'Continue', onPress: () => navigation.replace('EditLocations', { mode: 'Drop-off' }) }]
        );
      } else {
        Alert.alert(
          `${mode} location saved`,
          'Your driver will be able to see this location.',
          [{ text: 'OK', onPress: () => navigation.navigate('SettingsHome') }]
        );
      }
    } else if (error === 'You must be logged in to save locations.') {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Save Failed', error ?? 'Could not save your location. Try again.');
    }
  };

  // Defensive, not just a UX nicety: SettingsHome and the onboarding prompt
  // both already hide this screen's entry points from non-members, but a
  // passenger can still land here with no community if they're removed by
  // the driver while this screen is already open/queued on the stack, or
  // via a stale deep link. Block edits rather than letting them save to a
  // communityId that no longer applies to them.
  if (!communityLoading && !community) {
    return (
      <View style={styles.container}>
        <View style={styles.blockedContainer}>
          <Text style={styles.blockedTitle}>Join a community first</Text>
          <Text style={styles.blockedSubtitle}>
            You need to be part of a community before you can set a pickup or drop-off location.
          </Text>
          <TouchableOpacity
            style={[styles.confirmButton, styles.blockedButton]}
            onPress={() => navigation.getParent()?.navigate('PassengerHome')}
          >
            <Text style={styles.confirmButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
  headerAction: { color: '#1D4ED8', fontSize: 16, fontWeight: '500' },
  mapWrapper: { flex: 1 },
  mapLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionPanel: { padding: 20, backgroundColor: '#FFF' },
  confirmButton: { backgroundColor: '#1D3557', padding: 16, borderRadius: 10, alignItems: 'center', height: 55, justifyContent: 'center' },
  disabledButton: { backgroundColor: '#A0A0A0' },
  confirmButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  blockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  blockedTitle: { fontSize: 18, fontWeight: '700', color: '#1D3557', marginBottom: 8, textAlign: 'center' },
  blockedSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  blockedButton: { width: '100%' }
});