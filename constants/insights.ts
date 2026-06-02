export interface Insight {
  id: string
  tag: 'COACH' | 'FUEL' | 'MOVE' | 'RECOVER' | 'SCIENCE' | 'PROGRESS'
  color: string
  icon: string
  title: string
  body: string
  action?: string
  urgency?: 'high'
}

export interface InsightContext {
  // Body stats
  weight: number
  bodyFat: number
  maintenance: number

  // Today nutrition
  calories: number
  protein: number
  carbs: number
  fat: number
  fibre: number

  // Today activity
  steps: number
  totalBurned: number
  workoutDone: boolean
  isRestDay: boolean
  cardioLogged: boolean
  cardioMinutes: number
  cardioType: 'incline_walk' | 'cross_trainer' | null
  fastingHours: number

  // Today habits
  sleepDone: boolean
  supplementsDone: boolean
  veggiesDone: boolean
  noJunkDone: boolean

  // Today workout detail
  todayWorkoutId: string | null
  todayWorkoutLabel: string | null
  exercisesChecked: number
  totalExercises: number

  // Hydration & time
  waterMl: number
  hour: number
  dayOfWeek: number

  // Week aggregates
  weekWorkouts: number
  weekCalAvg: number | null
  weekCardioDays: number
  weekStepDays: number
  weekSleepDays: number
  weekSupplementDays: number
  weekVeggieDays: number
  weekGoodDays: number

  // Goals
  targetWeight: number
  targetBf: number
  calTarget: number
  proteinTarget: number

  // User stats
  streak: number
  level: number
  totalWorkoutsCompleted: number

  // PRs (Epley 1RM, null if never logged)
  benchOneRM: number | null
  squatOneRM: number | null
  deadliftOneRM: number | null
  ohpOneRM: number | null

  // Body composition trends
  weightTrend14d: number | null   // negative = losing weight (good)
  latestWaist: number | null
  waistTrend: number | null       // negative = waist shrinking (good)
  latestWeight: number

  // Weekly check-in
  lastCheckinRating: number | null

  weeksSinceGoalSet?: number
}

const C: Record<Insight['tag'], string> = {
  COACH:    '#FF2800',
  FUEL:     '#FF5500',
  MOVE:     '#2196F3',
  RECOVER:  '#9B59B6',
  SCIENCE:  '#1DB954',
  PROGRESS: '#D4A017',
}

function stepsKcal(steps: number, weight: number) {
  return Math.round(steps * weight * 0.00057)
}

function weeksToGoal(fatToLose: number, dailyDeficit: number) {
  return Math.round(fatToLose * 7700 / (dailyDeficit * 7))
}

function seededInt(seed: number, max: number): number {
  const x = Math.sin(seed + 1) * 10000
  return Math.abs(Math.floor((x - Math.floor(x)) * max)) % max
}

export function generateInsights(ctx: InsightContext): Insight[] {
  const {
    weight, bodyFat, maintenance,
    calories, protein, carbs, fat, fibre,
    steps, totalBurned, workoutDone, isRestDay,
    cardioLogged, cardioMinutes, cardioType, fastingHours,
    sleepDone, supplementsDone, veggiesDone,
    todayWorkoutId, todayWorkoutLabel, exercisesChecked, totalExercises,
    waterMl, hour, dayOfWeek, weekWorkouts, weekCalAvg, weekCardioDays,
    weekStepDays, weekSleepDays, weekSupplementDays, weekVeggieDays, weekGoodDays,
    targetWeight, calTarget, proteinTarget,
    streak, level,
    benchOneRM, squatOneRM, deadliftOneRM, ohpOneRM,
    weightTrend14d, latestWaist, waistTrend, latestWeight,
    lastCheckinRating,
  } = ctx

  const fatNow     = weight * bodyFat / 100
  const fatGoal    = targetWeight * 0.15
  const fatToLose  = Math.max(fatNow - fatGoal, 0)
  const weeksLeft  = weeksToGoal(fatToLose, 520)
  const protoGap   = Math.max(proteinTarget - protein, 0)
  const waterL     = (waterMl / 1000).toFixed(1)
  const kgToGoal   = Math.max(weight - targetWeight, 0)
  const dayNames   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today      = dayNames[dayOfWeek]
  const isPushDay  = !!(todayWorkoutId?.startsWith('push'))
  const isPullDay  = !!(todayWorkoutId?.startsWith('pull'))
  const isLegsDay  = !!(todayWorkoutId?.startsWith('legs'))
  const insights: Insight[] = []

  // ── WEIGHT TREND ─────────────────────────────────────────────────────────

  if (weightTrend14d !== null) {
    const ratePerWeek = weightTrend14d / 2
    if (weightTrend14d < -1.4) {
      insights.push({
        id: 'weight-fast', tag: 'PROGRESS', color: C.PROGRESS, icon: '📉',
        title: `LOSING TOO FAST — ${Math.abs(weightTrend14d).toFixed(1)}KG IN 14 DAYS`,
        body: `At ${Math.abs(ratePerWeek).toFixed(2)}kg/week you're losing faster than the optimal 0.3–0.5kg/week for a muscle-preserving cut. Rapid weight loss increases the proportion coming from lean mass. Consider adding a mini refeed at ${maintenance} kcal for 1 day every 10 days to reset leptin and protect muscle.`,
        action: `Add one maintenance day (${maintenance} kcal) this week to protect lean mass.`,
        urgency: 'high',
      })
    } else if (weightTrend14d <= -0.4) {
      insights.push({
        id: 'weight-on-track', tag: 'PROGRESS', color: C.PROGRESS, icon: '📉',
        title: `DOWN ${Math.abs(weightTrend14d).toFixed(1)}KG IN 14 DAYS — RIGHT ON TRACK`,
        body: `${latestWeight}kg now. At ~${Math.abs(ratePerWeek).toFixed(2)}kg/week you're in the optimal fat-loss zone — fast enough to see progress, slow enough to preserve muscle. At this rate you hit ${targetWeight}kg in ~${weeksLeft} weeks. The math is working. Keep stacking.`,
      })
    } else if (weightTrend14d > -0.2) {
      insights.push({
        id: 'weight-stall', tag: 'PROGRESS', color: C.PROGRESS, icon: '⚠️',
        title: `WEIGHT STALLED AT ${latestWeight}KG — 14-DAY PLATEAU`,
        body: `No meaningful change in 2 weeks. Metabolic adaptation has matched your intake. Fix: audit calorie accuracy (are portions actually ${calTarget} kcal?), add one extra cardio session per week, or use a 2-day mini cut at ${Math.round(calTarget * 0.85)} kcal to break the plateau.`,
        action: `Weigh food with a scale this week. One untracked snack can erase your deficit.`,
        urgency: 'high',
      })
    }
  }

  // ── WAIST MEASUREMENT ────────────────────────────────────────────────────

  if (waistTrend !== null && latestWaist !== null && waistTrend < -0.4) {
    insights.push({
      id: 'waist-down', tag: 'PROGRESS', color: C.PROGRESS, icon: '📏',
      title: `WAIST DOWN ${Math.abs(waistTrend).toFixed(1)}CM — FAT LOSS CONFIRMED`,
      body: `From ${(latestWaist - waistTrend).toFixed(1)}cm to ${latestWaist}cm. Waist reduction tracks visceral fat removal — the most metabolically harmful fat type. The scale can lie (water retention, glycogen). The tape measure cannot. This is real.`,
    })
  }

  // ── PR-SPECIFIC COACHING ─────────────────────────────────────────────────

  if (isPushDay && !workoutDone) {
    if (benchOneRM !== null) {
      const target = Math.round(benchOneRM * 0.82)
      insights.push({
        id: 'pr-bench', tag: 'MOVE', color: C.MOVE, icon: '🏋️',
        title: `PUSH DAY — BENCH 1RM: ${benchOneRM}KG`,
        body: `Your best bench press 1RM is ${benchOneRM}kg. Today's working target: ${target}kg for 4 sets of 6–8 reps. If you hit 8 clean reps on all sets, add 2.5kg next Push session. This incremental loading is exactly what prevents muscle loss on a cut.`,
        action: `Working weight: ${target}kg × 4 sets × 6–8 reps. Log every set.`,
      })
    }
    if (ohpOneRM !== null) {
      const target = Math.round(ohpOneRM * 0.8)
      insights.push({
        id: 'pr-ohp', tag: 'MOVE', color: C.MOVE, icon: '⬆️',
        title: `OHP 1RM: ${ohpOneRM}KG — PUSH THE OVERHEAD`,
        body: `Overhead press target today: ${target}kg for 3–4 sets. OHP is the purest indicator of shoulder strength — it transfers directly to every pressing pattern. Don't let the cut become an excuse to go lighter. Maintain the stimulus.`,
        action: `OHP working weight: ${target}kg. Full lockout at the top every rep.`,
      })
    }
  }

  if (isLegsDay && !workoutDone) {
    if (squatOneRM !== null) {
      const target = Math.round(squatOneRM * 0.80)
      insights.push({
        id: 'pr-squat', tag: 'MOVE', color: C.MOVE, icon: '🦵',
        title: `LEGS DAY — SQUAT 1RM: ${squatOneRM}KG`,
        body: `Working squat target today: ${target}kg for 4 sets of 6–8 reps, below parallel every rep. Legs carry 60% of your total muscle mass — two leg sessions a week generate more metabolic cost than anything else in the program. Don't cut sets short.`,
        action: `${target}kg × 4 sets. Below parallel, no exceptions. Film a set if you're unsure on depth.`,
      })
    }
    if (deadliftOneRM !== null && todayWorkoutId === 'pull') {
      const target = Math.round(deadliftOneRM * 0.82)
      insights.push({
        id: 'pr-deadlift', tag: 'MOVE', color: C.MOVE, icon: '⛏️',
        title: `DEADLIFT 1RM: ${deadliftOneRM}KG — PULL DAY`,
        body: `Deadlift target today: ${target}kg for 4 sets of 5 reps. The deadlift recruits more total muscle than any other movement — posterior chain, lats, upper back, grip. At ${Math.round(deadliftOneRM * 0.82)}kg you're training the strength that protects every other lift.`,
        action: `${target}kg × 4×5. Hip hinge, brace, lock hips at the top.`,
      })
    }
  }

  // ── SESSION IN PROGRESS ──────────────────────────────────────────────────

  if (workoutDone && totalExercises > 0 && exercisesChecked < totalExercises) {
    const remaining = totalExercises - exercisesChecked
    insights.push({
      id: 'session-progress', tag: 'MOVE', color: C.MOVE, icon: '⚡',
      urgency: 'high',
      title: `${exercisesChecked}/${totalExercises} EXERCISES — FINISH IT`,
      body: `${remaining} exercise${remaining > 1 ? 's' : ''} left in ${todayWorkoutLabel ?? 'today\'s session'}. The second half — usually isolation work — is where hypertrophy happens in the muscles compounds miss. The people who cut their session short at ${exercisesChecked} don't look the same as the people who complete all ${totalExercises}.`,
      action: `${remaining} exercises left. Don't leave until all ${totalExercises} are done.`,
    })
  }

  // ── TODAY'S WORKOUT BRIEF (pre-session) ──────────────────────────────────

  if (!workoutDone && !isRestDay && todayWorkoutLabel && totalExercises > 0 && hour >= 5) {
    insights.push({
      id: 'workout-brief', tag: 'MOVE', color: C.MOVE, icon: '📋',
      title: `TODAY: ${todayWorkoutLabel.toUpperCase()} — ${totalExercises} EXERCISES`,
      body: `${todayWorkoutLabel} is on the schedule. Log every working weight and rep — this data drives the progressive overload decisions for next session. Each time you beat your previous numbers, your body has a concrete reason to hold the muscle while the fat comes off.`,
      action: 'Open LIFT → log sets as you go. Your PR history is tracking.',
    })
  }

  // ── MORNING CHECK-IN (before 11am) ───────────────────────────────────────

  if (hour < 11) {
    insights.push({
      id: 'morning-brief', tag: 'COACH', color: C.COACH, icon: '🌅',
      title: `GOOD MORNING — ${today.toUpperCase()} BRIEF`,
      body: `${kgToGoal.toFixed(1)}kg from ${targetWeight}kg. ${weeksLeft} weeks at 520 kcal/day deficit. Today: ${calTarget} kcal, ${proteinTarget}g protein, 10,000 steps${!workoutDone && !isRestDay && todayWorkoutLabel ? `, ${todayWorkoutLabel}` : ''}. One clean day stacks directly on the last.`,
    })

    if (waterMl < 250) {
      insights.push({
        id: 'morning-hydrate', tag: 'RECOVER', color: C.RECOVER, icon: '💧',
        title: 'FIRST THING: DRINK 500ML WATER',
        body: `Body loses 400–600ml overnight through breathing and sweat. Rehydrating before coffee blunts the cortisol spike, kickstarts metabolism, and improves morning performance. Make it a ritual — glass of water before anything else.`,
        action: '500ml water right now, before coffee.',
      })
    }
  }

  // ── PRE-WORKOUT WINDOW (5–8am) ────────────────────────────────────────────

  if (hour >= 5 && hour < 8 && !workoutDone && !isRestDay && weekWorkouts < 5) {
    insights.push({
      id: 'pre-workout-fuel', tag: 'FUEL', color: C.FUEL, icon: '⚡',
      title: 'FUEL THE SESSION — EAT BEFORE YOU LIFT',
      body: `Training in the next 2 hours? A 150–200 kcal pre-workout meal with 20–30g protein prevents muscle breakdown during the session. Greek yogurt + banana or scrambled eggs. Fasted training on a calorie deficit increases muscle catabolism during the session itself.`,
      action: 'Greek yogurt 150g + 1 banana → 20g protein, fast carbs, 3 minutes to prep.',
    })
  }

  // ── REST DAY ─────────────────────────────────────────────────────────────

  if (isRestDay) {
    insights.push({
      id: 'rest-day-guide', tag: 'RECOVER', color: C.RECOVER, icon: '🔄',
      title: 'REST DAY — RECOVER LIKE A PROFESSIONAL',
      body: `Adaptation happens today — not in the gym. Walk 8,000–10,000 easy steps to flush metabolic waste. Hit your full ${proteinTarget}g protein target (muscle repair doesn't pause on rest days). Aim for 8+ hours sleep. The next session quality depends entirely on what you do right now.`,
      action: `${proteinTarget}g protein + 3L water + 8K easy steps. That's a complete rest day.`,
    })
  }

  // ── FASTING ──────────────────────────────────────────────────────────────

  if (fastingHours >= 14) {
    insights.push({
      id: 'fasting-active', tag: 'SCIENCE', color: C.SCIENCE, icon: '⏱️',
      title: `${fastingHours}H FAST LOGGED — FAT-BURNING STATE`,
      body: `At ${fastingHours}+ hours: insulin is at baseline, noradrenaline is elevated (+44%), lipolysis is accelerated. This is the metabolic state you're engineering with IF. Break the fast with ${proteinTarget > 120 ? '50g+' : '40g+'} protein to trigger muscle protein synthesis immediately after the fasted window.`,
      action: 'Break fast with 50g+ protein first: eggs, Greek yogurt, or a shake.',
    })
  }

  // ── SUPPLEMENTS ──────────────────────────────────────────────────────────

  if (!supplementsDone && hour >= 12) {
    insights.push({
      id: 'supplements-missing', tag: 'RECOVER', color: C.RECOVER, icon: '💊',
      title: 'SUPPLEMENTS NOT LOGGED TODAY',
      body: `Creatine monohydrate (5g) needs daily intake to maintain muscle phosphocreatine saturation — not just on training days. Omega-3s reduce systemic inflammation from training. Missing a day compounds over the week. Take them now.`,
      action: 'Creatine 5g + Omega-3s — take them now, log the supplements habit.',
    })
  }

  // ── VEGGIES ──────────────────────────────────────────────────────────────

  if (!veggiesDone && hour >= 13) {
    insights.push({
      id: 'veggies-missing', tag: 'FUEL', color: C.FUEL, icon: '🥦',
      title: 'NO VEGETABLES TODAY — FIX THIS',
      body: `Vegetables provide zinc (testosterone production), magnesium (sleep quality, muscle recovery), and fiber (satiety on 1,930 kcal). On a cut with limited calories, skipping vegetables removes your most important hunger management tool. 400g of broccoli is 140 kcal and keeps you full for hours.`,
      action: '400g broccoli / spinach / cucumber to your next meal. Log the veggie habit.',
    })
  }

  // ── CARBS LOW ON TRAINING DAY ────────────────────────────────────────────

  if (!isRestDay && !workoutDone && carbs < 80 && hour >= 9 && calories > 0) {
    insights.push({
      id: 'carbs-low', tag: 'FUEL', color: C.FUEL, icon: '⚡',
      title: `ONLY ${carbs}G CARBS — PERFORMANCE WARNING`,
      body: `Your muscles run on glycogen (stored carbs) during heavy compound sets. Sub-100g carbs on a training day leads to 10–15% strength reduction — exactly the opposite of progressive overload. Get 50–60g fast carbs 60–90 min before the session.`,
      action: '1 banana + 50g oats 60 min pre-session → glycogen topped up.',
    })
  }

  // ── PROTEIN URGENT ────────────────────────────────────────────────────────

  if (hour >= 12 && protein < proteinTarget * 0.5) {
    insights.push({
      id: 'protein-low', tag: 'FUEL', color: C.FUEL, icon: '🥩',
      urgency: 'high',
      title: `YOU'RE ${protoGap}G SHORT ON PROTEIN`,
      body: `At ${protein}g you're only ${Math.round((protein / proteinTarget) * 100)}% of your ${proteinTarget}g target. On a deficit, every gram under target increases the proportion of lean mass lost. Add a protein source with every remaining meal today.`,
      action: `Add cottage cheese (200g = 25g), Greek yogurt (17g), or a whey shake (25g) now.`,
    })
  }

  // ── OVER CALORIES ─────────────────────────────────────────────────────────

  if (calories > calTarget + 150) {
    const over = calories - calTarget
    insights.push({
      id: 'over-cals', tag: 'FUEL', color: C.FUEL, icon: '⚠️',
      urgency: 'high',
      title: `YOU'RE ${over} KCAL OVER — MAKE IT UP`,
      body: `${over} kcal above target partially erases today's deficit. Recovery: skip any evening snack (~200 kcal), do a 30-min brisk walk (~${stepsKcal(3000, weight)} kcal). Awareness now stops this from becoming a pattern.`,
      action: 'Skip evening snack + 30-min brisk walk to close the gap.',
    })
  }

  // ── NO MEALS LOGGED AFTER 2PM ─────────────────────────────────────────────

  if (hour >= 14 && calories === 0) {
    insights.push({
      id: 'no-meals', tag: 'FUEL', color: C.FUEL, icon: '📋',
      urgency: 'high',
      title: `IT'S ${hour}:00 AND NOTHING'S BEEN LOGGED`,
      body: `Untracked days average 30–40% more calories — not because you eat more, but because you eat without awareness. You can't manage what you don't measure. Log everything from today, even retrospectively.`,
      action: "Open Nutrition and log what you've already eaten today.",
    })
  }

  // ── STEPS LOW ─────────────────────────────────────────────────────────────

  if (hour >= 16 && steps < 5000) {
    insights.push({
      id: 'steps-low', tag: 'MOVE', color: C.MOVE, icon: '👟',
      title: `ONLY ${steps.toLocaleString()} STEPS — MOVE`,
      body: `${(10000 - steps).toLocaleString()} steps left to hit target. That's ${stepsKcal(10000 - steps, weight)} kcal of passive burn — no gym required. A 30-min evening walk covers it. Missing daily steps consistently adds ~1 extra week to your ${targetWeight}kg goal.`,
      action: `30-min walk now = ${(10000 - steps).toLocaleString()} steps = ${stepsKcal(10000 - steps, weight)} kcal deficit.`,
    })
  }

  // ── LOW WATER ─────────────────────────────────────────────────────────────

  if (hour >= 13 && waterMl < 1500) {
    insights.push({
      id: 'water-low', tag: 'RECOVER', color: C.RECOVER, icon: '💧',
      urgency: 'high',
      title: `ONLY ${waterL}L WATER — FAT METABOLISM SLUGGISH`,
      body: `Lipolysis requires water as a chemical reactant. You're running dehydrated — fat burning is literally slower right now. 500ml immediately, then one glass every hour. 3L/day also suppresses false hunger signals, which matters on a ${calTarget} kcal diet.`,
      action: 'Drink 500ml right now, then one glass every hour until 3L.',
    })
  }

  // ── EVENING PROTEIN WINDOW ───────────────────────────────────────────────

  if (hour >= 20 && protein < proteinTarget * 0.85) {
    insights.push({
      id: 'casein-window', tag: 'SCIENCE', color: C.SCIENCE, icon: '🌙',
      title: `${protoGap}G PROTEIN LEFT — CLOSE IT BEFORE BED`,
      body: `Casein protein (cottage cheese, Greek yogurt) releases amino acids over 5–7 hours. During tonight's overnight fast, this drip of leucine keeps muscle protein synthesis elevated. You have ${protoGap}g to go — close it before 11PM.`,
      action: `${protoGap}g left: cottage cheese 200g (25g) + 1 egg (6g) = done.`,
      urgency: protoGap > 30 ? 'high' : undefined,
    })
  }

  // ── TOTAL BURN BREAKDOWN ──────────────────────────────────────────────────

  if (totalBurned > 500 && (workoutDone || cardioLogged || steps > 7000)) {
    const bmr = Math.round(maintenance / 1.55)
    const totalExpenditure = bmr + totalBurned
    const deficit = totalExpenditure - calories
    insights.push({
      id: 'burn-breakdown', tag: 'PROGRESS', color: C.PROGRESS, icon: '🔥',
      title: `${totalBurned} KCAL ACTIVE BURN TODAY`,
      body: `Breakdown: lifting ${workoutDone && !isRestDay ? 350 : 0} kcal + steps ${stepsKcal(steps, weight)} kcal${cardioLogged ? ` + cardio ${Math.round(weight * cardioMinutes * 0.085)} kcal` : ''}. BMR ~${bmr} kcal. Total expenditure ~${totalExpenditure} kcal vs ${calories} kcal intake = ${deficit > 0 ? deficit + ' kcal deficit' : 'surplus'}.`,
    })
  }

  // ── LOCKED-IN DAY ────────────────────────────────────────────────────────

  if (workoutDone && protein >= proteinTarget * 0.85 && calories <= calTarget && steps >= 8000) {
    insights.push({
      id: 'locked-in', tag: 'COACH', color: C.COACH, icon: '🔒',
      title: "LOCKED IN TODAY — THIS IS HOW IT'S DONE",
      body: `Workout done, protein ${protein}g / ${proteinTarget}g, calories ${calories} / ${calTarget}, steps ${steps.toLocaleString()}. Every single box checked. Stack ${weeksLeft} weeks of days like this and the outcome is mathematically guaranteed. Sleep 8 hours and run it again tomorrow.`,
    })
  }

  // ── NEAR PROTEIN TARGET ──────────────────────────────────────────────────

  if (hour >= 17 && protein >= proteinTarget * 0.7 && protein < proteinTarget * 0.9) {
    insights.push({
      id: 'almost-protein', tag: 'FUEL', color: C.FUEL, icon: '🎯',
      title: `${protoGap}G PROTEIN LEFT — EASY CLOSE`,
      body: `${protein}g logged, ${protoGap}g to go. That's one Greek yogurt (17g), one egg (6g), or a small chicken portion. The difference between hitting and missing your protein target tonight directly determines whether muscle protein synthesis runs through the night.`,
      action: `Greek yogurt 150g (13g) + 1 egg (6g) + 25g almonds (6g) = ${protoGap}g closed.`,
    })
  }

  // ── STEPS EARLY ──────────────────────────────────────────────────────────

  if (steps >= 10000 && hour < 17) {
    insights.push({
      id: 'steps-early', tag: 'MOVE', color: C.MOVE, icon: '👟',
      title: `10K STEPS DONE BEFORE ${hour}:00`,
      body: `${stepsKcal(steps, weight)} kcal passive burn already banked. Every additional 1,000 steps adds ${stepsKcal(1000, weight)} kcal to your deficit for free. People who consistently hit 12–15K steps lose fat measurably faster than those who stop at 10K.`,
    })
  }

  // ── GOOD PROTEIN ─────────────────────────────────────────────────────────

  if (hour >= 15 && protein >= proteinTarget * 0.8 && protein <= proteinTarget * 1.1) {
    insights.push({
      id: 'protein-good', tag: 'COACH', color: C.COACH, icon: '✅',
      title: `PROTEIN ON TRACK — ${protein}G / ${proteinTarget}G`,
      body: `Right in the zone. On a cut, protein is the variable that determines whether you lose fat or fat+muscle. Every gram you hit today is protecting the lean mass you've built. Keep this consistent across the week.`,
    })
  }

  // ── WORKOUT DONE ─────────────────────────────────────────────────────────

  if (workoutDone && !isRestDay) {
    insights.push({
      id: 'workout-done', tag: 'COACH', color: C.COACH, icon: '🔥',
      title: 'SESSION DONE — NOW PROTECT IT',
      body: `Muscle protein synthesis is elevated for the next 2–3 hours. Feed it: 40–50g protein now, rehydrate (${Math.round((3000 - waterMl) / 1000 * 10) / 10}L water still to go), and sleep 7+ hours. The session is the trigger — recovery is where the adaptation happens.`,
      action: waterMl < 2000 ? `Drink ${Math.round((3000 - waterMl) / 100) * 100}ml water now. Then 40-50g protein within 2 hours.` : '40-50g protein in the next 2 hours.',
    })
  }

  // ── CARDIO COACHING ───────────────────────────────────────────────────────

  if (cardioLogged && cardioMinutes > 0) {
    const cardioTypeLabel = cardioType === 'incline_walk' ? 'incline walk' : 'cross trainer'
    insights.push({
      id: 'cardio-done', tag: 'MOVE', color: C.MOVE, icon: '🏃',
      title: `${cardioMinutes}MIN ${cardioTypeLabel?.toUpperCase()} DONE`,
      body: cardioType === 'incline_walk'
        ? `Incline walking at 60–70% max HR uses stored fat as primary fuel. This is precisely the right cardio for a cut — fat as fuel, cortisol stays low, muscle preserved. ${cardioMinutes} minutes at ~${Math.round(weight * cardioMinutes * 0.085)} kcal burned without the cortisol spike of high-intensity work.`
        : `Cross trainer logged. Good cardiovascular work with low joint impact. ${cardioMinutes} minutes adds ~${Math.round(weight * cardioMinutes * 0.1)} kcal to your deficit. Combined with the step target, your NEAT burn today is above average.`,
    })
  }

  if (dayOfWeek >= 4 && weekCardioDays === 0) {
    insights.push({
      id: 'no-cardio', tag: 'MOVE', color: C.MOVE, icon: '🏃',
      title: 'NO CARDIO YET THIS WEEK — 3 SESSIONS TARGET',
      body: `Three 35-min incline walks = ~1,200 extra kcal this week. Without them, you'd need to cut 170 kcal/day from food to hit the same deficit — making the diet harder and hunger worse. Cardio makes the cut easier, not harder. Log a session this weekend.`,
      action: 'Schedule a 35-min incline walk tomorrow morning.',
    })
  }

  // ── WEEK HABITS PATTERN ──────────────────────────────────────────────────

  if (weekSleepDays >= 5 && weekSupplementDays >= 5) {
    insights.push({
      id: 'habits-consistent', tag: 'RECOVER', color: C.RECOVER, icon: '🌙',
      title: `${weekSleepDays}/7 NIGHTS SLEEP · ${weekSupplementDays}/7 SUPPLEMENT DAYS`,
      body: `Sleep and supplement compliance this week is strong. Consistent sleep means cortisol stays controlled, GH pulses are firing nightly, and recovery is happening. Combined with creatine saturation from daily supplementation, your body is in the best possible state to protect muscle on this cut.`,
    })
  }

  if (weekVeggieDays >= 5) {
    insights.push({
      id: 'veggie-streak', tag: 'FUEL', color: C.FUEL, icon: '🥦',
      title: `VEGETABLES ${weekVeggieDays}/7 DAYS THIS WEEK`,
      body: `${weekVeggieDays} days of vegetable intake this week. Consistent micronutrient supply means zinc and magnesium are topped up — directly supporting testosterone production and sleep quality. This is the type of habit that makes a cut sustainable rather than a grind.`,
    })
  }

  // ── CHECK-IN MOOD ─────────────────────────────────────────────────────────

  if (lastCheckinRating !== null && lastCheckinRating <= 5) {
    insights.push({
      id: 'checkin-low', tag: 'COACH', color: C.COACH, icon: '💬',
      title: `LAST CHECK-IN: ${lastCheckinRating}/10 — HARD WEEK ACKNOWLEDGED`,
      body: `A ${lastCheckinRating}/10 week is tough — acknowledged. But difficult weeks are where the gap between transformation and just-trying widens. Motivation is variable. Discipline is not. The goal doesn't adjust for how you feel this week. The body doesn't care about your current energy levels. Show up anyway.`,
    })
  }

  // ── STREAK ───────────────────────────────────────────────────────────────

  if (streak >= 5) {
    insights.push({
      id: 'streak', tag: 'COACH', color: C.COACH, icon: '⚡',
      title: `${streak}-DAY STREAK — DON'T BREAK THE CHAIN`,
      body: `${streak} consecutive days of showing up. Body composition changes are built on this — not individual sessions, but the relentless daily standard. At day ${streak}, the habits are starting to become automatic. The people who actually transform look back and point to a streak like this as the turning point.`,
    })
  }

  // ── WEEK TRACKERS ─────────────────────────────────────────────────────────

  if (dayOfWeek === 1) {
    insights.push({
      id: 'monday-reset', tag: 'COACH', color: C.COACH, icon: '🗓️',
      title: 'MONDAY. NEW WEEK. CLEAN SLATE.',
      body: `Whatever last week looked like is irrelevant. 5 sessions, 3 cardio, protein and calories tracked every day. Set the intention now — not Wednesday. The people who look the way you want to look made this decision every Monday for 13 straight weeks.`,
      action: 'Log your first meal and get today\'s session done before noon.',
    })
  }

  if (dayOfWeek === 5 && weekWorkouts < 5) {
    insights.push({
      id: 'friday-checkin', tag: 'PROGRESS', color: C.PROGRESS, icon: '📊',
      title: `FRIDAY — ${weekWorkouts}/5 SESSIONS. WEEKEND IS THE WINDOW.`,
      body: `${5 - weekWorkouts} session${5 - weekWorkouts > 1 ? 's' : ''} remaining. Saturday morning gym before the day gets busy is one of the most disciplined choices you can make. It sets the tone for the following week. Don't give yourself a reason to start Monday behind.`,
      action: 5 - weekWorkouts === 1 ? 'Set a Saturday 7AM alarm right now.' : `Saturday + Sunday morning: ${5 - weekWorkouts} sessions.`,
    })
  }

  if (weekWorkouts >= 5) {
    insights.push({
      id: 'week-complete', tag: 'PROGRESS', color: C.PROGRESS, icon: '🏆',
      title: '5/5 SESSIONS — COMPLETE WEEK',
      body: `Five training sessions completed. The stimulus is done. Now your body spends 48+ hours rebuilding. Protect the investment: keep protein at ${proteinTarget}g through the weekend, prioritize sleep, maintain steps. Recovery quality determines how much of this week's work becomes permanent adaptation.`,
    })
  }

  // ── VOLUME EATING ─────────────────────────────────────────────────────────

  if (calories < calTarget * 0.5 && hour >= 15) {
    insights.push({
      id: 'volume-eating', tag: 'FUEL', color: C.FUEL, icon: '🥗',
      title: `${Math.max(calTarget - calories, 0)} KCAL LEFT — EAT SMARTER`,
      body: `Going too far below ${calTarget} kcal triggers a cortisol spike and increases muscle breakdown. Volume foods fix this: 500g vegetables ≈ 100–150 kcal but triple the meal size. Broccoli, spinach, cucumber — fill half the plate before anything else. Satiety comes from stomach volume, not just calories.`,
      action: 'Add 400g vegetables to your next meal before logging the protein source.',
    })
  }

  // ── WEEKLY DEFICIT ────────────────────────────────────────────────────────

  if (weekCalAvg !== null) {
    const deficit = maintenance - weekCalAvg
    const kgPerWk = (deficit * 7 / 7700).toFixed(2)
    const onTrack = deficit >= 400
    insights.push({
      id: 'weekly-deficit', tag: 'PROGRESS', color: C.PROGRESS, icon: '📊',
      title: onTrack ? `ON TRACK — ~${kgPerWk}KG FAT/WEEK` : `DEFICIT TOO SMALL THIS WEEK`,
      body: onTrack
        ? `Averaging ${weekCalAvg} kcal vs ${maintenance} kcal maintenance. That ${Math.round(deficit)} kcal/day deficit projects to ~${kgPerWk}kg fat lost this week. ${weeksLeft} weeks of this and you're at ${targetWeight}kg. The maths is working.`
        : `Averaging ${weekCalAvg} kcal — only ${Math.round(deficit)} kcal below maintenance. You need ~520 kcal/day deficit to hit ${targetWeight}kg on schedule. Tighten the diet, add cardio, or both. The gap is closeable this week.`,
    })
  }

  // ── GOAL PROJECTION ───────────────────────────────────────────────────────

  insights.push({
    id: 'goal-math', tag: 'PROGRESS', color: C.PROGRESS, icon: '🎯',
    title: `${fatToLose.toFixed(1)}KG FAT TO 15% — ${weeksLeft} WEEKS`,
    body: `Current: ${weight}kg at ${bodyFat}% BF = ${fatNow.toFixed(1)}kg fat. Target: ${targetWeight}kg at 15% = ${fatGoal.toFixed(1)}kg fat. Gap: ${fatToLose.toFixed(1)}kg. At 520 kcal/day deficit: ${weeksLeft} weeks. You have ${(weight * (1 - bodyFat / 100)).toFixed(1)}kg lean mass right now. The cut just reveals it.`,
  })

  // ── SCIENCE POOL ──────────────────────────────────────────────────────────

  const sciencePool: Insight[] = [
    {
      id: 'why-protein', tag: 'SCIENCE', color: C.SCIENCE, icon: '🔬',
      title: 'WHY PROTEIN IS YOUR #1 PRIORITY ON A CUT',
      body: `At ${proteinTarget}g/day (2.2g/kg bodyweight), you give your body enough amino acids to keep muscle protein synthesis running. Without this, a calorie deficit signals catabolism — muscle tissue is broken down for fuel. The weight you lose on a cut should be fat. Protein is what makes that the case.`,
    },
    {
      id: 'why-sleep', tag: 'RECOVER', color: C.RECOVER, icon: '😴',
      title: 'SLEEP IS WHERE FAT LOSS HAPPENS',
      body: `Growth hormone is released in pulses during deep sleep and directly signals adipose tissue to release stored fat. Sub-7 hours reduces GH secretion by 70%. You can eat perfectly and train hard, but chronic sleep deprivation will stall fat loss and accelerate muscle loss. 7+ hours is non-negotiable.`,
      action: 'Screens off by 9:30PM. In bed by 10PM. Room temperature 18–19°C.',
    },
    {
      id: 'why-incline', tag: 'MOVE', color: C.MOVE, icon: '⛰️',
      title: 'WHY INCLINE WALKING BEATS RUNNING FOR FAT LOSS',
      body: `At 60–70% max heart rate, your primary fuel source is stored fat. At high intensity (running), you burn more total calories but shift to glycogen and spike cortisol — which promotes visceral fat storage. LISS 3× per week = fat as fuel, cortisol controlled, muscle preserved.`,
    },
    {
      id: 'why-heavy', tag: 'MOVE', color: C.MOVE, icon: '🏋️',
      title: 'NEVER REDUCE YOUR WORKING WEIGHTS ON A CUT',
      body: `Heavy loading activates mTOR — the pathway that tells your body to preserve muscle tissue. Without this signal, muscle becomes metabolically expensive tissue with no apparent purpose. Keep the load high. The heavier you lift on a deficit, the more muscle you hold.`,
    },
    {
      id: 'why-cortisol', tag: 'SCIENCE', color: C.SCIENCE, icon: '⚗️',
      title: 'CHRONIC STRESS IS MAKING YOUR CUT HARDER',
      body: `Prolonged caloric restriction raises cortisol, which promotes visceral fat storage. This is why crash diets fail. Your ${calTarget} kcal target is calibrated to create a deficit without triggering this response. Stay above 1,500 kcal, manage life stress, and protect sleep.`,
    },
    {
      id: 'why-water', tag: 'SCIENCE', color: C.SCIENCE, icon: '💧',
      title: 'WATER IS A REACTANT IN FAT BREAKDOWN',
      body: `Lipolysis requires water as a chemical reactant. Drink less and the fat-burning reaction slows. 3L/day also suppresses false hunger — thirst is misread as hunger significantly on a restricted diet. At ${calTarget} kcal, every hunger-management tool matters.`,
    },
    {
      id: 'why-if', tag: 'SCIENCE', color: C.SCIENCE, icon: '⏱️',
      title: 'WHAT FASTING ACTUALLY DOES',
      body: `After 12–16 hours fasted: insulin drops to baseline, noradrenaline rises 44%, lipolysis accelerates. 16:8 also naturally restricts your eating window, making calorie control easier. The window is more important than any specific timing — just be consistent.`,
    },
    {
      id: 'why-legs', tag: 'MOVE', color: C.MOVE, icon: '🦵',
      title: 'TWO LEG DAYS: THE METABOLIC MULTIPLIER',
      body: `Legs A and Legs B target 60% of total muscle mass. Training cost: 400–600 kcal per session vs 200–300 for upper body. Two leg days per week = ~600 extra kcal weekly deficit. That's equivalent to an entire extra cardio session built into the program.`,
    },
    {
      id: 'why-creatine', tag: 'SCIENCE', color: C.SCIENCE, icon: '💊',
      title: 'CREATINE PROTECTS MUSCLE ON A CUT',
      body: `5g/day creatine replenishes phosphocreatine faster between sets — letting you maintain training intensity when glycogen is lower from the deficit. This is the stimulus that tells your body to preserve muscle. The most evidence-backed supplement for body composition during a cut. Daily, including rest days.`,
      action: '5g creatine monohydrate with your post-workout meal. Every day.',
    },
    {
      id: 'why-mps-window', tag: 'SCIENCE', color: C.SCIENCE, icon: '🔬',
      title: 'THE 2-HOUR POST-WORKOUT WINDOW IS REAL',
      body: `After resistance training, muscle protein synthesis elevation lasts 2–3 hours and leucine sensitivity peaks. Your muscles absorb amino acids more efficiently now than at any other point in the day. 40–50g protein (containing ~3g leucine) in this window maximises the return on every session.`,
    },
    {
      id: 'compound-effect', tag: 'PROGRESS', color: C.PROGRESS, icon: '📈',
      title: 'THE MATHS OF 13 WEEKS',
      body: `520 kcal deficit × 91 days = 47,320 kcal total deficit. At 7,700 kcal per kg fat, that's 6.1 kg of pure fat — not from surgery, not from a pill. From eating right and training every day. This is the arithmetic of body transformation. You're running it right now.`,
    },
    {
      id: 'reveal', tag: 'SCIENCE', color: C.SCIENCE, icon: '💪',
      title: 'THE MUSCLE IS ALREADY THERE',
      body: `You currently have ${(weight * (1 - bodyFat / 100)).toFixed(1)}kg of lean mass. At 15% BF and ${targetWeight}kg, you'll have ${(targetWeight * 0.85).toFixed(1)}kg — essentially the same muscle, with ${fatToLose.toFixed(1)}kg less fat over it. Every rep you've ever done is still there. The cut just reveals it.`,
    },
    {
      id: 'progressive-overload', tag: 'MOVE', color: C.MOVE, icon: '📈',
      title: 'THE ONE VARIABLE THAT PRESERVES MUSCLE ON A CUT',
      body: `Progressive overload signals: this muscle is needed, do not burn it. Without mechanical stimulus, your body has no reason to maintain expensive tissue during an energy deficit. 1 extra rep per set, 2.5kg added every 2 weeks — this difference separates losing fat from losing fat+muscle.`,
    },
    {
      id: 'deep-sleep', tag: 'RECOVER', color: C.RECOVER, icon: '🛌',
      title: 'SLEEP: THE MOST ANABOLIC STATE',
      body: `The first 90-min sleep cycle produces the day's highest GH pulse — mobilising stored fat AND driving muscle repair simultaneously. One night at 5 hours reduces next-day anabolic hormone levels by 15–20%. Your 5:30AM alarm makes lights-out by 10PM non-negotiable.`,
      action: 'Screens off 9:30PM. In bed 10PM. Cool, dark room.',
    },
    {
      id: 'fiber-satiety', tag: 'SCIENCE', color: C.SCIENCE, icon: '🌱',
      title: '30G FIBER/DAY MAKES YOUR DEFICIT LIVABLE',
      body: `Fiber slows gastric emptying by 2–3 hours — extending satiety significantly. It also feeds gut bacteria producing short-chain fatty acids that improve insulin sensitivity. Oats 8g, lentils 8g, broccoli 3g, chia seeds 10g. Hit 30g/day and hunger on ${calTarget} kcal becomes manageable.`,
    },
    {
      id: 'compound-movements', tag: 'MOVE', color: C.MOVE, icon: '🏗️',
      title: 'COMPOUND MOVEMENTS: FAT LOSS MULTIPLIERS',
      body: `Squats, deadlifts, bench, rows — compound movements recruit multiple muscle groups simultaneously, burning 40–60% more kcal per set than isolation work. They also trigger a larger testosterone and GH response. On a limited schedule, compounds give the maximum return per gym minute.`,
    },
    {
      id: 'alcohol-impact', tag: 'SCIENCE', color: C.SCIENCE, icon: '🚫',
      title: 'ALCOHOL HALTS FAT OXIDATION FOR 24–48 HOURS',
      body: `Ethanol (7 kcal/g) stops fat burning entirely while the body processes it as a priority toxin. Two drinks on Saturday halts fat oxidation until Monday — 2 of your 7 weekly fat-burning days eliminated. Social situations don't require alcohol. Sparkling water with lime is indistinguishable.`,
    },
    {
      id: 'dehydration-performance', tag: 'SCIENCE', color: C.SCIENCE, icon: '💧',
      title: '2% DEHYDRATION = 10% STRENGTH LOSS',
      body: `At 2% body weight dehydration — ~1.5kg for you — strength drops 10% and cognitive performance 15–20%. You won't feel thirsty until already 1–2% dehydrated. 500ml on waking, 500ml pre-training, 250ml every hour. 3L/day is your minimum.`,
    },
    {
      id: 'insulin-sensitivity', tag: 'SCIENCE', color: C.SCIENCE, icon: '🔬',
      title: 'INSULIN SENSITIVITY IS THE UNDERLYING VARIABLE',
      body: `Insulin is your primary fat-storage hormone. When cells are sensitive, glucose goes into muscle (not fat). Training and sleep improve it acutely; sugar, alcohol, and sleep deprivation worsen it. Every habit in this app — training, sleep, protein, water — is an insulin sensitivity intervention.`,
    },
  ]

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const picked = new Set<number>()
  for (let a = 0; picked.size < 3; a++) picked.add(seededInt(dayOfYear * 17 + a * 31, sciencePool.length))
  for (const i of picked) insights.push(sciencePool[i])

  return insights
}
