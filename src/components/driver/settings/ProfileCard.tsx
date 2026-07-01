import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { DriverProfile } from '../../../types/auth';
import InitialsAvatar from '@components/driver/activetrip/InitialsAvatar';

interface Props {
  profile: DriverProfile;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileCard({ profile }: Props) {
  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  return (
    <View style={styles.card}>
      {/* Avatar + name */}
      <View style={styles.avatarRow}>
        <InitialsAvatar initials={initials} size={56} />
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{profile.name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>Driver</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <InfoRow label="Email"        value={profile.email} />
      {profile.phone && (
        <InfoRow label="Phone"      value={profile.phone} />
      )}
      <InfoRow label="Vehicle type" value={profile.vehicleType} />
      <InfoRow label="Plate"        value={profile.vehiclePlate} />
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
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  nameBlock: { flex: 1 },
  name:      { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  divider:  { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: { fontSize: 13, color: Colors.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, maxWidth: '60%', textAlign: 'right' },
});