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
  Platform,
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

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('You will need to sign in again to continue. Log out?');
      if (confirmed) {
        await logoutUser();
      }
    } else {
      Alert.alert('Log out?', 'You will need to sign in again to continue.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => logoutUser(),
        },
      ]);
    }
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