export type WorkoutDay = 'PUSH' | 'PULL' | 'LEGS' | 'RECOVERY' | 'UPPER' | 'CONDITIONING' | 'REST';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  repsRange: string;
  type: 'strength' | 'cardio' | 'core' | 'conditioning';
  notes?: string;
}

export interface Workout {
  day: WorkoutDay;
  weekday: string;
  label: string;
  muscles: string;
  color: string;
  exercises: Exercise[];
  finisher?: string;
}

export const WEEKLY_SCHEDULE: Workout[] = [
  {
    day: 'PUSH',
    weekday: 'Monday',
    label: 'PUSH DAY',
    muscles: 'Chest · Shoulders · Triceps',
    color: '#FF3B30',
    exercises: [
      { id: 'flat-bench', name: 'Flat Bench Press', sets: 4, repsRange: '6-8', type: 'strength' },
      { id: 'incline-db', name: 'Incline Dumbbell Press', sets: 3, repsRange: '8-10', type: 'strength' },
      { id: 'seated-shoulder', name: 'Seated Shoulder Press', sets: 3, repsRange: '8-10', type: 'strength' },
      { id: 'lateral-raises', name: 'Lateral Raises', sets: 4, repsRange: '12-15', type: 'strength' },
      { id: 'cable-flyes', name: 'Cable Flyes', sets: 3, repsRange: '12-15', type: 'strength' },
      { id: 'tricep-pushdowns', name: 'Tricep Pushdowns', sets: 3, repsRange: '12', type: 'strength' },
      { id: 'overhead-tri', name: 'Overhead Tricep Extensions', sets: 2, repsRange: '12-15', type: 'strength' },
    ],
    finisher: '12–15 min incline treadmill walk',
  },
  {
    day: 'PULL',
    weekday: 'Tuesday',
    label: 'PULL DAY',
    muscles: 'Back · Biceps · Posture',
    color: '#FF6B00',
    exercises: [
      { id: 'pullups', name: 'Pull-ups / Lat Pulldown', sets: 4, repsRange: '8-10', type: 'strength' },
      { id: 'barbell-rows', name: 'Barbell Rows', sets: 4, repsRange: '8', type: 'strength' },
      { id: 'chest-sup-rows', name: 'Chest-Supported Rows', sets: 3, repsRange: '10', type: 'strength' },
      { id: 'face-pulls', name: 'Face Pulls', sets: 3, repsRange: '15', type: 'strength' },
      { id: 'db-curls', name: 'Dumbbell Curls', sets: 3, repsRange: '10-12', type: 'strength' },
      { id: 'hammer-curls', name: 'Hammer Curls', sets: 3, repsRange: '12', type: 'strength' },
    ],
    finisher: 'Rower / Assault Bike — 20s hard, 60s easy × 10 rounds',
  },
  {
    day: 'LEGS',
    weekday: 'Wednesday',
    label: 'LEGS + CORE',
    muscles: 'Quads · Hamstrings · Glutes · Core',
    color: '#22C55E',
    exercises: [
      { id: 'squats', name: 'Squats', sets: 4, repsRange: '6-8', type: 'strength' },
      { id: 'rdl', name: 'Romanian Deadlifts', sets: 4, repsRange: '8', type: 'strength' },
      { id: 'lunges', name: 'Walking Lunges', sets: 3, repsRange: '12 each leg', type: 'strength' },
      { id: 'leg-press', name: 'Leg Press', sets: 3, repsRange: '12', type: 'strength' },
      { id: 'ham-curls', name: 'Hamstring Curls', sets: 3, repsRange: '12', type: 'strength' },
      { id: 'calf-raises', name: 'Calf Raises', sets: 4, repsRange: '15', type: 'strength' },
      { id: 'hanging-knee', name: 'Hanging Knee Raises', sets: 3, repsRange: '15', type: 'core', notes: 'Core circuit × 3' },
      { id: 'cable-crunch', name: 'Cable Crunches', sets: 3, repsRange: '15', type: 'core' },
      { id: 'plank', name: 'Plank', sets: 3, repsRange: '45-60 sec', type: 'core' },
    ],
    finisher: '10 min brisk walk',
  },
  {
    day: 'RECOVERY',
    weekday: 'Thursday',
    label: 'ACTIVE RECOVERY',
    muscles: 'Mobility · Flexibility · Light Activity',
    color: '#38BDF8',
    exercises: [
      { id: 'steps', name: '8k–12k Steps', sets: 1, repsRange: 'All day', type: 'cardio' },
      { id: 'mobility', name: 'Mobility Work', sets: 1, repsRange: '20-30 min', type: 'cardio' },
      { id: 'stretching', name: 'Full Body Stretching', sets: 1, repsRange: '15-20 min', type: 'cardio' },
      { id: 'light-sport', name: 'Light Badminton / Swimming / Cycling', sets: 1, repsRange: 'Optional', type: 'cardio' },
    ],
  },
  {
    day: 'UPPER',
    weekday: 'Friday',
    label: 'UPPER BODY',
    muscles: 'Arms · Shoulders · Upper Chest · Posture',
    color: '#F59E0B',
    exercises: [
      { id: 'incline-smith', name: 'Incline Smith Press', sets: 4, repsRange: '10', type: 'strength' },
      { id: 'cable-lateral', name: 'Cable Lateral Raises', sets: 4, repsRange: '15', type: 'strength' },
      { id: 'single-rows', name: 'Single-Arm Rows', sets: 3, repsRange: '10', type: 'strength' },
      { id: 'pec-deck', name: 'Pec Deck', sets: 3, repsRange: '12', type: 'strength' },
      { id: 'rear-delt', name: 'Rear Delt Flyes', sets: 4, repsRange: '15', type: 'strength' },
      { id: 'ez-curls', name: 'EZ Bar Curls', sets: 3, repsRange: '12', type: 'strength' },
      { id: 'skull-crushers', name: 'Skull Crushers', sets: 3, repsRange: '12', type: 'strength' },
    ],
    finisher: '15–20 min incline walk',
  },
  {
    day: 'CONDITIONING',
    weekday: 'Saturday',
    label: 'FAT BURN',
    muscles: 'Full Body · Athletic Conditioning',
    color: '#FF3B30',
    exercises: [
      { id: 'kb-swings', name: 'Kettlebell Swings', sets: 5, repsRange: '20', type: 'conditioning' },
      { id: 'battle-ropes', name: 'Battle Ropes', sets: 5, repsRange: '30 sec', type: 'conditioning' },
      { id: 'sled-push', name: 'Sled Push', sets: 4, repsRange: '20m', type: 'conditioning', notes: 'If available' },
      { id: 'burpees', name: 'Burpees', sets: 4, repsRange: '10', type: 'conditioning' },
      { id: 'farmer-carry', name: 'Farmer Carries', sets: 4, repsRange: '30m', type: 'conditioning' },
      { id: 'box-steps', name: 'Box Step-Ups', sets: 4, repsRange: '12 each', type: 'conditioning' },
    ],
    finisher: 'Evening walk',
  },
  {
    day: 'REST',
    weekday: 'Sunday',
    label: 'FULL RECOVERY',
    muscles: 'Sleep · Hydrate · Meal Prep · Relax',
    color: '#9A9A9A',
    exercises: [],
  },
];

export const getWorkoutForDate = (date: Date): Workout => {
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const index = day === 0 ? 6 : day - 1;
  return WEEKLY_SCHEDULE[index];
};

export const getTodayWorkout = (): Workout => getWorkoutForDate(new Date());

export const MOTIVATION_BY_DAY: Record<WorkoutDay, string[]> = {
  PUSH: [
    'PUSH DAY. Build that chest. No excuses.',
    'The bar doesn\'t care how you feel. Press it.',
    'Every rep is a vote for the person you\'re becoming.',
  ],
  PULL: [
    'PULL DAY. Back width. Own it.',
    'Pull yourself up — metaphorically and literally.',
    'Your back is the foundation. Build it strong.',
  ],
  LEGS: [
    'LEG DAY. This is where champions are made.',
    'Never skip leg day. You know why you\'re here.',
    'Legs are the engine. Rev it up.',
  ],
  RECOVERY: [
    'RECOVERY DAY. But not lazy. Move your body.',
    'Active recovery is still progress. Walk. Stretch. Reset.',
    'Champions recover harder than they train.',
  ],
  UPPER: [
    'AESTHETIC DAY. Sculpt the physique.',
    'Detail work. Make every rep count.',
    'This is where the mirror gets kind.',
  ],
  CONDITIONING: [
    'FAT BURN DAY. This is the missing piece.',
    'Circuit time. Push the heart rate. No rest for the driven.',
    'This session burns fat for 48 hours after. Remember that.',
  ],
  REST: [
    'REST DAY. Sleep. Recover. Prep for the week ahead.',
    'Rest is training. Your body grows when you rest.',
    'Tomorrow you come back stronger.',
  ],
};

export const QUICK_MEALS = [
  { name: 'Chicken Breast (200g)', calories: 330, protein: 62, carbs: 0, fat: 7 },
  { name: '3 Whole Eggs', calories: 210, protein: 18, carbs: 0, fat: 15 },
  { name: 'Oatmeal (80g dry)', calories: 300, protein: 10, carbs: 52, fat: 6 },
  { name: 'Protein Shake', calories: 150, protein: 25, carbs: 5, fat: 2 },
  { name: 'Tuna (185g tin)', calories: 170, protein: 40, carbs: 0, fat: 1 },
  { name: 'Greek Yogurt (200g)', calories: 130, protein: 18, carbs: 8, fat: 3 },
  { name: 'Salmon (200g)', calories: 414, protein: 40, carbs: 0, fat: 26 },
  { name: 'Rice (1 cup cooked)', calories: 200, protein: 4, carbs: 45, fat: 0 },
  { name: 'Sweet Potato (200g)', calories: 172, protein: 3, carbs: 40, fat: 0 },
  { name: 'Chicken Curry + Rice', calories: 650, protein: 48, carbs: 72, fat: 14 },
  { name: 'Beef Stir Fry', calories: 550, protein: 45, carbs: 30, fat: 18 },
  { name: 'Boiled Eggs ×2', calories: 140, protein: 12, carbs: 0, fat: 10 },
];
