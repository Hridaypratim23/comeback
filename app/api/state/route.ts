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
  await db.from('app_state').upsert(
    { id: 'main', data: body, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  )
  return NextResponse.json({ ok: true })
}
