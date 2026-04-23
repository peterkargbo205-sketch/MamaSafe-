import * as SMS from 'expo-sms';

const AT_URL = 'https://api.sandbox.africastalking.com/version1/messaging';
const AT_API_KEY = 'atsk_4df9bad7d2d19675301f5da9bbe4d367a1592df231487b3d26fd1683d08440bfc85b969d';
const AT_USERNAME = 'sandbox';

// Primary channel: Africa's Talking API (requires data connection).
// Fallback: expo-sms native SMS (requires GSM signal only — works fully offline).
export const sendSMS = async (to, message) => {
  const recipients = Array.isArray(to) ? to : [to];

  // Try Africa's Talking first
  try {
    const body = new URLSearchParams({
      username: AT_USERNAME,
      to: recipients.join(','),
      message,
    }).toString();

    const res = await fetch(AT_URL, {
      method: 'POST',
      headers: {
        apiKey: AT_API_KEY,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (res.ok) {
      const data = await res.json();
      const allFailed = data?.SMSMessageData?.Recipients?.every(
        (r) => r.status !== 'Success'
      );
      if (!allFailed) return { success: true, method: 'africastalking', data };
    }
  } catch {
    // AT failed — fall through to native SMS
  }

  // Fallback: native device SMS (GSM signal only, no data needed)
  try {
    const available = await SMS.isAvailableAsync();
    if (available) {
      await SMS.sendSMSAsync(recipients, message);
      return { success: true, method: 'native' };
    }
  } catch (err) {
    console.error('Native SMS error:', err);
  }

  return { success: false, error: 'All SMS channels failed' };
};

export const buildSOSMessage = (user, location, symptoms, hospital, lang = 'en') => {
  const loc = location
    ? `GPS ${location.lat.toFixed(4)},${location.lng.toFixed(4)}`
    : 'location unavailable';

  const sym = symptoms.length ? `Symptoms: ${symptoms.join(', ')}. ` : '';
  const hosp = hospital ? `Nearest: ${hospital.name} (${hospital.distance?.toFixed(1)}km). ` : '';

  if (lang === 'krio') {
    return `MAMASAFE EMAJENCY: ${user.name} nid ELEP NAU! ${loc}. ${sym}${hosp}Kol 999 ɔ go ospital kwik kwik! -MamaSafe SL`;
  }
  return `MAMASAFE EMERGENCY: ${user.name} needs URGENT help! ${loc}. ${sym}${hosp}Call 999 or go to hospital immediately! -MamaSafe SL`;
};

export const buildHospitalSMS = (user, location, symptoms, priority) => {
  const flag = priority === 'high' ? '🚨 HIGH PRIORITY' : '⚠️ URGENT';
  const loc = location
    ? `Lat:${location.lat.toFixed(5)} Lng:${location.lng.toFixed(5)}`
    : 'unavailable';
  const sym = symptoms.length ? symptoms.join(', ') : 'none specified';

  return `${flag} MAMASAFE ALERT\nPatient: ${user.name}\nPhone: ${user.phone}\nGPS: ${loc}\nSymptoms: ${sym}\nPlease respond immediately.\n-MamaSafe SL`;
};
