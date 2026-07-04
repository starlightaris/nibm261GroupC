import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';

export function EmptyRoute() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🗺️</Text>
      <Text style={styles.title}>No stops today</Text>
      <Text style={styles.body}>
        No passengers have confirmed for this shift yet. Check back closer to departure.
      </Text>
    </View>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.errorTitle}>Couldn't load route</Text>
      <Text style={styles.errorBody}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Empty
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: Spacing.lg,
  },
  icon: { fontSize: 36, marginBottom: Spacing.md },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  body: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    padding: Spacing.xxl,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.card,
    margin: Spacing.lg,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 4,
  },
  errorBody: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    lineHeight: 20,
  },
});
