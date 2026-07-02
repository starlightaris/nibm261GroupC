import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParams } from '@navigation/types';
import { useVehicleDetails } from '@hooks/useVehicleDetails';
import { Colors, Spacing } from '@styles/tokens';
import VehicleDetailsCard from '@components/driver/settings/VehicleDetailsCard';

type Props = NativeStackScreenProps<SettingsStackParams, 'VehicleDetails'>;

export default function VehicleDetails({ navigation }: Props) {
  const { vehicle, loading, saving, error, saveVehicle } =
    useVehicleDetails();

  if (loading || !vehicle) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {error && <Text style={styles.errorText}>{error}</Text>}
        <VehicleDetailsCard
          vehicle={vehicle}
          saving={saving}
          onSave={saveVehicle}
        />
      </ScrollView>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
});