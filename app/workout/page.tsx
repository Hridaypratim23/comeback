'use client'

import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { WORKOUT_PLANS, getWorkoutById } from '@/constants/workouts'
import { getQuoteOfHour } from '@/constants/quotes'
import { Clock, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import QuoteTicker from '@/components/QuoteTicker'

export default function WorkoutPage() {
  const { dayLogs, stats, markWorkoutDone, setWorkoutDuration, toggleExerciseCheck, setWorkoutNotes, getOrCreateToday, selectWorkout, logCardio, logSet } = useStore()
  const [mounted, setMounted] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showFinisher, setShowFinisher] = useState(false)
  const [manualMins, setManualMins] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [setInputs, setSetInputs] = useState<Record<string, Array<{ weight: string; reps: string }>>>({})
  const [cardioType, setCardioType] = useState<'incline_walk' | 'cross_trainer'>('incline_walk')
  const [cardioMins, setCardioMins] = useState('')
  const [cardioKcal, setCardioKcal] = useState('')
  const timerRef = useRef(0)
  timerRef.current = timer
  const startedAtRef = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
    getOrCreateToday()
  }, [getOrCreateToday])

  useEffect(() => {
    if (!timerRunning) return
    startedAtRef.current = Date.now() - timerRef.current * 1000
    const tick = () => {
      if (startedAtRef.current !== null)
        setTimer(Math.floor((Date.now() - startedAtRef.current) / 1000))
    }
    const id = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [timerRunning])

  if (!mounted) return null

  const today = new Date().toLocaleDateString('en-CA')
  const dayLog = dayLogs[today]
  const selectedId = dayLog?.selectedWorkoutId
  const workout = selectedId ? getWorkoutById(selectedId) : null
  const isRest = workout?.id === 'rest'
  const checked = dayLog?.checkedExercises ?? []
  const doneCount = checked.length
  const totalCount = workout?.exercises.length ?? 0
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0
  const workoutDone = dayLog?.workoutDone ?? false
  const notes = dayLog?.workoutNotes ?? ''
  const savedCardio = dayLog?.cardio

  const toggleExpand = (exId: string, numSets: number) => {
    if (expanded === exId) { setExpanded(null); return }
    setExpanded(exId)
    const saved = dayLog?.exerciseLogs.find(l => l.exerciseId === exId)
    setSetInputs(prev => ({
      ...prev,
      [exId]: Array.from({ length: numSets }, (_, i) => {
        const s = saved?.sets.find(ss => ss.setNum === i + 1)
        return { weight: s ? String(s.weight) : '', reps: s ? String(s.reps) : '' }
      }),
    }))
  }

  const saveSets = (exId: string) => {
    ;(setInputs[exId] ?? []).forEach((inp, i) => {
      const w = parseFloat(inp.weight)
      const r = parseInt(inp.reps)
      if (w > 0 && r > 0) logSet(exId, i + 1, r, w)
    })
    setExpanded(null)
  }

  const tvl = (dayLog?.exerciseLogs ?? []).reduce((sum, el) =>
    sum + el.sets.reduce((s, set) => s + set.reps * set.weight, 0), 0)
  const sessionHours = (dayLog?.workoutDurationSecs ?? 0) / 3600
  const isActualLift = !!(dayLog?.workoutDone && dayLog?.selectedWorkoutId && dayLog.selectedWorkoutId !== 'rest')
  const liftingKcal = isActualLift
    ? sessionHours > 0 ? Math.round(6 * stats.weight * sessionHours + tvl * 0.05) : tvl > 0 ? Math.round(tvl * 0.05 + 350) : 350
    : tvl > 0 ? Math.round(tvl * 0.05 + 350) : 0
  const cardioKcalBurned = dayLog?.cardio?.caloriesBurned ?? 0
  const totalWorkoutBurned = liftingKcal + cardioKcalBurned

  const mins = Math.floor(timer / 60).toString().padStart(2, '0')
  const secs = (timer % 60).toString().padStart(2, '0')

  const saveCardio = () => {
    const m = parseInt(cardioMins)
    const k = parseInt(cardioKcal)
    if (!m || !k || m <= 0 || k <= 0) return
    logCardio({ type: cardioType, minutes: m, caloriesBurned: k })
  }

  const clearCardio = () => {
    logCardio(null)
    setCardioMins('')
    setCardioKcal('')
  }

  return (
    <div className="pb-28 space-y-4">
      <QuoteTicker />

      <div className="px-4 space-y-4">

        {/* ── No workout selected: show picker ── */}
        {!workout && (
          <>
            <div className="pt-8">
              <p className="text-[10px] font-black tracking-[0.35em] text-[#686870]">TODAY&apos;S MISSION</p>
              <h1 className="text-4xl font-black text-[#EDEDF0] leading-none mt-0.5">CHOOSE YOUR WEAPON</h1>
              <p className="text-[10px] italic text-[#2C2C38] mt-2">&ldquo;{getQuoteOfHour()}&rdquo;</p>
            </div>

            <div className="space-y-2">
              {WORKOUT_PLANS.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => selectWorkout(plan.id)}
                  className="w-full text-left rounded-xl border border-[#1E1E26] overflow-hidden cursor-pointer btn-press active:scale-[0.98] transition-all"
                  style={{ borderLeftWidth: 4, borderLeftColor: plan.color }}
                >
                  <div className="p-4" style={{ background: `linear-gradient(135deg, ${plan.color}22 0%, #111116 60%)` }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black tracking-[0.3em] mb-0.5" style={{ color: plan.color }}>
                          {plan.exercises.length} EXERCISES
                        </div>
                        <div className="text-xl font-black text-[#EDEDF0] leading-none">{plan.label}</div>
                        <div className="text-xs text-[#686870] mt-1 font-bold tracking-wide">{plan.muscles}</div>
                      </div>
                      <div className="text-2xl font-black opacity-20" style={{ color: plan.color }}>→</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {plan.exercises.slice(0, 4).map(ex => (
                        <span key={ex.id} className="px-2 py-0.5 rounded text-[10px] font-bold text-[#686870] bg-[#0D0D10] border border-[#1E1E26]">
                          {ex.name}
                        </span>
                      ))}
                      {plan.exercises.length > 4 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold text-[#686870] bg-[#0D0D10] border border-[#1E1E26]">
                          +{plan.exercises.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              <button
                onClick={() => selectWorkout('rest')}
                className="w-full text-left rounded-xl border border-[#1E1E26] bg-[#0D0D10] p-4 cursor-pointer btn-press active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔋</span>
                  <div>
                    <div className="text-sm font-black text-[#686870]">REST DAY</div>
                    <div className="text-[10px] text-[#2C2C38] font-bold">Recovery · Mobility · Eat well</div>
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── Workout selected ── */}
        {workout && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between pt-8">
              <div className="flex-1">
                <p className="text-[10px] font-black tracking-[0.35em]" style={{ color: workout.color }}>MISSION</p>
                <h1 className="text-4xl font-black text-[#EDEDF0] leading-none mt-0.5">{workout.label}</h1>
                <p className="text-xs text-[#686870] mt-1 font-bold tracking-wider">{workout.muscles}</p>
                <p className="text-[10px] italic text-[#2C2C38] mt-1">&ldquo;{getQuoteOfHour()}&rdquo;</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => setTimerRunning(r => !r)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer
                    ${timerRunning ? 'border-[#FF2800] bg-[#FF280011]' : 'border-[#1E1E26] bg-[#111116]'}`}>
                  <Clock size={13} className={timerRunning ? 'text-[#FF2800]' : 'text-[#686870]'} />
                  <span className={`text-sm font-black tabular-nums ${timerRunning ? 'text-[#FF2800]' : 'text-[#686870]'}`}>
                    {mins}:{secs}
                  </span>
                </button>
                {!timerRunning && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number" inputMode="numeric"
                      value={manualMins}
                      onChange={e => setManualMins(e.target.value)}
                      placeholder="min"
                      className="w-14 bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF2800] rounded-lg px-2 py-1.5 text-[11px] font-black text-[#EDEDF0] placeholder-[#2C2C38] outline-none text-center"
                    />
                    <button
                      onClick={() => {
                        const m = parseInt(manualMins)
                        if (!m || m <= 0) return
                        const secs = m * 60
                        if (workoutDone) {
                          setWorkoutDuration(secs)
                        } else {
                          setTimer(secs)
                        }
                        setManualMins('')
                      }}
                      className="px-2 py-1.5 rounded-lg border border-[#1E1E26] bg-[#0D0D10] text-[9px] font-black tracking-widest text-[#686870] cursor-pointer active:scale-95 transition-all">
                      SET
                    </button>
                  </div>
                )}
                {!workoutDone && (
                  <button
                    onClick={() => selectWorkout('')}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#1E1E26] bg-[#0D0D10] cursor-pointer active:scale-95 transition-all"
                  >
                    <RotateCcw size={11} className="text-[#686870]" />
                    <span className="text-[9px] font-black tracking-widest text-[#686870]">CHANGE</span>
                  </button>
                )}
              </div>
            </div>

            {isRest ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="text-6xl">🔋</div>
                <div className="text-2xl font-black text-[#EDEDF0]">REST DAY</div>
                <div className="text-sm text-[#686870] text-center max-w-xs">
                  Recovery is part of the grind. Eat, sleep, come back harder.
                </div>
                {!workoutDone && (
                  <button
                    onClick={() => { markWorkoutDone(timerRef.current); setTimerRunning(false) }}
                    className="mt-4 px-6 py-3 rounded-xl border border-[#686870] text-[10px] font-black tracking-widest text-[#686870] cursor-pointer active:scale-95 transition-all"
                  >
                    LOG REST DAY
                  </button>
                )}
                {workoutDone && (
                  <div className="text-xs font-black text-[#1DB954] tracking-widest">REST DAY LOGGED ✓</div>
                )}
              </div>
            ) : (
              <>
                {/* Progress */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black tracking-widest text-[#686870]">PROGRESS</span>
                    <span className="text-[10px] font-black" style={{ color: workout.color }}>
                      {doneCount}/{totalCount} EXERCISES
                    </span>
                  </div>
                  <div className="h-3 bg-[#111116] border border-[#1E1E26] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${workout.color}88, ${workout.color})` }} />
                  </div>
                </div>

                {/* Exercise Checklist */}
                <div className="space-y-2">
                  {workout.exercises.map(ex => {
                    const done = checked.includes(ex.id)
                    const exLog = dayLog?.exerciseLogs.find(l => l.exerciseId === ex.id)
                    const isOpen = expanded === ex.id
                    return (
                      <div key={ex.id} className={`rounded-xl border overflow-hidden transition-all
                        ${done ? 'bg-[#0D7A3A22] border-[#1DB95444]' : 'bg-[#111116] border-[#1E1E26]'}`}>

                        {/* Header row */}
                        <div className="flex items-center gap-3 p-4 cursor-pointer"
                          onClick={() => toggleExpand(ex.id, ex.sets)}>
                          <div className="w-1.5 rounded-full self-stretch flex-shrink-0"
                            style={{ backgroundColor: done ? '#1DB954' : workout.color }} />
                          <div className="flex-1 min-w-0">
                            <div className={`font-black text-sm tracking-wide transition-all ${done ? 'text-[#1DB954] line-through opacity-70' : 'text-[#EDEDF0]'}`}>
                              {ex.name}
                            </div>
                            <div className="text-[11px] text-[#686870] mt-0.5">
                              {ex.sets} sets · {ex.repsRange} reps{ex.notes ? ` · ${ex.notes}` : ''}
                            </div>
                            {exLog && exLog.sets.length > 0 && (
                              <div className="text-[10px] font-bold mt-0.5" style={{ color: workout.color }}>
                                {exLog.sets.map(s => `${s.weight}kg×${s.reps}`).join(' · ')}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); toggleExerciseCheck(ex.id) }}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                              ${done ? 'bg-[#1DB954] border-[#1DB954] text-[#070709]' : 'border-[#2C2C38]'}`}>
                            {done && <span className="text-[11px] font-black leading-none">✓</span>}
                          </button>
                        </div>

                        {/* Set inputs */}
                        {isOpen && (
                          <div className="border-t border-[#1E1E26] px-4 pt-3 pb-4 space-y-2">
                            {Array.from({ length: ex.sets }, (_, i) => {
                              const inp = setInputs[ex.id]?.[i] ?? { weight: '', reps: '' }
                              return (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-[9px] font-black text-[#686870] w-10 flex-shrink-0">SET {i + 1}</span>
                                  <div className="flex-1 relative">
                                    <input
                                      type="number" inputMode="decimal"
                                      value={inp.weight}
                                      onChange={e => setSetInputs(prev => {
                                        const arr = [...(prev[ex.id] ?? [])]
                                        arr[i] = { ...arr[i], weight: e.target.value }
                                        return { ...prev, [ex.id]: arr }
                                      })}
                                      placeholder="0"
                                      className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF2800] rounded-lg pl-2 pr-7 py-2 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#686870] pointer-events-none">kg</span>
                                  </div>
                                  <div className="flex-1 relative">
                                    <input
                                      type="number" inputMode="numeric"
                                      value={inp.reps}
                                      onChange={e => setSetInputs(prev => {
                                        const arr = [...(prev[ex.id] ?? [])]
                                        arr[i] = { ...arr[i], reps: e.target.value }
                                        return { ...prev, [ex.id]: arr }
                                      })}
                                      placeholder="0"
                                      className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF2800] rounded-lg pl-2 pr-9 py-2 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#686870] pointer-events-none">reps</span>
                                  </div>
                                </div>
                              )
                            })}
                            <button
                              onClick={() => saveSets(ex.id)}
                              className="w-full py-2.5 rounded-xl text-[10px] font-black tracking-widest mt-1 cursor-pointer btn-press"
                              style={{ background: `${workout.color}22`, border: `1px solid ${workout.color}55`, color: workout.color }}>
                              SAVE SETS
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* ── Cardio (optional) ── */}
                <div className="bg-[#111116] border border-[#1E1E26] rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[#1E1E26] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">CARDIO</span>
                      <span className="text-[10px] font-black tracking-[0.3em] text-[#2C2C38]"> · OPTIONAL</span>
                    </div>
                    {savedCardio && (
                      <button onClick={clearCardio}
                        className="text-[9px] font-black text-[#686870] cursor-pointer active:opacity-60 tracking-widest">
                        CLEAR
                      </button>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Type selector */}
                    <div className="flex gap-2">
                      {(['incline_walk', 'cross_trainer'] as const).map(type => (
                        <button key={type} onClick={() => setCardioType(type)}
                          className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black tracking-wider cursor-pointer transition-all btn-press
                            ${cardioType === type
                              ? 'border-[#FF2800] text-[#FF5500]'
                              : 'bg-[#0D0D10] border-[#1E1E26] text-[#686870]'}`}
                          style={cardioType === type ? { background: '#FF280018' } : {}}>
                          {type === 'incline_walk' ? '⛰ INCLINE WALK' : '🔄 CROSS TRAINER'}
                        </button>
                      ))}
                    </div>

                    {/* Minutes + Calories inputs */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="text-[9px] font-black tracking-widest text-[#686870] mb-1.5">MINUTES</div>
                        <input
                          type="number" inputMode="numeric"
                          value={cardioMins}
                          onChange={e => setCardioMins(e.target.value)}
                          placeholder={savedCardio ? String(savedCardio.minutes) : '30'}
                          className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF2800] rounded-lg px-3 py-2.5 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none transition-colors"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-[9px] font-black tracking-widest text-[#686870] mb-1.5">KCAL BURNED</div>
                        <input
                          type="number" inputMode="numeric"
                          value={cardioKcal}
                          onChange={e => setCardioKcal(e.target.value)}
                          placeholder={savedCardio ? String(savedCardio.caloriesBurned) : '200'}
                          className="w-full bg-[#0D0D10] border border-[#1E1E26] focus:border-[#FF2800] rounded-lg px-3 py-2.5 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      onClick={saveCardio}
                      disabled={!cardioMins || !cardioKcal}
                      className="w-full py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all cursor-pointer btn-press disabled:opacity-30 disabled:cursor-not-allowed bg-[#FF280018] border border-[#FF280044] text-[#FF5500]">
                      SAVE CARDIO
                    </button>

                    {/* Saved cardio summary */}
                    {savedCardio && (
                      <div className="flex items-center gap-2.5 py-2.5 px-3 bg-[#1DB95411] border border-[#1DB95433] rounded-xl">
                        <span className="text-lg leading-none">
                          {savedCardio.type === 'incline_walk' ? '⛰' : '🔄'}
                        </span>
                        <div>
                          <div className="text-[11px] font-black text-[#1DB954] tracking-wider">
                            {savedCardio.type === 'incline_walk' ? 'INCLINE WALK' : 'CROSS TRAINER'} LOGGED ✓
                          </div>
                          <div className="text-[10px] text-[#686870] mt-0.5">
                            {savedCardio.minutes} min · {savedCardio.caloriesBurned} kcal burned
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Finisher */}
                {workout.finisher && (
                  <button onClick={() => setShowFinisher(s => !s)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed cursor-pointer transition-all"
                    style={{ borderColor: `${workout.color}55` }}>
                    <div className="text-left">
                      <div className="text-[10px] font-black tracking-widest mb-0.5" style={{ color: workout.color }}>FINISHER</div>
                      <div className="text-sm font-bold text-[#EDEDF0]">{workout.finisher}</div>
                    </div>
                    {showFinisher ? <ChevronUp size={16} className="text-[#686870]" /> : <ChevronDown size={16} className="text-[#686870]" />}
                  </button>
                )}

                {/* Session Notes */}
                <div className="bg-[#111116] border border-[#1E1E26] rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[#1E1E26]">
                    <span className="text-[10px] font-black tracking-[0.3em] text-[#686870]">SESSION NOTES</span>
                  </div>
                  <textarea
                    value={notes}
                    onChange={e => setWorkoutNotes(e.target.value)}
                    placeholder="How did it feel? Anything to note for next time..."
                    className="w-full bg-transparent px-4 py-3 text-sm text-[#EDEDF0] placeholder-[#2C2C38] outline-none resize-none"
                    rows={3}
                  />
                </div>

                {/* Calories burned summary */}
                {totalWorkoutBurned > 0 && (
                  <div className="bg-[#111116] border border-[#1E1E26] rounded-xl p-4">
                    <div className="text-[10px] font-black tracking-[0.3em] text-[#686870] mb-3">CALORIES BURNED</div>
                    <div className="flex items-end gap-1 mb-3">
                      <span className="text-4xl font-black text-[#1DB954] leading-none">{totalWorkoutBurned}</span>
                      <span className="text-sm text-[#686870] mb-1">kcal</span>
                    </div>
                    <div className="space-y-1.5">
                      {liftingKcal > 0 && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#686870]">Lifting {tvl > 0 ? `· ${Math.round(tvl).toLocaleString()}kg volume` : ''}</span>
                          <span className="font-black text-[#EDEDF0]">{liftingKcal} kcal</span>
                        </div>
                      )}
                      {cardioKcalBurned > 0 && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#686870]">Cardio</span>
                          <span className="font-black text-[#EDEDF0]">{cardioKcalBurned} kcal</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Complete Button */}
                {!workoutDone ? (
                  <button
                    onClick={() => { markWorkoutDone(timerRef.current); setTimerRunning(false) }}
                    disabled={doneCount === 0}
                    className="w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed btn-press"
                    style={{
                      background: doneCount > 0 ? `linear-gradient(135deg, ${workout.color}, ${workout.color}bb)` : '#1E1E26',
                      color: doneCount > 0 ? 'white' : '#686870',
                    }}>
                    {doneCount === 0 ? 'CHECK OFF EXERCISES TO COMPLETE' : 'MISSION COMPLETE'}
                  </button>
                ) : (
                  <div className="w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase text-center bg-[#0D7A3A22] border border-[#1DB95433] text-[#1DB954]">
                    MISSION COMPLETE ✓
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
