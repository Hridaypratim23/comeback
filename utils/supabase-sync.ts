import { supabase, isConfigured } from '../lib/supabase';
import type { AppState } from '../store';

const today = () => new Date().toISOString().split('T')[0];

// Upsert today's day_log row
export async function syncDayLog(state: AppState) {
  if (!isConfigured()) return;
  const date = today();
  await supabase.from('day_logs').upsert({
    date,
    workout_completed: state.today.workoutCompleted,
    workout_day: state.today.workoutDay,
    steps: state.today.steps,
    xp_earned: state.today.xpEarned,
    updated_at: new Date().toISOString(),
  });
}

// Upsert all meals for today
export async function syncMeals(state: AppState) {
  if (!isConfigured()) return;
  const date = today();

  // Ensure day_log row exists first
  await supabase.from('day_logs').upsert({ date }, { onConflict: 'date' });

  if (!state.today.meals.length) return;
  await supabase.from('meals').upsert(
    state.today.meals.map((m) => ({
      id: m.id,
      day_date: date,
      name: m.name,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      meal_type: m.type,
      logged_time: m.time,
    }))
  );
}

// Delete a meal
export async function deleteMeal(id: string) {
  if (!isConfigured()) return;
  await supabase.from('meals').delete().eq('id', id);
}

// Upsert water entries
export async function syncWater(state: AppState) {
  if (!isConfigured()) return;
  const date = today();

  await supabase.from('day_logs').upsert({ date }, { onConflict: 'date' });

  if (!state.today.waterEntries.length) return;
  await supabase.from('water_entries').upsert(
    state.today.waterEntries.map((e) => ({
      id: e.id,
      day_date: date,
      ml: e.ml,
      logged_time: e.time,
    }))
  );
}

// Delete water entry
export async function deleteWaterEntry(id: string) {
  if (!isConfigured()) return;
  await supabase.from('water_entries').delete().eq('id', id);
}

// Upsert workout sets
export async function syncWorkoutSets(state: AppState) {
  if (!isConfigured()) return;
  const date = today();

  await supabase.from('day_logs').upsert({ date }, { onConflict: 'date' });

  if (!state.today.sets.length) return;
  await supabase.from('workout_sets').upsert(
    state.today.sets.map((s) => ({
      day_date: date,
      exercise_id: s.exerciseId,
      set_index: s.setIndex,
      reps: s.reps,
      weight: s.weight,
    })),
    { onConflict: 'day_date,exercise_id,set_index' }
  );
}

// Upsert user stats (XP, level, weight, streaks, badges)
export async function syncUserStats(state: AppState) {
  if (!isConfigured()) return;
  await supabase.from('user_stats').upsert({
    id: 1,
    xp: state.xp,
    level: state.level,
    weight: state.profile.weight,
    body_fat: state.profile.bodyFat,
    streak_workout: state.streaks.workout,
    streak_hydration: state.streaks.hydration,
    streak_protein: state.streaks.protein,
    streak_steps: state.streaks.steps,
    badges: JSON.stringify(state.badges),
    updated_at: new Date().toISOString(),
  });
}

// Load today from Supabase on app start
export async function loadTodayFromSupabase() {
  if (!isConfigured()) return null;
  const date = today();

  const [dayRes, mealsRes, waterRes, setsRes, statsRes] = await Promise.all([
    supabase.from('day_logs').select('*').eq('date', date).single(),
    supabase.from('meals').select('*').eq('day_date', date),
    supabase.from('water_entries').select('*').eq('day_date', date),
    supabase.from('workout_sets').select('*').eq('day_date', date),
    supabase.from('user_stats').select('*').eq('id', 1).single(),
  ]);

  return {
    dayLog: dayRes.data,
    meals: mealsRes.data ?? [],
    waterEntries: waterRes.data ?? [],
    sets: setsRes.data ?? [],
    stats: statsRes.data,
  };
}
