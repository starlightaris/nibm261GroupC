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
import { usePassengerCommunity } from '@hooks/usePassengerCommunity';
import { useJoinCommunity }      from '@hooks/useJoinCommunity';
import { useAttendance }         from '@hooks/useAttendance';
import { Colors, Radius, Spacing } from '@styles/tokens';
import JoinCommunityCard  from '@components/passenger/home/JoinCommunityCard';
import CommunityInfoCard  from '@components/passenger/home/CommunityInfoCard';
import AttendanceCard     from '@components/passenger/home/AttendanceCard';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PassengerTabParams, SettingsStackParams } from '@navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PassengerTabParams, 'PassengerHome'>,
  NativeStackScreenProps<SettingsStackParams>
>;

export default function PassengerHomeScreen({ navigation }: Props) {
  const {
    community,
    joined,
    hasLocations,
    loading: communityLoading,
    error:   communityError,
  } = usePassengerCommunity();

  const { joining, error: joinError, join } = useJoinCommunity();

  const {
    attendance,
    marking,
    error: attendanceError,
    mark,
  } = useAttendance(community?.communityId ?? null);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (communityLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const greeting = getGreeting();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.headerTitle}>
          {joined ? community?.member.name ?? 'Passenger' : 'Welcome'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── State A: not joined ─────────────────────────────────────────── */}
        {!joined && (
          <JoinCommunityCard
            joining={joining}
            error={joinError}
            onJoin={join}
          />
        )}

        {/* ── State B + C: joined ─────────────────────────────────────────── */}
        {joined && community && (
          <>
            <CommunityInfoCard
              community={community}
              hasLocations={hasLocations}
              onSetLocations={() => {
                navigation.navigate('PassengerSettings', {
                  screen: 'EditLocations',
                  params: { mode: 'Pickup' },
                });
              }}
            />

            {/* Only show attendance once locations are set */}
            {hasLocations && (
              <>
                <SectionGap label="Attendance" />
                {attendanceError && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>⚠️  {attendanceError}</Text>
                  </View>
                )}
                <AttendanceCard
                  attendance={attendance}
                  marking={marking}
                  onMark={mark}
                />
              </>
            )}
          </>
        )}

        {communityError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️  {communityError}</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function SectionGap({ label }: { label: string }) {
  return (
    <View style={gapStyles.wrap}>
      <Text style={gapStyles.label}>{label}</Text>
    </View>
  );
}

const gapStyles = StyleSheet.create({
  wrap:  { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.sm },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'android' ? Spacing.lg : Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting:    { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },

  scroll:        { flex: 1 },
  scrollContent: { paddingTop: Spacing.lg },

  errorBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  errorBannerText: { fontSize: 13, color: Colors.error, fontWeight: '500' },
});