import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { COLORS } from '../theme/colors';

const isEditMode = (user) => !!user;

const parseDateInput = (val) => {
  // Accepts DD/MM/YYYY
  const parts = val.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y || y < 2020 || y > 2030) return null;
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1) return null;
  return date.toISOString();
};

const formatDateForDisplay = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

function Field({ label, icon, error, children }) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>
        <Ionicons name={icon} size={14} color={COLORS.primaryLight} /> {label}
      </Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function RegistrationScreen({ navigation }) {
  const { user, registerUser, updateUser } = useContext(UserContext);
  const editing = isEditMode(user);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [lmpInput, setLmpInput] = useState(formatDateForDisplay(user?.lastPeriodDate) || '');
  const [contactName, setContactName] = useState(user?.emergencyContact?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.emergencyContact?.phone || '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Please enter your full name.';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8)
      e.phone = 'Enter a valid phone number.';
    if (!lmpInput.trim()) {
      e.lmp = 'Please enter your last period date.';
    } else if (!parseDateInput(lmpInput)) {
      e.lmp = 'Use format DD/MM/YYYY (e.g. 15/01/2025).';
    }
    if (!contactName.trim()) e.contactName = 'Emergency contact name is required.';
    if (!contactPhone.trim() || contactPhone.replace(/\D/g, '').length < 8)
      e.contactPhone = 'Enter a valid emergency contact number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const userData = {
        name: name.trim(),
        phone: phone.trim(),
        lastPeriodDate: parseDateInput(lmpInput),
        emergencyContact: {
          name: contactName.trim(),
          phone: contactPhone.trim(),
        },
      };
      if (editing) {
        await updateUser(userData);
        Alert.alert('Saved', 'Your information has been updated.');
      } else {
        await registerUser(userData);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not save your information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLmpChange = (text) => {
    // Auto-insert slashes
    let cleaned = text.replace(/[^\d/]/g, '');
    if (cleaned.length === 2 && lmpInput.length === 1) cleaned += '/';
    if (cleaned.length === 5 && lmpInput.length === 4) cleaned += '/';
    setLmpInput(cleaned.slice(0, 10));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        {editing && (
          <TouchableOpacity onPress={() => navigation.goBack?.()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.headerTitle}>{editing ? 'My Information' : 'Welcome to MamaSafe'}</Text>
          <Text style={styles.headerSub}>
            {editing ? 'Update your details below' : 'Sierra Leone Maternal Health'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {!editing && (
            <View style={styles.welcomeBanner}>
              <Ionicons name="heart" size={28} color={COLORS.secondary} />
              <Text style={styles.welcomeText}>
                Register once and MamaSafe will guide you through your entire pregnancy journey.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Your Details</Text>

          <Field label="Full Name" icon="person" error={errors.name}>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Aminata Koroma"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </Field>

          <Field label="Phone Number" icon="call" error={errors.phone}>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+232 76 000 000"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </Field>

          <Field label="Last Menstrual Period Date" icon="calendar" error={errors.lmp}>
            <TextInput
              style={[styles.input, errors.lmp && styles.inputError]}
              value={lmpInput}
              onChangeText={handleLmpChange}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              maxLength={10}
              returnKeyType="next"
            />
            <Text style={styles.hint}>Enter the first day of your last menstrual period.</Text>
          </Field>

          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Emergency Contact</Text>

          <Field label="Contact Name" icon="person-add" error={errors.contactName}>
            <TextInput
              style={[styles.input, errors.contactName && styles.inputError]}
              value={contactName}
              onChangeText={setContactName}
              placeholder="e.g. Ibrahim Bangura"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </Field>

          <Field label="Contact Phone Number" icon="call" error={errors.contactPhone}>
            <TextInput
              style={[styles.input, errors.contactPhone && styles.inputError]}
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="+232 76 000 000"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          </Field>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Ionicons name={editing ? 'checkmark-circle' : 'arrow-forward-circle'} size={22} color={COLORS.white} />
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Register'}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: COLORS.primary,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 13, color: COLORS.primaryFaded, marginTop: 2 },

  welcomeBanner: {
    backgroundColor: COLORS.primaryFaded,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  welcomeText: { flex: 1, fontSize: 14, color: COLORS.primaryLight, lineHeight: 20 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 14,
    letterSpacing: 0.3,
  },

  fieldWrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text,
  },
  inputError: { borderColor: COLORS.danger },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 5 },
  hint: { fontSize: 11, color: COLORS.textMuted, marginTop: 5 },

  saveBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
});
