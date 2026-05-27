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

export interface CardioLog {
  type: 'incline_walk' | 'cross_trainer'
  minutes: number
  caloriesBurned: number
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
  cardio?: CardioLog
  intimacyMinutes?: number
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
  unit?: string       // if set, macros are per 1 unit (or per 100g if unit==='g')
  servingSize?: boolean  // legacy field — kept for backward compat
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
  pendingStepFixes?: Record<string, number>
  stepsOverride: Record<string, number>

  getOrCreateToday: () => DayLog
  markWorkoutDone: () => void
  logSet: (exerciseId: string, setNum: number, reps: number, weight: number) => void
  selectWorkout: (workoutId: string) => void
  toggleExerciseCheck: (exerciseId: string) => void
  setWorkoutNotes: (notes: string) => void
  logCardio: (cardio: CardioLog | null) => void
  logIntimacy: (minutes: number | null) => void
  addMeal: (meal: Omit<MealEntry, 'id' | 'time'>) => void
  removeMeal: (id: string) => void
  updateMeal: (id: string, updates: Partial<Omit<MealEntry, 'id' | 'time'>>) => void
  addWater: (ml: number) => void
  setSteps: (steps: number) => void
  setStepsForDate: (date: string, steps: number) => void
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
  mergeRemoteState: (remote: Partial<AppState>) => void
}

export const localDateStr = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const todayStr = () => localDateStr()

function mergeByDate<T extends { date: string }>(remote: T[], local: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of remote) map.set(item.date, item)
  for (const item of local) map.set(item.date, item) // local wins per date
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
}

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

// Synchronous localStorage patch — runs before Zustand rehydrates so the
// bad value never enters the initial state, regardless of migration timing.
if (typeof window !== 'undefined') {
  try {
    const _raw = localStorage.getItem('comeback-store')
    if (_raw) {
      const _parsed = JSON.parse(_raw)
      const _s = _parsed?.state ?? _parsed
      if (_s?.dayLogs) {
        const _today = localDateStr()
        let _dirty = false
        for (const _k of Object.keys(_s.dayLogs as Record<string, unknown>)) {
          const _entry = (_s.dayLogs as Record<string, {steps?: number}>)[_k]
          if (_k < _today && (_entry?.steps ?? 0) > 90000) {
            _s.dayLogs[_k] = { ..._entry, steps: 0 }
            _dirty = true
          }
        }
        if (_dirty) localStorage.setItem('comeback-store', JSON.stringify(_parsed))
      }
    }
  } catch { /* ignore */ }
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
      stepsOverride: { '2025-05-22': 0 },

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
          const habits = { ...day.habits, workout: true }
          return {
            dayLogs: { ...s.dayLogs, [d]: { ...day, workoutDone: true, xpEarned: xp, habits } },
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

      updateMeal: (id, updates) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d]
          if (!day) return s
          return {
            dayLogs: {
              ...s.dayLogs,
              [d]: { ...day, meals: day.meals.map(m => m.id === id ? { ...m, ...updates } : m) },
            },
          }
        })
      },

      addWater: (ml) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          const newMl = Math.max(0, day.waterMl + ml)
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
        get().syncToSupabase()
      },

      setSteps: (steps) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          return { dayLogs: { ...s.dayLogs, [d]: { ...day, steps } } }
        })
      },

      setStepsForDate: (date, steps) => {
        set(s => {
          const day = s.dayLogs[date] ?? defaultDay(date)
          return { dayLogs: { ...s.dayLogs, [date]: { ...day, steps } } }
        })
        get().syncToSupabase()
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

      logCardio: (cardio) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          return { dayLogs: { ...s.dayLogs, [d]: { ...day, cardio: cardio ?? undefined } } }
        })
      },

      logIntimacy: (minutes) => {
        const d = todayStr()
        set(s => {
          const day = s.dayLogs[d] ?? defaultDay(d)
          return { dayLogs: { ...s.dayLogs, [d]: { ...day, intimacyMinutes: minutes ?? undefined } } }
        })
        get().syncToSupabase()
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
        get().syncToSupabase()
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
          const s = get()
          // Apply overrides to dayLogs before sending — prevents bad step counts from ever reaching Supabase
          const patchedDayLogs = { ...s.dayLogs }
          for (const [date, steps] of Object.entries(s.stepsOverride)) {
            if (patchedDayLogs[date]) patchedDayLogs[date] = { ...patchedDayLogs[date], steps }
          }
          const payload = {
            dayLogs: patchedDayLogs,
            stats: s.stats,
            prs: s.prs,
            bodyHistory: s.bodyHistory,
            exerciseHistory: s.exerciseHistory,
            measurements: s.measurements,
            weeklyCheckins: s.weeklyCheckins,
            customMeals: s.customMeals,
            stepsOverride: s.stepsOverride,
          }
          await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        } catch { /* fire-and-forget */ }
      },

      mergeRemoteState: (remote) => {
        set(s => {
          // Merge dayLogs: meals from whichever has more; numeric activity fields take max
          const mergedDayLogs: Record<string, DayLog> = { ...remote.dayLogs }
          const today = todayStr()
          for (const [date, local] of Object.entries(s.dayLogs)) {
            const rem = mergedDayLogs[date]
            if (!rem) { mergedDayLogs[date] = local; continue }
            const base = local.meals.length >= rem.meals.length ? local : rem
            mergedDayLogs[date] = {
              ...base,
              // Today: take max (step counter may still be accumulating mid-day)
              // Past dates: remote is authoritative — lets fix-steps corrections stick permanently
              steps: date === today
                ? Math.max(local.steps ?? 0, rem.steps ?? 0)
                : (rem.steps ?? local.steps ?? 0),
              waterMl:      Math.max(local.waterMl ?? 0,      rem.waterMl ?? 0),
              fastingHours: Math.max(local.fastingHours ?? 0, rem.fastingHours ?? 0),
            }
          }

          // Apply one-time step corrections
          const fixes = (remote as Record<string, unknown>).pendingStepFixes as Record<string, number> | undefined
          if (fixes) {
            for (const [date, steps] of Object.entries(fixes)) {
              const existing = mergedDayLogs[date] ?? defaultDay(date)
              mergedDayLogs[date] = { ...existing, steps }
            }
          }

          // Apply permanent step overrides — highest priority, wins over everything including old local state
          const remoteOverrides = (remote as Record<string, unknown>).stepsOverride as Record<string, number> | undefined
          const mergedOverrides = { ...s.stepsOverride, ...(remoteOverrides ?? {}) }
          for (const [date, steps] of Object.entries(mergedOverrides)) {
            const existing = mergedDayLogs[date] ?? defaultDay(date)
            mergedDayLogs[date] = { ...existing, steps }
          }

          // Stats: take whichever has higher XP (more complete)
          const stats = (remote.stats?.totalXP ?? 0) > s.stats.totalXP
            ? remote.stats! : s.stats

          return {
            dayLogs: mergedDayLogs,
            stats,
            prs: { ...remote.prs, ...s.prs },
            bodyHistory: mergeByDate(remote.bodyHistory ?? [], s.bodyHistory).slice(-90),
            measurements: mergeByDate(remote.measurements ?? [], s.measurements).slice(-90),
            weeklyCheckins: mergeByDate(remote.weeklyCheckins ?? [], s.weeklyCheckins).slice(-52),
            customMeals: s.customMeals.length > 0 ? s.customMeals : (remote.customMeals ?? []),
            pendingStepFixes: undefined,
            stepsOverride: mergedOverrides,
          }
        })
      },

      addMeasurement: (m) => {
        const d = todayStr()
        set(s => {
          const existing = s.measurements.find(x => x.date === d) ?? {}
          return {
            measurements: [...s.measurements.filter(x => x.date !== d), { ...existing, ...m, date: d }].slice(-90),
          }
        })
        get().syncToSupabase()
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
        get().syncToSupabase()
      },
    }),
    {
      name: 'comeback-store',
      version: 3,
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Hardcoded overrides survive rehydration regardless of localStorage contents
        const FIXED: Record<string, number> = { '2025-05-22': 0 }
        state.stepsOverride = { ...FIXED, ...state.stepsOverride }
        const today = localDateStr()
        for (const [date, steps] of Object.entries(state.stepsOverride)) {
          if (state.dayLogs[date]) state.dayLogs[date] = { ...state.dayLogs[date], steps }
        }
        // Also cap any past date with suspiciously high steps
        for (const [date, log] of Object.entries(state.dayLogs)) {
          if (date < today && (log.steps ?? 0) > 90000) {
            state.dayLogs[date] = { ...log, steps: 0 }
          }
        }
      },
      migrate: (raw: unknown) => {
        const state = raw as Record<string, unknown>
        const dayLogs = (state.dayLogs ?? {}) as Record<string, DayLog>
        const overrides: Record<string, number> = { '2025-05-22': 0, ...((state.stepsOverride as Record<string, number> | undefined) ?? {}) }
        const today = localDateStr()
        const fixed: Record<string, DayLog> = {}
        for (const [date, log] of Object.entries(dayLogs)) {
          if (overrides[date] !== undefined) {
            fixed[date] = { ...log, steps: overrides[date] }
          } else if (date < today && (log.steps ?? 0) > 90000) {
            fixed[date] = { ...log, steps: 0 }
          } else {
            fixed[date] = log
          }
        }
        return { ...state, dayLogs: fixed, stepsOverride: overrides }
      },
      partialize: (s) => {
        // Apply overrides before persisting — localStorage never stores a bad step count
        const dayLogs = { ...s.dayLogs }
        for (const [date, steps] of Object.entries(s.stepsOverride)) {
          if (dayLogs[date]) dayLogs[date] = { ...dayLogs[date], steps }
        }
        return {
          dayLogs,
          stats: s.stats,
          prs: s.prs,
          bodyHistory: s.bodyHistory,
          exerciseHistory: s.exerciseHistory,
          measurements: s.measurements,
          weeklyCheckins: s.weeklyCheckins,
          customMeals: s.customMeals,
          stepsOverride: s.stepsOverride,
        }
      },
    }
  )
)

export function getTodayLog() {
  return useStore.getState().getOrCreateToday()
}

export const TARGETS = { calories: 1930, protein: 160, carbs: 220, fat: 65, fibre: 30, waterMl: 3000, steps: 10000 }
export const XP_LEVEL = XP_PER_LEVEL
