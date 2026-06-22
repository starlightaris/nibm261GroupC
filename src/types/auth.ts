export type UserRole = 'passenger' | 'driver';

export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  createdAt: string;
}

export interface DriverProfile extends AuthUser {
  role: 'driver';
  licenseNumber: string;
  vehicleType: string;
  vehiclePlate: string;
}

export interface PassengerProfile extends AuthUser {
  role: 'passenger';
}