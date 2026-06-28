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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParams } from '@navigation/types';
import { registerUser, saveVehicleProfile } from '@services/authService';
import { isValidVehicleNumber } from '../../utils/validation';

type NavProp = NativeStackNavigationProp<AuthStackParams, 'DriverSignUpBus'>;
type RoutePropType = RouteProp<AuthStackParams, 'DriverSignUpBus'>;

export default function DriverSignUpBusScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { name, email, password, phone } = route.params;

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [routeTags, setRouteTags] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!isValidVehicleNumber(vehicleNumber))
      return Alert.alert('Oops', 'Please type a valid vehicle number');
    if (!nickname.trim())
      return Alert.alert('Oops', 'Please give your vehicle a nickname');

    const tags = routeTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      setLoading(true);

      const uid = await registerUser(email, password, {
        name,
        mobile: phone,
        role: 'driver',
      });

      await saveVehicleProfile(uid, {
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        nickname: nickname.trim(),
        routeTags: tags,
        whatsappLink: whatsappLink.trim() || undefined,
      });

      Alert.alert('All Done! 🎉', `Welcome aboard, ${name}!`);
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
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* HEADER */}
        <Text style={styles.appName}>🚐 Vehicle Details</Text>
        <Text style={styles.tagline}>Step 2 of 2 — Your Vehicle</Text>

        {/* CARD */}
        <KeyboardAvoidingView style={styles.card}>

          <Text style={styles.label}>Vehicle Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. WP-CAB-1234"
            placeholderTextColor="#4A5568"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Nickname</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Morning Shuttle A"
            placeholderTextColor="#4A5568"
            value={nickname}
            onChangeText={setNickname}
          />

          <Text style={styles.label}>Route Tags (separate with commas)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Negombo, Katunayake"
            placeholderTextColor="#4A5568"
            value={routeTags}
            onChangeText={setRouteTags}
          />

          <Text style={styles.label}>WhatsApp Group Link (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://chat.whatsapp.com/..."
            placeholderTextColor="#4A5568"
            value={whatsappLink}
            onChangeText={setWhatsappLink}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.btn}
            onPress={handleFinish}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? 'Saving...' : 'Finish ✓'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

        </KeyboardAvoidingView>

        <Text style={styles.footer}>
          By signing up you agree to our Terms & Privacy Policy
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const COLORS = {
  bg: '#0B1120',
  card: '#141E30',
  border: '#1E2D45',
  accent: '#6C63FF',
  text: '#E2E8F0',
  muted: '#64748B',
  input: '#0F1927',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  appName: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  tagline: {
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.input,
    color: COLORS.text,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  backBtnText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  footer: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
  },
});