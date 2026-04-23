import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { UserContext } from '../context/UserContext';
import { AlertContext } from '../context/AlertContext';
import { getCurrentLocation, findNearestHospitals, formatDistance } from '../services/locationService';
import { createAlert, markAlertSMSSent } from '../services/alertService';
import { sendSMS, buildSOSMessage, buildHospitalSMS } from '../services/smsService';

const SYMPTOMS = [
  { key: 'heavyBleeding',       icon: 'water',          highPriority: true },
  { key: 'severeHeadache',      icon: 'flash',          highPriority: false },
  { key: 'blurredVision',       icon: 'eye',            highPriority: false },
  { key: 'noBabyMovement',      icon: 'heart-dislike',  highPriority: true },
  { key: 'highFever',           icon: 'thermometer',    highPriority: false },
  { key: 'severeAbdominalPain', icon: 'bandage',        highPriority: true },
  { key: 'difficultyBreathing', icon: 'fitness',        highPriority: true },
  { key: 'swollenFaceHands',    icon: 'hand-left',      highPriority: false },
  { key: 'watersBroken',        icon: 'rainy',          highPriority: false },
];

export default function DangerSignsScreen({ navigation }) {
  const { t, lang } = useLanguage();
  const { user } = useContext(UserContext);
  const { setActiveAlert } = useContext(AlertContext);
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState('select'); // select | locating

  const toggle = (key) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const isHighPriority = selected.some((k) => SYMPTOMS.find((s) => s.key === k)?.highPriority);

  const doSendAlert = async (symptoms) => {
    if (!user) {
      Alert.alert(t('error'), 'Please register first.');
      return;
    }
    setSending(true);
    setStep('locating');
    try {
      const location = await getCurrentLocation();
      const hospitals = location ? findNearestHospitals(location.lat, location.lng, 3) : [];
      const priority = symptoms.length > 0 && isHighPriority ? 'high' : 'normal';
      const symptomLabels = symptoms.map((k) => t(k));

      const alert = await createAlert({ user, location, symptoms: symptomLabels, nearestHospitals: hospitals, priority });
      setActiveAlert(alert);

      // SMS emergency contact
      const emergencyPhone = user.emergencyContact?.phone;
      const sosMsg = buildSOSMessage(user, location, symptomLabels, hospitals[0], lang);
      if (emergencyPhone) {
        sendSMS(emergencyPhone, sosMsg)
          .then((r) => { if (r.success) markAlertSMSSent(alert.id); })
          .catch(() => {});
      }

      // SMS nearest hospital
      if (hospitals[0]?.phone) {
        const hospMsg = buildHospitalSMS(user, location, symptomLabels, priority);
        sendSMS(hospitals[0].phone, hospMsg).catch(() => {});
      }

      navigation.replace('AlertStatus');
    } catch (err) {
      Alert.alert(t('error'), t('smsFailed'));
      setSending(false);
      setStep('select');
    }
  };

  if (sending) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loadingText}>{t('gettingLocation')}</Text>
          <Text style={styles.loadingSubText}>{t('sendingAlert')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('dangerSigns')}</Text>
          <Text style={styles.headerSub}>{t('selectSymptoms')}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {SYMPTOMS.map(({ key, icon, highPriority }) => {
          const active = selected.includes(key);
          return (
            <TouchableOpacity
              key={key}
              style={[styles.symptomRow, active && (highPriority ? styles.symptomActiveHigh : styles.symptomActiveNormal)]}
              onPress={() => toggle(key)}
              activeOpacity={0.8}
            >
              <View style={[styles.symptomIcon, active && { backgroundColor: highPriority ? COLORS.danger : COLORS.secondary }]}>
                <Ionicons name={icon} size={20} color={active ? COLORS.white : COLORS.textMuted} />
              </View>
              <Text style={[styles.symptomLabel, active && styles.symptomLabelActive]}>{t(key)}</Text>
              {highPriority && (
                <View style={styles.hpBadge}>
                  <Text style={styles.hpBadgeText}>!</Text>
                </View>
              )}
              <View style={[styles.checkbox, active && { backgroundColor: highPriority ? COLORS.danger : COLORS.secondary, borderColor: 'transparent' }]}>
                {active && <Ionicons name="checkmark" size={13} color={COLORS.white} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {isHighPriority && (
          <View style={styles.hpBanner}>
            <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
            <Text style={styles.hpBannerText}>{t('highPriorityWarning')}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.sendBtn, selected.length === 0 && styles.sendBtnDisabled]}
          onPress={() => doSendAlert(selected)}
          disabled={selected.length === 0}
          activeOpacity={0.85}
        >
          <Ionicons name="alert-circle" size={22} color={COLORS.white} />
          <Text style={styles.sendBtnText}>{t('sendHighPriorityAlert')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={() => doSendAlert([])} activeOpacity={0.85}>
          <Ionicons name="flash" size={18} color={COLORS.secondary} />
          <Text style={styles.skipBtnText}>{t('skipSendSOS')}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 16, backgroundColor: COLORS.primary,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: COLORS.primaryFaded, marginTop: 2 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary, gap: 16 },
  loadingText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  loadingSubText: { fontSize: 14, color: COLORS.primaryFaded },

  symptomRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 13, padding: 14,
    marginBottom: 10, borderWidth: 1.5, borderColor: COLORS.border,
  },
  symptomActiveHigh: { borderColor: COLORS.danger, backgroundColor: '#FFF5F5' },
  symptomActiveNormal: { borderColor: COLORS.secondary, backgroundColor: '#FFF8F5' },
  symptomIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },
  symptomLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.text },
  symptomLabelActive: { fontWeight: '700', color: COLORS.text },
  hpBadge: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.danger + '33',
    justifyContent: 'center', alignItems: 'center',
  },
  hpBadgeText: { fontSize: 11, fontWeight: '900', color: COLORS.danger },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },

  hpBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.dangerLight, borderRadius: 12, padding: 14,
    marginVertical: 12, borderWidth: 1, borderColor: '#FECACA',
  },
  hpBannerText: { flex: 1, fontSize: 13, color: '#7F1D1D', lineHeight: 18, fontWeight: '600' },

  sendBtn: {
    backgroundColor: COLORS.danger, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    marginTop: 8,
    shadowColor: COLORS.danger, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.white },

  skipBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    marginTop: 12, paddingVertical: 14, borderRadius: 14,
    borderWidth: 2, borderColor: COLORS.secondary,
  },
  skipBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.secondary },
});
