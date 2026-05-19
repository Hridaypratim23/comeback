import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, Modal, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useStore, totalWater, totalCalories, totalProtein, comebackScore } from '../../store';
import { getTodayWorkout, MOTIVATION_BY_DAY } from '../../constants/workouts';
import ProgressRing from '../../components/ProgressRing';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const QUOTES = [
  "No shortcuts. No excuses. No looking back.",
  "The grind doesn't care about your feelings.",
  "Champions are built in the dark, revealed in the light.",
  "Pain is temporary. Quitting lasts forever.",
  "Be the hardest person in any room you enter.",
  "Every rep. Every mile. Every meal. It all counts.",
  "You said 6AM. It's 6AM. Move.",
];

export default function HomeScreen() {
  const router = useRouter();
  const store = useStore();
  const water = totalWater(store);
  const calories = totalCalories(store);
  const protein = totalProtein(store);
  const score = comebackScore(store);
  const carbs = store.today.meals.reduce((a, m) => a + m.carbs, 0);
  const fat = store.today.meals.reduce((a, m) => a + m.fat, 0);
  const [stepsModal, setStepsModal] = useState(false);
  const [stepsInput, setStepsInput] = useState('');

  const now = new Date();
  const workout = useMemo(() => getTodayWorkout(), []);
  const motivation = MOTIVATION_BY_DAY[workout.day][0];
  const quote = QUOTES[now.getDay()];
  const dateStr = `${DAYS[now.getDay()]} · ${MONTHS[now.getMonth()]} ${now.getDate()} · ${now.getFullYear()}`;
  const xpProgress = (store.xp % 200) / 200;
  const scoreColor = score >= 80 ? COLORS.greenHot : score >= 50 ? COLORS.orangeHot : COLORS.redHot;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>COMEBACK</Text>
            <Text style={styles.dateStr}>{dateStr}</Text>
          </View>
          <TouchableOpacity style={styles.levelPill} onPress={() => router.push('/progress')}>
            <Text style={styles.levelLabel}>LVL</Text>
            <Text style={styles.levelNum}>{store.level}</Text>
            <View style={styles.levelBarBg}>
              <View style={[styles.levelBarFill, { width: `${xpProgress * 100}%` as any }]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Workout Hero Card */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => router.push('/workout')}>
          <LinearGradient
            colors={['#1A0000', '#0D0000', COLORS.bg]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.workoutCard}
          >
            <View style={[styles.redLeftBorder, { backgroundColor: workout.color }]} />
            <View style={styles.workoutCardInner}>
              <View style={styles.workoutCardTop}>
                <View>
                  <Text style={styles.workoutDayLabel}>TODAY</Text>
                  <Text style={styles.workoutTitle}>{workout.label}</Text>
                  <Text style={styles.workoutMuscles}>{workout.muscles}</Text>
                </View>
                <View style={styles.workoutStatusIcon}>
                  {store.today.workoutCompleted
                    ? <Ionicons name="checkmark-circle" size={40} color={COLORS.greenHot} />
                    : <Ionicons name="play-circle" size={40} color={COLORS.redHot} />
                  }
                </View>
              </View>
              <Text style={styles.workoutMotivation}>"{motivation}"</Text>
              <View style={styles.workoutCTA}>
                <Text style={styles.workoutCTAText}>
                  {store.today.workoutCompleted ? '✓ SESSION COMPLETE' : 'ENTER THE GYM →'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* COMEBACK Score */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <Text style={styles.sectionLabel}>COMEBACK SCORE</Text>
            <ProgressRing
              size={110}
              strokeWidth={10}
              progress={score / 100}
              color={scoreColor}
              label={`${score}`}
              sublabel="/ 100"
            />
          </View>
          <View style={styles.scoreRight}>
            <ScoreRow label="WORKOUT" pts={store.today.workoutCompleted ? 25 : 0} max={25} />
            <ScoreRow label="PROTEIN" pts={Math.round(Math.min(protein / store.profile.targetProtein, 1) * 25)} max={25} />
            <ScoreRow label="HYDRATION" pts={Math.round(Math.min(water / store.profile.targetWaterMl, 1) * 25)} max={25} />
            <ScoreRow label="STEPS" pts={Math.round(Math.min(store.today.steps / store.profile.targetSteps, 1) * 25)} max={25} />
          </View>
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <MetricTile
            icon="water" color={COLORS.blueHot}
            value={`${(water / 1000).toFixed(1)}`} unit="L"
            sub={`/ ${store.profile.targetWaterMl / 1000}L`}
            progress={water / store.profile.targetWaterMl}
            onPress={() => router.push('/hydration')}
          />
          <MetricTile
            icon="footsteps" color={COLORS.goldHot}
            value={store.today.steps >= 1000 ? `${(store.today.steps / 1000).toFixed(1)}` : `${store.today.steps}`}
            unit={store.today.steps >= 1000 ? 'K' : ''}
            sub="/ 10K"
            progress={store.today.steps / store.profile.targetSteps}
            onPress={() => { setStepsInput(store.today.steps.toString()); setStepsModal(true); }}
          />
          <MetricTile
            icon="flame" color={COLORS.orangeHot}
            value={`${calories}`} unit=""
            sub={`/ ${store.profile.targetCalories} kcal`}
            progress={calories / store.profile.targetCalories}
            onPress={() => router.push('/nutrition')}
          />
        </View>

        {/* Macros */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>MACROS</Text>
          <MacroBar label="PROTEIN" current={protein} target={store.profile.targetProtein} color={COLORS.redHot} />
          <MacroBar label="CARBS" current={carbs} target={store.profile.targetCarbs} color={COLORS.orangeHot} />
          <MacroBar label="FAT" current={fat} target={store.profile.targetFat} color={COLORS.goldHot} />
        </View>

        {/* Streaks */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ACTIVE STREAKS</Text>
          <View style={styles.streaksGrid}>
            <StreakTile icon="barbell" label="GYM" count={store.streaks.workout} color={COLORS.redHot} />
            <StreakTile icon="water" label="H₂O" count={store.streaks.hydration} color={COLORS.blueHot} />
            <StreakTile icon="restaurant" label="FUEL" count={store.streaks.protein} color={COLORS.orangeHot} />
            <StreakTile icon="footsteps" label="STEPS" count={store.streaks.steps} color={COLORS.goldHot} />
          </View>
        </View>

        {/* Quote */}
        <View style={styles.quoteCard}>
          <View style={styles.quoteAccent} />
          <Text style={styles.quoteText}>"{quote}"</Text>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Steps Modal */}
      <Modal visible={stepsModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>LOG STEPS</Text>
            <Text style={styles.modalSub}>Enter today's step count</Text>
            <TextInput
              style={styles.modalInput}
              value={stepsInput}
              onChangeText={setStepsInput}
              keyboardType="number-pad"
              placeholder="8500"
              placeholderTextColor={COLORS.dimmed}
              autoFocus
            />
            <TouchableOpacity style={styles.modalBtn} onPress={() => {
              const s = parseInt(stepsInput) || 0;
              store.setSteps(s);
              if (s >= store.profile.targetSteps) store.addXp(35);
              setStepsModal(false);
            }}>
              <Text style={styles.modalBtnText}>SAVE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStepsModal(false)}>
              <Text style={styles.modalCancel}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ScoreRow({ label, pts, max }: { label: string; pts: number; max: number }) {
  const done = pts >= max;
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreRowLabel}>{label}</Text>
      <View style={styles.scoreRowBar}>
        <View style={[styles.scoreRowFill, { width: `${(pts / max) * 100}%` as any, backgroundColor: done ? COLORS.greenHot : COLORS.red }]} />
      </View>
      <Text style={[styles.scoreRowVal, done && { color: COLORS.greenHot }]}>{pts}</Text>
    </View>
  );
}

function MetricTile({ icon, color, value, unit, sub, progress, onPress }: any) {
  const pct = Math.min(progress, 1);
  return (
    <TouchableOpacity style={styles.metricTile} onPress={onPress} activeOpacity={0.75}>
      <Ionicons name={icon} size={18} color={color} />
      <View style={styles.metricValueRow}>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
        {unit ? <Text style={[styles.metricUnit, { color }]}>{unit}</Text> : null}
      </View>
      <Text style={styles.metricSub}>{sub}</Text>
      <View style={styles.metricBarBg}>
        <View style={[styles.metricBarFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
    </TouchableOpacity>
  );
}

function MacroBar({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = Math.min(current / target, 1);
  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroBarBg}>
        <View style={[styles.macroBarFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroVal}>{Math.round(current)}<Text style={styles.macroTarget}>/{target}g</Text></Text>
    </View>
  );
}

function StreakTile({ icon, label, count, color }: { icon: any; label: string; count: number; color: string }) {
  const on = count > 0;
  return (
    <View style={styles.streakTile}>
      <View style={[styles.streakRing, { borderColor: on ? color : COLORS.border, backgroundColor: on ? color + '15' : COLORS.cardAlt }]}>
        <Ionicons name={icon} size={18} color={on ? color : COLORS.dimmed} />
      </View>
      <Text style={[styles.streakCount, { color: on ? COLORS.white : COLORS.dimmed }]}>{count}</Text>
      <Text style={styles.streakLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: SPACING.md, paddingBottom: 16 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingTop: SPACING.lg, paddingBottom: SPACING.md,
  },
  appName: {
    fontSize: 30, fontWeight: '900', color: COLORS.white,
    letterSpacing: 6, textTransform: 'uppercase',
  },
  dateStr: { fontSize: 11, color: COLORS.grey, marginTop: 4, fontWeight: '700', letterSpacing: 1.5 },
  levelPill: {
    alignItems: 'flex-end', backgroundColor: COLORS.card,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, gap: 4,
  },
  levelLabel: { fontSize: 9, color: COLORS.grey, fontWeight: '800', letterSpacing: 2 },
  levelNum: { fontSize: 22, fontWeight: '900', color: COLORS.redHot, lineHeight: 24 },
  levelBarBg: { width: 60, height: 3, backgroundColor: COLORS.border, borderRadius: 2 },
  levelBarFill: { height: 3, borderRadius: 2, backgroundColor: COLORS.redHot },

  workoutCard: {
    borderRadius: RADIUS.lg, marginBottom: SPACING.md, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.borderHigh, flexDirection: 'row',
  },
  redLeftBorder: { width: 4 },
  workoutCardInner: { flex: 1, padding: SPACING.lg },
  workoutCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  workoutDayLabel: { fontSize: 10, fontWeight: '800', color: COLORS.grey, letterSpacing: 3, marginBottom: 6 },
  workoutTitle: { fontSize: 22, fontWeight: '900', color: COLORS.white, textTransform: 'uppercase', letterSpacing: 2 },
  workoutMuscles: { fontSize: 11, color: COLORS.grey, marginTop: 4, fontWeight: '600', letterSpacing: 0.5 },
  workoutStatusIcon: {},
  workoutMotivation: { fontSize: 13, color: COLORS.grey, fontStyle: 'italic', marginBottom: SPACING.md, lineHeight: 20 },
  workoutCTA: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.borderHigh,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.sm,
  },
  workoutCTAText: { color: COLORS.white, fontWeight: '900', fontSize: 11, letterSpacing: 2 },

  scoreCard: {
    flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', gap: SPACING.lg,
  },
  scoreLeft: { alignItems: 'center', gap: 6 },
  scoreRight: { flex: 1, gap: 10 },
  sectionLabel: { fontSize: 9, fontWeight: '900', color: COLORS.grey, letterSpacing: 3, textTransform: 'uppercase', marginBottom: SPACING.md },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreRowLabel: { width: 70, fontSize: 9, color: COLORS.grey, fontWeight: '700', letterSpacing: 1.5 },
  scoreRowBar: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2 },
  scoreRowFill: { height: 4, borderRadius: 2 },
  scoreRowVal: { width: 20, fontSize: 11, color: COLORS.white, fontWeight: '800', textAlign: 'right' },

  metricsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  metricTile: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    padding: 12, borderWidth: 1, borderColor: COLORS.border, gap: 3,
  },
  metricValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: 4 },
  metricValue: { fontSize: 22, fontWeight: '900', lineHeight: 24 },
  metricUnit: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  metricSub: { fontSize: 9, color: COLORS.grey, fontWeight: '600', marginBottom: 6 },
  metricBarBg: { height: 3, backgroundColor: COLORS.border, borderRadius: 2 },
  metricBarFill: { height: 3, borderRadius: 2 },

  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  macroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  macroLabel: { width: 60, fontSize: 9, fontWeight: '900', color: COLORS.grey, letterSpacing: 1.5 },
  macroBarBg: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3 },
  macroBarFill: { height: 6, borderRadius: 3 },
  macroVal: { width: 70, textAlign: 'right', fontSize: 12, fontWeight: '800', color: COLORS.white },
  macroTarget: { color: COLORS.dimmed, fontWeight: '500' },

  streaksGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  streakTile: { alignItems: 'center', gap: 6 },
  streakRing: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  streakCount: { fontSize: 18, fontWeight: '900' },
  streakLabel: { fontSize: 8, color: COLORS.grey, fontWeight: '800', letterSpacing: 2 },

  quoteCard: {
    flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    marginBottom: SPACING.md, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border,
  },
  quoteAccent: { width: 3, backgroundColor: COLORS.red },
  quoteText: { flex: 1, fontSize: 13, color: COLORS.grey, fontStyle: 'italic', lineHeight: 22, padding: SPACING.md },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  modal: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.xl,
    width: '100%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderHigh,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white, letterSpacing: 3, marginBottom: 6 },
  modalSub: { fontSize: 12, color: COLORS.grey, marginBottom: SPACING.lg },
  modalInput: {
    width: '100%', backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.md, padding: SPACING.md,
    color: COLORS.white, fontSize: 32, fontWeight: '900', textAlign: 'center',
    borderWidth: 1, borderColor: COLORS.borderHigh, marginBottom: SPACING.lg,
  },
  modalBtn: {
    backgroundColor: COLORS.red, borderRadius: RADIUS.sm, padding: SPACING.md,
    width: '100%', alignItems: 'center', marginBottom: SPACING.sm,
  },
  modalBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  modalCancel: { color: COLORS.grey, fontSize: 13, fontWeight: '600' },
});
