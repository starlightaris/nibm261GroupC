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
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SettingsStackParams, PassengerTabParams } from '@navigation/types';
import { useAuth } from '@hooks/useAuth';
import { usePassengerCommunity } from '@hooks/usePassengerCommunity';
import { useLeaveCommunity } from '@hooks/useLeaveCommunity';
import { logoutUser } from '@services/authService';
import { Colors, Radius, Spacing } from '@styles/tokens';
import InitialsAvatar from '@components/driver/activetrip/InitialsAvatar';
import SettingsRow from '@components/settings/SettingsRow';

type Props = NativeStackScreenProps<SettingsStackParams, 'SettingsHome'>;

export default function SettingsHome({ navigation }: Props) {
  const { user, loading } = useAuth();
  // Location sublabels live on communities.members[], not users/{uid} —
  // this is a no-op query for drivers (they're never in memberIds).
  const { community, loading: communityLoading } = usePassengerCommunity();
  const { leaving, leave } = useLeaveCommunity();

  // Passenger Home is the default landing for a passenger with no community
  // (it renders the join card), so send them there once they've left.
  const goToPassengerHome = () =>
    navigation
      .getParent<BottomTabNavigationProp<PassengerTabParams>>()
      ?.navigate('PassengerHome');

  const handleLeaveCommunity = () => {
    if (!community || leaving) return;

    Alert.alert(
      'Leave community?',
      `You will be removed from ${community.vehicleName || `${community.driverName}'s community`} and your driver will no longer see your pickup or drop-off. You can rejoin later with an invite code.`,
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const left = await leave(community.communityId);
            if (left) {
              goToPassengerHome();
            } else {
              Alert.alert('Could not leave', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

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
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          accessibilityHint="Opens your personal details"
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
            <SettingsRow
              icon="🚌"
              label="Vehicle details"
              onPress={() => navigation.navigate('VehicleDetails')}
            />
          ) : community ? (
            <>
              <SettingsRow
                icon="📍"
                label="Pickup location"
                subLabel={community.member.pickupLocation?.address || 'Not set yet'}
                onPress={() =>
                  navigation.navigate('EditLocations', { mode: 'Pickup' })
                }
              />
              <SettingsRow
                icon="🏁"
                label="Drop-off location"
                subLabel={community.member.dropoffLocation?.address || 'Not set yet'}
                onPress={() =>
                  navigation.navigate('EditLocations', { mode: 'Drop-off' })
                }
              />
              <SettingsRow
                icon="👋"
                label={leaving ? 'Leaving community…' : 'Leave community'}
                onPress={handleLeaveCommunity}
                destructive
                showChevron={false}
              />
            </>
          ) : (
            // Locations belong to a community, so there's nothing to edit
            // until the passenger joins one (skip while it's still loading
            // so this doesn't flash for members).
            !communityLoading && (
              <SettingsRow
                icon="🚌"
                label="Join a community"
                subLabel="Enter your driver's invite code"
                onPress={goToPassengerHome}
              />
            )
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