import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Linking, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { AlertContext } from '../context/AlertContext';
import { cancelAlert, updateAlertStatus, refreshAlertFromFirebase } from '../services/alertService';
import { formatDistance } from '../services/locationService';

const STATUS_STEPS = ['Pending', 'Accepted', 'Dispatched', 'Arrived'];

const STATUS_META = {
  Pending:    { icon: 'time',            color: COLORS.warning,   descKey: 'pendingDesc' },
  Accepted:   { icon: 'checkmark-circle', color: COLORS.success,  descKey: 'acceptedDesc' },
  Dispatched: { icon: 'car',             color: COLORS.secondary, descKey: 'dispatchedDesc' },
  Arrived:    { icon: 'home',            color: COLORS.primary,   descKey: 'arrivedDesc' },
  Cancelled:  { icon: 'close-circle',   color: COLORS.textMuted,  descKey: 'cancelled' },
};

export default function AlertStatusScreen({ navigation }) {
  const { t } = useLanguage();
  const { activeAlert, setActiveAlert, refreshAlert } = useContext(AlertContext);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Auto-refresh from Firebase on mount
    if (activeAlert?.id) {
      refreshAlertFromFirebase(activeAlert.id)
        .then((updated) => { if (updated) setActiveAlert(updated); })
        .catch(() => {});
    }
  }, []);

  if (!activeAlert) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('alertStatus')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-checkmark" size={60} color={COLORS.border} />
          <Text style={styles.emptyTitle}>{t('noActiveAlert')}</Text>
          <Text style={styles.emptyDesc}>{t('noActiveAlertDesc')}</Text>
          <TouchableOpacity style={styles.goHomeBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.goHomeBtnText}>{t('goHome')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(activeAlert.status);
  const meta = STATUS_META[activeAlert.status] || STATUS_META.Pending;
  const nearest = activeAlert.nearestHospitals?.[0];

  const handleRefresh = async () => {
    setRefreshing(true);
    const updated = await refreshAlertFromFirebase(activeAlert.id);
    if (updated) setActiveAlert(updated);
    setRefreshing(false);
  };

  const handleCancel = () => {
    Alert.alert(t('cancelAlert'), t('confirm') + '?', [
      {
        text: t('yes'),
        style: 'destructive',
        onPress: async () => {
          await cancelAlert(activeAlert.id);
          setActiveAlert(null);
          navigation.navigate('Home');
        },
      },
      { text: t('no'), style: 'cancel' },
    ]);
  };

  const handleSafe = async () => {
    await updateAlertStatus(activeAlert.id, 'Arrived');
    setActiveAlert(null);
    Alert.alert('', t('imSafeNow'));
    navigation.navigate('Home');
  };

  // CHW manual status update
  const manualStatusAdvance = async () => {
    const nextIdx = Math.min(currentStep + 1, STATUS_STEPS.length - 1);
    const next = STATUS_STEPS[nextIdx];
    const updated = await updateAlertStatus(activeAlert.id, next);
    if (updated) setActiveAlert(updated);
  };

  const createdAt = new Date(activeAlert.createdAt);
  const timeAgo = Math.round((Date.now() - createdAt) / 60000);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('alertStatus')}</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn} disabled={refreshing}>
          <Ionicons name="refresh" size={20} color={refreshing ? COLORS.primaryFaded : COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Status card */}
        <View style={[styles.statusCard, { borderTopColor: meta.color }]}>
          <View style={[styles.statusIconBg, { backgroundColor: meta.color + '22' }]}>
            <Ionicons name={meta.icon} size={32} color={meta.color} />
          </View>
          <Text style={[styles.statusTitle, { color: meta.color }]}>{t(activeAlert.status.toLowerCase())?.toUpperCase() || activeAlert.status}</Text>
          <Text style={styles.statusDesc}>{t(meta.descKey)}</Text>
          <Text style={styles.timeAgo}>{timeAgo < 1 ? 'Just now' : `${timeAgo} min ago`}</Text>
          {activeAlert.priority === 'high' && (
            <View style={styles.priorityBadge}>
              <Ionicons name="alert-circle" size={12} color={COLORS.danger} />
              <Text style={styles.priorityText}>{t('highPriority')}</Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {STATUS_STEPS.map((step, idx) => {
            const done = idx <= currentStep;
            const isCurrent = idx === currentStep;
            return (
              <View key={step} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, done && styles.timelineDotDone, isCurrent && { backgroundColor: meta.color }]}>
                    {done && <Ionicons name="checkmark" size={12} color={COLORS.white} />}
                  </View>
                  {idx < STATUS_STEPS.length - 1 && (
                    <View style={[styles.timelineLine, done && idx < currentStep && styles.timelineLineDone]} />
                  )}
                </View>
                <Text style={[styles.timelineLabel, done && styles.timelineLabelDone, isCurrent && { color: meta.color, fontWeight: '700' }]}>
                  {t(step.toLowerCase())}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Nearest hospital */}
        {nearest && (
          <View style={styles.hospitalCard}>
            <View style={styles.hospitalIcon}>
              <Ionicons name="medical" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hospitalLabel}>{t('nearestHospital')}</Text>
              <Text style={styles.hospitalName}>{nearest.shortName || nearest.name}</Text>
              <Text style={styles.hospitalDist}>{formatDistance(nearest.distance)} {t('awayFromYou')}</Text>
            </View>
            {nearest.phone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${nearest.phone}`)} style={styles.callBtn}>
                <Ionicons name="call" size={18} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Location & symptoms */}
        {activeAlert.location && (
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.infoText}>
              {t('yourLocation')}: {activeAlert.location.lat.toFixed(4)}, {activeAlert.location.lng.toFixed(4)}
            </Text>
          </View>
        )}

        {activeAlert.symptoms?.length > 0 && (
          <View style={styles.symptomsCard}>
            <Text style={styles.symptomsTitle}>{t('selectedSymptoms')}</Text>
            {activeAlert.symptoms.map((s, i) => (
              <View key={i} style={styles.symptomChip}>
                <Ionicons name="alert-circle" size={13} color={COLORS.danger} />
                <Text style={styles.symptomChipText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* SMS status */}
        <View style={styles.smsRow}>
          <Ionicons
            name={activeAlert.smsSent ? 'checkmark-circle' : 'time'}
            size={16}
            color={activeAlert.smsSent ? COLORS.success : COLORS.warning}
          />
          <Text style={[styles.smsText, { color: activeAlert.smsSent ? COLORS.success : COLORS.warning }]}>
            {activeAlert.smsSent ? t('smsSent') : t('smsPending')}
          </Text>
        </View>

        {/* CHW manual update */}
        {activeAlert.status !== 'Arrived' && activeAlert.status !== 'Cancelled' && currentStep < STATUS_STEPS.length - 1 && (
          <TouchableOpacity style={styles.advanceBtn} onPress={manualStatusAdvance}>
            <Ionicons name="arrow-forward-circle" size={18} color={COLORS.primary} />
            <Text style={styles.advanceBtnText}>
              Update status → {STATUS_STEPS[currentStep + 1]}
            </Text>
          </TouchableOpacity>
        )}

        {/* Action buttons */}
        <TouchableOpacity style={styles.safeBtn} onPress={handleSafe} activeOpacity={0.85}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
          <Text style={styles.safeBtnText}>{t('imSafeNow')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
          <Text style={styles.cancelBtnText}>{t('cancelAlert')}</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 18, backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  refreshBtn: { padding: 6 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12, backgroundColor: COLORS.background },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyDesc: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 20 },
  goHomeBtn: { marginTop: 8, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  goHomeBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  statusCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 20, alignItems: 'center',
    marginBottom: 16, borderTopWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  statusIconBg: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statusTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  statusDesc: { fontSize: 13, color: COLORS.textLight, marginTop: 4, textAlign: 'center' },
  timeAgo: { fontSize: 11, color: COLORS.textMuted, marginTop: 8 },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: COLORS.dangerLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  priorityText: { fontSize: 11, fontWeight: '700', color: COLORS.danger },

  timeline: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  timelineLeft: { alignItems: 'center', width: 32, marginRight: 12 },
  timelineDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  timelineDotDone: { backgroundColor: COLORS.success },
  timelineLine: { width: 2, height: 22, backgroundColor: COLORS.border, marginVertical: 2 },
  timelineLineDone: { backgroundColor: COLORS.success },
  timelineLabel: { flex: 1, fontSize: 14, color: COLORS.textMuted, paddingTop: 4, paddingBottom: 14 },
  timelineLabelDone: { color: COLORS.text },

  hospitalCard: {
    backgroundColor: COLORS.white, borderRadius: 13, padding: 14, flexDirection: 'row',
    alignItems: 'center', gap: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: COLORS.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  hospitalIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryFaded, justifyContent: 'center', alignItems: 'center' },
  hospitalLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  hospitalName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  hospitalDist: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  callBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingHorizontal: 4 },
  infoText: { fontSize: 12, color: COLORS.textLight, flex: 1 },

  symptomsCard: { backgroundColor: COLORS.white, borderRadius: 13, padding: 14, marginBottom: 10 },
  symptomsTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: 10 },
  symptomChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  symptomChipText: { fontSize: 13, color: COLORS.text },

  smsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, paddingHorizontal: 4 },
  smsText: { fontSize: 13, fontWeight: '600' },

  advanceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primaryFaded, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12,
  },
  advanceBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  safeBtn: {
    backgroundColor: COLORS.success, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  safeBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.white },

  cancelBtn: {
    borderRadius: 14, paddingVertical: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.border,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
});
