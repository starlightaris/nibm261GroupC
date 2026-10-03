import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';

export default function TripRecordState({ loading, title, message, onRetry }: {
  loading?: boolean;
  title: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.root}>
      {loading && <ActivityIndicator size="large" color={Colors.primary} />}
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {onRetry && (
        <TouchableOpacity style={styles.button} accessibilityRole="button" onPress={onRetry}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, backgroundColor: Colors.bg },
  title: { marginTop: Spacing.lg, fontSize: 20, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  message: { marginTop: Spacing.sm, fontSize: 14, lineHeight: 22, textAlign: 'center', color: Colors.textSecondary },
  button: { marginTop: Spacing.xl, padding: Spacing.lg, borderRadius: Radius.button, backgroundColor: Colors.primary },
  buttonText: { color: Colors.white, fontWeight: '700' },
});
