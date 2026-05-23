import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

function localDateStr(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function GET() {
  const db = getSupabase()
  if (!db) return NextResponse.json({ ok: false, error: 'No Supabase connection' }, { status: 500 })

  const { data, error } = await db
    .from('app_state')
    .select('data')
    .eq('id', 'main')
    .single()

  if (error || !data?.data) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'No data found' }, { status: 500 })
  }

  const state = data.data as Record<string, unknown>
  const dayLogs = (state.dayLogs ?? {}) as Record<string, Record<string, unknown>>

  const ist = new Date(Date.now() + (5.5 * 60 * 60 * 1000))
  const yesterday = localDateStr(new Date(ist.getTime() - 86400000))

  const prevSteps = (dayLogs[yesterday]?.steps as number) ?? 0

  dayLogs[yesterday] = {
    date: yesterday,
    workoutDone: false,
    exerciseLogs: [],
    checkedExercises: [],
    workoutNotes: '',
    meals: [],
    waterMl: 0,
    xpEarned: 0,
    habits: {},
    ...dayLogs[yesterday],
    steps: 10001,
  }

  const { error: writeError } = await db
    .from('app_state')
    .upsert({ id: 'main', data: { ...state, dayLogs }, updated_at: new Date().toISOString() }, { onConflict: 'id' })

  if (writeError) {
    return NextResponse.json({ ok: false, error: writeError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, date: yesterday, prevSteps, newSteps: 10001 })
}
