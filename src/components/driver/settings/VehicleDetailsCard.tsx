import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { VehicleDetails } from '@hooks/useVehicleDetails';

interface Props {
  vehicle: VehicleDetails;
  saving: boolean;
  onSave: (details: VehicleDetails) => void;
}

export default function VehicleDetailsCard({
  vehicle,
  saving,
  onSave,
}: Props) {
  const [vehicleName, setVehicleName] = useState(vehicle.vehicleName);
  const [plateNumber, setPlateNumber] = useState(vehicle.plateNumber);
  const [vehicleType, setVehicleType] = useState(vehicle.vehicleType);
  const [description, setDescription] = useState(vehicle.description);
  const [routeTagsText, setRouteTagsText] = useState(
    vehicle.routeTags.join(', ')
  );
  const [whatsappLink, setWhatsappLink] = useState(
    vehicle.whatsappLink ?? ''
  );
  const [dirty, setDirty] = useState(false);

  // Sync if parent data changes (e.g. onSnapshot fires)
  useEffect(() => {
    setVehicleName(vehicle.vehicleName);
    setPlateNumber(vehicle.plateNumber);
    setVehicleType(vehicle.vehicleType);
    setDescription(vehicle.description);
    setRouteTagsText(vehicle.routeTags.join(', '));
    setWhatsappLink(vehicle.whatsappLink ?? '');
    setDirty(false);
  }, [vehicle]);

  const markDirty = <T,>(setter: (v: T) => void) => (val: T) => {
    setter(val);
    setDirty(true);
  };

  const isValid =
    vehicleName.trim().length > 0 &&
    plateNumber.trim().length > 0 &&
    vehicleType.trim().length > 0;
  const canSave = dirty && isValid && !saving;

  const handleSave = () => {
    onSave({
      vehicleName: vehicleName.trim(),
      plateNumber: plateNumber.trim(),
      vehicleType: vehicleType.trim(),
      description: description.trim(),
      routeTags: routeTagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      whatsappLink: whatsappLink.trim() || undefined,
    });
  };

  return (
    <View style={styles.card}>
      <Field
        label="Vehicle / business name"
        value={vehicleName}
        onChangeText={markDirty(setVehicleName)}
        placeholder="e.g. Fernando Travels"
      />
      <Field
        label="Plate number"
        value={plateNumber}
        onChangeText={markDirty(setPlateNumber)}
        placeholder="e.g. NA-1234"
        autoCapitalize="characters"
      />
      <Field
        label="Vehicle type"
        value={vehicleType}
        onChangeText={markDirty(setVehicleType)}
        placeholder="e.g. Van, Bus"
      />
      <Field
        label="Description"
        value={description}
        onChangeText={markDirty(setDescription)}
        placeholder="Optional notes for passengers"
        multiline
      />
      <Field
        label="Route areas"
        value={routeTagsText}
        onChangeText={markDirty(setRouteTagsText)}
        placeholder="e.g. Colombo 5, Nugegoda, Maharagama"
        hint="Separate areas with commas"
      />
      <Field
        label="WhatsApp group link"
        value={whatsappLink}
        onChangeText={markDirty(setWhatsappLink)}
        placeholder="Optional"
        autoCapitalize="none"
        keyboardType="url"
      />

      <TouchableOpacity
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!canSave}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text style={styles.saveBtnText}>Save changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  multiline,
  autoCapitalize,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
  keyboardType?: 'default' | 'url';
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[styles_input.base, multiline && styles_input.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted}
        multiline={multiline}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        keyboardType={keyboardType ?? 'default'}
      />
      {hint && <Text style={fieldStyles.hint}>{hint}</Text>}
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
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
});

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  hint: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 4,
  },
});

const styles_input = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
});