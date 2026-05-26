import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function GET(req: Request) {
  const db = getSupabase()
  if (!db) return NextResponse.json({ ok: false, error: 'No Supabase connection' }, { status: 500 })

  // Accept ?date=YYYY-MM-DD&steps=N  (both optional)
  // Default: yesterday in IST, steps=0
  const url = new URL(req.url)
  const stepsParam = url.searchParams.get('steps')
  const dateParam  = url.searchParams.get('date')

  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000
  const istNow    = new Date(now.getTime() + istOffset)
  const targetDate = dateParam ?? localDateStr(new Date(istNow.getTime() - 86400000))
  const targetSteps = stepsParam !== null ? parseInt(stepsParam) : 0

  const { data, error } = await db
    .from('app_state')
    .select('data')
    .eq('id', 'main')
    .single()

  if (error || !data?.data) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'No data found' }, { status: 500 })
  }

  const state = data.data as Record<string, unknown>
  const existingDayLogs = (state.dayLogs as Record<string, unknown> | undefined) ?? {}
  const existingDay = (existingDayLogs[targetDate] as Record<string, unknown> | undefined) ?? {
    date: targetDate, steps: 0, meals: [], habits: {}, waterMl: 0, workoutDone: false, fastingHours: 0,
  }
  const patched = {
    ...state,
    pendingStepFixes: { [targetDate]: targetSteps },
    dayLogs: {
      ...existingDayLogs,
      [targetDate]: { ...existingDay, steps: targetSteps },
    },
  }

  const { error: writeError } = await db
    .from('app_state')
    .upsert({ id: 'main', data: patched, updated_at: new Date().toISOString() }, { onConflict: 'id' })

  if (writeError) {
    return NextResponse.json({ ok: false, error: writeError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, date: targetDate, steps: targetSteps })
}
