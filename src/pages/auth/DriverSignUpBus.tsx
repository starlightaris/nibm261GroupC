import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParams } from '../../navigation/types';
import { registerUser, saveVehicleProfile } from '../../services/authService';
import { isValidVehicleNumber, isValidMobile } from '../../utils/validation';

type NavProp = NativeStackNavigationProp<AuthStackParams, 'DriverSignUpBus'>;
type RoutePropType = RouteProp<AuthStackParams, 'DriverSignUpBus'>;

export default function DriverSignUpBusScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();

  // These came from Step 1
  const { name, email, password, phone, licenseNumber } = route.params;

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [routeTags, setRouteTags] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!isValidVehicleNumber(vehicleNumber)) return Alert.alert('Oops', 'Please type a valid vehicle number');
    if (!nickname.trim()) return Alert.alert('Oops', 'Please give your vehicle a nickname');
    if (!isValidMobile(contactNumber)) return Alert.alert('Oops', 'Please type a valid contact number');

    const tags = routeTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      setLoading(true);

      // 1. Create Firebase account + save user profile
      const uid = await registerUser(email, password, {
        name,
        mobile: phone,
        role: 'driver',
        licenseNumber,
      });

      // 2. Save vehicle profile linked to same uid
      await saveVehicleProfile(uid, {
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        nickname: nickname.trim(),
        routeTags: tags,
        contactNumber: contactNumber.trim(),
        whatsappLink: whatsappLink.trim() || undefined,
      });

      Alert.alert('All Done! 🎉', `Welcome aboard, ${name}!`);
      // Navigate to driver tabs after registration
      navigation.reset({
        index: 0,
        routes: [{ name: 'DriverTabs' }],
      });
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Vehicle Details</Text>
      <Text style={styles.step}>Step 2 of 2 — Your Vehicle</Text>

      <Text style={styles.label}>Vehicle Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. WP-CAB-1234"
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Nickname</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Morning Shuttle A"
        value={nickname}
        onChangeText={setNickname}
      />

      <Text style={styles.label}>Route Tags (separate with commas)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Negombo, Katunayake"
        value={routeTags}
        onChangeText={setRouteTags}
      />

      <Text style={styles.label}>Contact Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 0771234567"
        value={contactNumber}
        onChangeText={setContactNumber}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>WhatsApp Group Link (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="https://chat.whatsapp.com/..."
        value={whatsappLink}
        onChangeText={setWhatsappLink}
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.btn} onPress={handleFinish} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Saving...' : 'Finish ✓'}</Text>
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