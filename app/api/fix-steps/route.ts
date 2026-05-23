import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

function localDateStr(d: Date) {
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

  // Calculate yesterday in IST (UTC+5:30)
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000
  const istNow = new Date(now.getTime() + istOffset)
  const yesterday = localDateStr(new Date(istNow.getTime() - 86400000))

  // Set pendingStepFixes — mergeRemoteState applies these unconditionally, overriding local merge
  const patched = { ...state, pendingStepFixes: { [yesterday]: 10001 } }

  const { error: writeError } = await db
    .from('app_state')
    .upsert({ id: 'main', data: patched, updated_at: new Date().toISOString() }, { onConflict: 'id' })

  if (writeError) {
    return NextResponse.json({ ok: false, error: writeError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, date: yesterday, correction: 10001 })
}
