import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const UserContext = createContext(null);

const USER_KEY = '@mamasafe_user';

// Firebase sync is fire-and-forget — never blocks app startup.
const syncToFirebase = async (userData) => {
  try {
    const { isOnline } = await import('../services/networkService');
    if (!(await isOnline())) return;
    const { saveUserToFirestore } = await import('../firebase/firestore');
    await saveUserToFirestore(userData);
  } catch {
    // Firebase unavailable — that's fine, AsyncStorage is the source of truth.
  }
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chwData, setCHWModeState] = useState(null); // null = patient mode

  useEffect(() => {
    AsyncStorage.getItem(USER_KEY)
      .then((stored) => { if (stored) setUser(JSON.parse(stored)); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const registerUser = async (userData) => {
    const enriched = { ...userData, registeredAt: new Date().toISOString() };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(enriched));
    syncToFirebase(enriched);
    setUser(enriched);
  };

  const updateUser = async (updates) => {
    const updated = { ...user, ...updates };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    syncToFirebase(updated);
    setUser(updated);
  };

  // CHW mode: stores the CHW object; null = patient mode
  const setCHWMode = (chw) => setCHWModeState(chw);

  return (
    <UserContext.Provider value={{ user, registerUser, updateUser, isLoading, chwData, setCHWMode }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
