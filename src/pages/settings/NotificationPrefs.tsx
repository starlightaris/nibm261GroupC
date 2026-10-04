import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, AppState, Linking, SafeAreaView, ScrollView,
  StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '@hooks/useAuth';
import { registerForPushNotifications } from '@services/notificationService';
import { Colors, Radius, Spacing } from '@styles/tokens';

type Prefs = {
  enabled: boolean;              // master switch
  sound: boolean;
  driverApproaching: boolean;
};

export default function NotificationPrefsScreen() {
  const { user, loading } = useAuth();
  const [granted, setGranted] = useState<boolean | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);

  const stored = (user as any)?.notificationPrefs as Partial<Prefs> | undefined;
  const prefs: Prefs = {
    enabled: stored?.enabled !== false,
    sound: stored?.sound !== false,
    driverApproaching: stored?.driverApproaching !== false,
  };

  const refreshPermission = useCallback(async () => {
    const p = await Notifications.getPermissionsAsync();
    setGranted(p.granted);
    setCanAskAgain(p.canAskAgain);
    return p.granted;
  }, []);

  useEffect(() => {
    refreshPermission();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refreshPermission(); // user may have changed it in system settings
    });
    return () => sub.remove();
  }, [refreshPermission]);

  const savePrefs = (patch: Partial<Prefs>) => {
    if (!user) return;
    setDoc(
      doc(db, 'users', user.uid),
      { notificationPrefs: { ...prefs, ...patch } },
      { merge: true },
    ).catch((e) => console.warn('[notif prefs] save failed', e));
  };

  // Master switch
  const onMasterChange = async (value: boolean) => {
    if (!user) return;
    if (!value) {
      savePrefs({ enabled: false });
      return;
    }
    // Turning on: make sure the phone itself allows alerts
    if (!granted) {
      if (!canAskAgain) {
        Alert.alert(
          'Alerts are blocked',
          'Allow notifications for this app in your phone settings, then come back.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      await registerForPushNotifications(user.uid);
      const ok = await refreshPermission();
      if (!ok) return;
    }
    savePrefs({ enabled: true });
  };

  const sendTest = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test alert',
        body: 'Alerts are working on this phone.',
        sound: prefs.sound ? 'default' : false,
        data: { type: 'test' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        channelId: prefs.sound ? 'default' : 'silent',
      },
    });
    Alert.alert('Test sent', 'You should see an alert in a couple of seconds.');
  };

  if (loading || !user || granted === null) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const isPassenger = user.role === 'passenger';
  const masterOn = granted && prefs.enabled;
  const optionsDisabled = !masterOn;

  const masterSub = !granted
    ? 'Blocked on this phone. Turn on to allow alerts.'
    : prefs.enabled
      ? isPassenger
        ? 'On. You will get an alert when your driver is close.'
        : 'On. Trip updates can reach this phone.'
      : 'Off. You will not get any alerts from this app.';

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Master switch */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.title}>Allow alerts</Text>
              <Text style={styles.sub}>{masterSub}</Text>
            </View>
            <Switch value={masterOn} onValueChange={onMasterChange} />
          </View>
        </View>

        {/* Passenger alert types */}
        {isPassenger && (
          <>
            <Text style={styles.sectionLabel}>Choose your alerts</Text>
            <View style={[styles.card, optionsDisabled && styles.dimmed]}>
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.title}>Driver arriving</Text>
                  <Text style={styles.sub}>
                    A heads-up when your driver is close to your pickup point
                  </Text>
                </View>
                <Switch
                  value={prefs.driverApproaching}
                  onValueChange={(v) => savePrefs({ driverApproaching: v })}
                  disabled={optionsDisabled}
                />
              </View>
            </View>
          </>
        )}

        {/* Common options */}
        <Text style={styles.sectionLabel}>Options</Text>
        <View style={[styles.card, optionsDisabled && styles.dimmed]}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.title}>Sound</Text>
              <Text style={styles.sub}>Play a sound when an alert arrives</Text>
            </View>
            <Switch
              value={prefs.sound}
              onValueChange={(v) => savePrefs({ sound: v })}
              disabled={optionsDisabled}
            />
          </View>
          <TouchableOpacity
            style={[styles.row, styles.divider]}
            onPress={sendTest}
            disabled={optionsDisabled}
          >
            <View style={styles.rowText}>
              <Text style={[styles.title, { color: Colors.primary }]}>Send a test alert</Text>
              <Text style={styles.sub}>Check that alerts reach this phone</Text>
            </View>
          </TouchableOpacity>
        </View>

        {!granted && !canAskAgain && (
          <TouchableOpacity style={styles.btn} onPress={() => Linking.openSettings()}>
            <Text style={styles.btnText}>Open phone settings</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.lg },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.card,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg,
  },
  dimmed: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: Colors.border },
  rowText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  sub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingVertical: 12, alignItems: 'center',
  },
  btnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
});