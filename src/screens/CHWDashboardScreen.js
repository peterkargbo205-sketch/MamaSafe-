import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, TextInput, Modal, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { UserContext } from '../context/UserContext';
import { AlertContext } from '../context/AlertContext';
import { getCurrentLocation, findNearestHospitals } from '../services/locationService';
import { createAlert, markAlertSMSSent } from '../services/alertService';
import { sendSMS, buildSOSMessage, buildHospitalSMS } from '../services/smsService';
import { loadCHW } from './CHWLoginScreen';

const CHW_KEY = '@mamasafe_chw';

const getWeek = (lmpIso) => {
  if (!lmpIso) return null;
  const diff = Date.now() - new Date(lmpIso).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
};

const parseDDMMYYYY = (val) => {
  const parts = val.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y || y < 2020) return null;
  const date = new Date(y, m - 1, d);
  return isNaN(date) ? null : date.toISOString();
};

export default function CHWDashboardScreen({ navigation }) {
  const { t, lang } = useLanguage();
  const { chwData, setCHWMode } = useContext(UserContext);
  const { setActiveAlert } = useContext(AlertContext);

  const [women, setWomen] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sendingFor, setSendingFor] = useState(null);

  // Add woman form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLMP, setNewLMP] = useState('');
  const [newECName, setNewECName] = useState('');
  const [newECPhone, setNewECPhone] = useState('');

  useEffect(() => {
    loadWomen();
  }, []);

  const loadWomen = async () => {
    const chw = await loadCHW();
    if (chw?.registeredWomen) setWomen(chw.registeredWomen);
  };

  const saveWomen = async (updatedWomen) => {
    const chw = await loadCHW();
    if (!chw) return;
    chw.registeredWomen = updatedWomen;
    await AsyncStorage.setItem(CHW_KEY, JSON.stringify(chw));
    setWomen(updatedWomen);
  };

  const handleAddWoman = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert(t('error'), 'Name and phone number are required.');
      return;
    }
    const lmpISO = newLMP ? parseDDMMYYYY(newLMP) : null;
    const woman = {
      name: newName.trim(),
      phone: newPhone.trim(),
      lastPeriodDate: lmpISO,
      emergencyContact: { name: newECName.trim(), phone: newECPhone.trim() },
      addedAt: new Date().toISOString(),
      lastAlertStatus: null,
    };
    const updated = [woman, ...women];
    await saveWomen(updated);
    setShowAddModal(false);
    setNewName(''); setNewPhone(''); setNewLMP(''); setNewECName(''); setNewECPhone('');
  };

  const handleLMPChange = (text) => {
    let cleaned = text.replace(/[^\d/]/g, '');
    if (cleaned.length === 2 && newLMP.length === 1) cleaned += '/';
    if (cleaned.length === 5 && newLMP.length === 4) cleaned += '/';
    setNewLMP(cleaned.slice(0, 10));
  };

  const sendSOSFor = async (woman) => {
    Alert.alert(
      `${t('sendSosForHer')}`,
      `Send SOS for ${woman.name}?`,
      [
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            setSendingFor(woman.phone);
            try {
              const location = await getCurrentLocation();
              const hospitals = location ? findNearestHospitals(location.lat, location.lng, 3) : [];
              const alert = await createAlert({ user: woman, location, symptoms: [], nearestHospitals: hospitals, priority: 'normal' });
              setActiveAlert(alert);

              const sosMsg = buildSOSMessage(woman, location, [], hospitals[0], lang);
              if (woman.emergencyContact?.phone) {
                sendSMS(woman.emergencyContact.phone, sosMsg)
                  .then((r) => { if (r.success) markAlertSMSSent(alert.id); })
                  .catch(() => {});
              }
              if (hospitals[0]?.phone) {
                sendSMS(hospitals[0].phone, buildHospitalSMS(woman, location, [], 'normal')).catch(() => {});
              }

              // Update woman's last alert status
              const updated = women.map((w) =>
                w.phone === woman.phone ? { ...w, lastAlertStatus: 'Pending', lastAlertAt: new Date().toISOString() } : w
              );
              await saveWomen(updated);

              navigation.navigate('AlertStatus');
            } catch {
              Alert.alert(t('error'), t('smsFailed'));
            } finally {
              setSendingFor(null);
            }
          },
        },
        { text: t('cancel'), style: 'cancel' },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(t('switchToPatientMode'), t('confirm') + '?', [
      { text: t('yes'), onPress: () => { setCHWMode(null); navigation.replace('Registration'); } },
      { text: t('no'), style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('chwDashboard')}</Text>
          <Text style={styles.headerSub}>{chwData?.name} · {chwData?.chwId}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Add woman button */}
      <View style={styles.addBar}>
        <Text style={styles.addBarLabel}>{t('womenInCare')} ({women.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
          <Ionicons name="person-add" size={16} color={COLORS.white} />
          <Text style={styles.addBtnText}>{t('registerNewWoman')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {women.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>{t('noWomenYet')}</Text>
          </View>
        ) : (
          women.map((w, i) => {
            const week = getWeek(w.lastPeriodDate);
            const isSending = sendingFor === w.phone;
            return (
              <View key={i} style={styles.womanCard}>
                <View style={styles.womanInfo}>
                  <Text style={styles.womanName}>{w.name}</Text>
                  <Text style={styles.womanPhone}>{w.phone}</Text>
                  {week !== null && (
                    <Text style={styles.womanWeek}>
                      Week {week} {t('weeksLabel')}
                    </Text>
                  )}
                  {w.lastAlertStatus && (
                    <View style={styles.statusChip}>
                      <View style={[styles.statusDot, {
                        backgroundColor: w.lastAlertStatus === 'Pending' ? COLORS.warning
                          : w.lastAlertStatus === 'Arrived' ? COLORS.success : COLORS.secondary,
                      }]} />
                      <Text style={styles.statusChipText}>{t('lastAlert')}: {w.lastAlertStatus}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.sosBtn, isSending && { opacity: 0.5 }]}
                  onPress={() => sendSOSFor(w)}
                  disabled={isSending}
                  activeOpacity={0.85}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="alert-circle" size={16} color={COLORS.white} />
                      <Text style={styles.sosBtnText}>{t('sendSosForHer')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Woman Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('registerNewWoman')}</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.fieldLabel}>{t('fullName')} *</Text>
            <TextInput style={styles.fieldInput} value={newName} onChangeText={setNewName} placeholder="e.g. Aminata Koroma" placeholderTextColor={COLORS.textMuted} autoCapitalize="words" />

            <Text style={styles.fieldLabel}>{t('phoneNumber')} *</Text>
            <TextInput style={styles.fieldInput} value={newPhone} onChangeText={setNewPhone} placeholder="+232 76 000 000" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" />

            <Text style={styles.fieldLabel}>{t('lastPeriodDate')} (optional)</Text>
            <TextInput style={styles.fieldInput} value={newLMP} onChangeText={handleLMPChange} placeholder="DD/MM/YYYY" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" maxLength={10} />

            <Text style={styles.fieldLabel}>{t('contactName')} (optional)</Text>
            <TextInput style={styles.fieldInput} value={newECName} onChangeText={setNewECName} placeholder="Emergency contact name" placeholderTextColor={COLORS.textMuted} autoCapitalize="words" />

            <Text style={styles.fieldLabel}>{t('contactPhone')} (optional)</Text>
            <TextInput style={styles.fieldInput} value={newECPhone} onChangeText={setNewECPhone} placeholder="+232 76 000 000" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" />

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddWoman} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              <Text style={styles.modalSaveBtnText}>{t('register')}</Text>
            </TouchableOpacity>
            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: COLORS.primaryFaded, marginTop: 2 },
  logoutBtn: { padding: 8 },

  addBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.primaryLight,
  },
  addBarLabel: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.secondary, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },

  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },

  womanCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  womanInfo: { flex: 1 },
  womanName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  womanPhone: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  womanWeek: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusChipText: { fontSize: 11, color: COLORS.textMuted },

  sosBtn: {
    backgroundColor: COLORS.danger, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12,
    flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 74,
  },
  sosBtnText: { fontSize: 10, fontWeight: '700', color: COLORS.white, textAlign: 'center' },

  // Modal
  modalSafe: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  modalContent: { padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 6 },
  fieldInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: COLORS.text, marginBottom: 4,
  },
  modalSaveBtn: {
    backgroundColor: COLORS.secondary, borderRadius: 12, paddingVertical: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20,
  },
  modalSaveBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
});
