import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParams } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParams>;

export default function DriverHome() {
  const navigation = useNavigation<NavProp>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚐 Driver Home</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('ActiveTrip')}>
        <Text style={styles.btnText}>Start Trip / Share Location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#0B1120' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 24, color: '#E2E8F0' },
  btn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 10, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});