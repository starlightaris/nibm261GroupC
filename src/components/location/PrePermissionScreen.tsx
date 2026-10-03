import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { PRE_PERMISSION_COPY, type LocationRole } from '@utils/locationPermission';

interface Props {
  role: LocationRole;
  requesting: boolean;
  onAllow: () => void;
  onNotNow: () => void;
}

/** Explains why location is needed BEFORE the system dialog is shown. */
export default function PrePermissionScreen({ role, requesting, onAllow, onNotNow }: Props) {
  const copy = PRE_PERMISSION_COPY[role];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>📍</Text>
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
        <Text style={styles.note}>Only used while the app is open.</Text>

        <TouchableOpacity
          style={[styles.primaryBtn, requesting && styles.btnDisabled]}
          onPress={onAllow}
          disabled={requesting}
        >
          {requesting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Allow location</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={onNotNow} disabled={requesting}>
          <Text style={styles.secondaryBtnText}>Not now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', padding: Spacing.xl },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  icon: { fontSize: 36 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  body: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  note: { fontSize: 12, color: Colors.muted, marginBottom: Spacing.xl },
  primaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  secondaryBtn: { padding: Spacing.md },
  secondaryBtnText: { color: Colors.textSecondary, fontWeight: '600' },
});
