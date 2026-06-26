export type AuthStackParams = {
  Login: undefined;
  RoleSelect: undefined;
  PassengerSignUp: undefined;
  DriverSignUpDetails: undefined;
  DriverSignUpBus: {
    name: string;
    email: string;
    password: string;
    phone: string;
    licenseNumber: string;
  };
  PassengerTabs: undefined;
  DriverTabs: undefined;
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
  PassengerSettings: undefined;
};

export type RootStackParams = {
  DriverTabs:    undefined;
  PassengerTabs: undefined;
  ActiveTrip:    undefined;
};

export type SettingsStackParams = {
  SettingsHome:              undefined;
  EditProfile:               undefined;
  EditLocations:             undefined;
  VehicleDetails:            undefined;
  ShiftTimes:                undefined;
  NotificationPreferences:   undefined;
  TripHistory:               undefined;
};