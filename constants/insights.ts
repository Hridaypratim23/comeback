export interface Insight {
  id: string
  tag: 'NUTRITION' | 'TRAINING' | 'RECOVERY' | 'PROGRESS' | 'SCIENCE' | 'DEFICIT'
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
  weekCardioDays: number
  waterMl: number
  hour: number
  weekWorkouts: number
  weekCalAvg: number | null
  targetWeight: number
  calTarget: number
  proteinTarget: number
  dayOfWeek: number  // 0=Sun … 6=Sat
}

const C: Record<Insight['tag'], string> = {
  NUTRITION: '#FF5500',
  TRAINING:  '#FF2800',
  RECOVERY:  '#9B59B6',
  PROGRESS:  '#1DB954',
  SCIENCE:   '#2196F3',
  DEFICIT:   '#D4A017',
}

function stepsKcal(steps: number, weight: number) {
  return Math.round(steps * weight * 0.00057)
}

const SCIENCE_POOL: Insight[] = [
  {
    id: 'protein-mps', tag: 'SCIENCE', color: C.SCIENCE, icon: '🔬',
    title: 'PROTEIN TIMING & MUSCLE PRESERVATION',
    body: 'Muscle protein synthesis peaks 2-3h post-workout. Hit 40-50g protein in that window. Spreading 160g/day across 4 meals keeps MPS elevated continuously — far more effective than one large protein meal.',
  },
  {
    id: 'sleep-gh', tag: 'RECOVERY', color: C.RECOVERY, icon: '😴',
    title: 'SLEEP IS YOUR FAT-BURNING HORMONE',
    body: 'Growth hormone peaks in deep sleep and is your primary fat-mobilization signal. 7+ hours amplifies fat loss, blunts cortisol, and prevents muscle catabolism. Miss sleep = miss results.',
  },
  {
    id: 'liss-cardio', tag: 'SCIENCE', color: C.SCIENCE, icon: '⛰️',
    title: 'WHY INCLINE WALK BEATS SPRINTS',
    body: 'At 60-70% max HR your body preferentially burns stored fat over glycogen. High-intensity cardio burns more total calories but spikes cortisol and depletes glycogen — counterproductive on a cut. LISS = fat as fuel.',
  },
  {
    id: 'heavy-on-cut', tag: 'TRAINING', color: C.TRAINING, icon: '📈',
    title: 'KEEP LIFTING HEAVY ON A CUT',
    body: 'Heavy loading activates mTOR signaling — your body interprets this as "keep the muscle". Dropping weights during a cut signals "we don\'t need this tissue." Maintain intensity. The weights protect your lean mass.',
  },
  {
    id: 'cortisol', tag: 'SCIENCE', color: C.SCIENCE, icon: '⚗️',
    title: 'CORTISOL STORES BELLY FAT',
    body: 'Extreme restriction elevates cortisol, which promotes visceral fat storage and muscle breakdown. Your 1,930 kcal target is intentional — it maintains a 520 kcal deficit while keeping cortisol in check.',
  },
  {
    id: 'creatine', tag: 'SCIENCE', color: C.SCIENCE, icon: '💊',
    title: 'CREATINE ON A CUT',
    body: '5g creatine monohydrate/day maintains training intensity by replenishing phosphocreatine faster. On a calorie deficit, this preserves the strength stimulus needed to protect lean mass. Most studied supplement in sports science.',
  },
  {
    id: 'reveal', tag: 'PROGRESS', color: C.PROGRESS, icon: '💪',
    title: 'THE REVEAL IS ALREADY BUILT',
    body: 'Going from 22% to 15% BF removes ~6.1kg of fat from your frame. The muscle doesn\'t shrink — the cut reveals it. Every rep you\'ve done is already there, waiting.',
  },
  {
    id: 'legs-burn', tag: 'TRAINING', color: C.TRAINING, icon: '🦵',
    title: 'LEGS = MAXIMUM CALORIE BURN',
    body: 'Your Legs A + Legs B sessions target 60% of total muscle mass. A single leg day burns 400-600 kcal vs 200-300 for upper body. Two leg sessions/week adds ~400 kcal of extra weekly deficit.',
  },
  {
    id: 'water-lipolysis', tag: 'SCIENCE', color: C.SCIENCE, icon: '💧',
    title: 'WATER DRIVES FAT BREAKDOWN',
    body: 'Water is a required reactant in the lipolysis equation. Drinking 500ml of cold water increases metabolic rate by 24-30% for 60-90 min. 3L/day keeps fat-burning pathways fully active.',
  },
  {
    id: 'if-science', tag: 'SCIENCE', color: C.SCIENCE, icon: '⏱️',
    title: '16:8 FASTING SCIENCE',
    body: 'Fasting periods raise noradrenaline by up to 44%, directly signaling fat cells to release stored fat. Compressing your eating window also makes staying in a deficit easier without constant calorie tracking.',
  },
  {
    id: 'protein-per-meal', tag: 'NUTRITION', color: C.NUTRITION, icon: '🍗',
    title: 'OPTIMAL PROTEIN PER MEAL',
    body: 'The leucine threshold for triggering MPS is ~2.5-3g leucine — achieved by ~30-40g protein per meal. Spreading 160g across 4 meals (~40g each) maximizes MPS vs one large serving, which wastes the excess.',
  },
  {
    id: 'bmr-floor', tag: 'NUTRITION', color: C.NUTRITION, icon: '🧬',
    title: 'YOUR METABOLIC FLOOR IS ~1,584 KCAL',
    body: 'Your BMR (Katch-McArdle) is ~1,584 kcal — the calories your body burns at complete rest. Eating below 1,400 kcal triggers metabolic adaptation and muscle breakdown. Your 1,930 kcal target is calibrated to avoid this.',
  },
]

export function generateInsights(ctx: InsightContext): Insight[] {
  const {
    weight, bodyFat, maintenance,
    calories, protein, steps, weekCardioDays, waterMl, hour,
    weekWorkouts, weekCalAvg,
    targetWeight, calTarget, proteinTarget, dayOfWeek,
  } = ctx

  const insights: Insight[] = []
  const fatMassNow  = weight * bodyFat / 100
  const fatMassGoal = targetWeight * 0.15
  const fatToLose   = Math.max(fatMassNow - fatMassGoal, 0)
  const weeksNeeded = Math.round(fatToLose * 7700 / (520 * 7))

  // ── URGENT / ACTIONABLE (highest priority) ────────────────────────────────

  if (hour >= 12 && protein < proteinTarget * 0.5) {
    insights.push({
      id: 'protein-low', tag: 'NUTRITION', color: C.NUTRITION, icon: '🥩',
      title: `ONLY ${protein}G PROTEIN — ${proteinTarget - protein}G SHORT`,
      body: `You need ${proteinTarget - protein}g more today to hit your ${proteinTarget}g target. Low protein on a deficit causes muscle catabolism — you lose lean mass, not just fat. Add a chicken/eggs/whey meal now.`,
    })
  }

  if (calories > calTarget + 150) {
    const over = calories - calTarget
    insights.push({
      id: 'over-cals', tag: 'DEFICIT', color: C.DEFICIT, icon: '⚠️',
      title: `${over} KCAL OVER YOUR TARGET`,
      body: `Every 100 kcal above your 1,930 target delays your ${targetWeight}kg goal by ~1 day. A 30-min incline walk burns ~${stepsKcal(3500, weight)} kcal — use it to offset today's surplus.`,
    })
  }

  if (hour >= 14 && calories === 0) {
    insights.push({
      id: 'no-meals', tag: 'NUTRITION', color: C.NUTRITION, icon: '📋',
      title: 'NO MEALS TRACKED TODAY',
      body: 'Untracked days average 30-40% more calories. Logging creates awareness and accountability — studies show tracked dieters lose 2× more weight. Log your meals in the FUEL tab.',
    })
  }

  if (hour >= 16 && steps < 5000) {
    const extra = stepsKcal(10000 - steps, weight)
    insights.push({
      id: 'steps-low', tag: 'TRAINING', color: C.TRAINING, icon: '👟',
      title: `${steps.toLocaleString()} STEPS — MISSING ${extra} KCAL`,
      body: `${(10000 - steps).toLocaleString()} more steps burns ${extra} kcal passively. Steps are your free deficit — missing the 10K goal daily adds ~1 week to your 13-week target.`,
    })
  }

  if (hour >= 13 && waterMl < 1500) {
    insights.push({
      id: 'water-low', tag: 'RECOVERY', color: C.RECOVERY, icon: '💧',
      title: `ONLY ${(waterMl / 1000).toFixed(1)}L WATER LOGGED`,
      body: 'Dehydration suppresses fat oxidation and drops gym performance by 10-20%. Your kidneys need water to process lipolysis. Drink 500ml now — it also boosts metabolic rate for 60+ minutes.',
    })
  }

  if (dayOfWeek >= 4 && weekCardioDays === 0) {
    insights.push({
      id: 'no-cardio', tag: 'TRAINING', color: C.TRAINING, icon: '🏃',
      title: 'NO CARDIO LOGGED THIS WEEK',
      body: `3 cardio sessions × 400 kcal = 1,200 kcal/week. That's 20% of your total weekly deficit. Without it you need to cut an extra 170 kcal/day from food — making the diet harder to sustain.`,
    })
  }

  // ── PROGRESS INSIGHTS ─────────────────────────────────────────────────────

  if (weekCalAvg !== null) {
    const deficit = maintenance - weekCalAvg
    const kgPerWeek = (deficit * 7 / 7700).toFixed(2)
    const onTrack   = deficit >= 400
    insights.push({
      id: 'weekly-deficit', tag: 'PROGRESS', color: C.PROGRESS, icon: '📊',
      title: `~${Math.round(deficit)} KCAL/DAY DEFICIT THIS WEEK`,
      body: `Avg intake: ${weekCalAvg} kcal vs ${maintenance} maintenance. At this rate you're losing ~${kgPerWeek}kg fat/week. ${onTrack ? `On track for ${targetWeight}kg in ~${weeksNeeded} weeks.` : 'Increase deficit to hit your 13-week goal — tighten the diet or add cardio.'}`,
    })
  }

  insights.push({
    id: 'bf-math', tag: 'PROGRESS', color: C.PROGRESS, icon: '🎯',
    title: `${bodyFat}% → 15% BF: ${fatToLose.toFixed(1)}KG OF FAT`,
    body: `You need to lose ${fatToLose.toFixed(1)}kg of fat mass. At 520 kcal/day diet deficit + 3× cardio, this takes ~${weeksNeeded} weeks. Every consistent day shortens that timeline.`,
  })

  insights.push({
    id: 'full-stack', tag: 'DEFICIT', color: C.DEFICIT, icon: '🧮',
    title: 'YOUR FULL WEEKLY DEFICIT STACK',
    body: `Diet: 520 kcal/day. Steps (10K): ~${stepsKcal(10000, weight)} kcal/day. Cardio (3×/wk): ~170 kcal/day avg. Total: ~${520 + stepsKcal(10000, weight) + 170} kcal/day = ${((520 + stepsKcal(10000, weight) + 170) * 7 / 7700).toFixed(2)}kg fat/week when fully compliant.`,
  })

  insights.push({
    id: 'workouts-muscle', tag: 'TRAINING', color: C.TRAINING, icon: '🏋️',
    title: `${weekWorkouts}/5 LIFTS THIS WEEK`,
    body: `Maintaining training volume on a cut preserves up to 95% of lean mass vs ~70% without lifting. Your ${(weight - targetWeight).toFixed(0)}kg weight loss must be fat, not muscle — the barbell is what enforces that.`,
  })

  // ── ROTATING SCIENCE (day-based rotation) ────────────────────────────────

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const startIdx  = dayOfYear % SCIENCE_POOL.length
  for (let i = 0; i < 4; i++) {
    insights.push(SCIENCE_POOL[(startIdx + i) % SCIENCE_POOL.length])
  }

  return insights
}
