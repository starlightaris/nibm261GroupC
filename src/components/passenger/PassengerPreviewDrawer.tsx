import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PassengerPreview } from '../../types/trip';
import { Colors, Radius, Spacing } from '@styles/tokens';

interface Props {
  visible: boolean;
  passengers: PassengerPreview[];
  onDismiss: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PassengerPreviewDrawer({
  visible,
  passengers,
  onDismiss,
}: Props) {
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 300,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible && passengers.length === 0) return null;

  const label =
    passengers.length === 1
      ? '1 passenger nearby'
      : `${passengers.length} passengers nearby`;

  return (
    <Animated.View
      style={[styles.drawer, { transform: [{ translateY }] }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* handle */}
      <View style={styles.handle} />

      {/* header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{label}</Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* passenger rows */}
      {passengers.map((p) => (
        <View key={p.id} style={styles.row}>
          {p.photoUrl ? (
            <Image source={{ uri: p.photoUrl }} style={styles.avatar} />
          ) : (
            // uses initials from RouteStop — no more single char fallback
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{p.initials}</Text>
            </View>
          )}
          <View style={styles.rowText}>
            <Text style={styles.passengerName}>{p.name}</Text>
            <Text style={styles.statusLabel}>
              {p.attendanceStatus === 'unmarked' ? 'Tentative' : 'Confirmed'}
            </Text>
          </View>
          {/* attendance dot */}
          <View
            style={[
              styles.dot,
              p.attendanceStatus === 'present' && styles.dotPresent,
              p.attendanceStatus === 'unmarked' && styles.dotUnmarked,
            ]}
          />
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#161B2C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: SCREEN_HEIGHT * 0.35,
    // sits above the existing bottom sheet (SHEET_HEIGHT = 280)
    // so we push it up by that amount
    marginBottom: 280,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 10,
    elevation: 14,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A4159',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  closeText: {
    color: '#8A8FA3',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
  },
  avatarFallback: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  rowText: {
    flex: 1,
  },
  passengerName: {
    color: '#E2E4ED',
    fontSize: 14,
    fontWeight: '500',
  },
  statusLabel: {
    color: '#8A8FA3',
    fontSize: 11,
    marginTop: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8A8FA3',
  },
  dotPresent: {
    backgroundColor: '#4CAF50',
  },
  dotUnmarked: {
    backgroundColor: '#FFC107',
  },
});