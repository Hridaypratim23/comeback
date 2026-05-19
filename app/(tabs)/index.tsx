import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
  Modal, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useStore, totalWater, totalCalories, totalProtein, comebackScore } from '../../store';
import { getTodayWorkout, MOTIVATION_BY_DAY } from '../../constants/workouts';
import ProgressRing from '../../components/ProgressRing';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const QUOTES = [
  "You didn't come this far to only come this far.",
  "The only bad workout is the one that didn't happen.",
  "Champions are made in the moments they want to quit.",
  "Pain is temporary. Quitting lasts forever.",
  "Be the hardest worker in the room.",
  "Earn it. Every single day.",
  "No shortcuts. No excuses. No looking back.",
];

export default function HomeScreen() {
  const router = useRouter();
  const store = useStore();
  const [stepsModal, setStepsModal] = useState(false);
  const [stepsInput, setStepsInput] = useState('');
  const water = totalWater(store);
  const calories = totalCalories(store);
  const protein = totalProtein(store);
  const score = comebackScore(store);
  const carbs = store.today.meals.reduce((a, m) => a + m.carbs, 0);
  const fat = store.today.meals.reduce((a, m) => a + m.fat, 0);

  const now = new Date();
  const workout = useMemo(() => getTodayWorkout(), []);
  const quote = QUOTES[now.getDay()];
  const motivations = MOTIVATION_BY_DAY[workout.day];
  const motivation = motivations[0];
  const dateStr = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
  const xpToNext = 200 - (store.xp % 200);
  const xpProgress = (store.xp % 200) / 200;

  const scoreColor = score >= 80 ? COLORS.green : score >= 50 ? COLORS.orange : COLORS.red;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>COMEBACK</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <TouchableOpacity style={styles.xpBadge} onPress={() => router.push('/(tabs)/progress')}>
            <Text style={styles.xpLevel}>LVL {store.level}</Text>
            <Text style={styles.xpText}>{store.xp} XP</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Workout Card */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/workout')}>
          <LinearGradient
            colors={[workout.color + 'CC', '#111111']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1.5, y: 1 }}
            style={styles.workoutCard}
          >
            <View style={styles.workoutCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.workoutCardLabel}>{workout.label}</Text>
                <Text style={styles.workoutCardMuscles}>{workout.muscles}</Text>
              </View>
              {store.today.workoutCompleted
                ? <Ionicons name="checkmark-circle" size={34} color={COLORS.green} />
                : <Ionicons name="arrow-forward-circle" size={34} color="rgba(255,255,255,0.9)" />
              }
            </View>
            <Text style={styles.motivationText}>"{motivation}"</Text>
            <View style={styles.workoutCardBtn}>
              <Text style={styles.workoutCardBtnText}>
                {store.today.workoutCompleted ? 'COMPLETED ✓' : 'START WORKOUT →'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* COMEBACK Score */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>COMEBACK SCORE</Text>
          <View style={styles.scoreRow}>
            <ProgressRing
              size={100}
              strokeWidth={9}
              progress={score / 100}
              color={scoreColor}
              label={`${score}`}
              sublabel="score"
            />
            <View style={styles.scoreDetails}>
              <ScoreItem label="WORKOUT" pts={store.today.workoutCompleted ? 25 : 0} max={25} />
              <ScoreItem label="PROTEIN" pts={Math.round(Math.min(protein / store.profile.targetProtein, 1) * 25)} max={25} />
              <ScoreItem label="HYDRATION" pts={Math.round(Math.min(water / store.profile.targetWaterMl, 1) * 25)} max={25} />
              <ScoreItem label="STEPS" pts={Math.round(Math.min(store.today.steps / store.profile.targetSteps, 1) * 25)} max={25} />
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="water"
            iconColor={COLORS.blue}
            value={`${(water / 1000).toFixed(1)}L`}
            target={`${store.profile.targetWaterMl / 1000}L`}
            label="WATER"
            progress={water / store.profile.targetWaterMl}
            onPress={() => router.push('/(tabs)/hydration')}
          />
          <StatCard
            icon="footsteps"
            iconColor={COLORS.yellow}
            value={store.today.steps >= 1000 ? `${(store.today.steps/1000).toFixed(1)}k` : store.today.steps.toString()}
            target="10k"
            label="STEPS"
            progress={store.today.steps / store.profile.targetSteps}
            onPress={() => { setStepsInput(store.today.steps.toString()); setStepsModal(true); }}
          />
          <StatCard
            icon="flame"
            iconColor={COLORS.orange}
            value={`${calories}`}
            target={`${store.profile.targetCalories}`}
            label="KCAL"
            progress={calories / store.profile.targetCalories}
            onPress={() => router.push('/(tabs)/nutrition')}
          />
        </View>

        {/* Macros */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TODAY'S MACROS</Text>
          <MacroBar label="PROTEIN" current={protein} target={store.profile.targetProtein} color={COLORS.red} />
          <MacroBar label="CARBS" current={carbs} target={store.profile.targetCarbs} color={COLORS.orange} />
          <MacroBar label="FAT" current={fat} target={store.profile.targetFat} color={COLORS.yellow} />
        </View>

        {/* Streaks */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>STREAKS 🔥</Text>
          <View style={styles.streaksRow}>
            <StreakBadge icon="barbell" label="GYM" count={store.streaks.workout} color={COLORS.red} />
            <StreakBadge icon="water" label="WATER" count={store.streaks.hydration} color={COLORS.blue} />
            <StreakBadge icon="restaurant" label="NUTRITION" count={store.streaks.protein} color={COLORS.orange} />
            <StreakBadge icon="footsteps" label="STEPS" count={store.streaks.steps} color={COLORS.yellow} />
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.card}>
          <View style={styles.xpRow}>
            <Text style={styles.cardTitle}>LEVEL {store.level}</Text>
            <Text style={styles.xpNextText}>{xpToNext} XP to next level</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` }]} />
          </View>
          <Text style={styles.xpTotalText}>{store.xp} total XP</Text>
        </View>

        {/* Quote */}
        <View style={[styles.card, styles.quoteCard]}>
          <Ionicons name="flame" size={20} color={COLORS.red} style={{ marginBottom: 8 }} />
          <Text style={styles.quoteText}>"{quote}"</Text>
        </View>

      </ScrollView>

      {/* Steps Modal */}
      <Modal visible={stepsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>LOG STEPS</Text>
            <Text style={styles.modalSub}>How many steps have you taken today?</Text>
            <TextInput
              style={styles.modalInput}
              value={stepsInput}
              onChangeText={setStepsInput}
              keyboardType="number-pad"
              placeholder="e.g. 8500"
              placeholderTextColor={COLORS.dimmed}
              autoFocus
            />
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                const s = parseInt(stepsInput) || 0;
                store.setSteps(s);
                if (s >= store.profile.targetSteps) store.addXp(35);
                setStepsModal(false);
              }}
            >
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

function ScoreItem({ label, pts, max }: { label: string; pts: number; max: number }) {
  return (
    <View style={styles.scoreItem}>
      <Text style={styles.scoreItemLabel}>{label}</Text>
      <Text style={[styles.scoreItemValue, { color: pts >= max ? COLORS.green : COLORS.white }]}>
        {pts}/{max}
      </Text>
    </View>
  );
}

function StatCard({ icon, iconColor, value, target, label, progress, onPress }: {
  icon: any; iconColor: string; value: string; target: string;
  label: string; progress: number; onPress: () => void;
}) {
  const pct = Math.min(progress, 1);
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTarget}>/{target}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statBarBg}>
        <View style={[styles.statBarFill, { width: `${pct * 100}%`, backgroundColor: iconColor }]} />
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
        <View style={[styles.macroBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroValue}>
        {Math.round(current)}<Text style={styles.macroTarget}>/{target}g</Text>
      </Text>
    </View>
  );
}

function StreakBadge({ icon, label, count, color }: { icon: any; label: string; count: number; color: string }) {
  const active = count > 0;
  return (
    <View style={styles.streakBadge}>
      <View style={[styles.streakIconWrap, { borderColor: active ? color : COLORS.border, backgroundColor: active ? color + '22' : COLORS.cardAlt }]}>
        <Ionicons name={icon} size={18} color={active ? color : COLORS.dimmed} />
      </View>
      <Text style={[styles.streakCount, { color: active ? COLORS.white : COLORS.dimmed }]}>{count}</Text>
      <Text style={styles.streakLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1, paddingHorizontal: SPACING.md },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingTop: SPACING.lg, paddingBottom: SPACING.md,
  },
  appName: { fontSize: 26, fontWeight: '900', color: COLORS.white, letterSpacing: 4 },
  dateText: { fontSize: 12, color: COLORS.grey, marginTop: 3, fontWeight: '600', letterSpacing: 0.5 },
  xpBadge: { alignItems: 'flex-end', backgroundColor: COLORS.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  xpLevel: { fontSize: 15, fontWeight: '800', color: COLORS.red },
  xpText: { fontSize: 11, color: COLORS.grey, fontWeight: '600' },

  workoutCard: {
    borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  workoutCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  workoutCardLabel: { fontSize: 20, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  workoutCardMuscles: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4, fontWeight: '500' },
  motivationText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginBottom: SPACING.md, lineHeight: 20 },
  workoutCardBtn: {
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  workoutCardBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 12, letterSpacing: 1.5 },

  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 10, fontWeight: '800', color: COLORS.grey, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: SPACING.md },

  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  scoreDetails: { flex: 1, gap: 10 },
  scoreItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreItemLabel: { fontSize: 10, color: COLORS.grey, fontWeight: '700', letterSpacing: 1.5 },
  scoreItemValue: { fontSize: 12, fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.white, marginTop: 6 },
  statTarget: { fontSize: 10, color: COLORS.dimmed, fontWeight: '600', marginBottom: 2 },
  statLabel: { fontSize: 9, color: COLORS.grey, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  statBarBg: { width: '100%', height: 3, backgroundColor: COLORS.border, borderRadius: 2 },
  statBarFill: { height: 3, borderRadius: 2 },

  macroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  macroLabel: { width: 62, fontSize: 10, fontWeight: '700', color: COLORS.grey, letterSpacing: 1.5 },
  macroBarBg: { flex: 1, height: 7, backgroundColor: COLORS.border, borderRadius: 4 },
  macroBarFill: { height: 7, borderRadius: 4 },
  macroValue: { width: 72, textAlign: 'right', fontSize: 12, fontWeight: '700', color: COLORS.white },
  macroTarget: { color: COLORS.dimmed, fontWeight: '400' },

  streaksRow: { flexDirection: 'row', justifyContent: 'space-around' },
  streakBadge: { alignItems: 'center', gap: 5 },
  streakIconWrap: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  streakCount: { fontSize: 17, fontWeight: '800' },
  streakLabel: { fontSize: 8, color: COLORS.grey, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },

  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  xpNextText: { fontSize: 11, color: COLORS.grey, fontWeight: '600' },
  xpBarBg: { height: 8, backgroundColor: COLORS.border, borderRadius: 4 },
  xpBarFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.red },
  xpTotalText: { fontSize: 10, color: COLORS.dimmed, marginTop: 6, fontWeight: '600' },

  quoteCard: { backgroundColor: COLORS.bg, borderColor: COLORS.border, alignItems: 'center', paddingVertical: SPACING.lg },
  quoteText: { fontSize: 14, color: COLORS.grey, fontStyle: 'italic', lineHeight: 22, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  modalCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.xl, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white, letterSpacing: 2, marginBottom: 6 },
  modalSub: { fontSize: 13, color: COLORS.grey, marginBottom: SPACING.lg, textAlign: 'center' },
  modalInput: {
    width: '100%', backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.md, padding: SPACING.md,
    color: COLORS.white, fontSize: 28, fontWeight: '800', textAlign: 'center',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg,
  },
  modalBtn: { backgroundColor: COLORS.yellow, borderRadius: RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: SPACING.md },
  modalBtnText: { color: COLORS.bg, fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
  modalCancel: { color: COLORS.grey, fontSize: 13, fontWeight: '600' },
});
