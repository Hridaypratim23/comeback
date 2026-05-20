import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSupabase } from './supabase'

export interface SetLog {
  setNum: number
  reps: number
  weight: number
  done: boolean
}

export interface ExerciseLog {
  exerciseId: string
  sets: SetLog[]
}

export interface MealEntry {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fibre?: number
  time: string
}

export interface DayLog {
  date: string
  workoutDone: boolean
  selectedWorkoutId?: string
  exerciseLogs: ExerciseLog[]
  checkedExercises: string[]
  workoutNotes: string
  meals: MealEntry[]
  waterMl: number
  steps: number
  xpEarned: number
  habits: Record<string, boolean>
  fastingHours?: number
}

export const DAILY_HABITS = [
  { id: 'sleep', label: '7+ HOURS SLEEP', icon: '😴', xp: 20 },
  { id: 'workout', label: 'WORKOUT TODAY', icon: '💪', xp: 100 },
  { id: 'supplements', label: 'SUPPLEMENTS TAKEN', icon: '💊', xp: 10 },
  { id: 'veggies', label: 'ATE VEGETABLES', icon: '🥦', xp: 10 },
  { id: 'nojunk', label: 'ZERO JUNK FOOD', icon: '🚫', xp: 20 },
]

export interface Measurement {
  date: string
  chest?: number
  waist?: number
  hips?: number
  leftArm?: number
  rightArm?: number
  leftThigh?: number
}

export interface WeeklyCheckin {
  date: string
  rating: number
  weight: number
  intention: string
}

export interface UserStats {
  level: number
  totalXP: number
  streak: number
  workoutsCompleted: number
  badges: string[]
  weight: number
  bodyFat: number
}

export interface ExercisePR {
  weight: number
  reps: number
  date: string
  oneRM: number  // Epley: Math.round(weight * (1 + reps / 30))
}

export interface BodyStatEntry {
  date: string
  weight: number
  bodyFat: number
}

export interface CustomMealTemplate {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fibre?: number
  servingSize?: boolean  // if true, macros are per 50g
}

interface AppState {
  today: string
  dayLogs: Record<string, DayLog>
  stats: UserStats
  activeWorkoutId: string | null
  prs: Record<string, ExercisePR>
  bodyHistory: BodyStatEntry[]
  exerciseHistory: Record<string, Array<{ date: string; maxWeight: number; maxReps: number }>>
  newPR: string | null
  measurements: Measurement[]
  weeklyCheckins: WeeklyCheckin[]
  customMeals: CustomMealTemplate[]

  getOrCreateToday: () => DayLog
  markWorkoutDone: () => void
  logSet: (exerciseId: string, setNum: number, reps: number, weight: number) => void
  selectWorkout: (workoutId: string) => void
  toggleExerciseCheck: (exerciseId: string) => void
  setWorkoutNotes: (notes: string) => void
  addMeal: (meal: Omit<MealEntry, 'id' | 'time'>) => void
  removeMeal: (id: string) => void
  addWater: (ml: number) => void
  setSteps: (steps: number) => void
  addSteps: (steps: number) => void
  toggleHabit: (habitId: string) => void
  updateStats: (partial: Partial<UserStats>) => void
  updateBodyStats: (weight: number, bodyFat: number) => void
  setActiveWorkout: (id: string | null) => void
  clearNewPR: () => void
  addMeasurement: (m: Omit<Measurement, 'date'>) => void
  saveWeeklyCheckin: (c: Omit<WeeklyCheckin, 'date'>) => void
  setFastingHours: (hours: number) => void
  saveCustomMeal: (m: Omit<CustomMealTemplate, 'id'>) => void
  deleteCustomMeal: (id: string) => void
  syncToSupabase: () => Promise<void>
}

const todayStr = () => new Date().toISOString().split('T')[0]

const defaultDay = (date: string): DayLog => ({
  date,
  workoutDone: false,
  exerciseLogs: [],
  checkedExercises: [],
  workoutNotes: '',
  meals: [],
  waterMl: 0,
  steps: 0,
  xpEarned: 0,
  habits: {},
})

const defaultStats: UserStats = {
  level: 1,
  totalXP: 0,
  streak: 0,
  workoutsCompleted: 0,
  badges: [],
  weight: 72,
  bodyFat: 22,
}

const XP = { workout: 100, meal: 10, water250: 5, steps1k: 10 }
const XP_PER_LEVEL = 500

function epley(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      today: todayStr(),
      dayLogs: {},
      stats: defaultStats,
      activeWorkoutId: null,
      prs: {},
      bodyHistory: [],
      exerciseHistory: {},
      newPR: null,
      measurements: [],
      weeklyCheckins: [],
      customMeals: [],

      getOrCreateToday: () => {
        const d = todayStr()
        const existing = get().dayLogs[d]
        if (existing) return existing
        const fresh = defaultDay(d)
        set(s => ({ dayLogs: { ...s.dayLogs, [d]: fresh }, today: d }))
        return fresh
      },

      markWorkoutDone: () => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          if (day.workoutDone) return s
          const xp = day.xpEarned + XP.workout
          const totalXP = s.stats.totalXP + XP.workout
          const level = Math.floor(totalXP / XP_PER_LEVEL) + 1
          return {
            dayLogs: { ...s.dayLogs, [d]: { ...day, workoutDone: true, xpEarned: xp } },
            stats: { ...s.stats, totalXP, level, workoutsCompleted: s.stats.workoutsCompleted + 1, streak: s.stats.streak + 1 },
          }
        })
        get().syncToSupabase()
      },

      logSet: (exerciseId, setNum, reps, weight) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          const logs = [...day.exerciseLogs]
          const idx = logs.findIndex(l => l.exerciseId === exerciseId)
          const newSet: SetLog = { setNum, reps, weight, done: true }
          if (idx >= 0) {
            const sets = [...logs[idx].sets]
            const si = sets.findIndex(ss => ss.setNum === setNum)
            if (si >= 0) sets[si] = newSet; else sets.push(newSet)
            logs[idx] = { ...logs[idx], sets }
          } else {
            logs.push({ exerciseId, sets: [newSet] })
          }

          // Calculate Epley 1RM
          const oneRM = epley(weight, reps)
          const existingPR = s.prs[exerciseId]
          const isPR = !existingPR || oneRM > existingPR.oneRM
          const updatedPRs = isPR
            ? { ...s.prs, [exerciseId]: { weight, reps, date: d, oneRM } }
            : s.prs

          // Update exercise history for today
          const exHistory = { ...s.exerciseHistory }
          const entries = exHistory[exerciseId] ? [...exHistory[exerciseId]] : []
          const todayIdx = entries.findIndex(e => e.date === d)
          const newEntry = {
            date: d,
            maxWeight: Math.max(weight, entries.find(e => e.date === d)?.maxWeight ?? 0),
            maxReps: Math.max(reps, entries.find(e => e.date === d)?.maxReps ?? 0),
          }
          if (todayIdx >= 0) {
            entries[todayIdx] = newEntry
          } else {
            entries.push(newEntry)
          }
          // keep last 30 sessions
          const trimmed = entries.slice(-30)
          exHistory[exerciseId] = trimmed

          return {
            dayLogs: { ...s.dayLogs, [d]: { ...day, exerciseLogs: logs } },
            prs: updatedPRs,
            exerciseHistory: exHistory,
            newPR: isPR ? exerciseId : s.newPR,
          }
        })
      },

      clearNewPR: () => set({ newPR: null }),

      addMeal: (meal) => {
        const d = todayStr()
        const entry: MealEntry = {
          ...meal,
          id: crypto.randomUUID(),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        }
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          const totalXP = s.stats.totalXP + XP.meal
          const level = Math.floor(totalXP / XP_PER_LEVEL) + 1
          return {
            dayLogs: { ...s.dayLogs, [d]: { ...day, meals: [...day.meals, entry], xpEarned: day.xpEarned + XP.meal } },
            stats: { ...s.stats, totalXP, level },
          }
        })
        get().syncToSupabase()
      },

      removeMeal: (id) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d]
          if (!day) return s
          return { dayLogs: { ...s.dayLogs, [d]: { ...day, meals: day.meals.filter(m => m.id !== id) } } }
        })
      },

      addWater: (ml) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          const newMl = day.waterMl + ml
          const prevGlasses = Math.floor(day.waterMl / 250)
          const newGlasses = Math.floor(newMl / 250)
          const xpGain = (newGlasses - prevGlasses) * XP.water250
          const totalXP = s.stats.totalXP + xpGain
          const level = Math.floor(totalXP / XP_PER_LEVEL) + 1
          return {
            dayLogs: { ...s.dayLogs, [d]: { ...day, waterMl: newMl, xpEarned: day.xpEarned + xpGain } },
            stats: { ...s.stats, totalXP, level },
          }
        })
      },

      setSteps: (steps) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          return { dayLogs: { ...s.dayLogs, [d]: { ...day, steps } } }
        })
      },

      addSteps: (steps) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          const prevSteps = day.steps
          const newSteps = prevSteps + steps
          const prevMilestones = Math.floor(prevSteps / 1000)
          const newMilestones = Math.floor(newSteps / 1000)
          const xpGain = (newMilestones - prevMilestones) * XP.steps1k
          const totalXP = s.stats.totalXP + xpGain
          const level = Math.floor(totalXP / XP_PER_LEVEL) + 1
          return {
            dayLogs: { ...s.dayLogs, [d]: { ...day, steps: newSteps, xpEarned: day.xpEarned + xpGain } },
            stats: xpGain > 0 ? { ...s.stats, totalXP, level } : s.stats,
          }
        })
      },

      selectWorkout: (workoutId) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          return { dayLogs: { ...s.dayLogs, [d]: { ...day, selectedWorkoutId: workoutId, checkedExercises: [] } } }
        })
      },

      toggleExerciseCheck: (exerciseId) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          const checked = day.checkedExercises ?? []
          const already = checked.includes(exerciseId)
          return {
            dayLogs: { ...s.dayLogs, [d]: { ...day, checkedExercises: already ? checked.filter(id => id !== exerciseId) : [...checked, exerciseId] } }
          }
        })
      },

      setWorkoutNotes: (notes) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          return { dayLogs: { ...s.dayLogs, [d]: { ...day, workoutNotes: notes } } }
        })
      },

      toggleHabit: (habitId) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          const habits = { ...day.habits }
          const habit = DAILY_HABITS.find(h => h.id === habitId)
          const wasOn = habits[habitId]
          habits[habitId] = !wasOn
          const xpDelta = habit ? (wasOn ? -habit.xp : habit.xp) : 0
          const totalXP = Math.max(0, s.stats.totalXP + xpDelta)
          const level = Math.floor(totalXP / XP_PER_LEVEL) + 1
          return {
            dayLogs: { ...s.dayLogs, [d]: { ...day, habits, xpEarned: Math.max(0, day.xpEarned + xpDelta) } },
            stats: { ...s.stats, totalXP, level },
          }
        })
      },

      updateStats: (partial) => {
        set(s => ({ stats: { ...s.stats, ...partial } }))
      },

      updateBodyStats: (weight: number, bodyFat: number) => {
        const d = todayStr()
        set(s => {
          // Update stats
          const updatedStats = { ...s.stats, weight, bodyFat }

          // Push to bodyHistory, replacing today's entry if exists, keep last 90
          const existing = s.bodyHistory.filter(e => e.date !== d)
          const newEntry: BodyStatEntry = { date: d, weight, bodyFat }
          const updated = [...existing, newEntry]
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-90)

          return { stats: updatedStats, bodyHistory: updated }
        })
        get().syncToSupabase()
      },

      setActiveWorkout: (id) => set({ activeWorkoutId: id }),

      syncToSupabase: async () => {
        try {
          const sb = getSupabase()
          if (!sb) return
          const d = todayStr()
          const day = get().dayLogs[d]
          const stats = get().stats
          if (!day) return
          await sb.from('day_logs').upsert({
            date: d,
            workout_done: day.workoutDone,
            water_ml: day.waterMl,
            steps: day.steps,
            xp_earned: day.xpEarned,
            meals: day.meals,
            exercise_logs: day.exerciseLogs,
          }, { onConflict: 'date' })
          await sb.from('user_stats').upsert({
            id: 'singleton',
            level: stats.level,
            total_xp: stats.totalXP,
            streak: stats.streak,
            workouts_completed: stats.workoutsCompleted,
            badges: stats.badges,
            weight: stats.weight,
            body_fat: stats.bodyFat,
          }, { onConflict: 'id' })
        } catch { /* fire-and-forget */ }
      },

      addMeasurement: (m) => {
        const d = todayStr()
        set(s => ({
          measurements: [...s.measurements.filter(x => x.date !== d), { ...m, date: d }].slice(-90),
        }))
      },

      setFastingHours: (hours) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          return { dayLogs: { ...s.dayLogs, [d]: { ...day, fastingHours: hours } } }
        })
      },

      saveCustomMeal: (m) => {
        set(s => ({
          customMeals: [...s.customMeals, { ...m, id: crypto.randomUUID() }],
        }))
      },

      deleteCustomMeal: (id) => {
        set(s => ({ customMeals: s.customMeals.filter(m => m.id !== id) }))
      },

      saveWeeklyCheckin: (c) => {
        const d = todayStr()
        set(s => {
          const checkins = s.weeklyCheckins.filter(x => x.date !== d)
          const totalXP = s.stats.totalXP + 50
          const level = Math.floor(totalXP / XP_PER_LEVEL) + 1
          return {
            weeklyCheckins: [...checkins, { ...c, date: d }].slice(-52),
            stats: { ...s.stats, totalXP, level },
          }
        })
      },
    }),
    {
      name: 'comeback-store',
      partialize: (s) => ({
        dayLogs: s.dayLogs,
        stats: s.stats,
        prs: s.prs,
        bodyHistory: s.bodyHistory,
        exerciseHistory: s.exerciseHistory,
        measurements: s.measurements,
        weeklyCheckins: s.weeklyCheckins,
        customMeals: s.customMeals,
      }),
    }
  )
)

export function getTodayLog() {
  return useStore.getState().getOrCreateToday()
}

export const TARGETS = { calories: 2100, protein: 160, carbs: 220, fat: 65, fibre: 30, waterMl: 3000, steps: 10000 }
export const XP_LEVEL = XP_PER_LEVEL
