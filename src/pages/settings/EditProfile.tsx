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
import { db } from '@config/firebaseConfig';
import { Colors, Radius, Spacing } from '@styles/tokens';

type Props = NativeStackScreenProps<SettingsStackParams, 'EditProfile'>;

export default function EditProfile({ navigation }: Props) {
  const { user, loading: authLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize fields once user is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || (user as any).mobile || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Missing Info', 'Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        name: name.trim(),
        phone: phone.trim(),
      }, { merge: true });
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
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
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. John Doe"
              placeholderTextColor={Colors.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 077 123 4567"
              placeholderTextColor={Colors.muted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (Read-only)</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user.email}
              editable={false}
            />
            <Text style={styles.helpText}>Email cannot be changed.</Text>
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
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