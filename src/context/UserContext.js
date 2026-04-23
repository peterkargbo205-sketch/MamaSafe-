import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveUserToFirestore } from '../firebase/firestore';

export const UserContext = createContext(null);

const STORAGE_KEY = '@mamasafe_user';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setUser(JSON.parse(stored));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const registerUser = async (userData) => {
    const enriched = { ...userData, registeredAt: new Date().toISOString() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
    saveUserToFirestore(enriched).catch(console.error);
    setUser(enriched);
  };

  const updateUser = async (updates) => {
    const updated = { ...user, ...updates };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <UserContext.Provider value={{ user, registerUser, updateUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
