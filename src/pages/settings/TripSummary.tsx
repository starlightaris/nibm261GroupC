import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams, SettingsStackParams } from '@navigation/types';
import { useTripSummary } from '@hooks/useTripHistory';
import TripSummaryContent from '@components/trips/TripSummaryContent';
import TripRecordState from '@components/trips/TripRecordState';
import { Colors, Radius, Spacing } from '@styles/tokens';

type Props = NativeStackScreenProps<RootStackParams, 'TripSummary'> | NativeStackScreenProps<SettingsStackParams, 'TripSummary'>;

export default function TripSummaryScreen({ route, navigation }: Props) {
  const { data: summary, loading, error, reload } = useTripSummary(route.params.tripId);
  const completedNow = route.params.completedNow === true;
  const dismiss = () => {
    if (completedNow) {
      // Reset removes the completed Active Trip and opens the driver's Home tab.
      (navigation as NativeStackScreenProps<RootStackParams>['navigation']).reset({
        index: 0, routes: [{ name: 'DriverTabs', params: { screen: 'DriverHome' } }],
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={completedNow ? ['top', 'bottom'] : ['bottom']}>
      {loading ? <TripRecordState loading title="Loading trip summary…" />
        : error || !summary ? <TripRecordState title="Summary unavailable" message={error ?? 'This trip could not be found.'} onRetry={reload} />
          : <TripSummaryContent summary={summary} completedNow={completedNow} />}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={dismiss} accessibilityRole="button">
          <Text style={styles.buttonText}>{completedNow ? 'Back to Home' : 'Back to Trip History'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  footer: { padding: Spacing.lg, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  button: { padding: Spacing.lg, alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radius.button },
  buttonText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
