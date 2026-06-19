import React, { useState, useEffect } from 'react';
import { PassengerAttendance as AttendanceData, ShiftType, AttendanceStatus } from '../types/attendance';
import { fetchAttendance, updateAttendance } from '../services/attendanceService';
import './PassengerAttendance.css';

interface PassengerAttendanceProps {
  passengerId: string;
}

export const PassengerAttendance: React.FC<PassengerAttendanceProps> = ({ passengerId }) => {
  const [morningStatus, setMorningStatus] = useState<AttendanceStatus>('pending');
  const [eveningStatus, setEveningStatus] = useState<AttendanceStatus>('pending');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadAttendance = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAttendance(passengerId, todayDate);
        setMorningStatus(data.morningShift);
        setEveningStatus(data.eveningShift);
      } catch (err) {
        console.error("Failed to load attendance", err);
        setError("Failed to load attendance data. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };
    loadAttendance();
  }, [passengerId, todayDate]);

  const handleToggle = async (shift: ShiftType, status: AttendanceStatus) => {
    // Store previous states for rollback
    const prevMorning = morningStatus;
    const prevEvening = eveningStatus;
    setError(null);

    try {
      if (shift === 'morning') setMorningStatus(status);
      if (shift === 'evening') setEveningStatus(status);
      await updateAttendance(passengerId, todayDate, shift, status);
    } catch (err) {
      console.error("Failed to update attendance", err);
      // Rollback optimistic update
      setMorningStatus(prevMorning);
      setEveningStatus(prevEvening);
      setError("Failed to update status. Reverted to previous state.");
    }
  };

  return (
    <div className="attendance-dashboard">
      <h2>Passenger Attendance Dashboard</h2>
      
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {isLoading ? (
        <>
          <div className="shift-card skeleton">
            <div className="skeleton-title"></div>
            <div className="skeleton-button-group"></div>
          </div>
          <div className="shift-card skeleton">
            <div className="skeleton-title"></div>
            <div className="skeleton-button-group"></div>
          </div>
        </>
      ) : (
        <>
          <div className="shift-card">
            <h3>Morning Shift</h3>
            <div className="button-group">
              <button 
                className={`toggle-btn ${morningStatus === 'present' ? 'active-present' : ''}`}
                onClick={() => handleToggle('morning', 'present')}
              >
                Present
              </button>
              <button 
                className={`toggle-btn ${morningStatus === 'absent' ? 'active-absent' : ''}`}
                onClick={() => handleToggle('morning', 'absent')}
              >
                Absent
              </button>
            </div>
          </div>

          <div className="shift-card">
            <h3>Evening Shift</h3>
            <div className="button-group">
              <button 
                className={`toggle-btn ${eveningStatus === 'present' ? 'active-present' : ''}`}
                onClick={() => handleToggle('evening', 'present')}
              >
                Present
              </button>
              <button 
                className={`toggle-btn ${eveningStatus === 'absent' ? 'active-absent' : ''}`}
                onClick={() => handleToggle('evening', 'absent')}
              >
                Absent
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
