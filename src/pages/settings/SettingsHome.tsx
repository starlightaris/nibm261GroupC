import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParams } from '@navigation/types';
import { useIsFocused } from '@react-navigation/native';

// Import Auth and your profile reader service
import { auth } from '../../../firebaseConfig';
import { getUserProfile } from '../../services/userService';

type Props = NativeStackScreenProps<SettingsStackParams, 'SettingsHome'>;

export default function SettingsHome({ navigation }: Props) {
  const isFocused = useIsFocused(); // Automatically triggers a re-fetch when returning from the map
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      const uid = auth.currentUser?.uid || "CtDHg5G8XmQy53HU76o5qV99Pat1"; // Hardcoded for testing
      if (!uid) return;

      try {
        const data = await getUserProfile(uid);
        setProfile(data);
      } catch (error) {
        console.error("Error reading profile from Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      fetchProfileData();
    }
  }, [isFocused]);

  const handleEditLocation = (mode: 'Pickup' | 'Drop-off') => {
    navigation.navigate('EditLocations', { mode });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D3557" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder} />
        <Text style={styles.userName}>{profile?.name || "Passenger Name"}</Text>
        <Text style={styles.userSub}>{profile?.email || "No Email Bound"}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Transport Details</Text>
        
        {/* Pickup Card */}
        <View style={styles.locationCard}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.cardLabel}>PICKUP LOCATION</Text>
            <Text style={styles.cardAddress} numberOfLines={2}>
              {profile?.pickupLocation?.address || "Not Set Yet"}
            </Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => handleEditLocation('Pickup')}>
            <Text style={styles.editBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Drop-off Card */}
        <View style={styles.locationCard}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.cardLabel}>DROP-OFF LOCATION</Text>
            <Text style={styles.cardAddress} numberOfLines={2}>
              {profile?.dropoffLocation?.address || "Not Set Yet"}
            </Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => handleEditLocation('Drop-off')}>
            <Text style={styles.editBtnText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 60 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E1E5EB', marginBottom: 10 },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1D3557' },
  userSub: { fontSize: 14, color: '#A0A0A0', marginTop: 4 },
  infoSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1D3557', marginBottom: 15 },
  locationCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, elevation: 1 },
  cardLabel: { fontSize: 11, fontWeight: 'bold', color: '#A0A0A0', marginBottom: 4 },
  cardAddress: { fontSize: 14, color: '#1D3557', fontWeight: '500' },
  editBtn: { backgroundColor: '#F1FAEE', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
  editBtnText: { color: '#457B9D', fontWeight: '600', fontSize: 13 }
});