import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './config';

const toUserId = (phone) => phone.replace(/\D/g, '');

export const saveUserToFirestore = async (userData) => {
  try {
    const userId = toUserId(userData.phone);
    await setDoc(doc(db, 'users', userId), {
      name: userData.name,
      phone: userData.phone,
      lastPeriodDate: userData.lastPeriodDate,
      emergencyContact: userData.emergencyContact,
      country: 'Sierra Leone',
      createdAt: userData.registeredAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Firestore save error:', error);
    return false;
  }
};

export const getUserFromFirestore = async (phone) => {
  try {
    const userId = toUserId(phone);
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error('Firestore get error:', error);
    return null;
  }
};
