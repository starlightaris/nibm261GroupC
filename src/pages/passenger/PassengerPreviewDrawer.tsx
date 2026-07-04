// src/components/passenger/PassengerPreviewDrawer.tsx
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

  return (
    <Animated.View
      style={[
        styles.drawer,
        { transform: [{ translateY }] },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.handle} />

      <View style={styles.headerRow}>
        <Text style={styles.title}>
          Picking up {passengers.length === 1 ? '1 passenger' : `${passengers.length} passengers`}
        </Text>
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {passengers.map((p) => (
        <View key={p.id} style={styles.passengerRow}>
          {p.photoUrl ? (
            <Image source={{ uri: p.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {p.name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <Text style={styles.passengerName}>{p.name}</Text>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: SCREEN_HEIGHT * 0.35,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 10,
    elevation: 12,
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
    fontSize: 16,
    fontWeight: '600',
  },
  closeText: {
    color: '#8A8FA3',
    fontSize: 16,
    padding: 4,
  },
  passengerRow: {
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
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  passengerName: {
    color: '#E2E4ED',
    fontSize: 15,
  },
});