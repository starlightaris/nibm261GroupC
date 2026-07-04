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
import { useSettings } from '@hooks/useSettings';
import { Colors, Spacing } from '@styles/tokens';
import ShiftTimesCard from '@components/driver/settings/ShiftTimesCard';

type Props = NativeStackScreenProps<SettingsStackParams, 'ShiftTimes'>;

export default function ShiftTimes({ navigation }: Props) {
  const { settings, saving, saveShiftTimes, error, loading } = useSettings();

  if (loading || !settings) {
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
        <ShiftTimesCard
          shiftTimes={settings.shiftTimes}
          saving={saving}
          onSave={saveShiftTimes}
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