import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@styles/tokens';

export default function NoBusCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>🚌</Text>
      <Text style={styles.title}>Bus not sharing yet</Text>
      <Text style={styles.subtitle}>
        Your driver hasn't started the trip yet.{'\n'}
        Check back soon!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.xxl,
    alignItems: 'center',
    margin: Spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});