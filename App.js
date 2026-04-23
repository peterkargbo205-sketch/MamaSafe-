import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from './src/context/UserContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { AlertProvider } from './src/context/AlertContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <UserProvider>
          <AlertProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </AlertProvider>
        </UserProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
