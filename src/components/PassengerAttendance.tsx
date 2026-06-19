import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

interface PassengerAttendanceProps {
  passengerId: string;
}

export const PassengerAttendance: React.FC<PassengerAttendanceProps> = ({ passengerId }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Attendance Dashboard</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Morning Shift</Text>
          {/* Toggle buttons will go here */}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evening Shift</Text>
          {/* Toggle buttons will go here */}
        </View>

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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
});
