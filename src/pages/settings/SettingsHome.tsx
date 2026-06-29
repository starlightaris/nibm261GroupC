import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { logoutUser } from '@services/authService';

export default function SettingsHomeScreen() {

  const handleLogout = async () => {
    try {
      await logoutUser();
      // onAuthStateChanged() App.tsx එකේ automatically Login screen එකට ගෙනියනවා.
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to logout.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});