import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const db = getSupabase()
  if (!db) return NextResponse.json({ steps: null })

  const { data } = await db.from('app_state').select('data').eq('id', 'main').single()
  if (!data?.data) return NextResponse.json({ steps: null })

  const state = data.data as Record<string, unknown>
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const overrides = (state.stepsOverride as Record<string, number> | undefined) ?? {}
  const steps = overrides[today] ?? null

  return NextResponse.json({ steps, date: today }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
