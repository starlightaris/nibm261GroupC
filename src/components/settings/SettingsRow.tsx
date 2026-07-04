import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '@styles/tokens';

interface SettingsRowProps {
  icon: string;
  label: string;
  subLabel?: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

export default function SettingsRow({
  icon,
  label,
  subLabel,
  onPress,
  destructive = false,
  showChevron = true,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.textBlock}>
        <Text style={[styles.label, destructive && styles.labelDestructive]}>
          {label}
        </Text>
        {subLabel ? (
          <Text style={styles.subLabel} numberOfLines={1}>
            {subLabel}
          </Text>
        ) : null}
      </View>
      {showChevron && !destructive && (
        <Text style={styles.chevron}>›</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  icon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  labelDestructive: {
    color: Colors.error,
  },
  subLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: Colors.muted,
    fontWeight: '400',
  },
});
