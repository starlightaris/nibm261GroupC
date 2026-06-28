import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/types';
import { registerPassenger } from '../../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParams, 'PassengerSignUp'>;
};

// Basic email format check
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Basic phone check: digits, spaces, +, -, ( ) allowed, 7-15 digits total
const PHONE_REGEX = /^[0-9+\-\s()]{7,15}$/;

export default function PassengerSignUp({ navigation }: Props) {

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);


  const validate = (): string | null => {

    if (!name.trim()) {
      return 'Please enter your full name.';
    }

    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters.';
    }

    if (!email.trim()) {
      return 'Please enter your email address.';
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return 'Please enter a valid email address.';
    }

    if (phone.trim() && !PHONE_REGEX.test(phone.trim())) {
      return 'Please enter a valid phone number.';
    }

    if (!password) {
      return 'Please enter a password.';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return 'Password must include at least one uppercase letter and one number.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;

  };


  const handleSignUp = async () => {

    const error = validate();

    if (error) {
      Alert.alert('Check your details', error);
      return;
    }

    setLoading(true);

    try {

      await registerPassenger(
        email.trim(),
        password,
        name.trim(),
        phone.trim()
      );

      // Firebase Auth state change will automatically trigger
      // navigation to PassengerTabs once the user is signed in.

    } catch (e: any) {

      const msg =
        e.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : e.code === 'auth/invalid-email'
          ? 'That email address looks invalid.'
          : e.code === 'auth/weak-password'
          ? 'Password is too weak. Please choose a stronger one.'
          : e.message;

      Alert.alert('Sign up failed', msg);

    } finally {

      setLoading(false);

    }

  };


  return (

    <KeyboardAvoidingView
      style={styles.root}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >


        {/* HEADER */}

        <View style={styles.header}>

          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>
              🚍
            </Text>
          </View>


          <Text style={styles.appName}>
            TransportApp
          </Text>


          <Text style={styles.tagline}>
            Create your passenger account
          </Text>


        </View>



        {/* CARD */}

        <View style={styles.card}>


          <Text style={styles.cardTitle}>
            Sign Up
          </Text>


          {/* NAME */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Full Name
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Jane Doe"
              placeholderTextColor="#4A5568"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />

          </View>


          {/* EMAIL */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Email Address
            </Text>

            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#4A5568"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

          </View>


          {/* PHONE */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Phone Number (optional)
            </Text>

            <TextInput
              style={styles.input}
              placeholder="+1 234 567 8900"
              placeholderTextColor="#4A5568"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

          </View>


          {/* PASSWORD */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Password
            </Text>

            <View style={styles.passRow}>

              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="••••••••"
                placeholderTextColor="#4A5568"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
              >
                <Text style={styles.eyeIcon}>
                  {showPass ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>

            </View>

            <Text style={styles.hintText}>
              At least 8 characters, with 1 uppercase letter and 1 number.
            </Text>

          </View>


          {/* CONFIRM PASSWORD */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Confirm Password
            </Text>

            <View style={styles.passRow}>

              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="••••••••"
                placeholderTextColor="#4A5568"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                style={styles.eyeBtn}
              >
                <Text style={styles.eyeIcon}>
                  {showConfirm ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>

            </View>

          </View>


          {/* SIGN UP BUTTON */}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {
              loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Create Account</Text>
            }
          </TouchableOpacity>


          {/* BACK TO LOGIN */}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Already have an account?</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryBtnText}>
              ← Back to Sign In
            </Text>
          </TouchableOpacity>


        </View>


        <Text style={styles.footer}>
          By creating an account you agree to our Terms & Privacy Policy
        </Text>


      </ScrollView>

    </KeyboardAvoidingView>

  );

}


const COLORS = {
  bg: '#0B1120',
  card: '#141E30',
  border: '#1E2D45',
  passenger: '#6C63FF',
  text: '#E2E8F0',
  muted: '#64748B',
  input: '#0F1927',
};


const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: COLORS.bg
  },

  scroll: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60
  },

  header: {
    alignItems: 'center',
    marginBottom: 32
  },

  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#1A2540',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A3A5C'
  },

  logoIcon: {
    fontSize: 36
  },

  appName: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800'
  },

  tagline: {
    color: COLORS.muted,
    marginTop: 4
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20
  },

  inputGroup: {
    marginBottom: 16
  },

  inputLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 6
  },

  input: {
    backgroundColor: COLORS.input,
    color: COLORS.text,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  hintText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 6
  },

  passRow: {
    flexDirection: 'row',
    gap: 8
  },

  eyeBtn: {
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14
  },

  eyeIcon: {
    fontSize: 16
  },

  primaryBtn: {
    backgroundColor: COLORS.passenger,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border
  },

  dividerText: {
    color: COLORS.muted,
    fontSize: 12
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center'
  },

  secondaryBtnText: {
    color: COLORS.text,
    fontWeight: '600'
  },

  footer: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24
  }

});