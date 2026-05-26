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
  weight: number
  bodyFat: number
  maintenance: number
  calories: number
  protein: number
  steps: number
  workoutDone: boolean
  cardioLogged: boolean
  weekCardioDays: number
  waterMl: number
  hour: number
  weekWorkouts: number
  weekCalAvg: number | null
  targetWeight: number
  targetBf: number
  calTarget: number
  proteinTarget: number
  dayOfWeek: number
  streak: number
  weeksSinceGoalSet?: number
  isRestDay: boolean
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
    calories, protein, steps, workoutDone, weekCardioDays, waterMl, hour,
    weekWorkouts, weekCalAvg, targetWeight, calTarget, proteinTarget,
    dayOfWeek, streak, isRestDay,
  } = ctx

  const fatNow     = weight * bodyFat / 100
  const fatGoal    = targetWeight * 0.15
  const fatToLose  = Math.max(fatNow - fatGoal, 0)
  const weeksLeft  = weeksToGoal(fatToLose, 520)
  const protoGap   = Math.max(proteinTarget - protein, 0)
  const waterL     = (waterMl / 1000).toFixed(1)
  const isWorkout  = !workoutDone
  const dayNames   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today      = dayNames[dayOfWeek]
  const insights: Insight[] = []

  // ── MORNING CHECK-IN (before 11am) ───────────────────────────────────────

  if (hour < 11) {
    insights.push({
      id: 'morning-brief', tag: 'COACH', color: C.COACH, icon: '🌅',
      title: `GOOD MORNING — HERE'S YOUR ${today.toUpperCase()} BRIEF`,
      body: `You're ${weeksLeft} weeks away from ${targetWeight}kg and 15% body fat. Today your job is simple: hit ${calTarget} kcal, ${proteinTarget}g protein, 10,000 steps${isWorkout ? ', and get your session done' : ''}. Stack these daily and the goal takes care of itself.`,
    })

    if (waterMl < 250) {
      insights.push({
        id: 'morning-hydrate', tag: 'RECOVER', color: C.RECOVER, icon: '💧',
        title: 'FIRST THING: DRINK 500ML WATER',
        body: `Your body loses 400-600ml of water overnight through breathing and sweat. Rehydrating before coffee blunts the cortisol spike, kickstarts metabolism, and improves morning workout performance. Make it a ritual — glass of water before anything else.`,
      })
    }

    if (isWorkout && weekWorkouts < 5) {
      insights.push({
        id: 'morning-session', tag: 'MOVE', color: C.MOVE, icon: '🏋️',
        title: `YOU HAVE ${5 - weekWorkouts} SESSIONS LEFT THIS WEEK`,
        body: `Each session you complete maintains the mTOR signaling that tells your body to keep — not burn — your muscle tissue. On a cut, the gym isn't optional. It's the thing that determines whether you lose fat or lose muscle. Get it done today.`,
      })
    }
  }

  // ── PRE-WORKOUT FUEL WINDOW (5–8am, workout not done, week not full) ─────

  if (hour >= 5 && hour < 8 && !workoutDone && weekWorkouts < 5) {
    insights.push({
      id: 'pre-workout-fuel', tag: 'FUEL', color: C.FUEL, icon: '⚡',
      title: 'FUEL THE SESSION — EAT BEFORE YOU LIFT',
      body: `Training within the next 2 hours? A small pre-workout meal — 150-200 kcal with 20-30g protein — prevents muscle protein breakdown during the session and maintains intensity. Greek yogurt + banana, or scrambled eggs on rice cakes. Fasted training on a deficit increases muscle catabolism during the session itself.`,
      action: 'Greek yogurt (150g) + 1 banana → 20g protein, fast carbs, ready in 2 minutes.',
    })
  }

  // ── REST DAY COACHING ────────────────────────────────────────────────────

  if (isRestDay) {
    insights.push({
      id: 'rest-day-guide', tag: 'RECOVER', color: C.RECOVER, icon: '🔄',
      title: 'REST DAY — RECOVER LIKE A PROFESSIONAL',
      body: `Your muscles are rebuilding from this week's sessions. Rest day isn't zero-effort day — it's where adaptation actually happens. Walk 8,000–10,000 easy steps to flush metabolic waste and drive blood flow without adding breakdown stimulus. Keep protein high (your full ${proteinTarget}g target still applies). Sleep 8+ hours tonight. You're not losing progress today — you're locking it in.`,
      action: `Hit ${proteinTarget}g protein, 3L water, and an easy 8K-step walk today.`,
    })
  }

  // ── URGENT / ACTIONABLE ───────────────────────────────────────────────────

  // Protein gap after noon
  if (hour >= 12 && protein < proteinTarget * 0.5) {
    insights.push({
      id: 'protein-low', tag: 'FUEL', color: C.FUEL, icon: '🥩',
      title: `YOU'RE ${protoGap}G SHORT ON PROTEIN`,
      body: `At ${protein}g, you're only halfway to your ${proteinTarget}g target. On a calorie deficit, insufficient protein forces your body to break down muscle tissue for fuel — you'd lose lean mass, not just fat. Add a chicken breast (40g), Greek yogurt (17g), or whey shake (25g) before the day ends.`,
      action: `Add cottage cheese (200g = 25g), Greek yogurt (17g), or a whey shake (25g) before the day ends.`,
    })
  }

  // Over calories
  if (calories > calTarget + 150) {
    const over = calories - calTarget
    insights.push({
      id: 'over-cals', tag: 'FUEL', color: C.FUEL, icon: '⚠️',
      title: `YOU'RE ${over} KCAL OVER — MAKE IT UP`,
      body: `Going ${over} kcal above your target today partially wipes out your deficit. You can recover this: a 35-min incline walk burns ~${stepsKcal(4000, weight)} kcal, and skipping any late snack will bring you back inline. Awareness now stops this becoming a habit.`,
      action: 'Skip any evening snack and do a 30-min brisk walk to close the gap.',
      urgency: 'high',
    })
  }

  // No meals logged after 2pm
  if (hour >= 14 && calories === 0) {
    insights.push({
      id: 'no-meals', tag: 'FUEL', color: C.FUEL, icon: '📋',
      title: `IT'S ${hour}:00 AND NOTHING'S BEEN LOGGED`,
      body: `This isn't about punishment — it's about awareness. Studies show untracked days have 30-40% more calories on average. You can't manage what you don't measure. Log what you've eaten so far and we get back on track.`,
      urgency: 'high',
      action: 'Open Nutrition and log what you\'ve already eaten today.',
    })
  }

  // Low steps in the afternoon
  if (hour >= 16 && steps < 5000) {
    const extraBurn = stepsKcal(10000 - steps, weight)
    insights.push({
      id: 'steps-low', tag: 'MOVE', color: C.MOVE, icon: '👟',
      title: `ONLY ${steps.toLocaleString()} STEPS — YOU NEED TO MOVE`,
      body: `You still need ${(10000 - steps).toLocaleString()} steps to hit your daily target. That's ${extraBurn} kcal of passive burn — no gym, no effort, just walking. A 30-min evening walk gets you there. Missing this daily adds ~1 extra week to your ${targetWeight}kg goal.`,
      action: `A 30-min evening walk gets you there — that's ${10000 - steps} more steps.`,
    })
  }

  // Low water midday+
  if (hour >= 13 && waterMl < 1500) {
    insights.push({
      id: 'water-low', tag: 'RECOVER', color: C.RECOVER, icon: '💧',
      title: `ONLY ${waterL}L WATER — YOUR FAT METABOLISM IS SLUGGISH`,
      body: `Water is literally required for lipolysis — the chemical process of breaking down stored fat. You're running dehydrated right now. Drink 500ml immediately, then one glass every hour until you hit 3L. It also suppresses false hunger signals, which helps on a cut.`,
      action: 'Drink 500ml right now, then one glass every hour.',
      urgency: 'high',
    })
  }

  // ── EVENING PROTEIN WINDOW (after 8pm, still short on protein) ────────────

  if (hour >= 20 && protein < proteinTarget * 0.85) {
    insights.push({
      id: 'casein-window', tag: 'SCIENCE', color: C.SCIENCE, icon: '🌙',
      title: 'TAKE 30-40G PROTEIN BEFORE BED',
      body: `Casein (cottage cheese, Greek yogurt, or slow-release shake) releases amino acids slowly over 5-7 hours. During the overnight fast, this sustained leucine drip keeps muscle protein synthesis elevated while you sleep. You've still got ${protoGap}g to hit tonight — close this gap before 11PM.`,
      action: `${protoGap}g left: cottage cheese 200g (25g) + 1 boiled egg (6g) = done.`,
      urgency: protoGap > 30 ? 'high' : undefined,
    })
  }

  // ── LOCKED-IN DAY ────────────────────────────────────────────────────────

  if (workoutDone && protein >= proteinTarget * 0.85 && calories <= calTarget && steps >= 8000) {
    insights.push({
      id: 'locked-in', tag: 'COACH', color: C.COACH, icon: '🔒',
      title: "LOCKED IN — THIS IS EXACTLY HOW IT'S DONE",
      body: `Workout done, protein on track, calories controlled, steps moving. Stack 90 days like this and the body composition math is simple. The compound effect of a day this complete is ${Math.round((maintenance - calories) / 7700 * 100) / 100}kg of fat loss — one day at a time. Sleep 8 hours tonight and repeat tomorrow.`,
    })
  }

  // ── NEAR PROTEIN TARGET (after 5pm, 70-90% of target) ────────────────────

  if (hour >= 17 && protein >= proteinTarget * 0.7 && protein < proteinTarget * 0.9) {
    insights.push({
      id: 'almost-protein', tag: 'FUEL', color: C.FUEL, icon: '🎯',
      title: `ONLY ${protoGap}G TO GO ON PROTEIN`,
      body: `You're close to your ${proteinTarget}g target and this last gap is genuinely easy to close. ${protoGap}g is one Greek yogurt, one and a half eggs, or a small chicken portion. The difference between hitting and missing your protein target tonight is the difference between muscle protein synthesis running all night or shutting down.`,
      action: `${protoGap}g left: Greek yogurt 150g (13g) + 1 egg (6g) + 25g almonds (6g).`,
    })
  }

  // ── STEPS AHEAD OF SCHEDULE (10K before 5pm) ─────────────────────────────

  if (steps >= 10000 && hour < 17) {
    insights.push({
      id: 'steps-early', tag: 'MOVE', color: C.MOVE, icon: '👟',
      title: '10K STEPS DONE EARLY — KEEP GOING',
      body: `You hit your step target before ${hour}:00 — that's ${stepsKcal(steps, weight)} kcal of passive burn already banked. Every additional 1,000 steps from here adds ${stepsKcal(1000, weight)} kcal to your deficit for free. The people who consistently hit 12-15K steps lose fat noticeably faster than those who stop at 10K.`,
    })
  }

  // ── HUNGER MANAGEMENT (below 50% calories after 3pm) ────────────────────

  if (calories < calTarget * 0.5 && hour >= 15) {
    insights.push({
      id: 'volume-eating', tag: 'FUEL', color: C.FUEL, icon: '🥗',
      title: 'EAT MORE FOOD — JUST SMARTER',
      body: `You still have ${Math.max(calTarget - calories, 0)} kcal left today — use them. On a 1,930 kcal target, going too low triggers a larger cortisol spike and increases muscle breakdown. Volume foods (500g vegetables ≈ 100 kcal) let you fill your stomach without touching the calorie count. Hunger on a cut is a management problem, not a willpower test.`,
      action: 'Add 400g of broccoli, spinach, or cucumber to your next meal before logging protein.',
    })
  }

  // ── FRIDAY CHECK-IN ──────────────────────────────────────────────────────

  if (dayOfWeek === 5 && weekWorkouts < 5) {
    insights.push({
      id: 'friday-checkin', tag: 'PROGRESS', color: C.PROGRESS, icon: '📊',
      title: `FRIDAY — ${weekWorkouts}/5 SESSIONS DONE`,
      body: `${5 - weekWorkouts} session${5 - weekWorkouts > 1 ? 's' : ''} left to complete the week. The weekend is the window. Saturday morning gym before the day gets busy is one of the most disciplined choices you can make — it sets the tone for the entire following week. Don't give yourself a reason to start Monday behind.`,
      action: 5 - weekWorkouts === 1 ? 'Schedule Saturday morning now — gym first, everything else after.' : `Saturday + Sunday morning: ${5 - weekWorkouts} sessions, done.`,
    })
  }

  // ── MONDAY RESET ──────────────────────────────────────────────────────────

  if (dayOfWeek === 1) {
    insights.push({
      id: 'monday-reset', tag: 'COACH', color: C.COACH, icon: '🗓️',
      title: 'MONDAY. NEW WEEK. CLEAN SLATE.',
      body: `Whatever happened last week is irrelevant. Today the counter resets: 5 sessions, 3 cardio, protein and calories every day. Set your intention now, not Wednesday. The people who look the way you're working toward made a non-negotiable decision every Monday morning for 13 straight weeks. That decision starts today.`,
      action: 'Log your first meal and get your session done before noon if possible.',
    })
  }

  // ── WEEK COMPLETE ─────────────────────────────────────────────────────────

  if (weekWorkouts >= 5) {
    insights.push({
      id: 'week-complete', tag: 'PROGRESS', color: C.PROGRESS, icon: '🏆',
      title: '5/5 SESSIONS — COMPLETE WEEK',
      body: `Five training sessions this week. Every rep, every set, every session — completed. Your body will spend the next 48 hours rebuilding and adapting. Protect the investment: keep protein high through the weekend, prioritize sleep, and keep steps moving. One more week like this and the momentum is genuinely hard to stop.`,
    })
  }

  // ── GOOD PROTEIN ─────────────────────────────────────────────────────────

  if (hour >= 15 && protein >= proteinTarget * 0.8 && protein <= proteinTarget * 1.1) {
    insights.push({
      id: 'protein-good', tag: 'COACH', color: C.COACH, icon: '✅',
      title: `PROTEIN IS ON TRACK — GOOD WORK`,
      body: `You're at ${protein}g protein today — close to your ${proteinTarget}g target. This is the most important nutritional variable on a cut. Every gram of protein you hit today is a direct investment in keeping the muscle you've built while shedding the fat. Keep this consistent.`,
    })
  }

  // ── WORKOUT DONE ─────────────────────────────────────────────────────────

  if (workoutDone) {
    insights.push({
      id: 'workout-done', tag: 'COACH', color: C.COACH, icon: '🔥',
      title: `SESSION DONE — NOW PROTECT THE WORK`,
      body: `You've created the stimulus for muscle protein synthesis. Now feed it: 40-50g protein in the next 2 hours, rehydrate, and sleep 7+ hours tonight. The workout is the trigger — recovery is where the actual adaptation happens. Don't shortchange the recovery half.`,
    })
  }

  // ── NO CARDIO BY THURSDAY ─────────────────────────────────────────────────

  if (dayOfWeek >= 4 && weekCardioDays === 0) {
    insights.push({
      id: 'no-cardio', tag: 'MOVE', color: C.MOVE, icon: '🏃',
      title: `NO CARDIO YET THIS WEEK — 3 SESSIONS TARGET`,
      body: `Three 35-min incline walks burns ~1,200 extra kcal this week. Without them you'd need to cut an extra 170 kcal/day from food to hit the same deficit — making the diet harder and hunger worse. Cardio makes your cut easier, not harder. Log a session today.`,
    })
  }

  // ── STREAK ───────────────────────────────────────────────────────────────

  if (streak >= 3) {
    insights.push({
      id: 'streak', tag: 'COACH', color: C.COACH, icon: '⚡',
      title: `${streak}-DAY STREAK — DON'T BREAK THE CHAIN`,
      body: `${streak} consecutive days of showing up. This is how body composition actually changes — not through perfect individual sessions, but through relentless daily consistency. Your body is adapting right now. Every day you protect this streak, the compound interest builds.`,
    })
  }

  // ── PROGRESS NARRATIVE ────────────────────────────────────────────────────

  if (weekCalAvg !== null) {
    const deficit  = maintenance - weekCalAvg
    const kgPerWk  = (deficit * 7 / 7700).toFixed(2)
    const onTrack  = deficit >= 400
    insights.push({
      id: 'weekly-deficit', tag: 'PROGRESS', color: C.PROGRESS, icon: '📊',
      title: onTrack ? `ON TRACK — ~${kgPerWk}KG/WEEK DEFICIT` : 'BELOW TARGET DEFICIT THIS WEEK',
      body: onTrack
        ? `Your average intake this week is ${weekCalAvg} kcal vs your ${maintenance} kcal maintenance. That ${Math.round(deficit)} kcal/day deficit projects to ~${kgPerWk}kg of fat lost this week. Compound this over ${weeksLeft} weeks and you're at ${targetWeight}kg.`
        : `You're averaging ${weekCalAvg} kcal — only ${Math.round(deficit)} kcal below maintenance. You need ~520 to hit your goal on time. Tighten the diet, add a cardio session, or both. The target is achievable but the margin is thin.`,
    })
  }

  insights.push({
    id: 'goal-math', tag: 'PROGRESS', color: C.PROGRESS, icon: '🎯',
    title: `${fatToLose.toFixed(1)}KG OF FAT STANDING BETWEEN YOU AND 15%`,
    body: `You currently carry ${fatNow.toFixed(1)}kg of fat. At 15% and ${targetWeight}kg, you need ${fatGoal.toFixed(1)}kg — meaning ${fatToLose.toFixed(1)}kg needs to go. At a 520 kcal/day deficit that's ~${weeksLeft} weeks of consistent work. You're not far from the version of yourself you're working toward.`,
  })

  insights.push({
    id: 'this-week', tag: 'COACH', color: C.COACH, icon: '📋',
    title: `${weekWorkouts}/5 SESSIONS, ${weekCardioDays}/3 CARDIO THIS WEEK`,
    body: weekWorkouts >= 4 && weekCardioDays >= 2
      ? `Strong week. ${weekWorkouts} lifts and ${weekCardioDays} cardio sessions means your training deficit is working. Finish the week strong — one more session to hit target.`
      : `You need ${Math.max(5 - weekWorkouts, 0)} more lifts and ${Math.max(3 - weekCardioDays, 0)} more cardio sessions to complete this week. Each missed session widens the gap between your current trajectory and your ${targetWeight}kg target.`,
  })

  // ── SCIENCE EDUCATION (PT explaining the why) ─────────────────────────────

  const sciencePool: Insight[] = [
    {
      id: 'why-protein', tag: 'SCIENCE', color: C.SCIENCE, icon: '🔬',
      title: 'WHY PROTEIN IS YOUR #1 PRIORITY ON A CUT',
      body: `When you eat below maintenance, your body looks for fuel. Without adequate protein, it turns to muscle tissue. At ${proteinTarget}g/day (2.2g/kg), you give your body enough amino acids to keep muscle protein synthesis running — so the weight you lose is fat, not the hard-earned muscle underneath it.`,
    },
    {
      id: 'why-sleep', tag: 'RECOVER', color: C.RECOVER, icon: '😴',
      title: 'SLEEP IS WHERE FAT LOSS ACTUALLY HAPPENS',
      body: `Growth hormone — your primary fat-mobilization hormone — is released in pulses during deep sleep. It directly signals adipose tissue to release stored fat. Less than 7 hours and GH secretion drops by 70%. You can eat perfectly and train hard, but chronic short sleep will stall your fat loss. 7+ hours is non-negotiable.`,
    },
    {
      id: 'why-incline', tag: 'MOVE', color: C.MOVE, icon: '⛰️',
      title: 'WHY INCLINE WALKING BEATS RUNNING FOR FAT LOSS',
      body: `At 60-70% max heart rate (incline walk), your body's primary fuel source is stored fat. At high intensity (running), you burn more total calories but shift to glycogen — and spike cortisol. Elevated cortisol promotes belly fat storage. LISS cardio 3× per week = fat fuel, lower cortisol, preserved muscle.`,
    },
    {
      id: 'why-heavy', tag: 'MOVE', color: C.MOVE, icon: '🏋️',
      title: 'NEVER REDUCE WEIGHTS ON A CUT',
      body: `Heavy loading activates the mTOR pathway, which signals your body to preserve muscle tissue. Drop the weights and your body has no signal to keep the muscle — it becomes metabolically expensive tissue with no apparent purpose. Keep the load high. The heavier you lift on a deficit, the more muscle you protect.`,
    },
    {
      id: 'why-cortisol', tag: 'SCIENCE', color: C.SCIENCE, icon: '⚗️',
      title: 'STRESS IS MAKING YOUR CUT HARDER',
      body: `Chronic caloric restriction raises cortisol, which directly promotes visceral fat storage — the fat around your organs. This is why crash diets backfire. Your 1,930 kcal target is calibrated to maintain a deficit without triggering this stress response. Stay above 1,500 kcal and manage life stress alongside the training.`,
    },
    {
      id: 'why-water', tag: 'SCIENCE', color: C.SCIENCE, icon: '💧',
      title: 'WATER IS A REACTANT IN FAT BREAKDOWN',
      body: `Lipolysis — the process of freeing stored fat for energy — requires water as a chemical reactant. Drink less water and the reaction slows. Drink more and you accelerate it. 3L/day also suppresses false hunger (thirst is often misread as hunger), which matters a lot on a 1,930 kcal diet.`,
    },
    {
      id: 'why-if', tag: 'SCIENCE', color: C.SCIENCE, icon: '⏱️',
      title: 'WHAT FASTING ACTUALLY DOES TO YOUR BODY',
      body: `After 12-16 hours without food, insulin drops to baseline and noradrenaline rises by 44%. Noradrenaline directly signals fat cells to release stored fat. It also improves insulin sensitivity for the next eating window. If done consistently, 16:8 naturally restricts your calorie window and accelerates the fat-burning state.`,
    },
    {
      id: 'why-legs', tag: 'MOVE', color: C.MOVE, icon: '🦵',
      title: 'WHY YOU TRAIN LEGS TWICE A WEEK',
      body: `Legs A and Legs B together target 60% of your total muscle mass — quads, hamstrings, glutes, calves. The metabolic cost of training this much tissue is enormous: 400-600 kcal per session vs 200-300 for upper body. Two leg days per week contributes ~600 extra kcal of weekly deficit — equivalent to an entire cardio session.`,
    },
    {
      id: 'why-creatine', tag: 'SCIENCE', color: C.SCIENCE, icon: '💊',
      title: 'TAKE CREATINE ON YOUR CUT',
      body: `5g/day creatine monohydrate replenishes phosphocreatine faster between sets, letting you maintain training intensity even when glycogen is lower from the deficit. This is critical — it preserves the strength output that signals your body to protect muscle. It's the most evidence-backed supplement for body composition during a cut.`,
    },
    {
      id: 'why-mps-window', tag: 'SCIENCE', color: C.SCIENCE, icon: '🔬',
      title: 'THE 2-HOUR POST-WORKOUT WINDOW IS REAL',
      body: `After resistance training, muscle protein synthesis is elevated for 2-3 hours. Leucine sensitivity is at its peak — meaning your muscles absorb amino acids more efficiently than at any other point in the day. 40-50g protein (containing ~3g leucine) in this window maximizes the return on every session you complete.`,
    },
    {
      id: 'compound-effect', tag: 'PROGRESS', color: C.PROGRESS, icon: '📈',
      title: 'WHAT CONSISTENCY DOES OVER 13 WEEKS',
      body: `520 kcal deficit × 91 days = 47,320 kcal total deficit. At 7,700 kcal per kg of fat, that's 6.1 kg of pure fat removed. Not from surgery, not from a pill — from eating right and training consistently every single day. This is the arithmetic of body transformation.`,
    },
    {
      id: 'reveal', tag: 'SCIENCE', color: C.SCIENCE, icon: '💪',
      title: 'THE MUSCLE IS ALREADY THERE',
      body: `You currently have ${(weight * (1 - bodyFat / 100)).toFixed(1)}kg of lean mass. At 15% BF and ${targetWeight}kg, you'll have ${(targetWeight * 0.85).toFixed(1)}kg lean mass — essentially the same muscle, just with ${fatToLose.toFixed(1)}kg less fat covering it. Every rep you've ever done is still there. The cut just reveals it.`,
    },
    {
      id: 'progressive-overload', tag: 'MOVE', color: C.MOVE, icon: '📈',
      title: 'THE ONE TRAINING VARIABLE THAT PRESERVES MUSCLE ON A CUT',
      body: `Progressive overload is the signal that tells your body "this muscle is needed — do not burn it." Without it, your body has no mechanical reason to maintain expensive tissue while in an energy deficit. Even 1 extra rep per set, 2.5kg added every two weeks — this is the difference between losing fat and losing muscle+fat.`,
    },
    {
      id: 'deep-sleep', tag: 'RECOVER', color: C.RECOVER, icon: '🛌',
      title: 'SLEEP IS THE MOST ANABOLIC THING YOU CAN DO TONIGHT',
      body: `The first 90-minute sleep cycle produces the highest growth hormone pulse of the day — GH mobilizes stored fat AND drives muscle repair simultaneously. A single night of 5 hours reduces next-day anabolic hormone levels by 15-20%. Your 5:30AM alarm means lights out by 10PM is non-negotiable. The gym session is the trigger. Sleep is where the adaptation happens.`,
      action: 'Screens off at 9:30PM. In bed by 10PM. Cool room (18-19°C).',
    },
    {
      id: 'fiber-satiety', tag: 'SCIENCE', color: C.SCIENCE, icon: '🌱',
      title: '30G FIBER/DAY MAKES YOUR DEFICIT EASIER',
      body: `Dietary fiber slows gastric emptying by 2-3 hours, directly extending satiety. On 1,930 kcal, this is your hunger management system. Fiber also feeds gut bacteria that produce short-chain fatty acids, improving insulin sensitivity and reducing systemic inflammation. Oats (8g), lentils (8g), broccoli (3g), chia seeds (10g). Hit 30g/day and hunger becomes manageable.`,
    },
    {
      id: 'compound-movements', tag: 'MOVE', color: C.MOVE, icon: '🏗️',
      title: 'COMPOUND MOVEMENTS ARE YOUR FAT LOSS MULTIPLIER',
      body: `Squats, deadlifts, bench press, rows — compound movements recruit multiple muscle groups simultaneously, burning 40-60% more calories per set than isolation work. They also trigger a larger hormonal response (testosterone, GH) than machine isolation. On a limited training schedule, compounds give you the most return per minute of gym time.`,
    },
    {
      id: 'alcohol-impact', tag: 'SCIENCE', color: C.SCIENCE, icon: '🚫',
      title: 'ALCOHOL HALTS FAT OXIDATION FOR 24-48 HOURS',
      body: `Ethanol (7 kcal/g) isn't just empty calories — it completely stops fat burning while your body processes it as a priority toxin. Two standard drinks on a Saturday evening halt fat oxidation until Monday. For someone cutting, that's 2 of your 7 weekly fat-burning days eliminated. Social situations don't require alcohol — sparkling water with lime is indistinguishable in most contexts.`,
    },
    {
      id: 'dehydration-performance', tag: 'SCIENCE', color: C.SCIENCE, icon: '💧',
      title: '2% DEHYDRATION CUTS STRENGTH BY 10%',
      body: `At just 2% body weight dehydration — 1.5kg for a 75kg person — strength output drops by 10% and cognitive performance by 15-20%. You won't feel thirsty until you're already at 1-2% dehydration. The fix: drink 500ml on waking, 500ml pre-training, and 250ml every hour during the workday. 3L/day is your standard.`,
    },
    {
      id: 'insulin-sensitivity', tag: 'SCIENCE', color: C.SCIENCE, icon: '🔬',
      title: 'BETTER INSULIN SENSITIVITY = FASTER FAT LOSS',
      body: `Insulin is your primary fat-storage hormone. When cells are insulin sensitive, the same amount of insulin moves more glucose into muscle cells (not fat cells). Training and sleep improve insulin sensitivity acutely. Excess sugar, alcohol, and chronic sleep deprivation worsen it. Every habit in this app is, directly or indirectly, an insulin sensitivity intervention.`,
    },
  ]

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const picked = new Set<number>()
  for (let a = 0; picked.size < 3; a++) picked.add(seededInt(dayOfYear * 17 + a * 31, sciencePool.length))
  for (const i of picked) insights.push(sciencePool[i])

  return insights
}
