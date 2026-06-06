import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

function applyOverridesToDayLogs(
  dayLogs: Record<string, unknown>,
  overrides: Record<string, number>
): Record<string, unknown> {
  const patched = { ...dayLogs }
  for (const [date, steps] of Object.entries(overrides)) {
    const entry = patched[date] as Record<string, unknown> | undefined
    if (entry) patched[date] = { ...entry, steps }
  }
  return patched
}

export async function GET() {
  const db = getSupabase()
  if (!db) return NextResponse.json({ data: null })
  const { data } = await db
    .from('app_state')
    .select('data, updated_at')
    .eq('id', 'main')
    .single()

  const appData = data?.data as Record<string, unknown> | null
  if (appData) {
    // Apply stepsOverride to dayLogs server-side — client always receives corrected step counts
    const overrides = (appData.stepsOverride as Record<string, number> | undefined) ?? {}
    const hardcoded: Record<string, number> = { '2025-05-22': 0, ...overrides }
    const dayLogs = (appData.dayLogs as Record<string, unknown> | undefined) ?? {}
    appData.dayLogs = applyOverridesToDayLogs(dayLogs, hardcoded)
    appData.stepsOverride = hardcoded
  }

  return NextResponse.json({ data: appData ?? null, updatedAt: data?.updated_at ?? null })
}

export async function POST(req: NextRequest) {
  const db = getSupabase()
  if (!db) return NextResponse.json({ ok: false })
  const body = await req.json()

  // Preserve stepsOverride from the existing row — always merge server overrides on top
  const { data: existing } = await db
    .from('app_state').select('data').eq('id', 'main').single()
  const serverOverrides = (existing?.data as Record<string, unknown> | null)?.stepsOverride as Record<string, number> | undefined
  const hardcoded: Record<string, number> = { '2025-05-22': 0 }
  const finalOverrides: Record<string, number> = { ...(body.stepsOverride ?? {}), ...hardcoded, ...(serverOverrides ?? {}) }

  // Apply overrides to dayLogs before saving — dayLogs in Supabase always reflects correct steps
  const dayLogs = (body.dayLogs as Record<string, unknown> | undefined) ?? {}
  const patchedDayLogs = applyOverridesToDayLogs(dayLogs, finalOverrides)

  // Body stats: keep whichever was updated more recently (server wins on tie / missing timestamp)
  const existingStats = (existing?.data as Record<string, unknown> | null)?.stats as Record<string, unknown> | undefined
  const serverTs = existingStats?.bodyStatsUpdatedAt as string | undefined
  const clientTs = (body.stats as Record<string, unknown> | undefined)?.bodyStatsUpdatedAt as string | undefined
  const serverIsNewer = serverTs && (!clientTs || serverTs > clientTs)
  const resolvedStats = serverIsNewer
    ? { ...body.stats, weight: existingStats!.weight, bodyFat: existingStats!.bodyFat, bodyStatsUpdatedAt: serverTs }
    : body.stats

  const merged = { ...body, stats: resolvedStats, dayLogs: patchedDayLogs, stepsOverride: finalOverrides }

  await db.from('app_state').upsert(
    { id: 'main', data: merged, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  )
  return NextResponse.json({ ok: true })
}
