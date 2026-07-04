import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@navigation/types';
import {
  isValidEmail,
  isValidMobile,
  isStrongPassword,
  passwordStrengthMessage,
} from '@utils/validation';

type NavProp = NativeStackNavigationProp<AuthStackParams, 'DriverSignUpDetails'>;

export default function DriverSignUpDetailsScreen() {
  const navigation = useNavigation<NavProp>();

  const [name,            setName]            = useState('');
  const [phone,           setPhone]           = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  const handleNext = () => {
    if (!name.trim())
      return Alert.alert('Oops', 'Please enter your name');
    if (!isValidMobile(phone))
      return Alert.alert('Oops', 'Please enter a valid mobile number');
    if (!isValidEmail(email))
      return Alert.alert('Oops', 'Please enter a valid email address');
    if (!isStrongPassword(password))
      return Alert.alert('Oops', passwordStrengthMessage(password));
    if (password !== confirmPassword)
      return Alert.alert('Oops', 'Passwords do not match');

    navigation.navigate('DriverSignUpBus', {
      name:          name.trim(),
      email:         email.trim(),
      password,
      phone:         phone.trim(),
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.appName}>🚐 Driver Sign Up</Text>
        <Text style={styles.tagline}>Step 1 of 2 — Your Details</Text>

        <View style={styles.card}>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Kamal Perera"
            placeholderTextColor="#4A5568"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0771234567"
            placeholderTextColor="#4A5568"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. kamal@email.com"
            placeholderTextColor="#4A5568"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, styles.passInput]}
              placeholder="At least 8 characters"
              placeholderTextColor="#4A5568"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, styles.passInput]}
              placeholder="Type it again"
              placeholderTextColor="#4A5568"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
              <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleNext}>
            <Text style={styles.btnText}>Next →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

        </View>

        <Text style={styles.footer}>
          By signing up you agree to our Terms & Privacy Policy
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const COLORS = {
  bg: '#0B1120', card: '#141E30', border: '#1E2D45',
  accent: '#6C63FF', text: '#E2E8F0', muted: '#64748B', input: '#0F1927',
};

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.bg },
  scroll:      { flexGrow: 1, padding: 20, paddingTop: 60 },
  appName:     { color: COLORS.text, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  tagline:     { color: COLORS.muted, textAlign: 'center', marginBottom: 32 },
  card:        { backgroundColor: COLORS.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  label:       { color: COLORS.muted, fontSize: 12, marginBottom: 6, marginTop: 12 },
  input:       { backgroundColor: COLORS.input, color: COLORS.text, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  passRow:     { flexDirection: 'row', gap: 8 },
  passInput:   { flex: 1 },
  eyeBtn:      { backgroundColor: COLORS.input, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14 },
  eyeIcon:     { fontSize: 16 },
  btn:         { backgroundColor: COLORS.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText:     { color: '#fff', fontWeight: '800', fontSize: 16 },
  backBtn:     { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 12 },
  backBtnText: { color: COLORS.text, fontWeight: '600' },
  footer:      { color: COLORS.muted, fontSize: 11, textAlign: 'center', marginTop: 24 },
});