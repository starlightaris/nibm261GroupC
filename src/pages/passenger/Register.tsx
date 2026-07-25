import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Switch, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { registerUser, savePassengerProfile } from '../../services/authService';
import { isValidEmail, isValidMobile, isStrongPassword, passwordStrengthMessage } from '../../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'PassengerRegister'>;

export default function PassengerRegister({ navigation }: Props) {
  const [useEmail, setUseEmail] = useState(true);
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) return Alert.alert('Oops', 'Please type your name');
    if (useEmail) {
      if (!isValidEmail(emailOrPhone)) return Alert.alert('Please type a valid email');
    } else {
      if (!isValidMobile(emailOrPhone)) return Alert.alert('Please type a valid phone number');
    }
    if (!isStrongPassword(password)) return Alert.alert( passwordStrengthMessage(password));
    if (password !== confirmPassword) return Alert.alert('Passwords do not match');

    try {
      setLoading(true);
      const emailForAuth = useEmail
        ? emailOrPhone.trim()
        : `${emailOrPhone.trim()}@phone.transportapp.local`;

      const uid = await registerUser(emailForAuth, password, {
        name: name.trim(),
        mobile: useEmail ? '' : emailOrPhone.trim(),
        role: 'passenger',
      });

      await savePassengerProfile(uid, {
        name: name.trim(),
        email: useEmail ? emailOrPhone.trim() : undefined,
        phone: !useEmail ? emailOrPhone.trim() : undefined,
        pickupLocation: pickup.trim() || undefined,
        dropLocation: drop.trim() || undefined,
      });

      Alert.alert('All Done! ', 'Your account is ready!');
      navigation.reset({ index: 0, routes: [{ name: 'PassengerHome' }] });
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Passenger Sign Up</Text>

      <View style={styles.switchRow}>
        <Text style={!useEmail ? styles.activeLabel : styles.label}>Phone</Text>
        <Switch value={useEmail} onValueChange={setUseEmail} />
        <Text style={useEmail ? styles.activeLabel : styles.label}>Email</Text>
      </View>

      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} placeholder="e.g. Nimasha Silva" value={name} onChangeText={setName} />

      <Text style={styles.label}>{useEmail ? 'Email' : 'Phone Number'}</Text>
      <TextInput
        style={styles.input}
        placeholder={useEmail ? 'e.g. nimasha@email.com' : 'e.g. 0771234567'}
        value={emailOrPhone}
        onChangeText={setEmailOrPhone}
        keyboardType={useEmail ? 'email-address' : 'phone-pad'}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} placeholder="At least 8 characters" value={password} onChangeText={setPassword} secureTextEntry />

      <Text style={styles.label}>Confirm Password</Text>
      <TextInput style={styles.input} placeholder="Type it again" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

      <Text style={styles.label}>Pickup Location (optional)</Text>
      <TextInput style={styles.input} placeholder="e.g. Negombo Junction" value={pickup} onChangeText={setPickup} />

      <Text style={styles.label}>Drop-off Location (optional)</Text>
      <TextInput style={styles.input} placeholder="e.g. Office Main Gate" value={drop} onChangeText={setDrop} />

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Please wait...' : 'Register ✓'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, justifyContent: 'center' },
  label: { fontSize: 13, color: '#444', marginBottom: 4, marginTop: 8 },
  activeLabel: { fontSize: 13, color: '#2563eb', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 4 },
  btn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});