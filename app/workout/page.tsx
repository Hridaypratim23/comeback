'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { getTodayWorkout, WEEKLY_SCHEDULE, type Exercise } from '@/constants/workouts'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import RestTimer from '@/components/RestTimer'
import { getQuoteOfHour, getQuoteByIndex } from '@/constants/quotes'

// Quotes shown right after rest timer hits 0
const REST_OVER_QUOTES = [
  'REST OVER. ATTACK.',
  'NEXT SET. NO MERCY.',
  'GET BACK ON THE BAR.',
  'MOVE. NOW.',
  'WEAKNESS ENDS HERE.',
]

function SetRow({
  setNum, exerciseId, done, savedReps, savedWeight, onLog,
}: {
  setNum: number
  exerciseId: string
  done: boolean
  savedReps?: number
  savedWeight?: number
  onLog: (reps: number, weight: number) => void
}) {
  const [reps,   setReps]   = useState(savedReps?.toString()   ?? '')
  const [weight, setWeight] = useState(savedWeight?.toString() ?? '')

  const commit = () => {
    const r = parseInt(reps)
    const w = parseFloat(weight)
    if (r > 0 && w >= 0) onLog(r, w)
  }

  return (
    <div
      className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-all ${
        done
          ? 'bg-[#0D7A3A22] border border-[#1DB95433]'
          : 'bg-[#0D0D10] border border-[#1E1E26]'
      }`}
    >
      <span className={`text-[11px] font-black w-5 ${done ? 'text-[#1DB954]' : 'text-[#686870]'}`}>
        {setNum}
      </span>
      <input
        type="number"
        inputMode="decimal"
        placeholder="kg"
        value={weight}
        onChange={e => setWeight(e.target.value)}
        className="flex-1 bg-transparent text-center text-sm font-bold text-[#EDEDF0] outline-none placeholder-[#2C2C38] border-b border-[#1E1E26] focus:border-[#FF2800] transition-colors py-0.5"
      />
      <span className="text-[#2C2C38] text-xs">×</span>
      <input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        value={reps}
        onChange={e => setReps(e.target.value)}
        className="flex-1 bg-transparent text-center text-sm font-bold text-[#EDEDF0] outline-none placeholder-[#2C2C38] border-b border-[#1E1E26] focus:border-[#FF2800] transition-colors py-0.5"
      />
      <button
        onClick={commit}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer btn-press
          ${done
            ? 'bg-[#1DB954] text-[#070709]'
            : 'bg-[#1E1E26] text-[#686870] hover:bg-[#FF2800] hover:text-white'
          }`}
      >
        {done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
      </button>
    </div>
  )
}

function ExerciseCard({
  exercise,
  color,
  onSetLogged,
}: {
  exercise: Exercise
  color: string
  onSetLogged: () => void
}) {
  const [open, setOpen]                 = useState(false)
  const { dayLogs, logSet, prs, exerciseHistory } = useStore()
  const today   = new Date().toISOString().split('T')[0]
  const dayLog  = dayLogs[today]
  const exLog   = dayLog?.exerciseLogs.find(l => l.exerciseId === exercise.id)
  const doneSets = exLog?.sets.filter(s => s.done).length ?? 0
  const allDone  = doneSets >= exercise.sets

  const history    = exerciseHistory[exercise.id] ?? []
  const lastSession = history.filter(e => e.date !== today).slice(-1)[0] ?? null
  const pr          = prs[exercise.id] ?? null

  return (
    <div
      className={`bg-[#111116] rounded-xl overflow-hidden transition-all ${
        allDone
          ? 'border border-[#1DB95466] shadow-[0_0_16px_rgba(29,185,84,0.15)]'
          : 'border border-[#1E1E26]'
      }`}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-[#17171D] transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          {/* Thicker accent bar */}
          <div
            className="w-1.5 h-10 rounded-full flex-shrink-0"
            style={{ backgroundColor: allDone ? '#1DB954' : color }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black tracking-widest text-[#2C2C38]">//</span>
              <div className="font-black text-sm text-[#EDEDF0]">{exercise.name.toUpperCase()}</div>
              {pr && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#FF280022] text-[#FF2800] border border-[#FF280044]">
                  1RM ~{pr.oneRM}kg
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="text-[11px] text-[#686870]">
                {exercise.sets} SETS · {exercise.repsRange} REPS{exercise.notes ? ` · ${exercise.notes.toUpperCase()}` : ''}
              </div>
              {lastSession && (
                <div className="text-[10px] text-[#2C2C38] font-black tracking-wider">
                  LAST: {lastSession.maxWeight}kg×{lastSession.maxReps}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-black ${
              allDone ? 'text-[#1DB954]' : 'text-[#686870]'
            }`}
          >
            {doneSets}/{exercise.sets}
          </span>
          {open
            ? <ChevronUp   size={16} className="text-[#686870]" />
            : <ChevronDown size={16} className="text-[#686870]" />
          }
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-[#1E1E26] pt-3">
          <div className="flex justify-between text-[10px] font-black tracking-widest text-[#686870] px-3 mb-1">
            <span>#</span><span>WEIGHT (KG)</span><span>REPS</span><span>✓</span>
          </div>
          {Array.from({ length: exercise.sets }, (_, i) => {
            const s = exLog?.sets.find(x => x.setNum === i + 1)
            return (
              <SetRow
                key={i}
                setNum={i + 1}
                exerciseId={exercise.id}
                done={s?.done ?? false}
                savedReps={s?.reps}
                savedWeight={s?.weight}
                onLog={(reps, weight) => {
                  logSet(exercise.id, i + 1, reps, weight)
                  onSetLogged()
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// Confetti dot component
function ConfettiDots() {
  const dots = Array.from({ length: 24 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.8}s`,
    size: Math.random() > 0.5 ? 6 : 4,
  }))
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#FF2800] confetti-dot"
          style={{
            left: d.left,
            top: 0,
            width: d.size,
            height: d.size,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  )
}

export default function WorkoutPage() {
  const { dayLogs, markWorkoutDone, getOrCreateToday, newPR, clearNewPR, prs } = useStore()
  const [mounted,          setMounted]          = useState(false)
  const [timer,            setTimer]            = useState(0)
  const [timerRunning,     setTimerRunning]      = useState(false)
  const [showRest,         setShowRest]          = useState(false)
  const [restDuration,     setRestDuration]      = useState(90)
  const [prBannerVisible,  setPrBannerVisible]   = useState(false)
  const [prBannerExId,     setPrBannerExId]      = useState<string | null>(null)
  const [restOverQuote,    setRestOverQuote]      = useState<string | null>(null)
  const [showMissionDone,  setShowMissionDone]   = useState(false)

  useEffect(() => {
    setMounted(true)
    getOrCreateToday()
  }, [getOrCreateToday])

  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning])

  // Show PR banner
  useEffect(() => {
    if (!newPR) return
    setPrBannerExId(newPR)
    setPrBannerVisible(true)
    const t = setTimeout(() => {
      setPrBannerVisible(false)
      clearNewPR()
    }, 3000)
    return () => clearTimeout(t)
  }, [newPR, clearNewPR])

  const handleRestDismiss = useCallback(() => {
    setShowRest(false)
    const q = REST_OVER_QUOTES[Math.floor(Math.random() * REST_OVER_QUOTES.length)]
    setRestOverQuote(q)
    setTimeout(() => setRestOverQuote(null), 3000)
  }, [])

  if (!mounted) return null

  const today    = new Date().toISOString().split('T')[0]
  const dayLog   = dayLogs[today]
  const workout  = getTodayWorkout()
  const isRest   = workout.exercises.length === 0

  const totalSets = workout.exercises.reduce((s, e) => s + e.sets, 0)
  const doneSets  = workout.exercises.reduce((s, e) => {
    const log = dayLog?.exerciseLogs.find(l => l.exerciseId === e.id)
    return s + (log?.sets.filter(x => x.done).length ?? 0)
  }, 0)
  const progress  = totalSets > 0 ? (doneSets / totalSets) * 100 : 0

  const mins = Math.floor(timer / 60).toString().padStart(2, '0')
  const secs = (timer % 60).toString().padStart(2, '0')

  const allExercises  = WEEKLY_SCHEDULE.flatMap(w => w.exercises)
  const prExerciseName = prBannerExId
    ? allExercises.find(e => e.id === prBannerExId)?.name ?? prBannerExId
    : ''

  const REST_DURATION_OPTIONS = [
    { label: '60S',  seconds: 60 },
    { label: '90S',  seconds: 90 },
    { label: '120S', seconds: 120 },
  ]

  const isComplete = dayLog?.workoutDone ?? false

  const handleMarkDone = () => {
    markWorkoutDone()
    setTimerRunning(false)
    setShowMissionDone(true)
  }

  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      {/* ── PR Flash Banner ── */}
      {prBannerVisible && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#FF2800] py-3 px-4 text-center animate-pulse">
          <span className="text-white font-black text-sm tracking-widest">
            NEW PR — {prExerciseName.toUpperCase()} — YOU JUST REWROTE HISTORY
          </span>
        </div>
      )}

      {/* ── Rest Over Flash ── */}
      {restOverQuote && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-[#0D0D10] border-b-2 border-[#FF2800] py-3 px-4 text-center quote-enter">
          <span className="text-[#FF2800] font-black text-sm tracking-widest">
            {restOverQuote}
          </span>
        </div>
      )}

      {/* ── Mission Complete Banner ── */}
      {showMissionDone && (
        <div className="relative overflow-hidden rounded-xl border-2 border-[#FF2800] bg-[#0D0D10] p-6 text-center">
          <ConfettiDots />
          <div className="text-[10px] font-black tracking-[0.4em] text-[#FF2800] mb-2">
            MISSION COMPLETE
          </div>
          <div className="text-3xl font-black text-[#EDEDF0] leading-tight mb-3">
            MISSION<br />COMPLETE
          </div>
          <div className="text-xs font-black text-[#686870] tracking-wider max-w-xs mx-auto">
            "WARRIORS ARE MADE IN THE MOMENTS THEY WANT TO QUIT BUT DON'T."
          </div>
          <button
            className="mt-4 text-[10px] font-black tracking-widest text-[#686870] cursor-pointer"
            onClick={() => setShowMissionDone(false)}
          >
            DISMISS
          </button>
        </div>
      )}

      {/* ── Rest Timer ── */}
      {showRest && (
        <RestTimer
          defaultSeconds={restDuration}
          onDismiss={handleRestDismiss}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.4em] text-[#FF2800] uppercase">
            MISSION:
          </p>
          <h1 className="text-4xl font-black text-[#EDEDF0] leading-none mt-0.5">
            {workout.label}
          </h1>
          <p className="text-xs text-[#686870] mt-0.5 tracking-wider font-bold">
            {workout.muscles}
          </p>
          <p className="text-[10px] font-black text-[#686870] mt-2 italic max-w-[220px] leading-snug">
            "{getQuoteOfHour()}"
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded cursor-pointer transition-all btn-press"
            style={{ background: timerRunning ? '#FF280022' : '#1E1E26' }}
            onClick={() => setTimerRunning(r => !r)}
          >
            <Clock size={12} className={timerRunning ? 'text-[#FF2800]' : 'text-[#686870]'} />
            <span
              className={`text-xs font-black tabular-nums ${
                timerRunning ? 'text-[#FF2800]' : 'text-[#686870]'
              }`}
            >
              {mins}:{secs}
            </span>
          </div>
          {!isRest && (
            <div className="flex gap-1">
              {REST_DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.seconds}
                  onClick={() => setRestDuration(opt.seconds)}
                  className={`px-2 py-1 rounded text-[9px] font-black transition-all cursor-pointer btn-press ${
                    restDuration === opt.seconds
                      ? 'bg-[#FF2800] text-white'
                      : 'bg-[#1E1E26] text-[#686870] hover:text-[#EDEDF0]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Progress Bar ── */}
      {!isRest && (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-black tracking-widest text-[#686870]">PROGRESS</span>
            <span className="text-[10px] font-black" style={{ color: workout.color }}>
              {doneSets}/{totalSets} SETS
            </span>
          </div>
          <div className="h-3 bg-[#111116] border border-[#1E1E26] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: workout.color,
                boxShadow: progress > 0
                  ? `0 0 12px ${workout.color}88, 0 0 4px ${workout.color}`
                  : undefined,
              }}
            />
          </div>
        </div>
      )}

      {isRest ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="text-[10px] font-black tracking-[0.4em] text-[#686870]">STATUS</div>
          <div className="text-3xl font-black text-[#EDEDF0]">REST DAY</div>
          <div className="h-px w-16 bg-[#FF2800]" />
          <div className="text-sm text-[#686870] text-center max-w-xs font-bold tracking-wide">
            RECOVERY IS PART OF THE GRIND. EAT. SLEEP. COME BACK STRONGER.
          </div>
          <div className="text-[10px] font-black text-[#FF2800] tracking-widest mt-2 italic">
            "{getQuoteOfHour()}"
          </div>
        </div>
      ) : (
        <>
          {/* ── Exercises ── */}
          <div className="space-y-2">
            {workout.exercises.map(ex => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                color={workout.color}
                onSetLogged={() => setShowRest(true)}
              />
            ))}
          </div>

          {/* ── Finisher ── */}
          {workout.finisher && (
            <div
              className="border border-dashed rounded-xl p-4 text-center"
              style={{ borderColor: `${workout.color}66` }}
            >
              <div
                className="text-[10px] font-black tracking-widest mb-1"
                style={{ color: workout.color }}
              >
                FINISHER
              </div>
              <div className="text-sm font-black text-[#EDEDF0] uppercase tracking-wide">
                {workout.finisher}
              </div>
            </div>
          )}

          {/* ── Done Button ── */}
          {!isComplete ? (
            <button
              onClick={handleMarkDone}
              disabled={doneSets === 0}
              className="w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed btn-press"
              style={{
                background: doneSets > 0
                  ? `linear-gradient(135deg, ${workout.color}, ${workout.color}cc)`
                  : '#1E1E26',
                color: doneSets > 0 ? 'white' : '#686870',
              }}
            >
              {doneSets === 0
                ? 'LOG SETS TO ENGAGE'
                : `MISSION COMPLETE · +100 XP`}
            </button>
          ) : (
            <div className="w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase text-center bg-[#0D7A3A22] border border-[#1DB95433] text-[#1DB954]">
              MISSION COMPLETE ✓ · +100 XP EARNED
            </div>
          )}
        </>
      )}
    </div>
  )
}
