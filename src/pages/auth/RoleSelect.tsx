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

const COLORS = {
  bg: '#0B1120',
  card: '#141E30',
  border: '#1E2D45',
  driver: '#2563eb',
  passenger: '#16a34a',
  text: '#E2E8F0',
  muted: '#64748B',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  appName: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
  },
  tagline: {
    color: COLORS.muted,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  question: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  btnDriver: {
    backgroundColor: COLORS.driver,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  btnPassenger: {
    backgroundColor: COLORS.passenger,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  btnIcon: {
    fontSize: 28,
  },
  btnTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  loginBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  loginBtnText: {
    color: COLORS.text,
    fontWeight: '600',
  },
});