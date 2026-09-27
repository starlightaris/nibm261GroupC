
export interface NotificationPrefs {
  attendanceReminder: boolean; 
  tripStarted: boolean;        
  driverApproaching: boolean;  
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  attendanceReminder: true,
  tripStarted: true,
  driverApproaching: true,
};


export type NotificationDataType =
  | { type: 'TRIP_STARTED'; communityId: string }
  | { type: 'DRIVER_APPROACHING' }
  | { type: 'ATTENDANCE_REMINDER' };