export type DayKey = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export interface Exercise {
  id: string
  name: string
  sets: number
  repsRange: string
  notes?: string
}

export interface Workout {
  day: DayKey | 'REST'
  label: string
  muscles: string
  color: string
  exercises: Exercise[]
  finisher?: string
}

export const WEEKLY_SCHEDULE: Workout[] = [
  {
    day: 'MON', label: 'Push A', muscles: 'Chest · Shoulders · Triceps', color: '#FF2800',
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, repsRange: '6–8', notes: 'Controlled descent, full ROM' },
      { id: 'ohp', name: 'Overhead Press', sets: 3, repsRange: '8–10' },
      { id: 'incline', name: 'Incline DB Press', sets: 3, repsRange: '10–12' },
      { id: 'lateral', name: 'Lateral Raises', sets: 4, repsRange: '15–20', notes: 'No momentum' },
      { id: 'pushdown', name: 'Tricep Pushdowns', sets: 3, repsRange: '12–15' },
      { id: 'ohe', name: 'Overhead Tricep Extension', sets: 3, repsRange: '12–15' },
    ],
    finisher: '100 push-ups in as few sets as possible',
  },
  {
    day: 'TUE', label: 'Pull A', muscles: 'Back · Biceps · Rear Delts', color: '#2196F3',
    exercises: [
      { id: 'dl', name: 'Deadlift', sets: 4, repsRange: '5', notes: 'Lock hips at the top' },
      { id: 'pullup', name: 'Weighted Pull-ups', sets: 4, repsRange: '6–8' },
      { id: 'row', name: 'Barbell Row', sets: 3, repsRange: '8–10', notes: 'Chest to bar' },
      { id: 'cable-row', name: 'Seated Cable Row', sets: 3, repsRange: '10–12' },
      { id: 'face', name: 'Face Pulls', sets: 3, repsRange: '15–20' },
      { id: 'curl', name: 'Barbell Curl', sets: 3, repsRange: '10–12' },
    ],
    finisher: '50 band pull-aparts',
  },
  {
    day: 'WED', label: 'Legs A', muscles: 'Quads · Hamstrings · Glutes · Calves', color: '#1DB954',
    exercises: [
      { id: 'squat', name: 'Back Squat', sets: 4, repsRange: '6–8', notes: 'Below parallel' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, repsRange: '8–10', notes: 'Feel the stretch' },
      { id: 'legpress', name: 'Leg Press', sets: 3, repsRange: '10–12' },
      { id: 'legcurl', name: 'Lying Leg Curl', sets: 3, repsRange: '12–15' },
      { id: 'calf', name: 'Standing Calf Raise', sets: 4, repsRange: '15–20', notes: 'Full stretch at bottom' },
    ],
    finisher: '200 bodyweight calf raises',
  },
  {
    day: 'THU', label: 'Push B', muscles: 'Shoulders · Chest · Triceps', color: '#FF5500',
    exercises: [
      { id: 'ohp2', name: 'Overhead Press', sets: 4, repsRange: '6–8', notes: 'Push the bar back on the way up' },
      { id: 'incline2', name: 'Incline Bench Press', sets: 3, repsRange: '8–10' },
      { id: 'cablefly', name: 'Cable Flyes', sets: 3, repsRange: '12–15' },
      { id: 'lateral2', name: 'Lateral Raises', sets: 4, repsRange: '15–20' },
      { id: 'skull', name: 'Skull Crushers', sets: 3, repsRange: '10–12' },
      { id: 'dip', name: 'Tricep Dips', sets: 3, repsRange: '12–15', notes: 'Lean forward for chest' },
    ],
  },
  {
    day: 'FRI', label: 'Pull B', muscles: 'Back · Biceps · Rear Delts', color: '#D4A017',
    exercises: [
      { id: 'pullup2', name: 'Weighted Pull-ups', sets: 4, repsRange: '6–8' },
      { id: 'pendlay', name: 'Pendlay Row', sets: 3, repsRange: '8–10', notes: 'Bar to floor each rep' },
      { id: 'pulldown', name: 'Lat Pulldown', sets: 3, repsRange: '10–12' },
      { id: 'cablerow2', name: 'Cable Row', sets: 3, repsRange: '12–15' },
      { id: 'hammer', name: 'Hammer Curls', sets: 3, repsRange: '12–15' },
      { id: 'inccurl', name: 'Incline DB Curl', sets: 3, repsRange: '12–15', notes: 'Full stretch at bottom' },
    ],
    finisher: '5 min dead hang accumulation',
  },
  {
    day: 'SAT', label: 'Rest', muscles: 'Recovery & Mobility', color: '#686870',
    exercises: [],
  },
  {
    day: 'SUN', label: 'Rest', muscles: 'Recovery & Meal Prep', color: '#686870',
    exercises: [],
  },
]

const DAY_INDEX: Record<number, DayKey | 'REST'> = {
  0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT',
}

export function getTodayWorkout(): Workout {
  const key = DAY_INDEX[new Date().getDay()]
  return WEEKLY_SCHEDULE.find(w => w.day === key) ?? WEEKLY_SCHEDULE[5]
}

export const QUICK_MEALS = [
  { name: 'Chicken Breast + Rice', calories: 480, protein: 52, carbs: 48, fat: 8 },
  { name: 'Eggs & Toast (4 eggs)', calories: 380, protein: 28, carbs: 24, fat: 18 },
  { name: 'Tuna Sandwich', calories: 420, protein: 38, carbs: 36, fat: 12 },
  { name: 'Whey Protein Shake', calories: 160, protein: 30, carbs: 8, fat: 2 },
  { name: 'Greek Yogurt + Nuts', calories: 280, protein: 18, carbs: 16, fat: 14 },
  { name: 'Salmon + Sweet Potato', calories: 520, protein: 44, carbs: 46, fat: 14 },
  { name: 'Chicken Thigh + Veggies', calories: 440, protein: 42, carbs: 18, fat: 20 },
  { name: 'Beef Mince Bowl', calories: 560, protein: 48, carbs: 36, fat: 22 },
  { name: 'Dal Chicken Curry', calories: 500, protein: 40, carbs: 42, fat: 16 },
  { name: 'Paneer + Roti (2)', calories: 460, protein: 26, carbs: 44, fat: 18 },
  { name: 'Egg Bhurji + Rice', calories: 420, protein: 24, carbs: 40, fat: 16 },
  { name: 'Mutton Keema + Bread', calories: 580, protein: 44, carbs: 38, fat: 24 },
]

export const MOTIVATION: Record<string, string> = {
  MON: 'Push day. Start the week with force.',
  TUE: 'Pull your limits. Grow your back.',
  WED: 'Leg day. Built different.',
  THU: 'Second push. More weight than Monday.',
  FRI: 'Pull B. Finish the week strong.',
  SAT: 'Rest. Eat. Sleep. Recover.',
  SUN: 'Prep tomorrow. Own next week.',
}

export const BADGES = [
  { id: 'first_workout', name: 'FIRST BLOOD', description: 'Complete your first workout', icon: '🩸' },
  { id: 'week_streak', name: 'IRON WEEK', description: '7 day workout streak', icon: '⚡' },
  { id: 'protein_goal', name: 'PROTEIN KING', description: 'Hit protein goal 7 days straight', icon: '👑' },
  { id: 'hydration_goal', name: 'HYDRATED', description: 'Hit water goal 7 days straight', icon: '💧' },
  { id: 'perfect_day', name: 'PERFECT DAY', description: 'Hit all goals in one day', icon: '🎯' },
  { id: 'level_5', name: 'LEVEL 5', description: 'Reach level 5', icon: '🔥' },
  { id: 'level_10', name: 'VETERAN', description: 'Reach level 10', icon: '🏆' },
  { id: '100_workouts', name: 'CENTURION', description: 'Complete 100 workouts', icon: '💯' },
]
