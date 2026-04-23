import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline } from './networkService';

const ACTIVE_KEY = '@mamasafe_active_alert';
const HISTORY_KEY = '@mamasafe_alerts';

const uid = () => `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ── Firebase sync (optional — only when online) ───────────────────────────────
let _db = null;
const getDB = async () => {
  if (_db) return _db;
  try {
    const { db } = await import('../firebase/config');
    _db = db;
    return db;
  } catch {
    return null;
  }
};

const syncToFirebase = async (alert) => {
  if (!(await isOnline())) return;
  try {
    const db = await getDB();
    if (!db) return;
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'alerts', alert.id), alert);
  } catch (e) {
    console.warn('Firebase alert sync skipped:', e.message);
  }
};

// ── Core alert operations (all AsyncStorage-first) ────────────────────────────
export const createAlert = async ({ user, location, symptoms, nearestHospitals, priority }) => {
  const alert = {
    id: uid(),
    userId: user.phone?.replace(/\D/g, '') || 'unknown',
    userName: user.name,
    userPhone: user.phone,
    location: location || null,
    symptoms: symptoms || [],
    nearestHospitals: nearestHospitals || [],
    priority: priority || 'normal',
    status: 'Pending',
    smsSent: false,
    acceptedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(alert));

  // Prepend to history (cap at 50)
  const history = await getAlertHistory();
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([alert, ...history].slice(0, 50)));

  syncToFirebase(alert).catch(() => {});
  return alert;
};

export const updateAlertStatus = async (alertId, status, acceptedBy = null) => {
  const active = await getActiveAlert();
  if (!active || active.id !== alertId) return null;

  const updated = {
    ...active,
    status,
    acceptedBy: acceptedBy || active.acceptedBy,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(updated));

  // Also update in history
  const history = await getAlertHistory();
  const newHistory = history.map((a) => (a.id === alertId ? updated : a));
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));

  syncToFirebase(updated).catch(() => {});
  return updated;
};

export const markAlertSMSSent = async (alertId) => {
  const active = await getActiveAlert();
  if (!active || active.id !== alertId) return;
  const updated = { ...active, smsSent: true, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(updated));
};

export const cancelAlert = (alertId) => updateAlertStatus(alertId, 'Cancelled');

export const clearActiveAlert = () => AsyncStorage.removeItem(ACTIVE_KEY);

export const getActiveAlert = async () => {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const alert = JSON.parse(raw);
    // Treat cancelled / arrived as no active alert
    if (alert.status === 'Cancelled' || alert.status === 'Arrived') return null;
    return alert;
  } catch {
    return null;
  }
};

export const getAlertHistory = async () => {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// Poll Firebase for status updates (only when online)
export const refreshAlertFromFirebase = async (alertId) => {
  if (!(await isOnline())) return null;
  try {
    const db = await getDB();
    if (!db) return null;
    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(db, 'alerts', alertId));
    if (!snap.exists()) return null;
    const remote = snap.data();
    // Trust remote if it has a newer updatedAt
    const local = await getActiveAlert();
    if (local && local.id === alertId && remote.updatedAt > local.updatedAt) {
      await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(remote));
      return remote;
    }
    return null;
  } catch {
    return null;
  }
};
