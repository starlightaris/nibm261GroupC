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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParams } from '@navigation/types';
import { registerDriver } from '@services/authService';
import { isValidVehicleNumber } from '@utils/validation';

type NavProp = NativeStackNavigationProp<AuthStackParams, 'DriverSignUpBus'>;
type RouteP  = RouteProp<AuthStackParams, 'DriverSignUpBus'>;

export default function DriverSignUpBusScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteP>();
  const { name, email, password, phone } = route.params;

  const [vehiclePlate,  setVehiclePlate]  = useState('');
  const [vehicleName,   setVehicleName]   = useState('');
  const [vehicleType,   setVehicleType]   = useState('');
  const [description,   setDescription]   = useState('');
  const [routeTags,     setRouteTags]     = useState('');
  const [whatsappLink,  setWhatsappLink]  = useState('');
  const [loading,       setLoading]       = useState(false);

  const handleFinish = async () => {
    if (!isValidVehicleNumber(vehiclePlate))
      return Alert.alert('Oops', 'Please enter a valid vehicle plate number (e.g. WP-CAB-1234)');
    if (!vehicleName.trim())
      return Alert.alert('Oops', 'Please enter a vehicle / business name');
    if (!vehicleType.trim())
      return Alert.alert('Oops', 'Please enter the vehicle type (e.g. Van, Bus)');

    try {
      setLoading(true);
      await registerDriver(
        email,
        password,
        name,
        phone,
        vehicleType.trim(),
        vehiclePlate.trim().toUpperCase(),
        vehicleName.trim(),
        description.trim(),
        routeTags.split(',').map((t) => t.trim()).filter(Boolean),
        whatsappLink.trim() || undefined,
      );

      Alert.alert('All Done! 🎉', `Welcome aboard, ${name}!`);
      navigation.reset({ index: 0, routes: [{ name: 'DriverTabs' }] });
    } catch (err: any) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : err.message ?? 'Please try again';
      Alert.alert('Something went wrong', msg);
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

        <Text style={styles.appName}>🚐 Vehicle Details</Text>
        <Text style={styles.tagline}>Step 2 of 2 — Your Vehicle</Text>

        <View style={styles.card}>

          <Text style={styles.label}>Vehicle Plate Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. WP-CAB-1234"
            placeholderTextColor="#4A5568"
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Vehicle / Business Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Morning Shuttle A"
            placeholderTextColor="#4A5568"
            value={vehicleName}
            onChangeText={setVehicleName}
          />

          <Text style={styles.label}>Vehicle Type</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Van, Mini Bus, Bus"
            placeholderTextColor="#4A5568"
            value={vehicleType}
            onChangeText={setVehicleType}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell passengers about your route, timings, or anything useful..."
            placeholderTextColor="#4A5568"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Route Tags</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Negombo, Katunayake, Airport"
            placeholderTextColor="#4A5568"
            value={routeTags}
            onChangeText={setRouteTags}
          />
          <Text style={styles.hint}>Separate locations with commas</Text>

          <Text style={styles.label}>
            WhatsApp Group Link{'  '}
            <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="https://chat.whatsapp.com/..."
            placeholderTextColor="#4A5568"
            value={whatsappLink}
            onChangeText={setWhatsappLink}
            autoCapitalize="none"
            keyboardType="url"
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleFinish}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Saving...' : 'Finish ✓'}</Text>
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
  optional:    { color: COLORS.muted, fontStyle: 'italic', fontWeight: '400' },
  hint:        { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  input:       { backgroundColor: COLORS.input, color: COLORS.text, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  textArea:    { minHeight: 100, paddingTop: 14 },
  btn:         { backgroundColor: COLORS.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontWeight: '800', fontSize: 16 },
  backBtn:     { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 12 },
  backBtnText: { color: COLORS.text, fontWeight: '600' },
  footer:      { color: COLORS.muted, fontSize: 11, textAlign: 'center', marginTop: 24 },
});