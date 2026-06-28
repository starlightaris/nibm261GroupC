import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@config/firebaseConfig';
import { ShiftType, AttendanceStatus } from '../../types/attendance';

interface AttendanceRecord {
  userId: string;
  communityId: string;
  date: string;
  shift: ShiftType;
  status: AttendanceStatus;
  markedAt: string | null;
}

export default function DriverHomeScreen() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [passengerNames, setPassengerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const q = query(collection(db, 'attendance'), where('date', '==', today));
        const snapshot = await getDocs(q);
        
        const fetchedRecords = snapshot.docs.map(d => d.data() as AttendanceRecord);
        setRecords(fetchedRecords);

        // Fetch passenger names
        const names: Record<string, string> = {};
        const uniqueIds = Array.from(new Set(fetchedRecords.map(r => r.userId)));
        
        await Promise.all(uniqueIds.map(async (id) => {
          // Check users collection
          const uDoc = await getDoc(doc(db, 'users', id));
          if (uDoc.exists() && uDoc.data().name) {
            names[id] = uDoc.data().name;
            return;
          }
          
          // Fallback to passengers collection
          const pDoc = await getDoc(doc(db, 'passengers', id));
          if (pDoc.exists() && pDoc.data().name) {
             names[id] = pDoc.data().name;
             return;
          }
          
          names[id] = id; // Ultimate fallback
        }));
        
        setPassengerNames(names);
      } catch (error) {
        console.error("Error fetching attendance summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const morningRecords = records.filter(r => r.shift === 'morning');
  const eveningRecords = records.filter(r => r.shift === 'evening');

  const renderShiftSummary = (title: string, shiftRecords: AttendanceRecord[]) => {
    const presentCount = shiftRecords.filter(r => r.status === 'present').length;
    const absentCount = shiftRecords.filter(r => r.status === 'absent').length;
    const unmarkedCount = shiftRecords.filter(r => r.status === 'unmarked').length;

    const presentList = shiftRecords.filter(r => r.status === 'present');
    const absentList = shiftRecords.filter(r => r.status === 'absent');

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{presentCount}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{absentCount}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          {unmarkedCount > 0 && (
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{unmarkedCount}</Text>
              <Text style={styles.statLabel}>Unmarked</Text>
            </View>
          )}
        </View>

        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Present ({presentCount})</Text>
          {presentList.length > 0 ? (
            presentList.map((r, i) => (
              <Text key={`p_${i}`} style={styles.listItem}>• {passengerNames[r.userId] || r.userId}</Text>
            ))
          ) : (
            <Text style={styles.listEmptyText}>No passengers marked present.</Text>
          )}
        </View>

        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Absent ({absentCount})</Text>
          {absentList.length > 0 ? (
            absentList.map((r, i) => (
              <Text key={`a_${i}`} style={styles.listItem}>• {passengerNames[r.userId] || r.userId}</Text>
            ))
          ) : (
            <Text style={styles.listEmptyText}>No passengers marked absent.</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
        
        <Text style={styles.devNote}>
          Note: Community filtering pending. Showing all today's attendance records.
        </Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#1D4ED8" />
            <Text style={styles.loadingText}>Loading attendance summary...</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyText}>No attendance marked for today yet.</Text>
          </View>
        ) : (
          <>
            {renderShiftSummary("Morning Shift", morningRecords)}
            {renderShiftSummary("Evening Shift", eveningRecords)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  devNote: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  listSection: {
    marginTop: 16,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
    paddingLeft: 4,
  },
  listEmptyText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingLeft: 4,
  },
});