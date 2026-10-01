import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@styles/tokens';
import type { TripSummary } from '../../types/trip';
import { formatTripDate, formatTripDuration, formatTripTime } from '../../utils/tripSummary';

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function Metric({ value, label, color }: { value: number | null; label: string; color: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value ?? '—'}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function TripSummaryContent({ summary, completedNow = false }: { summary: TripSummary; completedNow?: boolean }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.check}><Ionicons name="checkmark" size={30} color={Colors.successText} /></View>
        <Text style={styles.title} accessibilityRole="header">{completedNow ? 'Trip complete' : 'Completed trip'}</Text>
        <Text style={styles.subtitle}>{formatTripDate(summary.date)}</Text>
        <Text style={styles.shift}>{summary.shift === 'morning' ? 'Morning shift' : 'Evening shift'}</Text>
      </View>
      <View style={styles.metrics}>
        <Metric value={summary.totalStopsPlanned} label="Stops planned" color={Colors.primary} />
        <Metric value={summary.passengersCollected} label="Passengers collected" color={Colors.successText} />
        <Metric value={summary.passengersMissed} label="Passengers missed" color={Colors.warningText} />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle} accessibilityRole="header">Journey details</Text>
        <Detail label="Stops completed" value={String(summary.stopsCompleted)} />
        <Detail label="Passengers planned" value={summary.passengersPlanned === null ? 'Not recorded' : String(summary.passengersPlanned)} />
        <Detail label="Start time" value={formatTripTime(summary.startedAt)} />
        <Detail label="End time" value={formatTripTime(summary.endedAt)} />
        <Detail label="Trip duration" value={formatTripDuration(summary.durationSeconds)} />
      </View>
      <Text style={styles.note}>Saved in Trip History. You can view this record again from Settings.</Text>
      {(summary.totalStopsPlanned === null || summary.passengersMissed === null) && (
        <Text style={styles.note}>Some details were not recorded for this older trip.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  hero: { alignItems: 'center', paddingVertical: Spacing.xxl },
  check: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: Spacing.sm },
  shift: { marginTop: Spacing.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: Radius.pill, overflow: 'hidden', backgroundColor: Colors.primaryLight, color: Colors.primary, fontWeight: '600' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  metric: { flex: 1, minWidth: 95, padding: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.card, alignItems: 'center' },
  metricValue: { fontSize: 30, fontWeight: '700' },
  metricLabel: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: Spacing.sm },
  card: { borderRadius: Radius.card, backgroundColor: Colors.white, padding: Spacing.lg },
  cardTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: Spacing.sm },
  detail: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.sm, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  label: { color: Colors.textSecondary, fontSize: 14 },
  value: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  note: { marginTop: Spacing.lg, color: Colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
