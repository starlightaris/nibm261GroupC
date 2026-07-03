import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@styles/tokens';

interface Props {
  initials: string;
  size?: number;
  done?: boolean;
  /** Override background — used in Community member list */
  backgroundColor?: string;
}

export default function InitialsAvatar({
  initials,
  size = 48,
  done = false,
  backgroundColor,
}: Props) {
  const bg = done ? Colors.border : (backgroundColor ?? Colors.primaryLight);
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.35 }, done && styles.doneText]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle:   { alignItems: 'center', justifyContent: 'center' },
  text:     { fontWeight: '700', color: Colors.primary },
  doneText: { color: Colors.muted },
});