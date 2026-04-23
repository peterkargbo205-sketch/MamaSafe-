import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const TIPS = {
  1: {
    label: '1st Trimester',
    weeks: 'Weeks 1–13',
    color: COLORS.primary,
    icon: 'leaf',
    description: 'Your baby is forming. Focus on building a healthy foundation.',
    tips: [
      {
        icon: 'medical',
        title: 'Start Folic Acid',
        body: 'Take 400mcg of folic acid daily to prevent neural tube defects. Ask at your nearest health center.',
      },
      {
        icon: 'home',
        title: 'First Antenatal Visit',
        body: 'Visit your health center as soon as possible. Early antenatal care is free at government clinics in Sierra Leone.',
      },
      {
        icon: 'restaurant',
        title: 'Eat Nutritious Foods',
        body: 'Eat beans, groundnuts, cassava leaves, sweet potatoes, and fruits. These local foods provide essential nutrients.',
      },
      {
        icon: 'water',
        title: 'Stay Hydrated',
        body: 'Drink at least 8 cups of clean, safe water each day. Dehydration can cause complications.',
      },
      {
        icon: 'moon',
        title: 'Rest and Sleep',
        body: 'Feeling tired is normal. Rest when you can. Your body is working hard to grow your baby.',
      },
      {
        icon: 'shield',
        title: 'Avoid Harmful Substances',
        body: 'Do not drink alcohol, smoke, or take any medicine without a doctor\'s advice during pregnancy.',
      },
      {
        icon: 'bug',
        title: 'Malaria Prevention',
        body: 'Sleep under an insecticide-treated mosquito net every night. Malaria is very dangerous during pregnancy.',
      },
      {
        icon: 'alert-circle',
        title: 'Know Danger Signs',
        body: 'Go to the clinic immediately if you have heavy bleeding, severe vomiting, fever, or severe abdominal pain.',
      },
    ],
  },
  2: {
    label: '2nd Trimester',
    weeks: 'Weeks 14–26',
    color: '#D97706',
    icon: 'sunny',
    description: 'Energy returns. Your bump grows and baby movements begin.',
    tips: [
      {
        icon: 'calendar',
        title: 'Regular Antenatal Visits',
        body: 'Continue attending antenatal clinic monthly. Your midwife will check blood pressure, weight, and baby\'s position.',
      },
      {
        icon: 'fitness',
        title: 'Gentle Exercise',
        body: 'Walking and light stretching are good for you and baby. Avoid heavy lifting and strenuous work.',
      },
      {
        icon: 'nutrition',
        title: 'Eat Iron-Rich Foods',
        body: 'Eat green leafy vegetables like potato leaves and cassava leaves, liver, and beans to prevent anaemia.',
      },
      {
        icon: 'hand-left',
        title: 'Feel Baby Move',
        body: 'From around week 18–20 you may feel baby moving. Note how often your baby moves each day.',
      },
      {
        icon: 'bed',
        title: 'Sleep on Your Side',
        body: 'Sleep on your left side when possible — it improves blood flow to your baby and reduces swelling.',
      },
      {
        icon: 'medkit',
        title: 'Take Iron and Folic Acid',
        body: 'Continue taking iron and folic acid supplements given at the clinic to prevent anaemia.',
      },
      {
        icon: 'eye',
        title: 'Watch for Preeclampsia',
        body: 'Go to the clinic immediately if you have severe headache, blurred vision, or swelling of face and hands.',
      },
      {
        icon: 'happy',
        title: 'Mental Wellbeing',
        body: 'Talk to someone you trust if you feel sad or anxious. Your emotional health matters as much as your physical health.',
      },
    ],
  },
  3: {
    label: '3rd Trimester',
    weeks: 'Weeks 27–40',
    color: COLORS.secondary,
    icon: 'heart',
    description: 'Your baby is almost ready. Prepare for birth and early care.',
    tips: [
      {
        icon: 'car',
        title: 'Plan Your Journey',
        body: 'Arrange transport to the hospital or health center now. Know two routes in case one is blocked during an emergency.',
      },
      {
        icon: 'bag-handle',
        title: 'Pack Your Birth Bag',
        body: 'Prepare: clean cloth for baby, clean razor blade, cord ties, sanitary pads, baby clothes, and your antenatal card.',
      },
      {
        icon: 'person-add',
        title: 'Choose a Birth Companion',
        body: 'Ask a trusted person — husband, sister, or mother — to be with you during labor and delivery.',
      },
      {
        icon: 'warning',
        title: 'Know Labor Signs',
        body: 'Go to the clinic when you have: regular contractions every 5 minutes, waters breaking, or heavy show of blood.',
      },
      {
        icon: 'heart',
        title: 'Count Baby Movements',
        body: 'Count your baby\'s kicks daily. If you feel fewer than 10 movements in 2 hours, go to the clinic immediately.',
      },
      {
        icon: 'time',
        title: 'More Frequent Visits',
        body: 'Visit the clinic every 2 weeks after week 36. Your midwife will ensure baby is in the right position.',
      },
      {
        icon: 'water',
        title: 'Watch for Fluid Leak',
        body: 'If your waters break (even a small trickle), go to the hospital immediately, even if you have no contractions.',
      },
      {
        icon: 'ribbon',
        title: 'Breastfeeding Preparation',
        body: 'Learn about exclusive breastfeeding. Breast milk is the best food for your newborn for the first 6 months.',
      },
    ],
  },
};

const TRIMESTER_KEYS = [1, 2, 3];

export default function TipsScreen() {
  const [selected, setSelected] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const trimester = TIPS[selected];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="heart" size={22} color={COLORS.secondary} />
        <View>
          <Text style={styles.headerTitle}>Pregnancy Tips</Text>
          <Text style={styles.headerSub}>Sierra Leone Maternal Health Guidance</Text>
        </View>
      </View>

      {/* Trimester Selector */}
      <View style={styles.selectorBg}>
        <View style={styles.selector}>
          {TRIMESTER_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.selectorTab,
                selected === key && [styles.selectorTabActive, { backgroundColor: TIPS[key].color }],
              ]}
              onPress={() => { setSelected(key); setExpanded(null); }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={TIPS[key].icon}
                size={14}
                color={selected === key ? COLORS.white : COLORS.textMuted}
              />
              <Text style={[styles.selectorText, selected === key && styles.selectorTextActive]}>
                {key === 1 ? '1st' : key === 2 ? '2nd' : '3rd'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Trimester Banner */}
        <View style={[styles.banner, { backgroundColor: trimester.color }]}>
          <Ionicons name={trimester.icon} size={30} color="rgba(255,255,255,0.6)" />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>{trimester.label}</Text>
            <Text style={styles.bannerWeeks}>{trimester.weeks}</Text>
            <Text style={styles.bannerDesc}>{trimester.description}</Text>
          </View>
        </View>

        {/* Tips List */}
        {trimester.tips.map((tip, index) => {
          const isOpen = expanded === index;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.tipCard, isOpen && styles.tipCardOpen]}
              onPress={() => setExpanded(isOpen ? null : index)}
              activeOpacity={0.85}
            >
              <View style={styles.tipRow}>
                <View style={[styles.tipIcon, { backgroundColor: trimester.color + '18' }]}>
                  <Ionicons name={tip.icon} size={20} color={trimester.color} />
                </View>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </View>
              {isOpen && (
                <View style={[styles.tipBody, { borderTopColor: trimester.color + '30' }]}>
                  <Text style={styles.tipBodyText}>{tip.body}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Danger Signs Box */}
        <View style={styles.dangerBox}>
          <View style={styles.dangerHeader}>
            <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
            <Text style={styles.dangerTitle}>Always Seek Immediate Help If:</Text>
          </View>
          {[
            'Heavy vaginal bleeding at any stage',
            'Severe headache or blurred vision',
            'High fever with chills',
            'Baby stops moving for several hours',
            'Severe abdominal pain or cramping',
            'Waters breaking before 37 weeks',
          ].map((sign, i) => (
            <View key={i} style={styles.dangerRow}>
              <View style={styles.dangerDot} />
              <Text style={styles.dangerText}>{sign}</Text>
            </View>
          ))}
          <Text style={styles.dangerFooter}>Call your emergency contact or dial 999</Text>
        </View>

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

  selectorBg: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingBottom: 12 },
  selector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 4,
  },
  selectorTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 5,
  },
  selectorTabActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  selectorText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  selectorTextActive: { color: COLORS.white },

  banner: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  bannerWeeks: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '600' },
  bannerDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 8, lineHeight: 18 },

  tipCard: {
    backgroundColor: COLORS.white,
    borderRadius: 13,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipCardOpen: { shadowOpacity: 0.1, elevation: 4 },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text },
  tipBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  tipBodyText: { fontSize: 14, color: COLORS.textLight, lineHeight: 21 },

  dangerBox: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dangerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.danger, flex: 1 },
  dangerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  dangerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.danger, marginTop: 6 },
  dangerText: { flex: 1, fontSize: 13, color: '#7F1D1D', lineHeight: 19 },
  dangerFooter: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
    textAlign: 'center',
  },
});
