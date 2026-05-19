'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { WORKOUT_PLANS, REST_WORKOUT, getWorkoutById } from '@/constants/workouts'
import { getQuoteOfHour } from '@/constants/quotes'
import { Clock, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import QuoteTicker from '@/components/QuoteTicker'

export default function WorkoutPage() {
  const { dayLogs, markWorkoutDone, toggleExerciseCheck, setWorkoutNotes, getOrCreateToday, selectWorkout } = useStore()
  const [mounted, setMounted] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showFinisher, setShowFinisher] = useState(false)

  useEffect(() => {
    setMounted(true)
    getOrCreateToday()
  }, [getOrCreateToday])

  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning])

  if (!mounted) return null

  const today = new Date().toISOString().split('T')[0]
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

  const mins = Math.floor(timer / 60).toString().padStart(2, '0')
  const secs = (timer % 60).toString().padStart(2, '0')

  return (
    <div className="pb-4 space-y-4">
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

            {/* 5-plan grid */}
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

              {/* Rest day option */}
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
                {/* Timer */}
                <button
                  onClick={() => setTimerRunning(r => !r)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer
                    ${timerRunning ? 'border-[#FF2800] bg-[#FF280011]' : 'border-[#1E1E26] bg-[#111116]'}`}>
                  <Clock size={13} className={timerRunning ? 'text-[#FF2800]' : 'text-[#686870]'} />
                  <span className={`text-sm font-black tabular-nums ${timerRunning ? 'text-[#FF2800]' : 'text-[#686870]'}`}>
                    {mins}:{secs}
                  </span>
                </button>
                {/* Change workout (only if not done) */}
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
                    onClick={() => { markWorkoutDone(); setTimerRunning(false) }}
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
                      style={{ width: `${progress}%`, backgroundColor: workout.color }} />
                  </div>
                </div>

                {/* Exercise Checklist */}
                <div className="space-y-2">
                  {workout.exercises.map(ex => {
                    const done = checked.includes(ex.id)
                    return (
                      <button key={ex.id} onClick={() => toggleExerciseCheck(ex.id)}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer btn-press text-left
                          ${done ? 'bg-[#0D7A3A22] border-[#1DB95444]' : 'bg-[#111116] border-[#1E1E26] hover:border-[#2C2C38]'}`}>
                        <div className="w-1.5 rounded-full self-stretch flex-shrink-0"
                          style={{ backgroundColor: done ? '#1DB954' : workout.color }} />
                        <div className="flex-1 min-w-0">
                          <div className={`font-black text-sm tracking-wide transition-all ${done ? 'text-[#1DB954] line-through opacity-70' : 'text-[#EDEDF0]'}`}>
                            {ex.name}
                          </div>
                          <div className="text-[11px] text-[#686870] mt-0.5">
                            {ex.sets} sets · {ex.repsRange} reps{ex.notes ? ` · ${ex.notes}` : ''}
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                          ${done ? 'bg-[#1DB954] border-[#1DB954] text-[#070709]' : 'border-[#2C2C38]'}`}>
                          {done && <span className="text-[11px] font-black leading-none">✓</span>}
                        </div>
                      </button>
                    )
                  })}
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

                {/* Complete Button */}
                {!workoutDone ? (
                  <button
                    onClick={() => { markWorkoutDone(); setTimerRunning(false) }}
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
