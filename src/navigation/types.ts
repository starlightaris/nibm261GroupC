import type { NavigatorScreenParams } from '@react-navigation/native';

export type Shift = 'morning' | 'evening';

export interface RouteStop {
  userId: string;
  name: string;
  initials: string;
  pickupLocation:  { latitude: number; longitude: number };
  dropoffLocation: { latitude: number; longitude: number };
  attendanceStatus: 'present' | 'absent' | 'unmarked';
}

// Stack param lists

export type AuthStackParams = {
  Login:               undefined;
  RoleSelect:          undefined;
  PassengerSignUp:     undefined;
  DriverSignUpDetails: undefined;
  DriverSignUpBus: {
    name:          string;
    email:         string;
    password:      string;
    phone:         string;

  };
  PassengerTabs: undefined;
  DriverTabs:    undefined;
};

export type DriverTabParams = {
  DriverHome:     undefined;
  DriverRoute:    undefined;
  Community:      undefined;
  DriverSettings: undefined;
};

export type PassengerTabParams = {
  PassengerHome:     undefined;
  Track:             undefined;
  // Typed as a nested navigator param list (not `undefined`) so screens
  // outside the Settings stack — e.g. passenger Home's "Set Locations"
  // prompt — can navigate straight into a specific settings screen:
  // navigation.navigate('PassengerSettings', { screen: 'EditLocations', params: { mode: 'Pickup' } })
  PassengerSettings: NavigatorScreenParams<SettingsStackParams>;
};

export type RootStackParams = {
  DriverTabs:    undefined;
  PassengerTabs: undefined;
  ActiveTrip: {
    stops:       RouteStop[];
    shift:       Shift;
    communityId: string;
  };
};

export type SettingsStackParams = {
  SettingsHome:            undefined;
  EditProfile:             undefined;
  EditLocations:           { mode: 'Pickup' | 'Drop-off' };
  VehicleDetails:          undefined;
  ShiftTimes:              undefined;
  NotificationPreferences: undefined;
  TripHistory:             undefined;
};

export type PassengerRootParams = {
  PassengerTabs: undefined;
};