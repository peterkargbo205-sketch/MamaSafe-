import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { UserContext } from '../context/UserContext';

const CHW_KEY = '@mamasafe_chw';

export const loadCHW = async () => {
  try {
    const raw = await AsyncStorage.getItem(CHW_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveCHW = async (chw) => {
  await AsyncStorage.setItem(CHW_KEY, JSON.stringify(chw));
};

export default function CHWLoginScreen({ navigation }) {
  const { t } = useLanguage();
  const { setCHWMode } = useContext(UserContext);
  const [mode, setMode] = useState('login'); // login | register
  const [chwId, setChwId] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [newPin, setNewPin] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!chwId.trim() || !pin.trim()) {
      Alert.alert(t('error'), 'Please enter CHW ID and PIN.');
      return;
    }
    setBusy(true);
    const stored = await loadCHW();
    setBusy(false);

    if (!stored) {
      Alert.alert(t('error'), 'No CHW account found. Please register first.');
      return;
    }
    if (stored.chwId.toLowerCase() !== chwId.toLowerCase().trim() || stored.pin !== pin.trim()) {
      Alert.alert(t('error'), 'Incorrect CHW ID or PIN.');
      return;
    }
    setCHWMode(stored);
    navigation.replace('CHWDashboard');
  };

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim() || !chwId.trim() || newPin.length !== 4) {
      Alert.alert(t('error'), 'Please fill all fields. PIN must be 4 digits.');
      return;
    }
    const existing = await loadCHW();
    if (existing) {
      Alert.alert(t('error'), 'A CHW account already exists on this device.');
      return;
    }
    setBusy(true);
    const chw = {
      chwId: chwId.trim(),
      name: name.trim(),
      phone: phone.trim(),
      district: district.trim(),
      pin: newPin.trim(),
      registeredWomen: [],
      createdAt: new Date().toISOString(),
    };
    await saveCHW(chw);
    setBusy(false);
    setCHWMode(chw);
    navigation.replace('CHWDashboard');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('communityHealthWorker')}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Mode toggle */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>{t('login')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.modeTabText, mode === 'register' && styles.modeTabTextActive]}>{t('registerAsCHW')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.iconRow}>
              <Ionicons name="people" size={36} color={COLORS.primary} />
            </View>

            {mode === 'register' && (
              <>
                <Text style={styles.registerTitle}>{t('registerCHWTitle')}</Text>

                <Text style={styles.label}>{t('yourName')}</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Fatima Sesay" placeholderTextColor={COLORS.textMuted} autoCapitalize="words" />

                <Text style={styles.label}>{t('yourPhone')}</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+232 76 000 000" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" />

                <Text style={styles.label}>{t('yourDistrict')}</Text>
                <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholder="e.g. Western Area Urban" placeholderTextColor={COLORS.textMuted} autoCapitalize="words" />
              </>
            )}

            <Text style={styles.label}>{t('chwId')}</Text>
            <TextInput
              style={styles.input} value={chwId} onChangeText={setChwId}
              placeholder={t('chwIdHint')} placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>{mode === 'register' ? t('createPin') : t('pinLabel')}</Text>
            <TextInput
              style={styles.input}
              value={mode === 'register' ? newPin : pin}
              onChangeText={mode === 'register' ? setNewPin : setPin}
              placeholder={t('pinHint')}
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.actionBtn, busy && { opacity: 0.6 }]}
              onPress={mode === 'login' ? handleLogin : handleRegister}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Ionicons name={mode === 'login' ? 'log-in' : 'person-add'} size={20} color={COLORS.white} />
              <Text style={styles.actionBtnText}>
                {busy ? t('loading') : mode === 'login' ? t('login') : t('registerBtn')}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="person" size={16} color={COLORS.textLight} />
            <Text style={styles.switchBtnText}>{t('switchToPatientMode')}</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 18, backgroundColor: COLORS.primary,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },

  modeRow: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12,
    padding: 4, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  modeTab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  modeTabActive: { backgroundColor: COLORS.primary },
  modeTabText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  modeTabTextActive: { color: COLORS.white },

  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    marginBottom: 16,
  },
  iconRow: { alignItems: 'center', marginBottom: 16 },
  registerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 16, textAlign: 'center' },

  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 4 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: COLORS.text,
    marginBottom: 4,
  },

  actionBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 16,
  },
  actionBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.white },

  switchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  switchBtnText: { fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
});
