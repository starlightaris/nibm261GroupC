import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import {
  hasCutoffPassed,
  MarkableAttendanceStatus,
  Shift,
  ShiftAttendance,
  ShiftTimes,
  TodayAttendance,
} from '@hooks/useAttendance';

const formatTime = (time: string): string => {
  const [hour, minute] = time.split(':').map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

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
  cutoffTime: string;
  isMarking: boolean;
  now: Date;
  onMark: (status: MarkableAttendanceStatus) => void;
}

function ShiftCard({
  shift,
  attendance,
  cutoffTime,
  isMarking,
  now,
  onMark,
}: ShiftCardProps) {
  const label = shift === 'morning' ? 'Morning' : 'Evening';
  const cutoffPassed = hasCutoffPassed(cutoffTime, now);

  const renderButton = (
    status: MarkableAttendanceStatus,
    text: string
  ) => {
    const selected = attendance.status === status;
    const disabled = cutoffPassed || isMarking;
    return (
      <TouchableOpacity
        style={[
          styles.actionButton,
          selected &&
            (status === 'present'
              ? styles.presentButton
              : styles.absentButton),
          disabled && styles.disabledButton,
        ]}
        onPress={() => onMark(status)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label} shift ${status}`}
        accessibilityState={{ disabled, selected }}
      >
        <Text style={[styles.actionText, selected && styles.selectedActionText]}>
          {text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.card, cutoffPassed && styles.closedCard]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.shiftLabel}>{label}</Text>
          <Text style={styles.cutoffText}>
            {cutoffPassed ? 'Closed' : 'Cutoff'} · {formatTime(cutoffTime)}
          </Text>
        </View>
        {isMarking && <ActivityIndicator size="small" color={Colors.primary} />}
      </View>

      <Text style={styles.confirmation} accessibilityLiveRegion="polite">
        {formatConfirmation(attendance)}
      </Text>

      <View style={styles.actions}>
        {renderButton('present', '✓ Present')}
        {renderButton('absent', '✕ Absent')}
      </View>

      {cutoffPassed && (
        <Text style={styles.closedHelp}>Attendance can no longer be changed.</Text>
      )}
    </View>
  );
}

interface Props {
  attendance: TodayAttendance;
  marking: Shift | null;
  shiftTimes: ShiftTimes;
  onMark: (shift: Shift, status: MarkableAttendanceStatus) => void;
}

export default function AttendanceCard({
  attendance,
  marking,
  shiftTimes,
  onMark,
}: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.cards}>
      <ShiftCard
        shift="morning"
        attendance={attendance.morning}
        cutoffTime={shiftTimes.morningCutoff}
        isMarking={marking === 'morning'}
        now={now}
        onMark={(status) => onMark('morning', status)}
      />
      <ShiftCard
        shift="evening"
        attendance={attendance.evening}
        cutoffTime={shiftTimes.eveningCutoff}
        isMarking={marking === 'evening'}
        now={now}
        onMark={(status) => onMark('evening', status)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  closedCard: { backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftLabel: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  cutoffText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmation: {
    marginTop: Spacing.md,
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
  closedHelp: { marginTop: Spacing.sm, fontSize: 12, color: Colors.muted },
});
