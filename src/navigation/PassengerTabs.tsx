import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import PassengerHome     from '@pages/passenger/Home';
import Track             from '@pages/passenger/Track';
import PassengerSettings from '@navigation/PassengerSettingsStack';

import type { PassengerTabParams } from '@navigation/types';

const Tab = createBottomTabNavigator<PassengerTabParams>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: {
  name:        keyof PassengerTabParams;
  label:       string;
  icon:        IconName;
  iconFocused: IconName;
  component:   React.ComponentType<any>;
}[] = [
  { name: 'PassengerHome',     label: 'Home',     icon: 'home-outline',     iconFocused: 'home',     component: PassengerHome },
  { name: 'Track',             label: 'Track',    icon: 'location-outline', iconFocused: 'location', component: Track },
  { name: 'PassengerSettings', label: 'Settings', icon: 'settings-outline', iconFocused: 'settings', component: PassengerSettings },
];

export default function PassengerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TABS.find(t => t.name === route.name)!;
        return {
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tab.iconFocused : tab.icon}
              size={size}
              color={color}
            />
          ),
          tabBarActiveTintColor:   '#1D4ED8',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarLabelStyle:        styles.label,
          tabBarStyle:             styles.bar,
        };
      }}
    >
      {TABS.map(t => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{ tabBarLabel: t.label }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#FFFFFF',
    borderTopColor:  '#F1F5F9',
    borderTopWidth:  1,
    paddingTop:      6,
    height:          Platform.OS === 'ios' ? 84 : 84,
  },
  label: {
    fontSize:     11,
    fontWeight:   '500',
    marginBottom: Platform.OS === 'ios' ? 0 : 6,
  },
});