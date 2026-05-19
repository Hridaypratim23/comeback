import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, Modal, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
const haptic = (fn: () => void) => { if (Platform.OS !== 'web') fn(); };
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useStore } from '../../store';
import { getTodayWorkout, Exercise } from '../../constants/workouts';

export default function WorkoutScreen() {
  const store = useStore();
  const workout = getTodayWorkout();
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const [ratingModal, setRatingModal] = useState(false);
  const [rating, setRating] = useState(4);

  const completedSets = store.today.sets.length;
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const progress = totalSets > 0 ? completedSets / totalSets : 0;
  const pct = Math.round(progress * 100);

  const handleComplete = () => {
    if (store.today.workoutCompleted) {
      Alert.alert('Already Done!', 'You crushed this workout today. Come back tomorrow.');
      return;
    }
    setRatingModal(true);
  };

  const confirmComplete = () => {
    store.completeWorkout(workout.day);
    store.addXp(100);
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    setRatingModal(false);
    Alert.alert('WORKOUT COMPLETE!', '+100 XP earned. Keep the streak alive.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[workout.color + '28', COLORS.bg]} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenLabel}>LIFT</Text>
            <Text style={styles.workoutName}>{workout.label.toUpperCase()}</Text>
            <Text style={styles.workoutMuscles}>{workout.muscles}</Text>
          </View>
          <View style={[styles.pctPill, { borderColor: workout.color + '66' }]}>
            <Text style={[styles.pctText, { color: workout.color }]}>{pct}%</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${pct}%` as any, backgroundColor: workout.color }]} />
        </View>
        <Text style={styles.progressLabel}>{completedSets} / {totalSets} SETS LOGGED</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {workout.day === 'REST' ? (
          <View style={styles.restCard}>
            <Ionicons name="moon" size={56} color={COLORS.blue} />
            <Text style={styles.restTitle}>REST DAY</Text>
            <Text style={styles.restSub}>Sleep. Recover. Eat your macros.{'\n'}Come back stronger tomorrow.</Text>
          </View>
        ) : (
          <>
            {workout.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                workoutColor={workout.color}
                loggedSets={store.today.sets.filter(s => s.exerciseId === exercise.id)}
                onLogSet={(setIndex, reps, weight) => {
                  store.logSet({ exerciseId: exercise.id, setIndex, reps, weight });
                  haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
                }}
                expanded={expandedEx === exercise.id}
                onToggle={() => setExpandedEx(expandedEx === exercise.id ? null : exercise.id)}
              />
            ))}

            {workout.finisher && (
              <View style={styles.finisherCard}>
                <Text style={styles.finisherLabel}>FINISHER</Text>
                <Text style={styles.finisherText}>{workout.finisher}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.8}>
              <LinearGradient
                colors={store.today.workoutCompleted ? [COLORS.green, COLORS.greenHot] : [COLORS.red, COLORS.orange]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.completeBtnGrad}
              >
                <Ionicons
                  name={store.today.workoutCompleted ? 'checkmark-circle' : 'trophy'}
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.completeBtnText}>
                  {store.today.workoutCompleted ? 'WORKOUT COMPLETE' : 'MARK COMPLETE  +100 XP'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={ratingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>RATE THE SESSION</Text>
            <Text style={styles.modalSub}>{workout.label.toUpperCase()} — HOW HARD DID YOU PUSH?</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((r) => (
                <TouchableOpacity key={r} onPress={() => setRating(r)}>
                  <Ionicons name="flame" size={38} color={r <= rating ? COLORS.redHot : COLORS.border} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalConfirm} onPress={confirmComplete}>
              <Text style={styles.modalConfirmText}>COMPLETE SESSION</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRatingModal(false)}>
              <Text style={styles.modalCancel}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ExerciseCard({
  exercise, workoutColor, loggedSets, onLogSet, expanded, onToggle,
}: {
  exercise: Exercise;
  workoutColor: string;
  loggedSets: { setIndex: number; reps: number; weight: number }[];
  onLogSet: (setIndex: number, reps: number, weight: number) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const doneCount = loggedSets.length;
  const allDone = doneCount >= exercise.sets;
  const accentColor = allDone ? COLORS.greenHot : workoutColor;

  return (
    <View style={[styles.exerciseCard, { borderLeftColor: accentColor }]}>
      <TouchableOpacity style={styles.exerciseHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.exerciseName, allDone && { color: COLORS.greenHot }]}>{exercise.name}</Text>
          <Text style={styles.exerciseSets}>{exercise.sets} × {exercise.repsRange}</Text>
          {exercise.notes && <Text style={styles.exerciseNotes}>{exercise.notes}</Text>}
        </View>
        <View style={styles.exerciseDoneRow}>
          <View style={[styles.setsBadge, { backgroundColor: allDone ? COLORS.greenHot + '1A' : COLORS.cardAlt }]}>
            <Text style={[styles.setsText, { color: allDone ? COLORS.greenHot : COLORS.grey }]}>
              {doneCount}/{exercise.sets}
            </Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.grey} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.setsContainer}>
          {Array.from({ length: exercise.sets }, (_, i) => (
            <SetRow
              key={i}
              setIndex={i}
              setNumber={i + 1}
              logged={loggedSets.find(s => s.setIndex === i)}
              onLog={(reps, weight) => onLogSet(i, reps, weight)}
              color={workoutColor}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function SetRow({ setIndex, setNumber, logged, onLog, color }: {
  setIndex: number; setNumber: number;
  logged?: { reps: number; weight: number };
  onLog: (reps: number, weight: number) => void;
  color: string;
}) {
  const [reps, setReps] = useState(logged?.reps?.toString() ?? '');
  const [weight, setWeight] = useState(logged?.weight?.toString() ?? '');

  const handleLog = () => {
    const r = parseInt(reps) || 0;
    const w = parseFloat(weight) || 0;
    if (r > 0) onLog(r, w);
  };

  return (
    <View style={styles.setRow}>
      <View style={[styles.setNumBadge, { borderColor: logged ? color : COLORS.border }]}>
        <Text style={[styles.setNum, { color: logged ? color : COLORS.grey }]}>S{setNumber}</Text>
      </View>
      <TextInput
        style={[styles.setInput, logged && { borderColor: color + '55' }]}
        value={weight}
        onChangeText={setWeight}
        placeholder="kg"
        placeholderTextColor={COLORS.dimmed}
        keyboardType="decimal-pad"
        onBlur={handleLog}
      />
      <Text style={styles.setX}>×</Text>
      <TextInput
        style={[styles.setInput, logged && { borderColor: color + '55' }]}
        value={reps}
        onChangeText={setReps}
        placeholder="reps"
        placeholderTextColor={COLORS.dimmed}
        keyboardType="number-pad"
        onBlur={handleLog}
      />
      <TouchableOpacity
        style={[styles.setDoneBtn, logged && { backgroundColor: COLORS.greenHot + '1A', borderColor: COLORS.greenHot + '55' }]}
        onPress={handleLog}
      >
        <Ionicons name="checkmark" size={16} color={logged ? COLORS.greenHot : COLORS.dimmed} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  screenLabel: { fontSize: 11, fontWeight: '800', color: COLORS.grey, letterSpacing: 3, marginBottom: 4 },
  workoutName: { fontSize: 26, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  workoutMuscles: { fontSize: 12, color: COLORS.grey, fontWeight: '600', marginTop: 3, letterSpacing: 0.5 },
  pctPill: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  pctText: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  progressBarBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginBottom: 8 },
  progressBarFill: { height: 4, borderRadius: 2 },
  progressLabel: { fontSize: 10, color: COLORS.grey, fontWeight: '700', letterSpacing: 2 },

  scroll: { flex: 1, paddingHorizontal: SPACING.md },

  restCard: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.md, marginTop: SPACING.xl },
  restTitle: { fontSize: 32, fontWeight: '900', color: COLORS.white, letterSpacing: 5 },
  restSub: { fontSize: 14, color: COLORS.grey, textAlign: 'center', lineHeight: 24, paddingHorizontal: SPACING.xl },

  exerciseCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3, overflow: 'hidden',
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  exerciseName: { fontSize: 15, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  exerciseSets: { fontSize: 12, color: COLORS.grey, marginTop: 3, fontWeight: '600' },
  exerciseNotes: { fontSize: 11, color: COLORS.orangeHot, marginTop: 3, fontWeight: '600' },
  exerciseDoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setsBadge: { borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4 },
  setsText: { fontSize: 12, fontWeight: '800' },

  setsContainer: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border + '44' },
  setNumBadge: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  setNum: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  setInput: {
    flex: 1, backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.sm,
    paddingHorizontal: 8, paddingVertical: 9, color: COLORS.white,
    fontSize: 14, fontWeight: '700', textAlign: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  setX: { color: COLORS.grey, fontWeight: '700', fontSize: 13 },
  setDoneBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.cardAlt, borderWidth: 1, borderColor: COLORS.border,
  },

  finisherCard: {
    backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3, borderLeftColor: COLORS.orangeHot,
  },
  finisherLabel: { fontSize: 10, fontWeight: '800', color: COLORS.orangeHot, letterSpacing: 2.5, marginBottom: 6 },
  finisherText: { fontSize: 14, color: COLORS.white, fontWeight: '600', lineHeight: 22 },

  completeBtn: { marginBottom: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.sm },
  completeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  completeBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '900', letterSpacing: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  modalCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.xl,
    width: '100%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderHigh,
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.white, letterSpacing: 2, marginBottom: 6 },
  modalSub: { fontSize: 11, color: COLORS.grey, marginBottom: SPACING.xl, letterSpacing: 1.5, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  modalConfirm: {
    backgroundColor: COLORS.redHot, borderRadius: RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: 16,
    width: '100%', alignItems: 'center', marginBottom: SPACING.md,
  },
  modalConfirmText: { color: COLORS.white, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  modalCancel: { color: COLORS.grey, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
});
