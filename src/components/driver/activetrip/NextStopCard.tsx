import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { RouteStop } from '@hooks/useDriverRoute';
import { tripStopKind, type TripStop } from '@utils/tripStops';
import InitialsAvatar from './InitialsAvatar';

interface Props {
  stop: TripStop;
  stopNumber: number;
  total: number;
  eta?: string | null;
  nextInstruction?: string | null;
  onComplete: () => void;
  loading: boolean;
}

const BUTTON_LABEL = {
  pickup: 'Picked Up  ✓',
  dropoff: 'Dropped Off  ✓',
  both: 'Done at this stop  ✓',
} as const;

function PassengerGroup({
  label,
  passengers,
  kind,
}: {
  label: string;
  passengers: RouteStop[];
  kind: 'pickup' | 'dropoff';
}) {
  if (passengers.length === 0) return null;
  const isDropoff = kind === 'dropoff';

  return (
    <View style={styles.group}>
      <View style={[styles.pill, isDropoff ? styles.pillDropoff : styles.pillPickup]}>
        <Text style={[styles.pillText, isDropoff ? styles.pillDropoffText : styles.pillPickupText]}>
          {label} · {passengers.length}
        </Text>
      </View>
      {passengers.map((p) => (
        <View key={p.userId} style={styles.passengerRow}>
          <InitialsAvatar
            initials={p.initials}
            size={36}
            backgroundColor={isDropoff ? Colors.purpleLight : undefined}
            color={isDropoff ? Colors.purple : undefined}
          />
          <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
        </View>
      ))}
    </View>
  );
}

export default function NextStopCard({
  stop,
  stopNumber,
  total,
  eta,
  nextInstruction,
  onComplete,
  loading,
}: Props) {
  const kind = tripStopKind(stop);

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

      <Text style={styles.coords} numberOfLines={1}>
        {stop.location.latitude.toFixed(5)}, {stop.location.longitude.toFixed(5)}
      </Text>

      {/* Drop-offs first: people get off, then new ones board */}
      <ScrollView style={styles.groups} showsVerticalScrollIndicator={false}>
        <PassengerGroup label="Drop off" passengers={stop.dropoffs} kind="dropoff" />
        <PassengerGroup label="Pick up" passengers={stop.pickups} kind="pickup" />
      </ScrollView>

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
        onPress={onComplete}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator size="small" color={Colors.white} />
          : <Text style={styles.btnText}>{BUTTON_LABEL[kind]}</Text>
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
    marginBottom: Spacing.xs,
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
  coords: { fontSize: 11, color: Colors.muted, marginBottom: Spacing.sm },

  // Capped so a busy stop scrolls instead of pushing the button off the sheet
  groups: { maxHeight: 120, marginBottom: Spacing.sm },
  group: { marginBottom: Spacing.sm },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: 6,
  },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  pillText: { fontSize: 11, fontWeight: '700' },
  pillPickup: { backgroundColor: Colors.primaryLight },
  pillPickupText: { color: Colors.primary },
  pillDropoff: { backgroundColor: Colors.purpleLight },
  pillDropoffText: { color: Colors.purple },

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
