import React from 'react';
import { View, Text, Switch, ActivityIndicator, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { useNotificationPreferences } from '@hooks/useNotificationPreferences';

export default function NotificationPrefsScreen() {
  const { types, preferences, loading, loadError, saveError, saving, setEnabled, reload } =
    useNotificationPreferences();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={reload}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>Choose which alerts you want to receive.</Text>

      {saveError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{saveError}</Text>
        </View>
      )}

      {types.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>There are no notification options for your account yet.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {types.map((type, index) => (
            <View key={type.key} style={[styles.row, index > 0 && styles.rowDivider]}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{type.label}</Text>
                <Text style={styles.rowDescription}>{type.description}</Text>
              </View>
              <Switch
                value={preferences[type.key]}
                onValueChange={(value) => setEnabled(type.key, value)}
                disabled={saving.has(type.key)}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                thumbColor={Colors.white}
                ios_backgroundColor="#E2E8F0"
                accessibilityLabel={type.label}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl },
  centered: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  intro: { color: Colors.textSecondary, fontSize: 14, marginBottom: Spacing.lg },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
  rowText: { flex: 1 },
  rowLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  rowDescription: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  emptyText: { color: Colors.textSecondary, fontSize: 14, padding: Spacing.lg, textAlign: 'center' },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.button,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: { color: Colors.error, fontSize: 13 },
  errorText: { color: Colors.error, fontSize: 14, textAlign: 'center', marginBottom: Spacing.md },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  retryText: { color: Colors.white, fontWeight: '700' },
});
