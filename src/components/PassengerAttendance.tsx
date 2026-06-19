import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ShiftType, AttendanceStatus } from '../types/attendance';
import { fetchPassengerAttendance, updateShiftStatus } from '../services/attendanceService';

interface PassengerAttendanceProps {
  passengerId: string;
}

/**
 * PassengerAttendance Component
 * 
 * Renders a mobile-first UI for passengers to mark their attendance
 * (present/absent) for morning and evening shifts. It syncs with Firestore
 * in real-time and provides optimistic updates.
 */
export const PassengerAttendance: React.FC<PassengerAttendanceProps> = ({ passengerId }) => {
  const [morningStatus, setMorningStatus] = useState<AttendanceStatus>('pending');
  const [eveningStatus, setEveningStatus] = useState<AttendanceStatus>('pending');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPassengerAttendance(passengerId, today);
        setMorningStatus(data.morningShift);
        setEveningStatus(data.eveningShift);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [passengerId, today]);

  const handleToggle = async (shift: ShiftType, status: AttendanceStatus) => {
    // Optimistic update
    if (shift === 'morning') setMorningStatus(status);
    if (shift === 'evening') setEveningStatus(status);
    
    // Firestore update
    await updateShiftStatus(passengerId, today, shift, status);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Attendance Dashboard</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#12A14B" />
            <Text style={styles.loadingText}>Loading attendance data...</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Morning Shift</Text>
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
          <Text style={styles.cardTitle}>Evening Shift</Text>
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
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748b',
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
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
