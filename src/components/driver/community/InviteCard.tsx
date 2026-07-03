import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors, Radius, Spacing } from '@styles/tokens';

interface Props {
  inviteCode: string;
  vehicleName: string;
  plateNumber: string;
  memberCount: number;
  capacity: number;
}

export default function InviteCard({
  inviteCode,
  vehicleName,
  plateNumber,
  memberCount,
  capacity,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFull = memberCount >= capacity;

  return (
    <View style={styles.card}>
      {/* Vehicle info row */}
      <View style={styles.vehicleRow}>
        <View style={styles.vehicleIcon}>
          <Text style={styles.vehicleEmoji}>🚌</Text>
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>{vehicleName}</Text>
          <Text style={styles.plateNumber}>{plateNumber}</Text>
        </View>
        <View style={[styles.capacityBadge, isFull && styles.capacityFull]}>
          <Text style={[styles.capacityText, isFull && styles.capacityFullText]}>
            {memberCount}/{capacity}
          </Text>
          <Text style={[styles.capacityLabel, isFull && styles.capacityFullText]}>
            {isFull ? 'Full' : 'seats'}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Invite code */}
      <Text style={styles.inviteLabel}>Passenger invite code</Text>
      <View style={styles.codeRow}>
        <Text style={styles.code} selectable>
          {inviteCode.split('').join('  ')}
        </Text>
        <TouchableOpacity
          style={[styles.copyBtn, copied && styles.copyBtnDone]}
          onPress={handleCopy}
          activeOpacity={0.8}
        >
          <Text style={[styles.copyBtnText, copied && styles.copyBtnDoneText]}>
            {copied ? '✓  Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.inviteHint}>
        Share this code with passengers so they can join your community.
      </Text>
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

  // Vehicle row
  vehicleRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  vehicleIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  vehicleEmoji: { fontSize: 22 },
  vehicleInfo:  { flex: 1 },
  vehicleName:  { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  plateNumber:  { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  // Capacity badge
  capacityBadge: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  capacityFull:     { backgroundColor: '#FEE2E2' },
  capacityText:     { fontSize: 14, fontWeight: '700', color: Colors.primary },
  capacityFullText: { color: Colors.error },
  capacityLabel:    { fontSize: 9, color: Colors.primary, fontWeight: '600', textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg },

  // Invite code
  inviteLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.md,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  code: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  copyBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.button,
  },
  copyBtnDone:     { backgroundColor: Colors.successLight ?? '#DCFCE7' },
  copyBtnText:     { fontSize: 13, fontWeight: '700', color: Colors.primary },
  copyBtnDoneText: { color: Colors.successText ?? '#15803D' },
  inviteHint: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 18,
  },
});