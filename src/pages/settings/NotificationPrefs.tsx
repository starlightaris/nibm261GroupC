import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@styles/tokens';
import { useNotificationPrefs } from '@hooks/useNotificationPrefs';
import { NotificationPrefs } from '../../types/notifications';

interface ToggleRowConfig {
  key: keyof NotificationPrefs;
  icon: string;
  label: string;
  description: string;
}

const ROWS: ToggleRowConfig[] = [
  {
    key: 'attendanceReminder',
    icon: '⏰',
    label: 'Attendance reminder',
    description: "A daily nudge to confirm whether you're riding today, before the cutoff time.",
  },
  {
    key: 'tripStarted',
    icon: '🚌',
    label: 'Trip started',
    description: 'Get notified the moment your driver starts the trip so you can start tracking.',
  },
  {
    key: 'driverApproaching',
    icon: '📍',
    label: 'Driver approaching',
    description: 'A heads-up when your driver is nearing your pickup point.',
  },
];

export default function NotificationPrefsScreen() {
  const { prefs, loading, saving, error, updatePref } = useNotificationPrefs();

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          {ROWS.map((row, index) => (
            <View
              key={row.key}
              style={[
                styles.row,
                index === ROWS.length - 1 && styles.rowLast,
              ]}
            >
              <Text style={styles.icon}>{row.icon}</Text>
              <View style={styles.textBlock}>
                <Text style={styles.label}>{row.label}</Text>
                <Text style={styles.description}>{row.description}</Text>
              </View>
              <Switch
                value={prefs[row.key]}
                onValueChange={(value) => updatePref(row.key, value)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
                disabled={saving}
              />
            </View>
          ))}
        </View>

        <Text style={styles.footnote}>
          You can change these any time. Turning a toggle off stops that
          notification for this device only.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.labelCaps,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  icon: {
    fontSize: 20,
    width: 26,
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
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footnote: {
    ...Typography.bodySmall,
    color: Colors.muted,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
});