import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

let passengerHomePending = false;

export function openPassengerHome(): void {
  const rootState = navigationRef.isReady() ? navigationRef.getRootState() : null;
  const passengerNavigatorReady = rootState?.routeNames.includes('PassengerTabs');

  if (!passengerNavigatorReady) {
    passengerHomePending = true;
    return;
  }

  passengerHomePending = false;
  navigationRef.navigate('PassengerTabs', { screen: 'PassengerHome' });
}

export function flushPendingNavigation(): void {
  if (passengerHomePending) openPassengerHome();
}
