import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing } from '@styles/tokens';
import { RouteStop } from '@hooks/useDriverRoute';
import InitialsAvatar from './InitialsAvatar';

interface Props {
  allStops: RouteStop[];
  currentIndex: number;
}

export default function PassengerQueue({ allStops, currentIndex }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Passengers</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {allStops.map((stop, i) => {
          const isDone = i < currentIndex;
          const isNext = i === currentIndex;
          return (
            <View key={stop.userId} style={styles.item}>
              <View style={[
                styles.ring,
                isNext && styles.ringActive,
                isDone && styles.ringDone,
              ]}>
                <InitialsAvatar initials={stop.initials} size={36} done={isDone} />
              </View>
              <Text
                style={[styles.name, isDone && styles.nameDone]}
                numberOfLines={1}
              >
                {stop.name.split(' ')[0]}
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
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  strip: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  item:  { alignItems: 'center', width: 52 },
  ring: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 1,
    marginBottom: 4,
  },
  ringActive: { borderColor: Colors.primary },
  ringDone:   { borderColor: Colors.success },
  name:     { fontSize: 10, color: Colors.textSecondary, fontWeight: '500', textAlign: 'center' },
  nameDone: { color: Colors.muted },
  tick:     { fontSize: 10, color: Colors.success, fontWeight: '700' },
});