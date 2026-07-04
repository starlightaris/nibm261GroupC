import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParams } from '@navigation/types';
import { useAuth } from '@hooks/useAuth';
import { logoutUser } from '@services/authService';
import { Colors, Radius, Spacing } from '@styles/tokens';
import InitialsAvatar from '@components/driver/activetrip/InitialsAvatar';
import SettingsRow from '@components/settings/SettingsRow';

type Props = NativeStackScreenProps<SettingsStackParams, 'SettingsHome'>;

export default function SettingsHome({ navigation }: Props) {
  const { user, loading } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => logoutUser(),
      },
    ]);
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const isDriver = user.role === 'driver';

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile snippet */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <InitialsAvatar initials={initials} size={48} />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Role-specific section */}
        <Text style={styles.sectionLabel}>
          {isDriver ? 'Vehicle' : 'Travel'}
        </Text>
        <View style={styles.card}>
          {isDriver ? (
            <>
              <SettingsRow
                icon="🚌"
                label="Vehicle details"
                onPress={() => navigation.navigate('VehicleDetails')}
              />
              <SettingsRow
                icon="⏰"
                label="Shift times"
                onPress={() => navigation.navigate('ShiftTimes')}
              />
            </>
          ) : (
            <>
              <SettingsRow
                icon="📍"
                label="Pickup location"
                onPress={() =>
                  navigation.navigate('EditLocations', { mode: 'Pickup' })
                }
              />
              <SettingsRow
                icon="🏁"
                label="Drop-off location"
                onPress={() =>
                  navigation.navigate('EditLocations', { mode: 'Drop-off' })
                }
              />
            </>
          )}
        </View>

        {/* Shared section */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="🔔"
            label="Notification preferences"
            onPress={() => navigation.navigate('NotificationPreferences')}
          />
          <SettingsRow
            icon="🕓"
            label="Trip history"
            onPress={() => navigation.navigate('TripHistory')}
          />
        </View>

        {/* Logout */}
        <View style={styles.card}>
          <SettingsRow
            icon="🚪"
            label="Log out"
            onPress={handleLogout}
            destructive
            showChevron={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: Colors.muted,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
});
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