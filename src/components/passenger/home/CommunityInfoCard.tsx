import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { PassengerCommunity } from '@hooks/usePassengerCommunity';

interface Props {
  community: PassengerCommunity;
  hasLocations: boolean;
  onSetLocations: () => void;
}

export default function CommunityInfoCard({
  community,
  hasLocations,
  onSetLocations,
}: Props) {
  return (
    <View style={styles.card}>
      {/* Driver + vehicle row */}
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🚌</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.vehicleName}>{community.vehicleName}</Text>
          <Text style={styles.driverName}>Driver: {community.driverName}</Text>
          <Text style={styles.plate}>{community.plateNumber}</Text>
        </View>
        <View style={styles.joinedBadge}>
          <Text style={styles.joinedText}>Joined ✓</Text>
        </View>
      </View>

      {/* Location prompt if not set */}
      {!hasLocations && (
        <>
          <View style={styles.divider} />
          <View style={styles.locationPrompt}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationText}>
              <Text style={styles.locationTitle}>Set your pickup & drop-off</Text>
              <Text style={styles.locationBody}>
                Your driver needs your locations to plan the route.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={onSetLocations}
            activeOpacity={0.85}
          >
            <Text style={styles.locationBtnText}>Set Locations</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  row:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24 },
  info:   { flex: 1 },
  vehicleName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  driverName:  { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  plate:       { fontSize: 11, color: Colors.muted, marginTop: 1 },
  joinedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  joinedText:  { fontSize: 11, fontWeight: '700', color: '#15803D' },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg },

  locationPrompt: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', marginBottom: Spacing.md },
  locationIcon:   { fontSize: 20, marginTop: 2 },
  locationText:   { flex: 1 },
  locationTitle:  { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  locationBody:   { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  locationBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.button, paddingVertical: 12, alignItems: 'center' },
  locationBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
});
