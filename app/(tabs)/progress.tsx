import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
  Modal, TextInput, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
const haptic = (fn: () => void) => { if (Platform.OS !== 'web') fn(); };
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useStore } from '../../store';

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function ProgressScreen() {
  const store = useStore();
  const [weightModal, setWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState(store.profile.weight.toString());

  const xpToNext = 200 - (store.xp % 200);
  const xpProgress = (store.xp % 200) / 200;
  const unlockedBadges = store.badges.filter((b) => b.unlockedAt);
  const lockedBadges = store.badges.filter((b) => !b.unlockedAt);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const log = store.history.find((h) => h.date === dateStr);
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    return {
      day: DAYS_SHORT[d.getDay()],
      completed: log?.workoutCompleted || (isToday && store.today.workoutCompleted),
      isToday,
    };
  });

  const bmi = store.profile.weight / Math.pow(store.profile.height / 100, 2);
  const leanMass = store.profile.weight * (1 - store.profile.bodyFat / 100);

  const handleSaveWeight = () => {
    const w = parseFloat(newWeight);
    if (isNaN(w) || w < 30 || w > 250) {
      Alert.alert('Invalid weight', 'Enter a weight between 30 and 250 kg.');
      return;
    }
    store.updateWeight(w);
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    setWeightModal(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>GAINS</Text>
        </View>

        {/* XP / Level Card */}
        <LinearGradient
          colors={['#1A0000', '#0D0005', COLORS.bg]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.levelCard}
        >
          <View style={styles.levelTop}>
            <View>
              <Text style={styles.levelLabel}>CURRENT LEVEL</Text>
              <Text style={styles.levelNum}>LVL {store.level}</Text>
              <Text style={styles.xpTotal}>{store.xp} XP total</Text>
            </View>
            <View style={styles.levelBadge}>
              <Ionicons name="trophy" size={28} color={COLORS.goldHot} />
            </View>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` as any }]} />
          </View>
          <View style={styles.xpLabelRow}>
            <Text style={styles.xpLabel}>LVL {store.level}</Text>
            <Text style={styles.xpNextLabel}>{xpToNext} XP TO LEVEL {store.level + 1}</Text>
            <Text style={styles.xpLabel}>LVL {store.level + 1}</Text>
          </View>
        </LinearGradient>

        {/* Weekly Grid */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>THIS WEEK</Text>
          <View style={styles.weekGrid}>
            {last7.map((day, i) => (
              <View key={i} style={styles.dayCol}>
                <View style={[
                  styles.dayDot,
                  day.completed && { backgroundColor: COLORS.redHot, borderColor: COLORS.redHot },
                  day.isToday && !day.completed && { borderColor: COLORS.orangeHot },
                ]}>
                  {day.completed
                    ? <Ionicons name="checkmark" size={14} color={COLORS.white} />
                    : day.isToday
                    ? <View style={styles.todayDot} />
                    : null
                  }
                </View>
                <Text style={[styles.dayLabel, day.isToday && { color: COLORS.orangeHot }]}>{day.day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.streakRow}>
            <Ionicons name="flame" size={14} color={COLORS.redHot} />
            <Text style={styles.streakText}>
              Workout streak: <Text style={{ color: COLORS.redHot, fontWeight: '900' }}>{store.streaks.workout} days</Text>
            </Text>
          </View>
        </View>

        {/* Body Metrics */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>BODY METRICS</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => setWeightModal(true)}>
              <Ionicons name="pencil" size={12} color={COLORS.grey} />
              <Text style={styles.editBtnText}>UPDATE</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.metricsGrid}>
            <MetricBox label="WEIGHT" value={`${store.profile.weight}`} unit="kg" color={COLORS.orangeHot} />
            <MetricBox label="BODY FAT" value={`${store.profile.bodyFat}`} unit="%" color={COLORS.redHot} />
            <MetricBox label="BMI" value={bmi.toFixed(1)} unit="" color={COLORS.goldHot} />
            <MetricBox label="LEAN MASS" value={leanMass.toFixed(1)} unit="kg" color={COLORS.greenHot} />
          </View>
          <View style={styles.goalRow}>
            <Ionicons name="flag" size={13} color={COLORS.redHot} />
            <Text style={styles.goalText}>Mission: Reach 15% body fat — {(store.profile.weight * 0.85).toFixed(1)}kg lean mass</Text>
          </View>
        </View>

        {/* Daily Targets */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DAILY TARGETS</Text>
          <TargetRow icon="flame" label="Calories" value={`${store.profile.targetCalories} kcal`} color={COLORS.orangeHot} />
          <TargetRow icon="barbell" label="Protein" value={`${store.profile.targetProtein}g`} color={COLORS.redHot} />
          <TargetRow icon="leaf" label="Carbs" value={`${store.profile.targetCarbs}g`} color={COLORS.goldHot} />
          <TargetRow icon="water" label="Hydration" value="3.0 L" color={COLORS.blueHot} />
          <TargetRow icon="footsteps" label="Steps" value="10,000" color={COLORS.greenHot} />
        </View>

        {/* Unlocked Badges */}
        {unlockedBadges.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ACHIEVEMENTS</Text>
            <View style={styles.badgesGrid}>
              {unlockedBadges.map((badge) => (
                <View key={badge.id} style={[styles.badgeCard, styles.badgeUnlocked]}>
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Locked Badges */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>MISSIONS LOCKED</Text>
          <View style={styles.badgesGrid}>
            {lockedBadges.map((badge) => (
              <View key={badge.id} style={[styles.badgeCard, styles.badgeLocked]}>
                <Text style={[styles.badgeIcon, { opacity: 0.25 }]}>{badge.icon}</Text>
                <Text style={[styles.badgeName, { color: COLORS.dimmed }]}>{badge.name}</Text>
                <Text style={[styles.badgeDesc, { color: COLORS.dimmed }]}>{badge.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* XP Guide */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>XP REWARDS</Text>
          {[
            { action: 'Complete workout', xp: '+100' },
            { action: 'Hit protein goal', xp: '+30' },
            { action: 'Hit hydration goal', xp: '+30' },
            { action: 'Hit step goal', xp: '+35' },
            { action: 'Log all meals', xp: '+20' },
            { action: 'Log a meal', xp: '+5' },
            { action: 'Perfect day (all goals)', xp: '+150' },
          ].map(({ action, xp }, i) => (
            <View key={i} style={styles.xpRow}>
              <Text style={styles.xpAction}>{action}</Text>
              <Text style={styles.xpPoints}>{xp} XP</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Weight Modal */}
      <Modal visible={weightModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>UPDATE WEIGHT</Text>
            <TextInput
              style={styles.modalInput}
              value={newWeight}
              onChangeText={setNewWeight}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={styles.modalUnit}>KG</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={handleSaveWeight}>
              <Text style={styles.modalBtnText}>SAVE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setWeightModal(false)}>
              <Text style={styles.modalCancel}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MetricBox({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}<Text style={styles.metricUnit}> {unit}</Text></Text>
    </View>
  );
}

function TargetRow({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <View style={styles.targetRow}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={styles.targetLabel}>{label}</Text>
      <Text style={[styles.targetValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1, paddingHorizontal: SPACING.md },

  header: { paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  screenTitle: { fontSize: 30, fontWeight: '900', color: COLORS.white, letterSpacing: 6 },

  levelCard: {
    borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.redHot + '33',
  },
  levelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  levelLabel: { fontSize: 10, fontWeight: '800', color: COLORS.grey, letterSpacing: 2.5, marginBottom: 4 },
  levelNum: { fontSize: 34, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  xpTotal: { fontSize: 12, color: COLORS.grey, fontWeight: '600', marginTop: 2 },
  levelBadge: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.goldHot + '1A',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.goldHot + '44',
  },
  xpBarBg: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginBottom: 8 },
  xpBarFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.redHot },
  xpLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLabel: { fontSize: 10, color: COLORS.grey, fontWeight: '700' },
  xpNextLabel: { fontSize: 10, color: COLORS.white, fontWeight: '700', letterSpacing: 0.5 },

  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 10, fontWeight: '800', color: COLORS.grey, letterSpacing: 2.5, marginBottom: SPACING.md },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  editBtnText: { fontSize: 10, color: COLORS.grey, fontWeight: '800', letterSpacing: 1.5 },

  weekGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.sm },
  dayCol: { alignItems: 'center', gap: 6 },
  dayDot: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.cardAlt,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.border,
  },
  todayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.orangeHot },
  dayLabel: { fontSize: 11, color: COLORS.grey, fontWeight: '700' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: SPACING.sm },
  streakText: { fontSize: 13, color: COLORS.grey, fontWeight: '600' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  metricBox: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  metricLabel: { fontSize: 9, color: COLORS.grey, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  metricValue: { fontSize: 26, fontWeight: '900' },
  metricUnit: { fontSize: 13, fontWeight: '600', color: COLORS.grey },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: SPACING.sm },
  goalText: { fontSize: 12, color: COLORS.grey, flex: 1, lineHeight: 18 },

  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.border + '55' },
  targetLabel: { flex: 1, fontSize: 13, color: COLORS.white, fontWeight: '600' },
  targetValue: { fontSize: 13, fontWeight: '900' },

  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  badgeCard: { width: '30%', borderRadius: RADIUS.md, padding: 12, alignItems: 'center', borderWidth: 1, gap: 5 },
  badgeUnlocked: { backgroundColor: COLORS.cardAlt, borderColor: COLORS.redHot + '44' },
  badgeLocked: { backgroundColor: COLORS.cardAlt, borderColor: COLORS.border },
  badgeIcon: { fontSize: 26 },
  badgeName: { fontSize: 9, fontWeight: '800', color: COLORS.white, textAlign: 'center', letterSpacing: 0.5 },
  badgeDesc: { fontSize: 9, color: COLORS.grey, textAlign: 'center', lineHeight: 13 },

  xpRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: COLORS.border + '55',
  },
  xpAction: { fontSize: 13, color: COLORS.white, fontWeight: '500' },
  xpPoints: { fontSize: 13, color: COLORS.redHot, fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  modalCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.xl,
    width: '100%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderHigh,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white, letterSpacing: 2, marginBottom: SPACING.lg },
  modalInput: {
    width: '100%', backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.md, padding: SPACING.md,
    color: COLORS.white, fontSize: 36, fontWeight: '900', textAlign: 'center',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 6,
  },
  modalUnit: { fontSize: 12, color: COLORS.grey, marginBottom: SPACING.lg, fontWeight: '700', letterSpacing: 2 },
  modalBtn: {
    backgroundColor: COLORS.redHot, borderRadius: RADIUS.full, paddingHorizontal: SPACING.xl,
    paddingVertical: 16, width: '100%', alignItems: 'center', marginBottom: SPACING.md,
  },
  modalBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  modalCancel: { color: COLORS.grey, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
});
