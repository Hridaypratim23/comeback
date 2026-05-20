import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const db = getSupabase()
  if (!db) return NextResponse.json({ error: 'no db' })

  const { data: subs } = await db.from('push_subscriptions').select('id, updated_at')
  const { data: schedule } = await db
    .from('notification_schedule')
    .select('id, show_at, fired')
    .order('show_at')

  const now = Date.now()
  return NextResponse.json({
    now,
    subscriptions: subs,
    scheduleCount: schedule?.length ?? 0,
    due: schedule?.filter(n => !n.fired && n.show_at <= now),
    upcoming: schedule?.filter(n => !n.fired && n.show_at > now).slice(0, 5),
    firedCount: schedule?.filter(n => n.fired).length ?? 0,
  })
}
