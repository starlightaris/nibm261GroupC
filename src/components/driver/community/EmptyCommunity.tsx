import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@styles/tokens';

export default function EmptyCommunity() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>👥</Text>
      <Text style={styles.title}>No community yet</Text>
      <Text style={styles.body}>
        Your community will appear here once passengers join using your invite code.
        Complete your vehicle profile to get started.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: Spacing.xxl,
  },
  icon:  { fontSize: 40, marginBottom: Spacing.md },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  body:  { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});