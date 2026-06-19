import React, { useState, useEffect } from 'react';
import { PassengerAttendance as AttendanceData, ShiftType, AttendanceStatus } from '../types/attendance';
import './PassengerAttendance.css';

interface PassengerAttendanceProps {
  passengerId: string;
}

export const PassengerAttendance: React.FC<PassengerAttendanceProps> = ({ passengerId }) => {
  const [morningStatus, setMorningStatus] = useState<AttendanceStatus>('pending');
  const [eveningStatus, setEveningStatus] = useState<AttendanceStatus>('pending');

  const handleToggle = (shift: ShiftType, status: AttendanceStatus) => {
    if (shift === 'morning') setMorningStatus(status);
    if (shift === 'evening') setEveningStatus(status);
  };

  return (
    <div className="attendance-dashboard">
      <h2>Passenger Attendance Dashboard</h2>
      
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
    </div>
  );
};
