import * as Location from 'expo-location';
import { HOSPITALS } from '../data/hospitals';

const toRad = (deg) => (deg * Math.PI) / 180;

export const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// GPS uses satellite — works fully offline (no data needed).
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
    });

    return {
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
    };
  } catch (err) {
    console.error('GPS error:', err);
    return null;
  }
};

// Runs entirely from local database — no internet required.
export const findNearestHospitals = (userLat, userLng, limit = 3, emergencyOnly = true) => {
  const pool = emergencyOnly ? HOSPITALS.filter((h) => h.emergency) : HOSPITALS;
  return pool
    .map((h) => ({ ...h, distance: haversineKm(userLat, userLng, h.lat, h.lng) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};

export const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};
