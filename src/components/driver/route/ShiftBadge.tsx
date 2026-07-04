import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '@styles/tokens';

interface Props {
  shift: 'morning' | 'evening';
}

export default function ShiftBadge({ shift }: Props) {
  const isMorning = shift === 'morning';
  return (
    <View style={[styles.badge, isMorning ? styles.morning : styles.evening]}>
      <Text style={[styles.text, isMorning ? styles.morningText : styles.eveningText]}>
        {isMorning ? '🌅  Morning shift' : '🌆  Evening shift'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  morning: { backgroundColor: Colors.warningLight },
  evening: { backgroundColor: Colors.purpleLight },
  text: { fontSize: 12, fontWeight: '600' },
  morningText: { color: Colors.warningText },
  eveningText: { color: Colors.purple },
});
