import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapPicker from '../../components/passenger/MapPicker'; 
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParams } from '@navigation/types';

// Import Auth and your new location service
import { auth } from '../../../firebaseConfig'; 
import { updateUserLocation } from '../../services/userService';

type Props = NativeStackScreenProps<SettingsStackParams, 'EditLocations'>;

export default function EditLocations({ route, navigation }: Props) {
  const { mode } = route.params; 
  const [isSaving, setIsSaving] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  const handleSaveToBackend = async () => {
    const uid = auth.currentUser?.uid || "CtDHg5G8XmQy53HU76o5qV99Pat1"; // Hardcoded for testing
    
    if (!uid) {
      Alert.alert("Error", "You must be logged in to save locations.");
      return;
    }

    if (currentSelection) {
      setIsSaving(true);
      try {
        // Fire the update request to Firestore
        await updateUserLocation(uid, mode, currentSelection);
        navigation.goBack();
      } catch (error) {
        console.error("Firestore Save Error: ", error);
        Alert.alert("Save Failed", "Could not save your location. Try again.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Set {mode} Point</Text>
      </View>

      <View style={styles.mapWrapper}>
        <MapPicker 
          mode={mode} 
          onLocationConfirmed={(address, latitude, longitude) => {
            setCurrentSelection({ address, latitude, longitude });
          }}
        />
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
  actionPanel: { padding: 20, backgroundColor: '#FFF' },
  confirmButton: { backgroundColor: '#1D3557', padding: 16, borderRadius: 10, alignItems: 'center', height: 55, justifyContent: 'center' },
  disabledButton: { backgroundColor: '#A0A0A0' },
  confirmButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});