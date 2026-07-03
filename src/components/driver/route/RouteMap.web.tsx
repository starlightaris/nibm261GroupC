import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { RouteStop } from '@hooks/useDriverRoute';

interface Props {
  stops: RouteStop[];
  absentMembers: RouteStop[];
}

export default function RouteMap({ stops, absentMembers }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.mapFallback}>
        <Text style={styles.text}>Map is not supported on Web</Text>
        <Text style={styles.subtext}>
          {stops.length} active stops, {absentMembers.length} absent
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.card,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  text: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: Colors.muted,
  },
});
