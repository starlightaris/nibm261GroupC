import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@navigation/types';
import { Colors, Radius, Spacing } from '@styles/tokens';

type NavProp = NativeStackNavigationProp<AuthStackParams, 'RoleSelect'>;

export default function RoleSelect() {
  const navigation = useNavigation<NavProp>();

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.logo}>🚍</Text>
        <Text style={styles.appName}>TransportApp</Text>
        <Text style={styles.tagline}>Your journey starts here</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.question}>I am a...</Text>

        <TouchableOpacity
          style={styles.btnDriver}
          onPress={() => navigation.navigate('DriverSignUpDetails')}
        >
          <Text style={styles.btnIcon}>🚐</Text>
          <View>
            <Text style={styles.btnTitle}>Driver</Text>
            <Text style={styles.btnSub}>Manage routes and trips</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnPassenger}
          onPress={() => navigation.navigate('PassengerSignUp')}
        >
          <Text style={styles.btnIcon}>🧑</Text>
          <View>
            <Text style={styles.btnTitle}>Passenger</Text>
            <Text style={styles.btnSub}>Track and manage my rides</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Already have an account?</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginBtnText}>Sign In →</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const DRIVER = Colors.primary;
const PASSENGER = '#16a34a';
const INPUT_BORDER = '#E2E8F0';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  tagline: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  question: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  btnDriver: {
    backgroundColor: DRIVER,
    borderRadius: Radius.button,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: Spacing.md,
  },
  btnPassenger: {
    backgroundColor: PASSENGER,
    borderRadius: Radius.button,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: Spacing.xl,
  },
  btnIcon: {
    fontSize: 28,
  },
  btnTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  btnSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: INPUT_BORDER,
  },
  dividerText: {
    color: Colors.muted,
    fontSize: 12,
  },
  loginBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.button,
    padding: 14,
    alignItems: 'center',
  },
  loginBtnText: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
