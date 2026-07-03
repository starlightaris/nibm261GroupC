import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useCommunity } from '@hooks/useCommunity';
import { Colors, Radius, Spacing } from '@styles/tokens';
import InviteCard from '@components/driver/community/InviteCard';
import MemberRow from '@components/driver/community/MemberRow';

export default function CommunityScreen() {
  const { community, hasMembers, loading, error, removeMember, removing } =
    useCommunity();

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading community…</Text>
      </SafeAreaView>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !community) {
    return (
      <SafeAreaView style={styles.centered}>
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Couldn't load community</Text>
          <Text style={styles.errorBody}>{error ?? 'Unknown error'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

      {/* Header */}
            <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Invite card — always visible */}
        <InviteCard
          inviteCode={community.inviteCode}
          vehicleName={community.vehicleName}
          plateNumber={community.plateNumber}
          memberCount={community.members.length}
        />

        {/* Member list */}
        <View style={styles.listCard}>
          <Text style={styles.sectionLabel}>Members</Text>

          {!hasMembers ? (
            // Clean empty state — no misleading "complete vehicle profile" copy
            <View style={styles.emptyMembers}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No passengers yet</Text>
              <Text style={styles.emptyBody}>
                Share your invite code or QR above and passengers will appear here once they join.
              </Text>
            </View>
          ) : (
            community.members.map((member, i) => (
              <MemberRow
                key={member.userId}
                member={member}
                index={i}
                isRemoving={removing === member.userId}
                onRemove={() => removeMember(member.userId)}
              />
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: Colors.bg },
  centered: {
    flex: 1, backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },

  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'android' ? Spacing.lg : Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },

  scroll:        { flex: 1 },
  scrollContent: { paddingTop: Spacing.lg, paddingBottom: 16 },

  listCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm,
  },

  // Empty members state
  emptyMembers: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: Spacing.lg },
  emptyIcon:    { fontSize: 36, marginBottom: Spacing.md },
  emptyTitle:   { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyBody:    { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Error
  errorCard:  {
    backgroundColor: '#FEF2F2', borderRadius: Radius.card,
    padding: Spacing.xxl, alignItems: 'center', margin: Spacing.lg,
  },
  errorIcon:  { fontSize: 32, marginBottom: Spacing.sm },
  errorTitle: { fontSize: 16, fontWeight: '700', color: Colors.error, marginBottom: 4 },
  errorBody:  { fontSize: 13, color: Colors.error, textAlign: 'center', lineHeight: 20 },
});