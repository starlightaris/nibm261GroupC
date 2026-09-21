import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@styles/tokens';
import InitialsAvatar from '@components/driver/activetrip/InitialsAvatar';
import type { RouteStopEntry } from '@utils/routeStopEntries';

// ─── Kind badge ───────────────────────────────────────────────────────────────

function KindPill({ kind }: { kind: RouteStopEntry['kind'] }) {
  const isDropoff = kind === 'dropoff';
  return (
    <View style={[styles.pill, isDropoff ? styles.pillDropoff : styles.pillPickup]}>
      <Text style={[styles.pillText, isDropoff ? styles.pillDropoffText : styles.pillPickupText]}>
        {isDropoff ? 'Drop-off' : 'Pickup'}
      </Text>
    </View>
  );
}

// ─── Stop row ─────────────────────────────────────────────────────────────────

interface Props {
  entry: RouteStopEntry;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function StopRow({ entry, index, total, onMoveUp, onMoveDown }: Props) {
  const isDropoff = entry.kind === 'dropoff';
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const names = entry.passengers.map((p) => p.name).join(', ');

  return (
    <View style={styles.row}>
      {/* Numbered badge, colour-coded by kind — matches the map marker */}
      <View style={styles.badgeCol}>
        <View style={[styles.badge, isDropoff && styles.badgeDropoff]}>
          <Text style={styles.badgeText}>{index + 1}</Text>
        </View>
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <KindPill kind={entry.kind} />
        </View>

        <View style={styles.passengerRow}>
          <View style={styles.avatarStack}>
            {entry.passengers.map((p, i) => (
              <View key={p.userId} style={[styles.avatarWrap, i > 0 && { marginLeft: -10 }]}>
                <InitialsAvatar initials={p.initials} size={28} />
              </View>
            ))}
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {names}
          </Text>
        </View>
      </View>

      {/* Manual reorder controls */}
      <View style={styles.moveCol}>
        <TouchableOpacity
          style={[styles.moveBtn, isFirst && styles.moveBtnDisabled]}
          onPress={onMoveUp}
          disabled={isFirst}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="chevron-up" size={16} color={isFirst ? Colors.muted : Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.moveBtn, isLast && styles.moveBtnDisabled]}
          onPress={onMoveDown}
          disabled={isLast}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="chevron-down" size={16} color={isLast ? Colors.muted : Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  // Numbered badge column
  badgeCol: { width: 28, alignItems: 'center', marginRight: Spacing.md },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  badgeDropoff: { backgroundColor: Colors.purple },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginTop: 4,
    marginBottom: 4,
    minHeight: 20,
  },

  // Content
  content: { flex: 1, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center' },

  passengerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: Spacing.sm },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { borderWidth: 2, borderColor: Colors.white, borderRadius: Radius.avatar },
  name: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1 },

  // Pills
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  pillText: { fontSize: 11, fontWeight: '600' },
  pillPickup: { backgroundColor: Colors.primaryLight },
  pillPickupText: { color: Colors.primary },
  pillDropoff: { backgroundColor: Colors.purpleLight },
  pillDropoffText: { color: Colors.purple },

  // Move controls
  moveCol: { justifyContent: 'center', gap: 4, marginLeft: Spacing.sm },
  moveBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveBtnDisabled: { opacity: 0.4 },
});
