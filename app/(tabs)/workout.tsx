import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
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
    Alert.alert('💪 WORKOUT COMPLETE!', `+100 XP earned. Keep the streak alive.`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient
        colors={[workout.color + '44', 'transparent']}
        style={styles.headerGrad}
      >
        <Text style={styles.workoutTitle}>{workout.label}</Text>
        <Text style={styles.workoutMuscles}>{workout.muscles}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: workout.color }]} />
          </View>
          <Text style={styles.progressText}>{completedSets}/{totalSets} sets</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {workout.day === 'REST' ? (
          <View style={styles.restCard}>
            <Text style={styles.restEmoji}>😴</Text>
            <Text style={styles.restTitle}>REST DAY</Text>
            <Text style={styles.restSub}>Sleep. Recover. Meal prep. Come back stronger tomorrow.</Text>
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

            {/* Complete Button */}
            <TouchableOpacity
              style={[styles.completeBtn, store.today.workoutCompleted && styles.completeBtnDone]}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={store.today.workoutCompleted ? [COLORS.green, '#1a7a3a'] : [COLORS.red, COLORS.orange]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.completeBtnGrad}
              >
                <Ionicons
                  name={store.today.workoutCompleted ? 'checkmark-circle' : 'trophy'}
                  size={22}
                  color={COLORS.white}
                />
                <Text style={styles.completeBtnText}>
                  {store.today.workoutCompleted ? 'WORKOUT COMPLETE ✓' : 'MARK COMPLETE  +100 XP'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={ratingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>HOW WAS IT?</Text>
            <Text style={styles.modalSub}>Rate your {workout.label} session</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((r) => (
                <TouchableOpacity key={r} onPress={() => setRating(r)}>
                  <Ionicons
                    name="flame"
                    size={36}
                    color={r <= rating ? COLORS.red : COLORS.border}
                  />
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

  return (
    <View style={[styles.exerciseCard, allDone && { borderColor: COLORS.green + '55' }]}>
      <TouchableOpacity style={styles.exerciseHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.exerciseDot, { backgroundColor: allDone ? COLORS.green : workoutColor }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseSets}>{exercise.sets} × {exercise.repsRange}</Text>
          {exercise.notes && <Text style={styles.exerciseNotes}>{exercise.notes}</Text>}
        </View>
        <View style={styles.exerciseDoneRow}>
          <Text style={[styles.exerciseDoneText, { color: allDone ? COLORS.green : COLORS.grey }]}>
            {doneCount}/{exercise.sets}
          </Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.dimmed} />
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
      <View style={[styles.setNumBadge, { backgroundColor: logged ? color + '33' : COLORS.border }]}>
        <Text style={[styles.setNum, { color: logged ? color : COLORS.grey }]}>{setNumber}</Text>
      </View>
      <TextInput
        style={styles.setInput}
        value={weight}
        onChangeText={setWeight}
        placeholder="kg"
        placeholderTextColor={COLORS.dimmed}
        keyboardType="decimal-pad"
        onBlur={handleLog}
      />
      <Text style={styles.setX}>×</Text>
      <TextInput
        style={styles.setInput}
        value={reps}
        onChangeText={setReps}
        placeholder="reps"
        placeholderTextColor={COLORS.dimmed}
        keyboardType="number-pad"
        onBlur={handleLog}
      />
      <TouchableOpacity
        style={[styles.setDoneBtn, { backgroundColor: logged ? COLORS.green + '22' : COLORS.border }]}
        onPress={handleLog}
      >
        <Ionicons name="checkmark" size={16} color={logged ? COLORS.green : COLORS.dimmed} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  headerGrad: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  workoutTitle: { fontSize: 26, fontWeight: '900', color: COLORS.white, letterSpacing: 2, textTransform: 'uppercase' },
  workoutMuscles: { fontSize: 13, color: COLORS.grey, marginTop: 4, fontWeight: '500', marginBottom: SPACING.md },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3 },
  progressBarFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 12, color: COLORS.grey, fontWeight: '700', width: 64, textAlign: 'right' },

  scroll: { flex: 1, paddingHorizontal: SPACING.md },

  restCard: {
    alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  restEmoji: { fontSize: 64 },
  restTitle: { fontSize: 28, fontWeight: '900', color: COLORS.white, letterSpacing: 3 },
  restSub: { fontSize: 14, color: COLORS.grey, textAlign: 'center', lineHeight: 22, paddingHorizontal: SPACING.xl },

  exerciseCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  exerciseDot: { width: 8, height: 8, borderRadius: 4 },
  exerciseName: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  exerciseSets: { fontSize: 12, color: COLORS.grey, marginTop: 2, fontWeight: '600' },
  exerciseNotes: { fontSize: 11, color: COLORS.orange, marginTop: 2, fontStyle: 'italic' },
  exerciseDoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exerciseDoneText: { fontSize: 12, fontWeight: '700' },

  setsContainer: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border + '66' },
  setNumBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  setNum: { fontSize: 13, fontWeight: '800' },
  setInput: {
    flex: 1, backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.sm,
    paddingHorizontal: 10, paddingVertical: 8, color: COLORS.white,
    fontSize: 14, fontWeight: '700', textAlign: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  setX: { color: COLORS.dimmed, fontWeight: '700', fontSize: 14 },
  setDoneBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  finisherCard: {
    backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.orange + '44',
  },
  finisherLabel: { fontSize: 10, fontWeight: '800', color: COLORS.orange, letterSpacing: 2.5, marginBottom: 6 },
  finisherText: { fontSize: 14, color: COLORS.white, fontWeight: '600', lineHeight: 20 },

  completeBtn: { marginBottom: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.sm },
  completeBtnDone: {},
  completeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.md, gap: 10 },
  completeBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  modalCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.xl, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.white, letterSpacing: 2, marginBottom: 6 },
  modalSub: { fontSize: 13, color: COLORS.grey, marginBottom: SPACING.xl },
  ratingRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  modalConfirm: {
    backgroundColor: COLORS.red, borderRadius: RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: 14,
    width: '100%', alignItems: 'center', marginBottom: SPACING.md,
  },
  modalConfirmText: { color: COLORS.white, fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
  modalCancel: { color: COLORS.grey, fontSize: 13, fontWeight: '600' },
});
