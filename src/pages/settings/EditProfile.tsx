import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParams } from '@navigation/types';
import { useAuth } from '@hooks/useAuth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { isValidMobile } from '@utils/validation';

type Props = NativeStackScreenProps<SettingsStackParams, 'EditProfile'>;

export default function EditProfile(_props: Props) {
  const { user, loading: authLoading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const nameParts = (user.name ?? '').trim().split(/\s+/).filter(Boolean);
      setFirstName(user.firstName ?? nameParts[0] ?? '');
      setLastName(user.lastName ?? nameParts.slice(1).join(' '));
      setPhone(user.phone ?? user.mobile ?? user.mobileNumber ?? '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing information', 'First name and last name are required.');
      return;
    }
    if (!isValidMobile(phone)) {
      Alert.alert('Invalid mobile number', 'Enter a valid mobile number using 9 to 15 digits.');
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    try {
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const trimmedPhone = phone.trim();
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        name: `${trimmedFirstName} ${trimmedLastName}`,
        phone: trimmedPhone,
        mobile: trimmedPhone,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setSuccessMessage('Profile updated successfully.');
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Profile updated successfully.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Unable to load profile.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={(value) => {
                setFirstName(value);
                setSuccessMessage(null);
              }}
              placeholder="e.g. John"
              placeholderTextColor={Colors.muted}
              autoCapitalize="words"
              accessibilityLabel="First name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={(value) => {
                setLastName(value);
                setSuccessMessage(null);
              }}
              placeholder="e.g. Silva"
              placeholderTextColor={Colors.muted}
              autoCapitalize="words"
              accessibilityLabel="Last name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setSuccessMessage(null);
              }}
              placeholder="e.g. 077 123 4567"
              placeholderTextColor={Colors.muted}
              keyboardType="phone-pad"
              accessibilityLabel="Mobile number"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (Read-only)</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user.email}
              editable={false}
              accessibilityLabel="Email address, read only"
            />
            <Text style={styles.helpText}>Email cannot be changed.</Text>
          </View>

          {successMessage && (
            <View style={styles.successBanner} accessibilityRole="alert">
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Save profile changes"
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: Colors.muted,
  },
  helpText: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
  },
  successBanner: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: Radius.button,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    padding: 16,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
