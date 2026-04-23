import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Vibration, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { UserContext } from '../context/UserContext';
import { sendSMS, buildSOSMessage } from '../services/smsService';

const SESSION_KEY = '@mamasafe_kick_sessions';
const TARGET_KICKS = 10;
const SESSION_DURATION_SECS = 2 * 60 * 60; // 2 hours

const pad = (n) => String(n).padStart(2, '0');
const formatTime = (secs) => `${pad(Math.floor(secs / 3600))}:${pad(Math.floor((secs % 3600) / 60))}:${pad(secs % 60)}`;

export default function KickCounterScreen() {
  const { t } = useLanguage();
  const { user } = useContext(UserContext);

  const [active, setActive] = useState(false);
  const [kicks, setKicks] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState([]);
  const [lastKickFlash, setLastKickFlash] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    loadHistory();
    return () => clearInterval(timerRef.current);
  }, []);

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  };

  const saveSession = async (kickCount, durationSecs, completed) => {
    const session = {
      date: new Date().toISOString(),
      kickCount,
      durationSecs,
      completed,
      sufficient: kickCount >= TARGET_KICKS,
    };
    const updated = [session, ...history].slice(0, 30);
    setHistory(updated);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updated)).catch(() => {});
    return session;
  };

  const startSession = () => {
    setKicks(0);
    setElapsed(0);
    setActive(true);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);

      if (secs >= SESSION_DURATION_SECS) {
        clearInterval(timerRef.current);
        endSession(true);
      }
    }, 1000);
  };

  const recordKick = () => {
    if (!active) return;
    Vibration.vibrate(80);
    setLastKickFlash(true);
    setTimeout(() => setLastKickFlash(false), 300);
    setKicks((prev) => prev + 1);
  };

  const endSession = async (timedOut = false) => {
    clearInterval(timerRef.current);
    setActive(false);
    const finalKicks = kicks + (timedOut ? 0 : 0); // kicks state captured in closure
    const session = await saveSession(finalKicks, elapsed, true);

    if (finalKicks < TARGET_KICKS) {
      Alert.alert(
        t('sessionComplete'),
        t('sessionCompleteLow'),
        [
          {
            text: t('call'),
            onPress: () => {
              const phone = user?.emergencyContact?.phone;
              if (phone) {
                sendSMS(phone, `MamaSafe: ${user?.name || 'A mama'} recorded only ${finalKicks} baby kicks in their session. Please check on her. -MamaSafe SL`).catch(() => {});
              }
            },
          },
          { text: t('ok'), style: 'cancel' },
        ]
      );
    } else {
      Alert.alert(t('sessionComplete'), t('sessionCompleteGood'));
    }
  };

  const forceEnd = () => {
    endSession(false);
  };

  const progress = Math.min((kicks / TARGET_KICKS) * 100, 100);
  const progressColor = kicks >= TARGET_KICKS ? COLORS.success : kicks >= 6 ? COLORS.warning : COLORS.danger;

  const formatDate = (iso) => {
    const d = new Date(iso);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <Ionicons name="heart" size={22} color={COLORS.secondary} />
        <View>
          <Text style={styles.headerTitle}>{t('babyKickCounter')}</Text>
          <Text style={styles.headerSub}>{t('kickCounterSubtitle')}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: progressColor }]}>{kicks}</Text>
            <Text style={styles.statLabel}>{t('kicks')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{TARGET_KICKS}</Text>
            <Text style={styles.statLabel}>Target</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{formatTime(elapsed)}</Text>
            <Text style={styles.statLabel}>{t('sessionTime')}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressCard}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progressColor }]} />
          </View>
          <Text style={styles.progressLabel}>{t('targetLabel')}</Text>
          {active && kicks >= TARGET_KICKS && (
            <Text style={styles.goodText}>{t('goodMovement')}</Text>
          )}
          {active && kicks < 5 && elapsed > 3600 && (
            <Text style={styles.warnText}>{t('lowMovementWarning')}</Text>
          )}
        </View>

        {/* Kick button */}
        <View style={styles.kickSection}>
          <TouchableOpacity
            style={[
              styles.kickBtn,
              !active && styles.kickBtnInactive,
              lastKickFlash && styles.kickBtnFlash,
            ]}
            onPress={active ? recordKick : startSession}
            activeOpacity={0.8}
          >
            <Ionicons
              name={active ? 'heart' : 'play'}
              size={44}
              color={COLORS.white}
            />
            <Text style={styles.kickBtnText}>
              {active ? t('kickBtn') : t('newSession')}
            </Text>
          </TouchableOpacity>

          {active && (
            <TouchableOpacity style={styles.endBtn} onPress={forceEnd} activeOpacity={0.85}>
              <Ionicons name="stop-circle" size={18} color={COLORS.danger} />
              <Text style={styles.endBtnText}>{t('endSession')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Session history */}
        <Text style={styles.sectionTitle}>{t('kickHistory')}</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>{t('noHistory')}</Text>
        ) : (
          history.slice(0, 10).map((s, i) => (
            <View key={i} style={[styles.historyRow, !s.sufficient && styles.historyRowLow]}>
              <View style={[styles.historyDot, { backgroundColor: s.sufficient ? COLORS.success : COLORS.danger }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyDate}>{formatDate(s.date)}</Text>
                <Text style={styles.historyDuration}>{formatTime(s.durationSecs)} session</Text>
              </View>
              <View style={styles.historyKicks}>
                <Text style={[styles.historyKickNum, { color: s.sufficient ? COLORS.success : COLORS.danger }]}>
                  {s.kickCount}
                </Text>
                <Text style={styles.historyKickLabel}>{t('kicks')}</Text>
              </View>
              <Ionicons
                name={s.sufficient ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={s.sufficient ? COLORS.success : COLORS.danger}
              />
            </View>
          ))
        )}

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
    paddingHorizontal: 20, paddingVertical: 18, backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: COLORS.primaryFaded, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statNum: { fontSize: 26, fontWeight: '900', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },

  progressCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  progressBar: { height: 14, backgroundColor: COLORS.border, borderRadius: 7, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 7 },
  progressLabel: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
  goodText: { marginTop: 8, fontSize: 14, fontWeight: '700', color: COLORS.success, textAlign: 'center' },
  warnText: { marginTop: 8, fontSize: 13, fontWeight: '600', color: COLORS.danger, textAlign: 'center' },

  kickSection: { alignItems: 'center', marginBottom: 28 },
  kickBtn: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 10, gap: 6,
  },
  kickBtnInactive: { backgroundColor: COLORS.primary },
  kickBtnFlash: { backgroundColor: COLORS.secondaryDark },
  kickBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  endBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 20, borderWidth: 2, borderColor: COLORS.danger,
  },
  endBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.danger },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 },

  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  historyRowLow: { borderColor: '#FECACA', backgroundColor: '#FFF5F5' },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyDate: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  historyDuration: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  historyKicks: { alignItems: 'center', marginRight: 6 },
  historyKickNum: { fontSize: 22, fontWeight: '900' },
  historyKickLabel: { fontSize: 10, color: COLORS.textMuted },
});
