import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { ShiftTimes } from '@hooks/useSettings';

interface Props {
  shiftTimes: ShiftTimes;
  saving: boolean;
  onSave: (times: ShiftTimes) => void;
}

/** Validate HH:MM 24-hour format */
function isValidTime(val: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(val);
}

export default function ShiftTimesCard({ shiftTimes, saving, onSave }: Props) {
  const [morning, setMorning] = useState(shiftTimes.morningCutoff);
  const [evening, setEvening] = useState(shiftTimes.eveningCutoff);
  const [dirty,   setDirty]   = useState(false);

  // Sync if parent data changes (e.g. onSnapshot fires)
  useEffect(() => {
    setMorning(shiftTimes.morningCutoff);
    setEvening(shiftTimes.eveningCutoff);
    setDirty(false);
  }, [shiftTimes.morningCutoff, shiftTimes.eveningCutoff]);

  const handleChange = (field: 'morning' | 'evening', val: string) => {
    if (field === 'morning') setMorning(val);
    else setEvening(val);
    setDirty(true);
  };

  const morningValid = isValidTime(morning);
  const eveningValid = isValidTime(evening);
  const canSave      = dirty && morningValid && eveningValid && !saving;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Shift cutoff times</Text>
      <Text style={styles.hint}>
        Passengers must confirm attendance before these times. Format: HH:MM (24-hour)
      </Text>

      <View style={styles.row}>
        <TimeField
          label="🌅  Morning"
          value={morning}
          valid={morningValid}
          onChange={(v) => handleChange('morning', v)}
        />
        <View style={styles.rowSpacer} />
        <TimeField
          label="🌆  Evening"
          value={evening}
          valid={eveningValid}
          onChange={(v) => handleChange('evening', v)}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={() => onSave({ morningCutoff: morning, eveningCutoff: evening })}
        disabled={!canSave}
        activeOpacity={0.85}
      >
        {saving
          ? <ActivityIndicator size="small" color={Colors.white} />
          : <Text style={styles.saveBtnText}>Save changes</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

function TimeField({
  label,
  value,
  valid,
  onChange,
}: {
  label: string;
  value: string;
  valid: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, !valid && fieldStyles.inputError]}
        value={value}
        onChangeText={onChange}
        placeholder="09:00"
        placeholderTextColor={Colors.muted}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        selectTextOnFocus
      />
      {!valid && (
        <Text style={fieldStyles.errorText}>Use HH:MM format</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  hint: { fontSize: 12, color: Colors.muted, lineHeight: 18, marginBottom: Spacing.lg },
  row:        { flexDirection: 'row', marginBottom: Spacing.lg },
  rowSpacer:  { width: Spacing.md },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
});

const fieldStyles = StyleSheet.create({
  wrap:       { flex: 1 },
  label:      { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  inputError: { borderColor: Colors.error },
  errorText:  { fontSize: 10, color: Colors.error, marginTop: 4, textAlign: 'center' },
});