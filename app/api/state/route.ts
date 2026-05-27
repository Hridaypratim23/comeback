import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const db = getSupabase()
  if (!db) return NextResponse.json({ data: null })
  const { data } = await db
    .from('app_state')
    .select('data, updated_at')
    .eq('id', 'main')
    .single()
  return NextResponse.json({ data: data?.data ?? null, updatedAt: data?.updated_at ?? null })
}

export async function POST(req: NextRequest) {
  const db = getSupabase()
  if (!db) return NextResponse.json({ ok: false })
  const body = await req.json()

  // Preserve stepsOverride from the existing row — a client with stale localStorage
  // may not have it yet and would otherwise wipe the server-side correction.
  const { data: existing } = await db
    .from('app_state').select('data').eq('id', 'main').single()
  const serverOverrides = (existing?.data as Record<string, unknown> | null)?.stepsOverride as Record<string, number> | undefined
  const merged = serverOverrides && Object.keys(serverOverrides).length > 0
    ? { ...body, stepsOverride: { ...(body.stepsOverride ?? {}), ...serverOverrides } }
    : body

  await db.from('app_state').upsert(
    { id: 'main', data: merged, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  )
  return NextResponse.json({ ok: true })
}
