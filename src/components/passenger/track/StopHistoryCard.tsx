import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@styles/tokens';
import type { StopWithEta } from '@hooks/usePassengerTrack';

interface Props {
  stops: StopWithEta[];
}

export default function StopHistoryCard({ stops }: Props) {
  if (stops.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Recent Stops</Text>

      {stops.map((stop, index) => (
        <View key={index} style={styles.stopRow}>

          {/* Timeline dot */}
          <View style={styles.timeline}>
            <View style={[
              styles.dot,
              stop.isPast ? styles.dotPast : styles.dotUpcoming
            ]} />
            {index < stops.length - 1 && <View style={styles.line} />}
          </View>

          {/* Stop info */}
          <View style={styles.stopInfo}>
            <Text style={[
              styles.stopName,
              stop.isPast && styles.stopNamePast
            ]}>
              {stop.name}
            </Text>
            <Text style={styles.stopEta}>
              {stop.isPast
                ? '✅ Picked up'
                : stop.etaMinutes !== null
                  ? `~${stop.etaMinutes} min away`
                  : 'Calculating...'}
            </Text>
          </View>

        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  heading: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    fontSize: 16,
  },
  stopRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  timeline: {
    alignItems: 'center',
    width: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotPast: {
    backgroundColor: Colors.success,
  },
  dotUpcoming: {
    backgroundColor: Colors.primary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 2,
  },
  stopInfo: {
    flex: 1,
    paddingBottom: Spacing.sm,
  },
  stopName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  stopNamePast: {
    color: Colors.textSecondary,
  },
  stopEta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});