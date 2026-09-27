import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { Colors, Spacing, Typography } from '@styles/tokens';

interface SplashScreenProps {
  message?: string;
}

export default function SplashScreen({ message = 'Getting things ready…' }: SplashScreenProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, scale]);

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.logoCircle,
          { opacity: fade, transform: [{ scale }] },
        ]}
      >
        <Image
         source={require('../../../assets/splash.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.Text style={[styles.appName, { opacity: fade }]}>
        TransportApp
      </Animated.Text>

      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  appName: {
    ...Typography.heading,
    color: Colors.white,
    fontSize: 22,
  },
  message: {
    ...Typography.bodySmall,
    color: Colors.primaryLight,
    marginTop: Spacing.xs,
  },
});