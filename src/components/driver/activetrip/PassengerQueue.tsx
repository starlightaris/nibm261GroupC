import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing } from '@styles/tokens';
import { buildQueueItems, type TripStop } from '@utils/tripStops';
import InitialsAvatar from './InitialsAvatar';

interface Props {
  allStops: TripStop[];
  /** Index of the stop the driver is heading to */
  currentIndex: number;
}

/**
 * Upcoming and finished actions in trip order, colour-coded: blue for pickups,
 * purple for drop-offs. A passenger shows up twice — once to board, once to
 * get off. The label under each avatar repeats the kind so it isn't
 * colour-only.
 */
export default function PassengerQueue({ allStops, currentIndex }: Props) {
  const items = useMemo(() => buildQueueItems(allStops), [allStops]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Queue</Text>
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Pick up</Text>
          <View style={[styles.legendDot, { backgroundColor: Colors.purple }]} />
          <Text style={styles.legendText}>Drop off</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {items.map((item) => {
          const isDone = item.stopIndex < currentIndex;
          const isNext = item.stopIndex === currentIndex;
          const isDropoff = item.kind === 'dropoff';
          const accent = isDropoff ? Colors.purple : Colors.primary;

          return (
            <View key={item.key} style={styles.item}>
              <View style={[
                styles.ring,
                { borderColor: isDone ? Colors.success : isNext ? accent : Colors.border },
              ]}>
                <InitialsAvatar
                  initials={item.passenger.initials}
                  size={36}
                  done={isDone}
                  backgroundColor={isDropoff ? Colors.purpleLight : undefined}
                  color={isDropoff ? Colors.purple : undefined}
                />
              </View>
              <Text
                style={[styles.name, isDone && styles.nameDone]}
                numberOfLines={1}
              >
                {item.passenger.name.split(' ')[0]}
              </Text>
              <Text
                style={[styles.kind, { color: isDone ? Colors.muted : accent }]}
                numberOfLines={1}
              >
                {isDropoff ? 'Drop off' : 'Pick up'}
              </Text>
              {isDone && <Text style={styles.tick}>✓</Text>}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.white,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', marginRight: 6 },
  strip: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  item:  { alignItems: 'center', width: 56 },
  ring: {
    borderRadius: 22,
    borderWidth: 2,
    padding: 1,
    marginBottom: 4,
  },
  name:     { fontSize: 10, color: Colors.textSecondary, fontWeight: '500', textAlign: 'center' },
  nameDone: { color: Colors.muted },
  kind:     { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  tick:     { fontSize: 10, color: Colors.success, fontWeight: '700' },
});
