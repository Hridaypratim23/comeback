import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const webStorage = {
  getItem: (k: string) => (typeof window !== 'undefined' ? localStorage.getItem(k) : null),
  setItem: (k: string, v: string) => { if (typeof window !== 'undefined') localStorage.setItem(k, v); },
  removeItem: (k: string) => { if (typeof window !== 'undefined') localStorage.removeItem(k); },
};

const zustandStorage = Platform.OS === 'web' ? webStorage : AsyncStorage;
import {
  syncDayLog, syncMeals, syncWater, syncWorkoutSets, syncUserStats,
  deleteMeal as dbDeleteMeal, deleteWaterEntry as dbDeleteWater,
  loadTodayFromSupabase,
} from '../utils/supabase-sync';

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface WaterEntry {
  id: string;
  ml: number;
  time: string;
}

export interface WorkoutSetLog {
  exerciseId: string;
  setIndex: number;
  reps: number;
  weight: number;
}

export interface DayLog {
  date: string;
  workoutCompleted: boolean;
  workoutDay: string;
  meals: Meal[];
  waterEntries: WaterEntry[];
  steps: number;
  sets: WorkoutSetLog[];
  xpEarned: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: string;
}

const ALL_BADGES: Badge[] = [
  { id: 'first-blood', name: 'FIRST BLOOD', icon: '🩸', description: 'Logged your first workout' },
  { id: 'hydrated-3', name: 'HYDRATED', icon: '💧', description: '3L water for 3 consecutive days' },
  { id: 'streak-7', name: 'WEEK WARRIOR', icon: '🔥', description: '7-day workout streak' },
  { id: 'streak-30', name: 'UNSTOPPABLE', icon: '⚡', description: '30-day workout streak' },
  { id: 'protein-7', name: 'PROTEIN KING', icon: '💪', description: 'Hit protein goal 7 days in a row' },
  { id: 'steps-5', name: '10K STEPS', icon: '👣', description: 'Hit 10k steps 5 days in a row' },
  { id: 'perfect-day', name: 'PERFECT DAY', icon: '🎯', description: 'All goals hit in a single day' },
  { id: 'comeback', name: 'THE COMEBACK', icon: '🏆', description: 'Returned after 7+ day break' },
  { id: 'iron-legs', name: 'IRON LEGS', icon: '🦵', description: 'Completed 5 leg days' },
  { id: 'level-10', name: 'LEVEL 10', icon: '🌟', description: 'Reached Level 10' },
];

export interface AppState {
  profile: {
    name: string;
    weight: number;
    height: number;
    bodyFat: number;
    dob: string;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    targetWaterMl: number;
    targetSteps: number;
  };
  today: DayLog;
  history: DayLog[];
  xp: number;
  level: number;
  badges: Badge[];
  streaks: {
    workout: number;
    hydration: number;
    protein: number;
    steps: number;
  };
  notificationsScheduled: boolean;

  // Actions
  addWater: (ml: number) => void;
  removeWaterEntry: (id: string) => void;
  setSteps: (steps: number) => void;
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  removeMeal: (id: string) => void;
  logSet: (set: WorkoutSetLog) => void;
  completeWorkout: (day: string) => void;
  addXp: (amount: number) => void;
  checkBadges: () => void;
  saveAndResetDay: () => void;
  setNotificationsScheduled: (v: boolean) => void;
  updateWeight: (kg: number) => void;
  loadFromCloud: () => Promise<void>;
}

const todayStr = () => new Date().toISOString().split('T')[0];

const freshDay = (): DayLog => ({
  date: todayStr(),
  workoutCompleted: false,
  workoutDay: '',
  meals: [],
  waterEntries: [],
  steps: 0,
  sets: [],
  xpEarned: 0,
});

const levelFromXp = (xp: number) => Math.floor(xp / 200) + 1;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: {
        name: 'Hriday',
        weight: 72,
        height: 167.6,
        bodyFat: 22,
        dob: '1994-11-23',
        targetCalories: 2100,
        targetProtein: 160,
        targetCarbs: 220,
        targetFat: 65,
        targetWaterMl: 3000,
        targetSteps: 10000,
      },
      today: freshDay(),
      history: [],
      xp: 0,
      level: 1,
      badges: ALL_BADGES,
      streaks: { workout: 0, hydration: 0, protein: 0, steps: 0 },
      notificationsScheduled: false,

      addWater: (ml) => {
        const entry: WaterEntry = {
          id: Date.now().toString(),
          ml,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        set((s) => ({ today: { ...s.today, waterEntries: [...s.today.waterEntries, entry] } }));
        setTimeout(() => syncWater(get()), 0);
      },

      removeWaterEntry: (id) => {
        set((s) => ({
          today: { ...s.today, waterEntries: s.today.waterEntries.filter((e) => e.id !== id) },
        }));
        dbDeleteWater(id);
      },

      setSteps: (steps) => {
        set((s) => ({ today: { ...s.today, steps } }));
        setTimeout(() => syncDayLog(get()), 0);
      },

      addMeal: (meal) => {
        const newMeal: Meal = { ...meal, id: Date.now().toString() };
        set((s) => ({ today: { ...s.today, meals: [...s.today.meals, newMeal] } }));
        setTimeout(() => syncMeals(get()), 0);
      },

      removeMeal: (id) => {
        set((s) => ({ today: { ...s.today, meals: s.today.meals.filter((m) => m.id !== id) } }));
        dbDeleteMeal(id);
      },

      logSet: (setLog) => {
        set((s) => {
          const existing = s.today.sets.findIndex(
            (x) => x.exerciseId === setLog.exerciseId && x.setIndex === setLog.setIndex
          );
          const sets =
            existing >= 0
              ? s.today.sets.map((x, i) => (i === existing ? setLog : x))
              : [...s.today.sets, setLog];
          return { today: { ...s.today, sets } };
        });
        setTimeout(() => syncWorkoutSets(get()), 0);
      },

      completeWorkout: (day) => {
        set((s) => ({
          today: { ...s.today, workoutCompleted: true, workoutDay: day },
          streaks: { ...s.streaks, workout: s.streaks.workout + 1 },
        }));
        get().addXp(100);
        get().checkBadges();
        setTimeout(() => { syncDayLog(get()); syncUserStats(get()); }, 0);
      },

      addXp: (amount) => {
        set((s) => {
          const newXp = s.xp + amount;
          return { xp: newXp, level: levelFromXp(newXp) };
        });
        setTimeout(() => syncUserStats(get()), 0);
      },

      checkBadges: () => {
        const { today, streaks, history, badges } = get();
        const now = new Date().toISOString();

        set((s) => {
          let updated = [...s.badges];
          const unlock = (id: string) => {
            updated = updated.map((b) => (b.id === id && !b.unlockedAt ? { ...b, unlockedAt: now } : b));
          };

          const totalWorkouts = s.history.filter((d) => d.workoutCompleted).length;
          if (totalWorkouts >= 1 || today.workoutCompleted) unlock('first-blood');
          if (streaks.workout >= 7) unlock('streak-7');
          if (streaks.workout >= 30) unlock('streak-30');
          if (streaks.hydration >= 3) unlock('hydrated-3');
          if (streaks.protein >= 7) unlock('protein-7');
          if (streaks.steps >= 5) unlock('steps-5');
          if (s.level >= 10) unlock('level-10');

          const legDays = s.history.filter((d) => d.workoutDay === 'LEGS').length;
          if (legDays >= 5) unlock('iron-legs');

          const totalCalories = today.meals.reduce((sum, m) => sum + m.calories, 0);
          const totalProtein = today.meals.reduce((sum, m) => sum + m.protein, 0);
          const totalWater = today.waterEntries.reduce((sum, e) => sum + e.ml, 0);
          const isPerfect =
            today.workoutCompleted &&
            Math.abs(totalCalories - s.profile.targetCalories) < 200 &&
            totalProtein >= s.profile.targetProtein &&
            totalWater >= s.profile.targetWaterMl &&
            today.steps >= s.profile.targetSteps;
          if (isPerfect) unlock('perfect-day');

          return { badges: updated };
        });
      },

      saveAndResetDay: () => {
        const { today, history } = get();
        if (today.date !== todayStr()) {
          set({ history: [...history, today], today: freshDay() });
        }
      },

      setNotificationsScheduled: (v) => set({ notificationsScheduled: v }),

      updateWeight: (kg) => {
        set((s) => ({ profile: { ...s.profile, weight: kg } }));
        setTimeout(() => syncUserStats(get()), 0);
      },

      loadFromCloud: async () => {
        const data = await loadTodayFromSupabase();
        if (!data) return;

        const { dayLog, meals, waterEntries, sets, stats } = data;

        set((s) => {
          const next = { ...s };

          if (dayLog) {
            next.today = {
              ...s.today,
              workoutCompleted: dayLog.workout_completed,
              workoutDay: dayLog.workout_day ?? '',
              steps: Math.max(dayLog.steps, s.today.steps), // keep whichever is higher (HealthKit may be fresher)
            };
          }

          if (meals.length) {
            next.today = {
              ...next.today,
              meals: meals.map((m: any) => ({
                id: m.id,
                name: m.name,
                calories: m.calories,
                protein: m.protein,
                carbs: m.carbs,
                fat: m.fat,
                time: m.logged_time ?? '',
                type: m.meal_type as Meal['type'],
              })),
            };
          }

          if (waterEntries.length) {
            next.today = {
              ...next.today,
              waterEntries: waterEntries.map((e: any) => ({
                id: e.id,
                ml: e.ml,
                time: e.logged_time ?? '',
              })),
            };
          }

          if (sets.length) {
            next.today = {
              ...next.today,
              sets: sets.map((s: any) => ({
                exerciseId: s.exercise_id,
                setIndex: s.set_index,
                reps: s.reps,
                weight: s.weight,
              })),
            };
          }

          if (stats) {
            next.xp = stats.xp ?? s.xp;
            next.level = stats.level ?? s.level;
            next.streaks = {
              workout: stats.streak_workout ?? s.streaks.workout,
              hydration: stats.streak_hydration ?? s.streaks.hydration,
              protein: stats.streak_protein ?? s.streaks.protein,
              steps: stats.streak_steps ?? s.streaks.steps,
            };
            if (stats.weight) next.profile = { ...next.profile, weight: stats.weight };
            if (stats.badges) {
              try {
                const cloudBadges = typeof stats.badges === 'string'
                  ? JSON.parse(stats.badges) : stats.badges;
                if (Array.isArray(cloudBadges) && cloudBadges.length) {
                  next.badges = cloudBadges;
                }
              } catch {}
            }
          }

          return next;
        });
      },
    }),
    {
      name: 'comeback-v1',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

// Derived selectors
export const totalWater = (s: AppState) => s.today.waterEntries.reduce((sum, e) => sum + e.ml, 0);
export const totalCalories = (s: AppState) => s.today.meals.reduce((sum, m) => sum + m.calories, 0);
export const totalProtein = (s: AppState) => s.today.meals.reduce((sum, m) => sum + m.protein, 0);
export const totalCarbs = (s: AppState) => s.today.meals.reduce((sum, m) => sum + m.carbs, 0);
export const totalFat = (s: AppState) => s.today.meals.reduce((sum, m) => sum + m.fat, 0);

export const comebackScore = (s: AppState): number => {
  const water = Math.min(totalWater(s) / s.profile.targetWaterMl, 1) * 25;
  const steps = Math.min(s.today.steps / s.profile.targetSteps, 1) * 25;
  const protein = Math.min(totalProtein(s) / s.profile.targetProtein, 1) * 25;
  const workout = s.today.workoutCompleted ? 25 : 0;
  return Math.round(water + steps + protein + workout);
};
