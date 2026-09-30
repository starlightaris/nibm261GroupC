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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParams } from '@navigation/types';
import { useAuth } from '@hooks/useAuth';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { updateUserProfile } from '@services/profileService';
import {
  fromStoredName,
  splitFullName,
  submitProfileDetails,
  validateProfileDetails,
  type ProfileErrors,
} from '@utils/profileDetails';

type Props = NativeStackScreenProps<SettingsStackParams, 'EditProfile'>;

export default function EditProfile(_props: Props) {
  const { user, loading: authLoading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProfileErrors>({});

  useEffect(() => {
    if (user) {
      const nameParts = splitFullName(user.name ?? '');
      setFirstName(fromStoredName(user.firstName ?? nameParts.firstName));
      setLastName(fromStoredName(user.lastName ?? nameParts.lastName));
      setPhone(user.phone ?? '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || isSaving) return;

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const errors = await submitProfileDetails(
        user.uid,
        { firstName, lastName, phone },
        updateUserProfile,
      );
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) return;

      setSuccessMessage('Profile updated successfully.');
    } catch (err) {
      console.error('Error saving profile:', err);
      setErrorMessage('Failed to save profile. Please try again.');
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
                setErrorMessage(null);
                setFieldErrors((current) => ({
                  ...current,
                  firstName: validateProfileDetails({ firstName: value, lastName, phone }).firstName,
                }));
              }}
              placeholder="e.g. John"
              placeholderTextColor={Colors.muted}
              autoCapitalize="words"
              accessibilityLabel="First name"
            />
            {fieldErrors.firstName && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{fieldErrors.firstName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={(value) => {
                setLastName(value);
                setSuccessMessage(null);
                setErrorMessage(null);
                setFieldErrors((current) => ({
                  ...current,
                  lastName: validateProfileDetails({ firstName, lastName: value, phone }).lastName,
                }));
              }}
              placeholder="e.g. Silva"
              placeholderTextColor={Colors.muted}
              autoCapitalize="words"
              accessibilityLabel="Last name"
            />
            {fieldErrors.lastName && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{fieldErrors.lastName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setSuccessMessage(null);
                setErrorMessage(null);
                setFieldErrors((current) => ({
                  ...current,
                  phone: validateProfileDetails({ firstName, lastName, phone: value }).phone,
                }));
              }}
              placeholder="e.g. 0771234567"
              placeholderTextColor={Colors.muted}
              keyboardType="number-pad"
              maxLength={10}
              accessibilityLabel="Mobile number"
            />
            {fieldErrors.phone && <Text style={styles.fieldError} accessibilityLiveRegion="polite">{fieldErrors.phone}</Text>}
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

          {errorMessage && (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Text style={styles.errorText}>{errorMessage}</Text>
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
  fieldError: {
    color: Colors.error,
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: Radius.button,
    padding: Spacing.md,
    marginBottom: Spacing.md,
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
