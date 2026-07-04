export interface PassengerPreview {
  id: string;
  name: string;
  photoUrl?: string;
  pickupLat: number;
  pickupLng: number;
  status: 'waiting' | 'picked_up' | 'cancelled';
}