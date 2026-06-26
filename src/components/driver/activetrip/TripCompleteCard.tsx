import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';

interface Props {
  total: number;
  onDone: () => void;
}

export default function TripCompleteCard({ total, onDone }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>🎉</Text>
      <Text style={styles.title}>Trip complete</Text>
      <Text style={styles.body}>All {total} passengers picked up.</Text>
      <TouchableOpacity style={styles.btn} onPress={onDone} activeOpacity={0.85}>
        <Text style={styles.btnText}>Back to Route</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.xxl,
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  icon:  { fontSize: 40, marginBottom: Spacing.md },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  body:  { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.xl },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  btnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});