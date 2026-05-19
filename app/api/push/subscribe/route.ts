import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { subscription, schedule } = await req.json()
    const db = getSupabase()
    if (!db) return NextResponse.json({ error: 'no db' }, { status: 500 })

    // Save push subscription
    await db.from('push_subscriptions').upsert(
      { id: 'main', subscription, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )

    // Replace entire schedule (delete unfired + insert fresh)
    if (Array.isArray(schedule) && schedule.length > 0) {
      await db.from('notification_schedule').delete().eq('fired', false)
      await db.from('notification_schedule').upsert(
        schedule.map((n: { id: string; showAt: number; title: string; body: string; url?: string }) => ({
          id: n.id,
          show_at: n.showAt,
          title: n.title,
          body: n.body,
          url: n.url ?? '/',
          fired: false,
        })),
        { onConflict: 'id' }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
