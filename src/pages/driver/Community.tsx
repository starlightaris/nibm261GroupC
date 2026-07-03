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
  RefreshControl,
} from 'react-native';
import { useCommunity } from '@hooks/useCommunity';
import { Colors, Radius, Spacing } from '@styles/tokens';
import InviteCard from '@components/driver/community/InviteCard';
import MemberRow from '@components/driver/community/MemberRow';
import EmptyCommunity from '@components/driver/community/EmptyCommunity';

export default function CommunityScreen() {
  const { community, loading, error, removeMember, removing } = useCommunity();

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading community…</Text>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Couldn't load community</Text>
          <Text style={styles.errorBody}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        {community && (
          <Text style={styles.headerSub}>
            {community.members.length} member{community.members.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── No community ────────────────────────────────────────────────── */}
        {!community ? (
          <EmptyCommunity />
        ) : (
          <>
            {/* ── Invite card ───────────────────────────────────────────── */}
            <InviteCard
              inviteCode={community.inviteCode}
              vehicleName={community.vehicleName}
              plateNumber={community.plateNumber}
              memberCount={community.members.length}
              capacity={community.capacity}
            />

            {/* ── Member list ───────────────────────────────────────────── */}
            <View style={styles.listCard}>
              <Text style={styles.sectionLabel}>Members</Text>

              {community.members.length === 0 ? (
                <View style={styles.noMembers}>
                  <Text style={styles.noMembersText}>
                    No passengers yet. Share your invite code to get started.
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
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bg },
  centered: {
    flex: 1, backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },

  // Header
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
  headerSub:   { fontSize: 13, color: Colors.textSecondary },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingTop: Spacing.lg, paddingBottom: 16 },

  // Member list card
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
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  noMembers: { paddingVertical: Spacing.xl, alignItems: 'center' },
  noMembersText: { fontSize: 13, color: Colors.muted, textAlign: 'center' },

  // Error
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.card,
    padding: Spacing.xxl,
    alignItems: 'center',
    margin: Spacing.lg,
  },
  errorIcon:  { fontSize: 32, marginBottom: Spacing.sm },
  errorTitle: { fontSize: 16, fontWeight: '700', color: Colors.error, marginBottom: 4 },
  errorBody:  { fontSize: 13, color: Colors.error, textAlign: 'center', lineHeight: 20 },
});