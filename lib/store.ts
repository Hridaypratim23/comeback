import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from './supabase'

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
  time: string
}

export interface DayLog {
  date: string
  workoutDone: boolean
  exerciseLogs: ExerciseLog[]
  meals: MealEntry[]
  waterMl: number
  steps: number
  xpEarned: number
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

interface AppState {
  today: string
  dayLogs: Record<string, DayLog>
  stats: UserStats
  activeWorkoutId: string | null

  getOrCreateToday: () => DayLog
  markWorkoutDone: () => void
  logSet: (exerciseId: string, setNum: number, reps: number, weight: number) => void
  addMeal: (meal: Omit<MealEntry, 'id' | 'time'>) => void
  removeMeal: (id: string) => void
  addWater: (ml: number) => void
  setSteps: (steps: number) => void
  updateStats: (partial: Partial<UserStats>) => void
  setActiveWorkout: (id: string | null) => void
  syncToSupabase: () => Promise<void>
}

const todayStr = () => new Date().toISOString().split('T')[0]

const defaultDay = (date: string): DayLog => ({
  date,
  workoutDone: false,
  exerciseLogs: [],
  meals: [],
  waterMl: 0,
  steps: 0,
  xpEarned: 0,
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

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      today: todayStr(),
      dayLogs: {},
      stats: defaultStats,
      activeWorkoutId: null,

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
          return { dayLogs: { ...s.dayLogs, [d]: { ...day, exerciseLogs: logs } } }
        })
      },

      addMeal: (meal) => {
        const d = todayStr()
        const entry: MealEntry = { ...meal, id: crypto.randomUUID(), time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
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

      updateStats: (partial) => {
        set(s => ({ stats: { ...s.stats, ...partial } }))
      },

      setActiveWorkout: (id) => set({ activeWorkoutId: id }),

      syncToSupabase: async () => {
        try {
          const d = todayStr()
          const day = get().dayLogs[d]
          const stats = get().stats
          if (!day) return
          await supabase.from('day_logs').upsert({
            date: d,
            workout_done: day.workoutDone,
            water_ml: day.waterMl,
            steps: day.steps,
            xp_earned: day.xpEarned,
            meals: day.meals,
            exercise_logs: day.exerciseLogs,
          }, { onConflict: 'date' })
          await supabase.from('user_stats').upsert({
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
    }),
    {
      name: 'comeback-store',
      partialize: (s) => ({ dayLogs: s.dayLogs, stats: s.stats }),
    }
  )
)

export function getTodayLog() {
  return useStore.getState().getOrCreateToday()
}

export const TARGETS = { calories: 2100, protein: 160, carbs: 220, fat: 65, waterMl: 3000, steps: 10000 }
export const XP_LEVEL = XP_PER_LEVEL
