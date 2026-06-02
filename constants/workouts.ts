export interface Exercise {
  id: string
  name: string
  sets: number
  repsRange: string
  notes?: string
}

export interface Workout {
  id: string
  label: string
  muscles: string
  color: string
  exercises: Exercise[]
  finisher?: string
}

export const WORKOUT_PLANS: Workout[] = [
  {
    id: 'push', label: 'Push', muscles: 'Chest · Shoulders · Triceps', color: '#FF2800',
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, repsRange: '6–8', notes: 'Controlled descent, full ROM' },
      { id: 'ohp', name: 'Overhead Press', sets: 4, repsRange: '6–8', notes: 'Push the bar back on the way up' },
      { id: 'incline', name: 'Incline DB Press', sets: 3, repsRange: '10–12' },
      { id: 'cablefly', name: 'Cable Flyes', sets: 3, repsRange: '12–15', notes: 'Squeeze at the midline' },
      { id: 'lateral', name: 'Lateral Raises', sets: 4, repsRange: '15–20', notes: 'No momentum' },
      { id: 'pushdown', name: 'Tricep Pushdowns', sets: 3, repsRange: '12–15' },
    ],
    finisher: '100 push-ups in as few sets as possible',
  },
  {
    id: 'pull', label: 'Pull', muscles: 'Back · Biceps · Rear Delts', color: '#2196F3',
    exercises: [
      { id: 'dl', name: 'Deadlift', sets: 4, repsRange: '5', notes: 'Lock hips at the top' },
      { id: 'pullup', name: 'Weighted Pull-ups', sets: 4, repsRange: '6–8' },
      { id: 'row', name: 'Barbell Row', sets: 3, repsRange: '8–10', notes: 'Chest to bar' },
      { id: 'pulldown', name: 'Lat Pulldown', sets: 3, repsRange: '10–12' },
      { id: 'face', name: 'Face Pulls', sets: 3, repsRange: '15–20' },
      { id: 'curl', name: 'Barbell Curl', sets: 3, repsRange: '10–12' },
    ],
    finisher: '5 min dead hang accumulation',
  },
  {
    id: 'legs', label: 'Legs', muscles: 'Quads · Hamstrings · Glutes · Calves', color: '#1DB954',
    exercises: [
      { id: 'squat', name: 'Back Squat', sets: 4, repsRange: '6–8', notes: 'Below parallel' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, repsRange: '8–10', notes: 'Load the hamstrings, feel the stretch' },
      { id: 'bss', name: 'Bulgarian Split Squat', sets: 3, repsRange: '10–12', notes: 'Rear foot elevated, drive through front heel' },
      { id: 'legpress', name: 'Leg Press', sets: 3, repsRange: '10–12' },
      { id: 'legcurl', name: 'Lying Leg Curl', sets: 3, repsRange: '12–15' },
      { id: 'calf', name: 'Standing Calf Raise', sets: 4, repsRange: '15–20', notes: 'Full stretch at bottom' },
    ],
    finisher: '100 walking lunges — 50 each leg, no rest',
  },
  {
    id: 'func-upper', label: 'Functional Upper', muscles: 'Push · Pull · Core · Carries', color: '#FF5500',
    exercises: [
      { id: 'sa-press', name: 'Single Arm DB Press', sets: 3, repsRange: '10 each side', notes: 'Brace hard — no lateral lean' },
      { id: 'bw-pullup', name: 'Pull-ups (bodyweight)', sets: 3, repsRange: 'AMRAP', notes: 'Full hang to chin over bar' },
      { id: 'renegade', name: 'Renegade Rows', sets: 3, repsRange: '8 each side', notes: 'Hips square, no rotation' },
      { id: 'oh-carry', name: 'Overhead Carry (DB)', sets: 3, repsRange: '30 sec each side', notes: 'Pack the shoulder, ribs down' },
      { id: 'pallof', name: 'Pallof Press', sets: 3, repsRange: '12 each side', notes: 'Anti-rotation — resist the cable' },
      { id: 'woodchop', name: 'Cable Wood Chop', sets: 3, repsRange: '12 each side', notes: 'Drive from hips, not arms' },
    ],
    finisher: '5 rounds: 10 burpees + 10 band pull-aparts — rest 30s between rounds',
  },
  {
    id: 'func-lower', label: 'Functional Lower', muscles: 'Glutes · Hamstrings · Core · Power', color: '#9B59B6',
    exercises: [
      { id: 'kb-swing', name: 'Kettlebell Swings', sets: 4, repsRange: '15–20', notes: 'Hip hinge — not a squat. Snap the hips' },
      { id: 'sl-rdl', name: 'Single Leg RDL', sets: 3, repsRange: '10 each side', notes: 'Slow eccentric, feel the hamstring load' },
      { id: 'stepup', name: 'Weighted Step-ups', sets: 3, repsRange: '12 each side', notes: 'Drive through the heel, no push-off from back foot' },
      { id: 'hipthrust', name: 'Hip Thrusts', sets: 3, repsRange: '12–15', notes: 'Full glute squeeze at the top, chin tucked' },
      { id: 'boxjump', name: 'Box Jumps', sets: 3, repsRange: '6–8', notes: 'Land softly — absorb with your hips, not just knees' },
      { id: 'farmer', name: 'Farmer\'s Carry', sets: 3, repsRange: '30 sec', notes: 'Heavy. Shoulders packed, walk with purpose' },
    ],
    finisher: '100 bodyweight squats for time — aim to beat it each week',
  },
]

export const REST_WORKOUT: Workout = {
  id: 'rest', label: 'Rest', muscles: 'Recovery & Mobility', color: '#686870', exercises: [],
}

export function getWorkoutById(id: string): Workout {
  return WORKOUT_PLANS.find(w => w.id === id) ?? REST_WORKOUT
}

// kept for backwards compat with notification builder
export function getTodayWorkout(): Workout { return REST_WORKOUT }

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
  MON: 'Push day. Bench, press, build. Start the week with force.',
  TUE: 'Pull day. Deadlift heavy, grow your back.',
  WED: 'Legs. Squat deep, split squat hard. Built different.',
  THU: 'Functional Upper. Move well, carry heavy, stay strong.',
  FRI: 'Functional Lower. Swings, jumps, carries. Finish the week.',
  SAT: 'Active recovery. Walk, stretch, prep tomorrow.',
  SUN: 'Rest. Own next week.',
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
