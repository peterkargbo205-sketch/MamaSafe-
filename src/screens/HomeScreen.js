import React, { useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { COLORS } from '../theme/colors';

const getWeekOfPregnancy = (lastPeriodDate) => {
  if (!lastPeriodDate) return null;
  const lmp = new Date(lastPeriodDate);
  const today = new Date();
  const days = Math.floor((today - lmp) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.floor(days / 7));
};

const getDueDate = (lastPeriodDate) => {
  if (!lastPeriodDate) return null;
  const due = new Date(lastPeriodDate);
  due.setDate(due.getDate() + 280);
  return due.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getTrimesterLabel = (week) => {
  if (week <= 13) return '1st Trimester';
  if (week <= 26) return '2nd Trimester';
  return '3rd Trimester';
};

const getTrimesterColor = (week) => {
  if (week <= 13) return '#059669';
  if (week <= 26) return '#D97706';
  return COLORS.secondary;
};

export default function HomeScreen({ navigation }) {
  const { user } = useContext(UserContext);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const week = getWeekOfPregnancy(user?.lastPeriodDate);
  const dueDate = getDueDate(user?.lastPeriodDate);
  const progress = week !== null ? Math.min((week / 40) * 100, 100) : 0;

  const handleSOS = () => {
    const emergencyPhone = user?.emergencyContact?.phone;
    Alert.alert(
      'Emergency SOS',
      'Choose how to get help:',
      [
        {
          text: `Call ${user?.emergencyContact?.name || 'Emergency Contact'}`,
          onPress: () =>
            Linking.openURL(`tel:${emergencyPhone || '999'}`).catch(() =>
              Alert.alert('Error', 'Could not open phone app.')
            ),
        },
        {
          text: 'Call 999 (Emergency)',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:999'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>MamaSafe</Text>
          <Text style={styles.greeting}>Hello, {user?.name || 'Mama'} 👋</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="shield-checkmark" size={22} color={COLORS.secondary} />
          <Text style={styles.headerBadgeText}>Protected</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Pregnancy Info Card */}
        {week !== null ? (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoBlock}>
                <Text style={styles.infoNum}>{week}</Text>
                <Text style={styles.infoLabel}>Weeks</Text>
                <Text style={styles.infoSub}>pregnant</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoBlock}>
                <Text style={styles.infoDueDate}>{dueDate}</Text>
                <Text style={styles.infoLabel}>Due Date</Text>
                <View style={[styles.trimesterBadge, { backgroundColor: getTrimesterColor(week) + '22' }]}>
                  <Text style={[styles.trimesterText, { color: getTrimesterColor(week) }]}>
                    {getTrimesterLabel(week)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{Math.min(week, 40)} of 40 weeks complete</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noDataCard}>
            <Ionicons name="information-circle" size={24} color={COLORS.primaryLight} />
            <Text style={styles.noDataText}>
              Register with your last period date to track your pregnancy.
            </Text>
          </View>
        )}

        {/* SOS Button */}
        <View style={styles.sosSection}>
          <Text style={styles.sosHeading}>Emergency Help</Text>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.sosButton} onPress={handleSOS} activeOpacity={0.85}>
              <Ionicons name="call" size={44} color={COLORS.white} />
              <Text style={styles.sosText}>SOS</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.sosSub}>Press for immediate emergency assistance</Text>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Calculator')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.primaryFaded }]}>
              <Ionicons name="calendar" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>Due Date</Text>
            <Text style={styles.actionSub}>Calculator</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Tips')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="heart" size={26} color={COLORS.secondary} />
            </View>
            <Text style={styles.actionTitle}>Pregnancy</Text>
            <Text style={styles.actionSub}>Tips</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Contact */}
        {user?.emergencyContact?.name ? (
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyIcon}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.emergencyInfo}>
              <Text style={styles.emergencyLabel}>Emergency Contact</Text>
              <Text style={styles.emergencyName}>{user.emergencyContact.name}</Text>
              <Text style={styles.emergencyPhone}>{user.emergencyContact.phone}</Text>
            </View>
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${user.emergencyContact.phone}`)}
              style={styles.callBtn}
            >
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
  },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  greeting: { fontSize: 14, color: COLORS.primaryFaded, marginTop: 2 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerBadgeText: { color: COLORS.secondary, fontSize: 12, fontWeight: '700' },

  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  infoBlock: { flex: 1, alignItems: 'center' },
  infoDivider: { width: 1, height: 60, backgroundColor: COLORS.border, marginHorizontal: 8 },
  infoNum: { fontSize: 48, fontWeight: '900', color: COLORS.primary, lineHeight: 52 },
  infoDueDate: { fontSize: 18, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  infoLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 4, fontWeight: '500' },
  infoSub: { fontSize: 11, color: COLORS.textMuted },
  trimesterBadge: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  trimesterText: { fontSize: 11, fontWeight: '700' },

  progressSection: { gap: 6 },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressLabel: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },

  noDataCard: {
    backgroundColor: COLORS.primaryFaded,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  noDataText: { flex: 1, fontSize: 13, color: COLORS.primaryLight, lineHeight: 18 },

  sosSection: { alignItems: 'center', marginBottom: 28 },
  sosHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  sosButton: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
    gap: 4,
  },
  sosText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sosSub: { marginTop: 12, fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  actionSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  emergencyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyInfo: { flex: 1 },
  emergencyLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  emergencyName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  emergencyPhone: { fontSize: 13, color: COLORS.textLight, marginTop: 1 },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
