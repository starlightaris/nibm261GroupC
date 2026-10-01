import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParams } from '@navigation/types';
import { useTripHistory } from '@hooks/useTripHistory';
import TripRecordState from '@components/trips/TripRecordState';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { formatTripDate, formatTripDuration } from '@utils/tripSummary';

type Props = NativeStackScreenProps<SettingsStackParams, 'TripHistory'>;

export default function TripHistoryScreen({ navigation }: Props) {
  const { data: trips, loading, error, reload, role } = useTripHistory();
  if (loading) return <TripRecordState loading title="Loading trip history…" />;
  if (error) return <TripRecordState title="History unavailable" message={error} onRetry={reload} />;

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <FlatList
        data={trips ?? []}
        keyExtractor={(trip) => trip.id}
        contentContainerStyle={[styles.content, !trips?.length && styles.empty]}
        refreshing={false}
        onRefresh={reload}
        ListHeaderComponent={trips?.length ? (
          <Text style={styles.description}>{role === 'driver' ? 'Your completed journeys, newest first.' : 'Completed journeys from communities you were part of.'}</Text>
        ) : null}
        ListEmptyComponent={<TripRecordState title="No completed trips yet" message={role === 'driver' ? 'Your journeys will appear here when you finish a trip.' : 'Completed trips for your community will appear here.'} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`View trip on ${formatTripDate(item.date)}, ${item.shift} shift`}
            accessibilityHint="Opens a read-only trip summary"
            onPress={() => navigation.navigate('TripSummary', { tripId: item.id })}
          >
            <View style={styles.icon}><Ionicons name="bus-outline" size={24} color={Colors.primary} /></View>
            <View style={styles.details}>
              <Text style={styles.date}>{formatTripDate(item.date)}</Text>
              <Text style={styles.shift}>{item.shift === 'morning' ? 'Morning shift' : 'Evening shift'} · {formatTripDuration(item.durationSeconds)}</Text>
              <Text style={styles.stats}>{item.totalStopsPlanned === null ? `${item.stopsCompleted} stops completed` : `${item.totalStopsPlanned} stops planned`}{role === 'driver' ? ` · ${item.passengersCollected} picked up` : ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
  empty: { flexGrow: 1 },
  description: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: Spacing.xs },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.card, backgroundColor: Colors.white },
  icon: { padding: Spacing.md, borderRadius: Radius.button, backgroundColor: Colors.primaryLight },
  details: { flex: 1 },
  date: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  shift: { fontSize: 13, color: Colors.textSecondary, marginTop: Spacing.xs },
  stats: { fontSize: 12, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 18 },
});
