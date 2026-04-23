import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const parseDDMMYYYY = (val) => {
  const parts = val.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y || y < 2020 || y > 2030) return null;
  const date = new Date(y, m - 1, d);
  if (isNaN(date) || date.getMonth() !== m - 1) return null;
  return date;
};

const computePregnancyInfo = (lmpDate) => {
  const due = new Date(lmpDate);
  due.setDate(due.getDate() + 280);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today - lmpDate;
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  let trimester, trimesterNum;
  if (weeks <= 13) { trimester = '1st Trimester'; trimesterNum = 1; }
  else if (weeks <= 26) { trimester = '2nd Trimester'; trimesterNum = 2; }
  else { trimester = '3rd Trimester'; trimesterNum = 3; }

  const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  return {
    dueDate: due,
    weeks: Math.max(0, weeks),
    days: Math.max(0, days),
    trimester,
    trimesterNum,
    daysUntilDue,
    totalDays: Math.max(0, totalDays),
  };
};

const MILESTONES = [
  { week: 6, label: 'Heartbeat detected', icon: 'heart' },
  { week: 12, label: '1st trimester ends', icon: 'star' },
  { week: 16, label: 'Baby starts moving', icon: 'walk' },
  { week: 20, label: 'Anatomy scan', icon: 'medical' },
  { week: 24, label: 'Viability milestone', icon: 'shield-checkmark' },
  { week: 28, label: '3rd trimester begins', icon: 'sunny' },
  { week: 36, label: 'Baby is full term soon', icon: 'ribbon' },
  { week: 40, label: 'Due date!', icon: 'balloon' },
];

export default function DueDateCalculatorScreen() {
  const [lmpInput, setLmpInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleLmpChange = (text) => {
    let cleaned = text.replace(/[^\d/]/g, '');
    if (cleaned.length === 2 && lmpInput.length === 1) cleaned += '/';
    if (cleaned.length === 5 && lmpInput.length === 4) cleaned += '/';
    setLmpInput(cleaned.slice(0, 10));
    setError('');
    setResult(null);
  };

  const calculate = () => {
    const lmpDate = parseDDMMYYYY(lmpInput);
    if (!lmpDate) {
      setError('Please enter a valid date in DD/MM/YYYY format.');
      setResult(null);
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (lmpDate > today) {
      setError('Last period date cannot be in the future.');
      setResult(null);
      return;
    }
    setError('');
    setResult(computePregnancyInfo(lmpDate));
  };

  const formatDate = (d) =>
    d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const trimesterColor = [null, COLORS.primary, '#D97706', COLORS.secondary];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <Ionicons name="calendar" size={22} color={COLORS.secondary} />
        <View>
          <Text style={styles.headerTitle}>Due Date Calculator</Text>
          <Text style={styles.headerSub}>Based on your last menstrual period</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.primaryLight} /> Last Menstrual Period (LMP)
          </Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={lmpInput}
            onChangeText={handleLmpChange}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            maxLength={10}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : (
            <Text style={styles.hint}>Enter the first day of your last period.</Text>
          )}

          <TouchableOpacity style={styles.calcBtn} onPress={calculate} activeOpacity={0.85}>
            <Ionicons name="calculator" size={20} color={COLORS.white} />
            <Text style={styles.calcBtnText}>Calculate</Text>
          </TouchableOpacity>
        </View>

        {result && (
          <>
            {/* Due Date Result */}
            <View style={styles.resultCard}>
              <Text style={styles.resultCardLabel}>Your Estimated Due Date</Text>
              <Text style={styles.resultDueDate}>{formatDate(result.dueDate)}</Text>
              <View style={[styles.trimesterBadge, { backgroundColor: trimesterColor[result.trimesterNum] }]}>
                <Text style={styles.trimesterBadgeText}>{result.trimester}</Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{result.weeks}</Text>
                <Text style={styles.statLabel}>Weeks</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{result.days}</Text>
                <Text style={styles.statLabel}>Days extra</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{Math.max(0, result.daysUntilDue)}</Text>
                <Text style={styles.statLabel}>Days left</Text>
              </View>
            </View>

            {/* Progress */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Pregnancy Progress</Text>
                <Text style={styles.progressPct}>{Math.round((result.weeks / 40) * 100)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((result.weeks / 40) * 100, 100)}%`,
                      backgroundColor: trimesterColor[result.trimesterNum],
                    },
                  ]}
                />
              </View>
              <View style={styles.progressMarkers}>
                <Text style={styles.marker}>0</Text>
                <Text style={styles.marker}>13</Text>
                <Text style={styles.marker}>26</Text>
                <Text style={styles.marker}>40 wks</Text>
              </View>
            </View>

            {/* Milestones */}
            <Text style={styles.milestonesTitle}>Pregnancy Milestones</Text>
            {MILESTONES.map((m) => {
              const passed = result.weeks >= m.week;
              const current = result.weeks >= m.week - 1 && result.weeks < m.week + 2;
              return (
                <View
                  key={m.week}
                  style={[
                    styles.milestone,
                    passed && styles.milestonePassed,
                    current && styles.milestoneCurrent,
                  ]}
                >
                  <View style={[styles.milestoneIcon, passed && styles.milestoneIconPassed]}>
                    <Ionicons
                      name={m.icon}
                      size={16}
                      color={passed ? COLORS.white : COLORS.textMuted}
                    />
                  </View>
                  <View style={styles.milestoneInfo}>
                    <Text style={[styles.milestoneLabel, passed && styles.milestoneLabelPassed]}>
                      {m.label}
                    </Text>
                    <Text style={styles.milestoneWeek}>Week {m.week}</Text>
                  </View>
                  {passed && (
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  )}
                </View>
              );
            })}
          </>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: COLORS.primaryFaded, marginTop: 2 },

  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: COLORS.text,
    letterSpacing: 1,
  },
  inputError: { borderColor: COLORS.danger },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 6 },
  hint: { fontSize: 11, color: COLORS.textMuted, marginTop: 6 },

  calcBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  calcBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },

  resultCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  resultCardLabel: { fontSize: 12, color: COLORS.primaryFaded, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  resultDueDate: { fontSize: 20, fontWeight: '800', color: COLORS.white, textAlign: 'center', lineHeight: 26 },
  trimesterBadge: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  trimesterBadgeText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNum: { fontSize: 32, fontWeight: '900', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: '500' },

  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  progressPct: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  progressBar: { height: 10, backgroundColor: COLORS.border, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  progressMarkers: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  marker: { fontSize: 10, color: COLORS.textMuted },

  milestonesTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  milestone: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  milestonePassed: { borderColor: COLORS.successLight, backgroundColor: COLORS.successLight },
  milestoneCurrent: { borderColor: COLORS.secondary, borderWidth: 2 },
  milestoneIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneIconPassed: { backgroundColor: COLORS.primary },
  milestoneInfo: { flex: 1 },
  milestoneLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  milestoneLabelPassed: { color: COLORS.primary },
  milestoneWeek: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
