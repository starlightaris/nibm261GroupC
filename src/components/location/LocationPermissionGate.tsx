import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { useLocationPermission } from '@hooks/useLocationPermission';
import { DENIED_COPY, type LocationRole } from '@utils/locationPermission';
import PrePermissionScreen from './PrePermissionScreen';

interface Props {
  role: LocationRole;
  children: React.ReactNode;
  /**
   * Remount the wrapped screen when permission flips to granted so its
   * location hooks run again. Only safe for screens with no start-up side
   * effects (e.g. NOT the active trip, which would start the trip twice).
   */
  remountOnGrant?: boolean;
}

/**
 * Wrap any screen that uses the device location.
 *  - never asked      -> explanation screen first, then the system dialog
 *  - granted          -> the screen as normal
 *  - denied / blocked -> the screen still opens, with a non-blocking banner
 *                        (blocked adds an "Open Settings" button)
 * Permission is re-checked on every focus, so it is never assumed.
 */
export default function LocationPermissionGate({ role, children, remountOnGrant = false }: Props) {
  const { state, requesting, request, openSettings } = useLocationPermission();
  const [skipped, setSkipped] = useState(false);
  const insets = useSafeAreaInsets();

  if (state === 'checking') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (state === 'undetermined' && !skipped) {
    return (
      <PrePermissionScreen
        role={role}
        requesting={requesting}
        onAllow={request}
        onNotNow={() => setSkipped(true)}
      />
    );
  }

  const granted = state === 'granted';

  return (
    <View style={styles.flex}>
      {!granted && (
        <View style={[styles.banner, { paddingTop: insets.top + Spacing.sm }]}>
          <Text style={styles.bannerText}>{DENIED_COPY[role]}</Text>
          {state === 'blocked' ? (
            <TouchableOpacity style={styles.bannerBtn} onPress={openSettings}>
              <Text style={styles.bannerBtnText}>Open Settings</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.bannerBtn} onPress={request} disabled={requesting}>
              <Text style={styles.bannerBtnText}>Allow location</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={styles.flex}>
        <React.Fragment key={remountOnGrant && granted ? 'granted' : 'default'}>
          {children}
        </React.Fragment>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  banner: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  bannerText: { color: Colors.warningText, fontSize: 13, lineHeight: 19 },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  bannerBtnText: { color: Colors.warningText, fontWeight: '700', fontSize: 13 },
});
