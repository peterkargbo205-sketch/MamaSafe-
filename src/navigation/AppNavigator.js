import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { UserContext } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import DueDateCalculatorScreen from '../screens/DueDateCalculatorScreen';
import TipsScreen from '../screens/TipsScreen';
import KickCounterScreen from '../screens/KickCounterScreen';
import DangerSignsScreen from '../screens/DangerSignsScreen';
import AlertStatusScreen from '../screens/AlertStatusScreen';
import CHWLoginScreen from '../screens/CHWLoginScreen';
import CHWDashboardScreen from '../screens/CHWDashboardScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home:       { focused: 'home',     unfocused: 'home-outline' },
  Kicks:      { focused: 'heart',    unfocused: 'heart-outline' },
  Calculator: { focused: 'calendar', unfocused: 'calendar-outline' },
  Tips:       { focused: 'book',     unfocused: 'book-outline' },
  Profile:    { focused: 'person',   unfocused: 'person-outline' },
};

function MainTabs() {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.focused : icons.unfocused} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"       component={HomeScreen}            options={{ tabBarLabel: (p) => null, title: 'Home' }} />
      <Tab.Screen name="Kicks"      component={KickCounterScreen}     options={{ tabBarLabel: (p) => null }} />
      <Tab.Screen name="Calculator" component={DueDateCalculatorScreen} options={{ tabBarLabel: (p) => null }} />
      <Tab.Screen name="Tips"       component={TipsScreen}            options={{ tabBarLabel: (p) => null }} />
      <Tab.Screen name="Profile"    component={RegistrationScreen}    options={{ tabBarLabel: (p) => null }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading, chwData } = useContext(UserContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {chwData ? (
          // CHW flow
          <Stack.Screen name="CHWDashboard" component={CHWDashboardScreen} />
        ) : !user ? (
          // Onboarding
          <Stack.Screen name="Registration" component={RegistrationScreen} />
        ) : (
          // Main patient app
          <Stack.Screen name="Main" component={MainTabs} />
        )}

        {/* Accessible from all states */}
        <Stack.Screen name="DangerSigns"   component={DangerSignsScreen}   options={{ presentation: 'card' }} />
        <Stack.Screen name="AlertStatus"   component={AlertStatusScreen}   options={{ presentation: 'card' }} />
        <Stack.Screen name="CHWLogin"      component={CHWLoginScreen}      options={{ presentation: 'card' }} />
        <Stack.Screen name="CHWDashboard"  component={CHWDashboardScreen}  options={{ presentation: 'card' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
