import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import {
  MarkableAttendanceStatus,
  Shift,
  ShiftAttendance,
  TodayAttendance,
} from '@hooks/useAttendance';

const formatConfirmation = (attendance: ShiftAttendance): string => {
  if (attendance.status === 'unmarked' || !attendance.markedAt) {
    return 'Not marked yet';
  }

  const time = new Date(attendance.markedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `Marked ${attendance.status} · ${time}`;
};

interface ShiftCardProps {
  shift: Shift;
  attendance: ShiftAttendance;
  isMarking: boolean;
  onMark: (status: MarkableAttendanceStatus) => void;
}

function ShiftCard({
  shift,
  attendance,
  isMarking,
  onMark,
}: ShiftCardProps) {
  const label = shift === 'morning' ? 'Morning' : 'Evening';

  const renderButton = (
    status: MarkableAttendanceStatus,
    text: string
  ) => {
    const selected = attendance.status === status;
    return (
      <TouchableOpacity
        style={[
          styles.actionButton,
          selected &&
            (status === 'present'
              ? styles.presentButton
              : styles.absentButton),
          isMarking && styles.disabledButton,
        ]}
        onPress={() => onMark(status)}
        disabled={isMarking}
        accessibilityRole="button"
        accessibilityLabel={`${label} shift ${status}`}
        accessibilityState={{ disabled: isMarking, selected }}
      >
        <Text style={[styles.actionText, selected && styles.selectedActionText]}>
          {text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.shiftHeader}>
        <Text style={styles.shiftLabel}>{label}</Text>
        {isMarking && <ActivityIndicator size="small" color={Colors.primary} />}
      </View>

      <Text style={styles.confirmation} accessibilityLiveRegion="polite">
        {formatConfirmation(attendance)}
      </Text>

      <View style={styles.actions}>
        {renderButton('present', '✓ Present')}
        {renderButton('absent', '✕ Absent')}
      </View>
    </View>
  );
}

interface Props {
  attendance: TodayAttendance;
  marking: Shift | null;
  onMark: (shift: Shift, status: MarkableAttendanceStatus) => void;
}

export default function AttendanceCard({ attendance, marking, onMark }: Props) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View>
      <View style={styles.dateHeader}>
        <Text style={styles.sectionLabel}>Today's Attendance</Text>
        <Text style={styles.dateText}>{today}</Text>
      </View>

      <View style={styles.cards}>
        <ShiftCard
          shift="morning"
          attendance={attendance.morning}
          isMarking={marking === 'morning'}
          onMark={(status) => onMark('morning', status)}
        />
        <ShiftCard
          shift="evening"
          attendance={attendance.evening}
          isMarking={marking === 'evening'}
          onMark={(status) => onMark('evening', status)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dateHeader: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  cards: { gap: Spacing.md, marginHorizontal: Spacing.lg },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftLabel: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  confirmation: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.button,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  presentButton: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  absentButton: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  disabledButton: { opacity: 0.55 },
  actionText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  selectedActionText: { color: Colors.white },
});
