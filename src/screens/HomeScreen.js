import React, { useContext, useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Linking, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { AlertContext } from '../context/AlertContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS } from '../theme/colors';
import { isOnline } from '../services/networkService';

// ── Pregnancy helpers ─────────────────────────────────────────────────────────
const getWeek = (lmpISO) => {
  if (!lmpISO) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(lmpISO)) / (1000 * 60 * 60 * 24 * 7)));
};

const getDueDate = (lmpISO) => {
  if (!lmpISO) return null;
  const d = new Date(lmpISO);
  d.setDate(d.getDate() + 280);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getTrimester = (week) => {
  if (week <= 13) return { label: '1st Trimester', color: COLORS.primary };
  if (week <= 26) return { label: '2nd Trimester', color: COLORS.warning };
  return { label: '3rd Trimester', color: COLORS.secondary };
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { user, chwData } = useContext(UserContext);
  const { activeAlert } = useContext(AlertContext);
  const { t, lang, toggleLanguage } = useLanguage();
  const [online, setOnline] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    isOnline().then(setOnline);
  }, []);

  const week = getWeek(user?.lastPeriodDate);
  const dueDate = getDueDate(user?.lastPeriodDate);
  const trimester = week !== null ? getTrimester(week) : null;
  const progress = week !== null ? Math.min((week / 40) * 100, 100) : 0;

  const handleSOS = () => {
    if (!user) {
      Alert.alert(t('error'), 'Please register first to use SOS.');
      return;
    }
    navigation.navigate('DangerSigns');
  };

  const handleCHWMode = () => navigation.navigate('CHWLogin');

  const handleCallEmergency = () => {
    const phone = user?.emergencyContact?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() =>
        Alert.alert(t('error'), 'Could not open phone app.')
      );
    } else {
      Alert.alert(t('noEmergencyContact'));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appName}>{t('appName')}</Text>
          <Text style={styles.greeting}>{t('hello')}, {user?.name || t('mama')} 👋</Text>
        </View>
        <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn}>
          <Text style={styles.langBtnText}>{lang === 'en' ? 'KR' : 'EN'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCHWMode} style={styles.chwBtn}>
          <Ionicons name="people" size={18} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {/* Offline banner */}
      {!online && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={14} color={COLORS.white} />
          <Text style={styles.offlineBannerText}>{t('offlineBanner')}</Text>
        </View>
      )}

      {/* Active alert banner */}
      {activeAlert && (
        <TouchableOpacity style={styles.activeBanner} onPress={() => navigation.navigate('AlertStatus')}>
          <Ionicons name="alert-circle" size={16} color={COLORS.white} />
          <Text style={styles.activeBannerText}>
            {t('alertStatus')}: {t(activeAlert.status?.toLowerCase()) || activeAlert.status}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
        </TouchableOpacity>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Pregnancy card */}
        {week !== null ? (
          <View style={styles.pregnancyCard}>
            <View style={styles.pregnancyRow}>
              <View style={styles.pregnancyBlock}>
                <Text style={styles.pregnancyNum}>{week}</Text>
                <Text style={styles.pregnancyLabel}>{t('weeksPregnant')}</Text>
                <Text style={styles.pregnancySub}>{t('ofPregnancy')}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.pregnancyBlock}>
                <Text style={styles.dueDateVal}>{dueDate}</Text>
                <Text style={styles.pregnancyLabel}>{t('dueDate')}</Text>
                {trimester && (
                  <View style={[styles.trimBadge, { backgroundColor: trimester.color + '22' }]}>
                    <Text style={[styles.trimText, { color: trimester.color }]}>{trimester.label}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{Math.min(week, 40)}/40 weeks</Text>
          </View>
        ) : (
          <View style={styles.noDataCard}>
            <Ionicons name="information-circle" size={22} color={COLORS.primaryLight} />
            <Text style={styles.noDataText}>Register with your last period date to track your pregnancy.</Text>
          </View>
        )}

        {/* SOS section */}
        <View style={styles.sosSection}>
          <Text style={styles.sosHeading}>{t('emergencyHelp')}</Text>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.sosBtn} onPress={handleSOS} activeOpacity={0.85}>
              <Ionicons name="alert-circle" size={46} color={COLORS.white} />
              <Text style={styles.sosBtnText}>{t('sos')}</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.sosSub}>{t('pressForHelp')}</Text>

          {/* Check symptoms shortcut */}
          <TouchableOpacity style={styles.symptomBtn} onPress={() => navigation.navigate('DangerSigns')} activeOpacity={0.85}>
            <Ionicons name="medical" size={16} color={COLORS.secondary} />
            <Text style={styles.symptomBtnText}>{t('checkSymptoms')}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>{t('quickAccess')}</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Calculator')} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: COLORS.primaryFaded }]}>
              <Ionicons name="calendar" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>{t('dueDate')}</Text>
            <Text style={styles.actionSub}>{t('calculator')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Kicks')} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="heart" size={26} color={COLORS.secondary} />
            </View>
            <Text style={styles.actionTitle}>{t('babyKickCounter')}</Text>
            <Text style={styles.actionSub}>{t('kickCounter')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Tips')} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="book" size={26} color="#7C3AED" />
            </View>
            <Text style={styles.actionTitle}>{t('pregnancyTips')}</Text>
            <Text style={styles.actionSub}>{t('tips')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AlertStatus')} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: activeAlert ? COLORS.dangerLight : COLORS.border }]}>
              <Ionicons name="shield" size={26} color={activeAlert ? COLORS.danger : COLORS.textMuted} />
            </View>
            <Text style={styles.actionTitle}>{t('alertStatus')}</Text>
            <Text style={styles.actionSub}>{activeAlert ? (t(activeAlert.status?.toLowerCase()) || activeAlert.status) : '—'}</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency contact card */}
        {user?.emergencyContact?.name ? (
          <View style={styles.ecCard}>
            <View style={styles.ecIcon}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.ecInfo}>
              <Text style={styles.ecLabel}>{t('emergencyContact')}</Text>
              <Text style={styles.ecName}>{user.emergencyContact.name}</Text>
              <Text style={styles.ecPhone}>{user.emergencyContact.phone}</Text>
            </View>
            <TouchableOpacity onPress={handleCallEmergency} style={styles.callBtn}>
              <Ionicons name="call" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: COLORS.primary,
  },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  greeting: { fontSize: 13, color: COLORS.primaryFaded, marginTop: 2 },
  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  langBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.white },
  chwBtn: { padding: 6 },

  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.warning, paddingHorizontal: 16, paddingVertical: 8,
  },
  offlineBannerText: { fontSize: 12, color: COLORS.white, fontWeight: '600', flex: 1 },

  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.danger, paddingHorizontal: 16, paddingVertical: 10,
  },
  activeBannerText: { flex: 1, fontSize: 13, color: COLORS.white, fontWeight: '700' },

  pregnancyCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  pregnancyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  pregnancyBlock: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 60, backgroundColor: COLORS.border, marginHorizontal: 10 },
  pregnancyNum: { fontSize: 52, fontWeight: '900', color: COLORS.primary, lineHeight: 56 },
  dueDateVal: { fontSize: 17, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  pregnancyLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  pregnancySub: { fontSize: 11, color: COLORS.textMuted },
  trimBadge: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  trimText: { fontSize: 11, fontWeight: '700' },
  progressBar: {
    height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressLabel: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },

  noDataCard: {
    backgroundColor: COLORS.primaryFaded, borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20,
  },
  noDataText: { flex: 1, fontSize: 13, color: COLORS.primaryLight, lineHeight: 18 },

  sosSection: { alignItems: 'center', marginBottom: 28 },
  sosHeading: {
    fontSize: 12, fontWeight: '700', color: COLORS.textLight,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14,
  },
  sosBtn: {
    width: 136, height: 136, borderRadius: 68, backgroundColor: COLORS.danger,
    justifyContent: 'center', alignItems: 'center', gap: 4,
    shadowColor: COLORS.danger, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 12,
  },
  sosBtnText: { color: COLORS.white, fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  sosSub: { marginTop: 12, fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
  symptomBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.secondary,
  },
  symptomBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionCard: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  actionSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },

  ecCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  ecIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primaryFaded, justifyContent: 'center', alignItems: 'center' },
  ecInfo: { flex: 1 },
  ecLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  ecName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  ecPhone: { fontSize: 13, color: COLORS.textLight, marginTop: 1 },
  callBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
});
