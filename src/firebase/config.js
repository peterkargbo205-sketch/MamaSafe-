import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Replace these placeholder values with your actual Firebase config from the Firebase console.
// Project: mamasafe-f68dd
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'mamasafe-f68dd.firebaseapp.com',
  projectId: 'mamasafe-f68dd',
  storageBucket: 'mamasafe-f68dd.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export default app;
