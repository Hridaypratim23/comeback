import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
  Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
const haptic = (fn: () => void) => { if (Platform.OS !== 'web') fn(); };
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useStore, totalCalories, totalProtein, totalCarbs, totalFat, Meal } from '../../store';
import { QUICK_MEALS } from '../../constants/workouts';
import ProgressRing from '../../components/ProgressRing';

type MealType = Meal['type'];

const MEAL_TYPES: { type: MealType; label: string; icon: string; time: string }[] = [
  { type: 'breakfast', label: 'BREAKFAST', icon: '🌅', time: '7–9 AM' },
  { type: 'lunch', label: 'LUNCH', icon: '☀️', time: '12–2 PM' },
  { type: 'dinner', label: 'DINNER', icon: '🌙', time: '7–8 PM' },
  { type: 'snack', label: 'SNACKS', icon: '🍎', time: 'Any time' },
];

export default function NutritionScreen() {
  const store = useStore();
  const [addModal, setAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<MealType>('breakfast');
  const [customMode, setCustomMode] = useState(false);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });

  const calories = totalCalories(store);
  const protein = totalProtein(store);
  const carbs = totalCarbs(store);
  const fat = totalFat(store);

  const calorieColor = calories > store.profile.targetCalories + 100
    ? COLORS.red : calories >= store.profile.targetCalories * 0.9 ? COLORS.green : COLORS.orange;

  const openAdd = (type: MealType) => {
    setSelectedType(type);
    setCustomMode(false);
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setAddModal(true);
  };

  const handleQuickAdd = (meal: typeof QUICK_MEALS[0]) => {
    store.addMeal({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: selectedType,
    });
    store.addXp(5);
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    setAddModal(false);
  };

  const handleCustomAdd = () => {
    const cal = parseInt(form.calories) || 0;
    const prot = parseInt(form.protein) || 0;
    if (!form.name || cal === 0) {
      Alert.alert('Missing Info', 'Enter at least the meal name and calories.');
      return;
    }
    store.addMeal({
      name: form.name,
      calories: cal,
      protein: prot,
      carbs: parseInt(form.carbs) || 0,
      fat: parseInt(form.fat) || 0,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: selectedType,
    });
    store.addXp(5);
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    setAddModal(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>FUEL</Text>
          <Text style={styles.targetText}>Target: {store.profile.targetCalories} kcal</Text>
        </View>

        {/* Calorie Ring + Macros */}
        <View style={styles.card}>
          <View style={styles.calorieSection}>
            <ProgressRing
              size={130}
              strokeWidth={12}
              progress={calories / store.profile.targetCalories}
              color={calorieColor}
              label={`${calories}`}
              sublabel="kcal"
            />
            <View style={styles.macroCircles}>
              <MacroCircle label="PROTEIN" current={protein} target={store.profile.targetProtein} color={COLORS.red} unit="g" />
              <MacroCircle label="CARBS" current={carbs} target={store.profile.targetCarbs} color={COLORS.orange} unit="g" />
              <MacroCircle label="FAT" current={fat} target={store.profile.targetFat} color={COLORS.yellow} unit="g" />
            </View>
          </View>

          {/* Remaining */}
          <View style={styles.remainingRow}>
            <RemainingItem label="REMAINING" value={Math.max(store.profile.targetCalories - calories, 0)} unit="kcal" color={COLORS.grey} />
            <RemainingItem label="PROTEIN LEFT" value={Math.max(store.profile.targetProtein - protein, 0)} unit="g" color={COLORS.red} />
          </View>
        </View>

        {/* Meal Sections */}
        {MEAL_TYPES.map(({ type, label, icon, time }) => {
          const meals = store.today.meals.filter((m) => m.type === type);
          const sectionCals = meals.reduce((sum, m) => sum + m.calories, 0);
          return (
            <View key={type} style={styles.card}>
              <View style={styles.mealSectionHeader}>
                <View style={styles.mealSectionLeft}>
                  <Text style={styles.mealTypeEmoji}>{icon}</Text>
                  <View>
                    <Text style={styles.mealTypeLabel}>{label}</Text>
                    <Text style={styles.mealTypeTime}>{time}</Text>
                  </View>
                </View>
                <View style={styles.mealSectionRight}>
                  {sectionCals > 0 && <Text style={styles.mealSectionCals}>{sectionCals} kcal</Text>}
                  <TouchableOpacity style={styles.addMealBtn} onPress={() => openAdd(type)}>
                    <Ionicons name="add" size={18} color={COLORS.red} />
                  </TouchableOpacity>
                </View>
              </View>

              {meals.length === 0 ? (
                <Text style={styles.emptyMeal}>Tap + to log {label.toLowerCase()}</Text>
              ) : (
                meals.map((meal) => (
                  <View key={meal.id} style={styles.mealItem}>
                    <View style={styles.mealItemLeft}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.mealMacroLine}>
                        P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g · {meal.time}
                      </Text>
                    </View>
                    <View style={styles.mealItemRight}>
                      <Text style={styles.mealCals}>{meal.calories}</Text>
                      <Text style={styles.mealKcal}>kcal</Text>
                      <TouchableOpacity onPress={() => store.removeMeal(meal.id)}>
                        <Ionicons name="trash-outline" size={14} color={COLORS.dimmed} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        })}

      </ScrollView>

      {/* Add Meal Modal */}
      <Modal visible={addModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ADD {selectedType.toUpperCase()}</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.grey} />
              </TouchableOpacity>
            </View>

            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, !customMode && styles.modeBtnActive]}
                onPress={() => setCustomMode(false)}
              >
                <Text style={[styles.modeBtnText, !customMode && styles.modeBtnTextActive]}>QUICK ADD</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, customMode && styles.modeBtnActive]}
                onPress={() => setCustomMode(true)}
              >
                <Text style={[styles.modeBtnText, customMode && styles.modeBtnTextActive]}>CUSTOM</Text>
              </TouchableOpacity>
            </View>

            {!customMode ? (
              <ScrollView style={styles.quickList} showsVerticalScrollIndicator={false}>
                {QUICK_MEALS.map((meal, i) => (
                  <TouchableOpacity key={i} style={styles.quickMealItem} onPress={() => handleQuickAdd(meal)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quickMealName}>{meal.name}</Text>
                      <Text style={styles.quickMealMacros}>P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g</Text>
                    </View>
                    <Text style={styles.quickMealCals}>{meal.calories} kcal</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <CustomInput label="Meal Name" value={form.name} onChange={(v) => setForm(f => ({ ...f, name: v }))} />
                <CustomInput label="Calories (kcal)" value={form.calories} onChange={(v) => setForm(f => ({ ...f, calories: v }))} numeric />
                <CustomInput label="Protein (g)" value={form.protein} onChange={(v) => setForm(f => ({ ...f, protein: v }))} numeric />
                <CustomInput label="Carbs (g)" value={form.carbs} onChange={(v) => setForm(f => ({ ...f, carbs: v }))} numeric />
                <CustomInput label="Fat (g)" value={form.fat} onChange={(v) => setForm(f => ({ ...f, fat: v }))} numeric />
                <TouchableOpacity style={styles.addBtn} onPress={handleCustomAdd}>
                  <Text style={styles.addBtnText}>ADD MEAL</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MacroCircle({ label, current, target, color, unit }: {
  label: string; current: number; target: number; color: string; unit: string;
}) {
  const pct = Math.min(current / target, 1);
  return (
    <View style={styles.macroCircle}>
      <ProgressRing size={66} strokeWidth={6} progress={pct} color={color} label={`${Math.round(current)}`} sublabel={unit} />
      <Text style={[styles.macroCircleLabel, { color }]}>{label}</Text>
    </View>
  );
}

function RemainingItem({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={styles.remainingItem}>
      <Text style={styles.remainingLabel}>{label}</Text>
      <Text style={[styles.remainingValue, { color }]}>{value} <Text style={styles.remainingUnit}>{unit}</Text></Text>
    </View>
  );
}

function CustomInput({ label, value, onChange, numeric }: { label: string; value: string; onChange: (v: string) => void; numeric?: boolean }) {
  return (
    <View style={styles.customInputWrap}>
      <Text style={styles.customInputLabel}>{label}</Text>
      <TextInput
        style={styles.customInput}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'number-pad' : 'default'}
        placeholderTextColor={COLORS.dimmed}
        placeholder={numeric ? '0' : 'Enter name'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1, paddingHorizontal: SPACING.md },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  screenTitle: { fontSize: 26, fontWeight: '900', color: COLORS.white, letterSpacing: 4 },
  targetText: { fontSize: 12, color: COLORS.grey, fontWeight: '600' },

  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },

  calorieSection: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  macroCircles: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  macroCircle: { alignItems: 'center', gap: 5 },
  macroCircleLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },

  remainingRow: { flexDirection: 'row', gap: SPACING.sm },
  remainingItem: { flex: 1, backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.md, padding: 10, alignItems: 'center' },
  remainingLabel: { fontSize: 9, color: COLORS.grey, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  remainingValue: { fontSize: 20, fontWeight: '800' },
  remainingUnit: { fontSize: 12, color: COLORS.grey, fontWeight: '600' },

  mealSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  mealSectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealTypeEmoji: { fontSize: 22 },
  mealTypeLabel: { fontSize: 13, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
  mealTypeTime: { fontSize: 10, color: COLORS.grey, fontWeight: '600' },
  mealSectionRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealSectionCals: { fontSize: 12, color: COLORS.orange, fontWeight: '700' },
  addMealBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.red + '22',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.red + '55',
  },
  emptyMeal: { fontSize: 12, color: COLORS.dimmed, fontStyle: 'italic', paddingVertical: 6 },
  mealItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  mealItemLeft: { flex: 1 },
  mealName: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  mealMacroLine: { fontSize: 11, color: COLORS.grey, marginTop: 2, fontWeight: '500' },
  mealItemRight: { alignItems: 'flex-end', gap: 2 },
  mealCals: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  mealKcal: { fontSize: 9, color: COLORS.grey, fontWeight: '600', letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg, maxHeight: '80%', borderWidth: 1, borderColor: COLORS.border, borderBottomWidth: 0,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: 17, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },

  modeToggle: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 3, marginBottom: SPACING.md },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.sm - 2, alignItems: 'center' },
  modeBtnActive: { backgroundColor: COLORS.red },
  modeBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.grey, letterSpacing: 1 },
  modeBtnTextActive: { color: COLORS.white },

  quickList: { maxHeight: 340 },
  quickMealItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  quickMealName: { fontSize: 14, fontWeight: '600', color: COLORS.white, marginBottom: 3 },
  quickMealMacros: { fontSize: 11, color: COLORS.grey, fontWeight: '500' },
  quickMealCals: { fontSize: 15, fontWeight: '800', color: COLORS.orange },

  customInputWrap: { marginBottom: SPACING.sm },
  customInputLabel: { fontSize: 10, fontWeight: '700', color: COLORS.grey, letterSpacing: 1.5, marginBottom: 6 },
  customInput: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.sm,
    color: COLORS.white, fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: COLORS.border,
  },
  addBtn: {
    backgroundColor: COLORS.red, borderRadius: RADIUS.full, padding: SPACING.md,
    alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.xl,
  },
  addBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
});
