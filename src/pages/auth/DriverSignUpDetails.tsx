import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParams } from '../../navigation/types';
import { isValidEmail, isValidMobile, isStrongPassword, passwordStrengthMessage } from '../../utils/validation';

type NavProp = NativeStackNavigationProp<AuthStackParams, 'DriverSignUpDetails'>;

export default function DriverSignUpDetailsScreen() {
  const navigation = useNavigation<NavProp>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (!name.trim()) return Alert.alert('Oops', 'Please type your name');
    if (!isValidMobile(phone)) return Alert.alert('Oops', 'Please type a valid mobile number');
    if (!isValidEmail(email)) return Alert.alert('Oops', 'Please type a valid email');
    if (!licenseNumber.trim()) return Alert.alert('Oops', 'Please enter your license number');
    if (!isStrongPassword(password)) return Alert.alert('Oops', passwordStrengthMessage(password));
    if (password !== confirmPassword) return Alert.alert('Oops', 'Passwords do not match');

    // Pass all details to Step 2 — Firebase save happens there
    navigation.navigate('DriverSignUpBus', {
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      licenseNumber: licenseNumber.trim(),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Driver Sign Up</Text>
      <Text style={styles.step}>Step 1 of 2 — Your Details</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Kamal Perera"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Mobile Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 0771234567"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. kamal@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>License Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. B1234567"
        value={licenseNumber}
        onChangeText={setLicenseNumber}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="At least 8 characters"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Type it again"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.btn} onPress={handleNext} disabled={loading}>
        <Text style={styles.btnText}>Next →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 20 },
  step: { fontSize: 14, color: '#666', marginBottom: 20 },
  label: { fontSize: 13, color: '#444', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 4 },
  btn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});