export interface Insight {
  id: string
  tag: 'COACH' | 'FUEL' | 'MOVE' | 'RECOVER' | 'SCIENCE' | 'PROGRESS'
  color: string
  icon: string
  title: string
  body: string
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

export function generateInsights(ctx: InsightContext): Insight[] {
  const {
    weight, bodyFat, maintenance,
    calories, protein, steps, workoutDone, weekCardioDays, waterMl, hour,
    weekWorkouts, weekCalAvg, targetWeight, calTarget, proteinTarget,
    dayOfWeek, streak,
  } = ctx

  const fatNow     = weight * bodyFat / 100
  const fatGoal    = targetWeight * 0.15
  const fatToLose  = Math.max(fatNow - fatGoal, 0)
  const kgToLose   = weight - targetWeight
  const weeksLeft  = weeksToGoal(fatToLose, 520)
  const protoGap   = Math.max(proteinTarget - protein, 0)
  const calGap     = Math.max(calTarget - calories, 0)
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

  // ── URGENT / ACTIONABLE ───────────────────────────────────────────────────

  // Protein gap after noon
  if (hour >= 12 && protein < proteinTarget * 0.5) {
    insights.push({
      id: 'protein-low', tag: 'FUEL', color: C.FUEL, icon: '🥩',
      title: `YOU'RE ${protoGap}G SHORT ON PROTEIN`,
      body: `At ${protein}g, you're only halfway to your ${proteinTarget}g target. On a calorie deficit, insufficient protein forces your body to break down muscle tissue for fuel — you'd lose lean mass, not just fat. Add a chicken breast (40g), Greek yogurt (17g), or whey shake (25g) before the day ends.`,
    })
  }

  // Over calories
  if (calories > calTarget + 150) {
    const over = calories - calTarget
    insights.push({
      id: 'over-cals', tag: 'FUEL', color: C.FUEL, icon: '⚠️',
      title: `YOU'RE ${over} KCAL OVER — MAKE IT UP`,
      body: `Going ${over} kcal above your target today partially wipes out your deficit. You can recover this: a 35-min incline walk burns ~${stepsKcal(4000, weight)} kcal, and skipping any late snack will bring you back inline. Awareness now stops this becoming a habit.`,
    })
  }

  // No meals logged after 2pm
  if (hour >= 14 && calories === 0) {
    insights.push({
      id: 'no-meals', tag: 'FUEL', color: C.FUEL, icon: '📋',
      title: `IT'S ${hour}:00 AND NOTHING'S BEEN LOGGED`,
      body: `This isn't about punishment — it's about awareness. Studies show untracked days have 30-40% more calories on average. You can't manage what you don't measure. Log what you've eaten so far and we get back on track.`,
    })
  }

  // Low steps in the afternoon
  if (hour >= 16 && steps < 5000) {
    const extraBurn = stepsKcal(10000 - steps, weight)
    insights.push({
      id: 'steps-low', tag: 'MOVE', color: C.MOVE, icon: '👟',
      title: `ONLY ${steps.toLocaleString()} STEPS — YOU NEED TO MOVE`,
      body: `You still need ${(10000 - steps).toLocaleString()} steps to hit your daily target. That's ${extraBurn} kcal of passive burn — no gym, no effort, just walking. A 30-min evening walk gets you there. Missing this daily adds ~1 extra week to your ${targetWeight}kg goal.`,
    })
  }

  // Low water midday+
  if (hour >= 13 && waterMl < 1500) {
    insights.push({
      id: 'water-low', tag: 'RECOVER', color: C.RECOVER, icon: '💧',
      title: `ONLY ${waterL}L WATER — YOUR FAT METABOLISM IS SLUGGISH`,
      body: `Water is literally required for lipolysis — the chemical process of breaking down stored fat. You're running dehydrated right now. Drink 500ml immediately, then one glass every hour until you hit 3L. It also suppresses false hunger signals, which helps on a cut.`,
    })
  }

  // Good protein — acknowledge it
  if (hour >= 15 && protein >= proteinTarget * 0.8 && protein <= proteinTarget * 1.1) {
    insights.push({
      id: 'protein-good', tag: 'COACH', color: C.COACH, icon: '✅',
      title: `PROTEIN IS ON TRACK — GOOD WORK`,
      body: `You're at ${protein}g protein today — close to your ${proteinTarget}g target. This is the most important nutritional variable on a cut. Every gram of protein you hit today is a direct investment in keeping the muscle you've built while shedding the fat. Keep this consistent.`,
    })
  }

  // Workout done — acknowledge it
  if (workoutDone) {
    insights.push({
      id: 'workout-done', tag: 'COACH', color: C.COACH, icon: '🔥',
      title: `SESSION DONE — NOW PROTECT THE WORK`,
      body: `You've created the stimulus for muscle protein synthesis. Now feed it: 40-50g protein in the next 2 hours, rehydrate, and sleep 7+ hours tonight. The workout is the trigger — recovery is where the actual adaptation happens. Don't shortchange the recovery half.`,
    })
  }

  // No cardio by Thursday
  if (dayOfWeek >= 4 && weekCardioDays === 0) {
    insights.push({
      id: 'no-cardio', tag: 'MOVE', color: C.MOVE, icon: '🏃',
      title: `NO CARDIO YET THIS WEEK — 3 SESSIONS TARGET`,
      body: `Three 35-min incline walks burns ~1,200 extra kcal this week. Without them you'd need to cut an extra 170 kcal/day from food to hit the same deficit — making the diet harder and hunger worse. Cardio makes your cut easier, not harder. Log a session today.`,
    })
  }

  // Streak acknowledgment
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
  ]

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const startIdx  = dayOfYear % sciencePool.length
  for (let i = 0; i < 4; i++) {
    insights.push(sciencePool[(startIdx + i) % sciencePool.length])
  }

  return insights
}
