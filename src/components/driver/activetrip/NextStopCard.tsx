import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { RouteStop } from '@hooks/useDriverRoute';
import InitialsAvatar from './InitialsAvatar';

interface Props {
  stop: RouteStop;
  stopNumber: number;
  total: number;
  eta?: string | null;
  nextInstruction?: string | null;
  onMarkPickedUp: () => void;
  loading: boolean;
}

export default function NextStopCard({
  stop,
  stopNumber,
  total,
  eta,
  nextInstruction,
  onMarkPickedUp,
  loading,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>Next stop · {stopNumber} of {total}</Text>
        {eta && (
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>{eta}</Text>
          </View>
        )}
      </View>

      <View style={styles.passengerRow}>
        <InitialsAvatar initials={stop.initials} size={52} />
        <View style={styles.info}>
          <Text style={styles.name}>{stop.name}</Text>
          <Text style={styles.coords} numberOfLines={1}>
            {stop.pickupLocation.latitude.toFixed(5)},{' '}
            {stop.pickupLocation.longitude.toFixed(5)}
          </Text>
        </View>
      </View>

      {nextInstruction && (
        <View style={styles.instructionRow}>
          <Text style={styles.instructionIcon}>↱</Text>
          <Text style={styles.instructionText} numberOfLines={1}>
            {nextInstruction}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={onMarkPickedUp}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator size="small" color={Colors.white} />
          : <Text style={styles.btnText}>Mark as Picked Up  ✓</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  etaBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  etaText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  info:   { flex: 1 },
  name:   { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  coords: { fontSize: 11, color: Colors.muted },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: Spacing.md,
  },
  instructionIcon: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  instructionText: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});