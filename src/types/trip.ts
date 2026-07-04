export interface PassengerPreview {
  id: string;           
  name: string;
  initials: string;     
  photoUrl?: string;
  pickupLocation: {     
    latitude: number;
    longitude: number;
  };
  attendanceStatus: 'present' | 'absent' | 'unmarked';
}