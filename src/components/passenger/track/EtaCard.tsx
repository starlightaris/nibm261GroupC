import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@styles/tokens';

interface Props {
  etaMinutes: number | null;
  driverName: string | null;
  vehicleNickname: string | null;
}

export default function EtaCard({ etaMinutes, driverName, vehicleNickname }: Props) {
  return (
    <View style={styles.card}>

      <View style={styles.row}>
        <View style={styles.etaBox}>
          <Text style={styles.etaNumber}>
            {etaMinutes !== null ? etaMinutes : '--'}
          </Text>
          <Text style={styles.etaLabel}>min away</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live tracking</Text>
          </View>
          {driverName && (
            <Text style={styles.driverName}>🚐 {driverName}</Text>
          )}
          {vehicleNickname && (
            <Text style={styles.vehicleName}>{vehicleNickname}</Text>
          )}
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    margin: Spacing.xl,
    marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  etaBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    alignItems: 'center',
    minWidth: 80,
  },
  etaNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
  },
  etaLabel: {
    ...Typography.labelCaps,
    color: Colors.primary,
    marginTop: 2,
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveText: {
    ...Typography.labelCaps,
    color: Colors.success,
  },
  driverName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  vehicleName: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});