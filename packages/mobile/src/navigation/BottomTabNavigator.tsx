import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HubScreen from '../screens/HubScreen';
import TicketsScreen from '../screens/TicketsScreen';
import TapScreen from '../screens/TapScreen';
import FamilyScreen from '../screens/FamilyScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#dfba7d', // fm-gold
        tabBarInactiveTintColor: '#ffffff80',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#ffffff20',
        },
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#ffffff',
      }}
    >
      <Tab.Screen
        name="Hub"
        component={HubScreen}
        options={{
          tabBarLabel: 'Hub',
        }}
      />
      <Tab.Screen
        name="Tickets"
        component={TicketsScreen}
        options={{
          tabBarLabel: 'Tickets',
        }}
      />
      <Tab.Screen
        name="Tap"
        component={TapScreen}
        options={{
          tabBarLabel: 'Tap',
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyScreen}
        options={{
          tabBarLabel: 'Family',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
