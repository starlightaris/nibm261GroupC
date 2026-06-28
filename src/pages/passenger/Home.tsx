import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ShiftType, AttendanceStatus } from '../../types/attendance';
import { fetchAttendance, updateAttendance } from '../../services/attendanceService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@config/firebaseConfig';

const MORNING_CUTOFF = '7:30 AM';
const EVENING_CUTOFF = '5:30 PM';

/**
 * Attendance Component
 * 
 * Provides a mobile-first UI for passengers to mark their attendance (present/absent)
 * for morning and evening shifts. Connects to the attendanceService for data persistence.
 */
export default function PassengerHome() {
  const [passengerId, setPassengerId] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const [morningStatus, setMorningStatus] = useState<AttendanceStatus>('unmarked');
  const [eveningStatus, setEveningStatus] = useState<AttendanceStatus>('unmarked');
  const [morningUpdatedAt, setMorningUpdatedAt] = useState<string | null>(null);
  const [eveningUpdatedAt, setEveningUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const formatDateTime = (isoString: string | null | undefined): string => {
    if (!isoString) return 'Not marked yet';
    const d = new Date(isoString);
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.uid) {
        setPassengerId(user.uid);
      } else {
        setPassengerId(null);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!passengerId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAttendance(passengerId, today);
        setMorningStatus(data.morningShift);
        setEveningStatus(data.eveningShift);
        setMorningUpdatedAt(data.morningMarkedAt);
        setEveningUpdatedAt(data.eveningMarkedAt);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [passengerId, today]);

  const handleToggle = async (shift: ShiftType, status: AttendanceStatus) => {
    if (!passengerId) {
      Alert.alert('Error', 'You must be logged in to mark attendance.');
      return;
    }
    try {
      setIsLoading(true);
      await updateAttendance(passengerId, today, shift, status);
      const nowStr = new Date().toISOString();
      if (shift === 'morning') {
        setMorningStatus(status);
        setMorningUpdatedAt(nowStr);
      }
      if (shift === 'evening') {
        setEveningStatus(status);
        setEveningUpdatedAt(nowStr);
      }
      Alert.alert('Success', 'Attendance saved successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save attendance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Attendance Dashboard</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#12A14B" />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Morning Shift</Text>
                <Text style={styles.cutoffText}>Cutoff: {MORNING_CUTOFF}</Text>
              </View>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Status: <Text style={styles.statusValue}>{morningStatus.charAt(0).toUpperCase() + morningStatus.slice(1)}</Text></Text>
                <Text style={styles.updatedText}>Last updated: {formatDateTime(morningUpdatedAt)}</Text>
              </View>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.button, morningStatus === 'present' && styles.buttonActivePresent]}
              onPress={() => handleToggle('morning', 'present')}
            >
              <Text style={[styles.buttonText, morningStatus === 'present' && styles.buttonTextActive]}>Present</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, morningStatus === 'absent' && styles.buttonActiveAbsent]}
              onPress={() => handleToggle('morning', 'absent')}
            >
              <Text style={[styles.buttonText, morningStatus === 'absent' && styles.buttonTextActive]}>Absent</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Evening Shift</Text>
            <Text style={styles.cutoffText}>Cutoff: {EVENING_CUTOFF}</Text>
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Status: <Text style={styles.statusValue}>{eveningStatus.charAt(0).toUpperCase() + eveningStatus.slice(1)}</Text></Text>
            <Text style={styles.updatedText}>Last updated: {formatDateTime(eveningUpdatedAt)}</Text>
          </View>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.button, eveningStatus === 'present' && styles.buttonActivePresent]}
              onPress={() => handleToggle('evening', 'present')}
            >
              <Text style={[styles.buttonText, eveningStatus === 'present' && styles.buttonTextActive]}>Present</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, eveningStatus === 'absent' && styles.buttonActiveAbsent]}
              onPress={() => handleToggle('evening', 'absent')}
            >
              <Text style={[styles.buttonText, eveningStatus === 'absent' && styles.buttonTextActive]}>Absent</Text>
            </TouchableOpacity>
          </View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cutoffText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  statusInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 4,
  },
  statusValue: {
    fontWeight: '600',
    color: '#1e293b',
  },
  updatedText: {
    fontSize: 13,
    color: '#64748b',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActivePresent: {
    backgroundColor: '#12A14B',
    borderColor: '#12A14B',
  },
  buttonActiveAbsent: {
    backgroundColor: '#64748b',
    borderColor: '#64748b',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748b',
  },
  buttonTextActive: {
    color: '#ffffff',
  },
});
