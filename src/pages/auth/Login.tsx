import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/types';
import { loginUser, resetPassword } from '../../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParams, 'Login'>;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const showError = (title: string, message: string) => {
    setErrorMsg(message);
    Alert.alert(title, message);
  };
const handleLogin = async () => {
  setErrorMsg('');

  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  // Both empty
  if (!trimmedEmail && !trimmedPassword) {
    showError('Validation Error', 'Email & Password are required');
    return;
  }

  // Email empty
  if (!trimmedEmail) {
    showError('Validation Error', 'Email is required');
    return;
  }

  // Password empty
  if (!trimmedPassword) {
    showError('Validation Error', 'Password is required');
    return;
  }

  // Invalid email format
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    showError('Validation Error', 'Please enter a valid email address');
    return;
  }

  // Password length
  if (trimmedPassword.length < 6) {
    showError(
      'Validation Error',
      'Password must be at least 6 characters'
    );
    return;
  }

  setLoading(true);

  try {
    await loginUser(trimmedEmail, trimmedPassword);

    // Optional success message
    Alert.alert('Success', 'Successfully logged in.');

  } catch (e: any) {
    console.log(e.code);

    switch (e.code) {
      case 'auth/user-not-found':
        showError('Login Failed', 'No account found with this email.');
        break;

      case 'auth/wrong-password':
        showError('Login Failed', 'Incorrect password. Please try again.');
        break;

      case 'auth/invalid-credential':
        showError(
          'Login Failed',
          'Incorrect email or password. Please try again.'
        );
        break;

      case 'auth/invalid-email':
        showError(
          'Login Failed',
          'Please enter a valid email address.'
        );
        break;

      case 'auth/too-many-requests':
        showError(
          'Login Failed',
          'Too many failed attempts. Please try again later.'
        );
        break;

      case 'auth/network-request-failed':
        showError(
          'Login Failed',
          'Network error. Check your connection.'
        );
        break;

      default:
        showError(
          'Login Failed',
          'Something went wrong. Please try again.'
        );
    }
  } finally {
    setLoading(false);
  }
};

  const handleForgot = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      showError('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      await resetPassword(trimmedEmail);
      setErrorMsg('');
      Alert.alert('Email Sent', 'Check your inbox for a password reset link.');
    } catch (e: any) {
      console.log('🔥 Reset password error:', e.code, e.message);
      showError('Error', 'Could not send reset email. Please check the address.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🚍</Text>
          </View>
          <Text style={styles.appName}>TransportApp</Text>
          <Text style={styles.tagline}>Your journey starts here</Text>
        </View>

        {/* CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#4A5568"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => { setEmail(t); if (errorMsg) setErrorMsg(''); }}
            />
          </View>

          {/* PASSWORD */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="••••••••"
                placeholderTextColor="#4A5568"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={(t) => { setPassword(t); if (errorMsg) setErrorMsg(''); }}
              />
              <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FORGOT */}
          <TouchableOpacity onPress={handleForgot} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* DIVIDER */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>New to TransportApp?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* CREATE ACCOUNT */}
          <TouchableOpacity
            style={styles.secondaryBtn}

            onPress={() =>
              navigation.navigate('RoleSelect')
            }

          >


            <Text style={styles.secondaryBtnText}>

              Create Account →

            </Text>


          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          By signing in you agree to our Terms & Privacy Policy
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* STYLES (UNCHANGED) */
const COLORS = {
  bg: '#0B1120', card: '#141E30', border: '#1E2D45',
  passenger: '#6C63FF', text: '#E2E8F0', muted: '#64748B', input: '#0F1927',
  error: '#EF4444', errorBg: '#2A1418',
};

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: COLORS.bg },
  scroll:           { flexGrow: 1, padding: 20, paddingTop: 60 },
  header:           { alignItems: 'center', marginBottom: 32 },
  logoBox:          { width: 72, height: 72, borderRadius: 20, backgroundColor: '#1A2540', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#2A3A5C' },
  logoIcon:         { fontSize: 36 },
  appName:          { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  tagline:          { color: COLORS.muted, marginTop: 4 },
  card:             { backgroundColor: COLORS.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  cardTitle:        { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 20 },
  errorBox:         { backgroundColor: COLORS.errorBg, borderWidth: 1, borderColor: COLORS.error, borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText:        { color: COLORS.error, fontSize: 13, fontWeight: '600' },
  inputGroup:       { marginBottom: 16 },
  inputLabel:       { color: COLORS.muted, fontSize: 12, marginBottom: 6 },
  input:            { backgroundColor: COLORS.input, color: COLORS.text, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  passRow:          { flexDirection: 'row', gap: 8 },
  eyeBtn:           { backgroundColor: COLORS.input, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14 },
  eyeIcon:          { fontSize: 16 },
  forgotRow:        { alignItems: 'flex-end', marginBottom: 20 },
  forgotText:       { color: COLORS.passenger, fontWeight: '600' },
  primaryBtn:       { backgroundColor: COLORS.passenger, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20 },
  primaryBtnText:   { color: '#fff', fontWeight: '800', fontSize: 16 },
  divider:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  dividerLine:      { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText:      { color: COLORS.muted, fontSize: 12 },
  secondaryBtn:     { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  secondaryBtnText: { color: COLORS.text, fontWeight: '600' },
  footer:           { color: COLORS.muted, fontSize: 11, textAlign: 'center', marginTop: 24 },
});