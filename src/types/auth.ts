export type UserRole = 'passenger' | 'driver';

export interface Location {
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  createdAt: string;
  pickupLocation?: Location;
  dropoffLocation?: Location;
}

export interface DriverProfile extends AuthUser {
  role: 'driver';
  vehicleType: string;
  vehiclePlate: string;
}

export interface PassengerProfile extends AuthUser {
  role: 'passenger';
}