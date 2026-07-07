import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';

interface Props {
  joining: boolean;
  error: string | null;
  onJoin: (code: string) => void;
}

export default function JoinCommunityCard({ joining, error, onJoin }: Props) {
  const [code, setCode] = useState('');

  return (
    <View style={styles.card}>
      <Text style={styles.icon}>🚌</Text>
      <Text style={styles.title}>Join your community</Text>
      <Text style={styles.body}>
        Ask your driver for an invite code or scan their QR to get started.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter invite code"
        placeholderTextColor={Colors.muted}
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.btn, (!code.trim() || joining) && styles.btnDisabled]}
        onPress={() => onJoin(code)}
        disabled={!code.trim() || joining}
        activeOpacity={0.85}
      >
        {joining
          ? <ActivityIndicator size="small" color={Colors.white} />
          : <Text style={styles.btnText}>Join Community</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.xxl,
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  icon:  { fontSize: 44, marginBottom: Spacing.md },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  body:  { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: Spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  error: { fontSize: 12, color: Colors.error, marginBottom: Spacing.md, textAlign: 'center' },
  btn:         { width: '100%', backgroundColor: Colors.primary, borderRadius: Radius.button, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.sm },
  btnDisabled: { opacity: 0.45 },
  btnText:     { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
