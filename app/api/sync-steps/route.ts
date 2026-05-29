import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // Validate token
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || token !== process.env.STEPS_SYNC_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabase()
  if (!db) return NextResponse.json({ ok: false, error: 'No database' }, { status: 500 })

  const body = await req.json().catch(() => null)
  const steps = typeof body?.steps === 'number' ? Math.round(body.steps) : null
  const date  = typeof body?.date  === 'string'  ? body.date  : null

  if (steps === null || steps < 0 || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: false, error: 'Invalid payload. Expected { date: "YYYY-MM-DD", steps: number }' }, { status: 400 })
  }

  const { data, error } = await db.from('app_state').select('data').eq('id', 'main').single()
  if (error || !data?.data) return NextResponse.json({ ok: false, error: 'State not found' }, { status: 500 })

  const state = data.data as Record<string, unknown>
  const existingDayLogs  = (state.dayLogs  as Record<string, unknown> | undefined) ?? {}
  const existingOverrides = (state.stepsOverride as Record<string, number> | undefined) ?? {}
  const existingDay = (existingDayLogs[date] as Record<string, unknown> | undefined) ?? {
    date, steps: 0, meals: [], habits: {}, waterMl: 0, workoutDone: false,
  }

  // Respect manual override — if user entered steps manually, don't overwrite with Health sync
  if ((existingDay as Record<string, unknown>).stepsManualOverride === true) {
    return NextResponse.json({ ok: true, date, steps: existingDay.steps, skipped: 'manual_override' })
  }

  const patched = {
    ...state,
    stepsOverride: { ...existingOverrides, [date]: steps },
    dayLogs: { ...existingDayLogs, [date]: { ...existingDay, steps } },
  }

  const { error: writeError } = await db
    .from('app_state')
    .upsert({ id: 'main', data: patched, updated_at: new Date().toISOString() }, { onConflict: 'id' })

  if (writeError) return NextResponse.json({ ok: false, error: writeError.message }, { status: 500 })

  return NextResponse.json({ ok: true, date, steps })
}
