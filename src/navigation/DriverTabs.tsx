import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DriverHome        from '@pages/driver/Home';
import DriverRoute       from '@pages/driver/Route';
import Community         from '@pages/driver/Community';
import DriverSettings    from '@navigation/DriverSettingsStack';

import type { DriverTabParams } from '@navigation/types';

const Tab = createBottomTabNavigator<DriverTabParams>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: {
  name:       keyof DriverTabParams;
  label:      string;
  icon:       IconName;
  iconFocused: IconName;
  component:  React.ComponentType<any>;
}[] = [
  { name: 'DriverHome',     label: 'Home',      icon: 'home-outline',     iconFocused: 'home',     component: DriverHome },
  { name: 'DriverRoute',    label: 'Route',     icon: 'map-outline',      iconFocused: 'map',      component: DriverRoute },
  { name: 'Community',      label: 'Community', icon: 'people-outline',   iconFocused: 'people',   component: Community },
  { name: 'DriverSettings', label: 'Settings',  icon: 'settings-outline', iconFocused: 'settings', component: DriverSettings },
];

export default function DriverTabs() {
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
    height:          Platform.OS === 'ios' ? 84 : 64,
  },
  label: {
    fontSize:     11,
    fontWeight:   '500',
    marginBottom: Platform.OS === 'ios' ? 0 : 6,
  },
});