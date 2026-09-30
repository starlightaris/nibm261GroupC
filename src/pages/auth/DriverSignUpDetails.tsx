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
import { Colors, Radius, Spacing } from '@styles/tokens';
import {
  isValidEmail,
  isValidMobile,
  isStrongPassword,
  passwordStrengthMessage,
} from '@utils/validation';
import { normalizeName, validateFullName } from '@utils/profileDetails';

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
    const nameError = validateFullName(name);
    if (nameError)
      return Alert.alert('Oops', nameError);
    if (!isValidMobile(phone))
      return Alert.alert('Oops', 'Please enter a valid mobile number');
    if (!isValidEmail(email))
      return Alert.alert('Oops', 'Please enter a valid email address');
    if (!isStrongPassword(password))
      return Alert.alert('Oops', passwordStrengthMessage(password));
    if (password !== confirmPassword)
      return Alert.alert('Oops', 'Passwords do not match');

    navigation.navigate('DriverSignUpBus', {
      name:          normalizeName(name),
      email:         email.trim(),
      password,
      phone,
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
            placeholderTextColor={Colors.muted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0771234567"
            placeholderTextColor={Colors.muted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="number-pad"
            maxLength={10}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. kamal@email.com"
            placeholderTextColor={Colors.muted}
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
              placeholderTextColor={Colors.muted}
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
              placeholderTextColor={Colors.muted}
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

const INPUT_BORDER = '#E2E8F0';

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.bg },
  scroll:      { flexGrow: 1, padding: Spacing.xl, paddingTop: 60 },
  appName:     { color: Colors.textPrimary, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  tagline:     { color: Colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  card:        { backgroundColor: Colors.white, borderRadius: 24, padding: Spacing.xxl, borderWidth: 1, borderColor: Colors.border },
  label:       { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input:       { backgroundColor: Colors.bg, color: Colors.textPrimary, borderRadius: Radius.button, padding: 14, borderWidth: 1, borderColor: INPUT_BORDER },
  passRow:     { flexDirection: 'row', gap: 8 },
  passInput:   { flex: 1 },
  eyeBtn:      { backgroundColor: Colors.bg, borderWidth: 1, borderColor: INPUT_BORDER, borderRadius: Radius.button, padding: 14 },
  eyeIcon:     { fontSize: 16 },
  btn:         { backgroundColor: Colors.primary, borderRadius: Radius.button, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText:     { color: Colors.white, fontWeight: '800', fontSize: 16 },
  backBtn:     { borderWidth: 1, borderColor: INPUT_BORDER, backgroundColor: Colors.white, borderRadius: Radius.button, padding: 14, alignItems: 'center', marginTop: 12 },
  backBtnText: { color: Colors.textPrimary, fontWeight: '600' },
  footer:      { color: Colors.muted, fontSize: 11, textAlign: 'center', marginTop: 24 },
});