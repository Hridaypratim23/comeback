import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { subscription, schedule } = await req.json()
    const db = getSupabase()
    if (!db) return NextResponse.json({ error: 'no db' }, { status: 500 })

    // Save push subscription
    const { error: subErr } = await db.from('push_subscriptions').upsert(
      { id: 'main', subscription, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    if (subErr) {
      console.error('[push/subscribe] upsert push_subscriptions failed:', subErr)
      return NextResponse.json({ error: subErr.message }, { status: 500 })
    }

    // Replace entire schedule (delete unfired + insert fresh)
    if (Array.isArray(schedule) && schedule.length > 0) {
      const { error: delErr } = await db
        .from('notification_schedule')
        .delete()
        .eq('fired', false)
      if (delErr) console.error('[push/subscribe] delete notification_schedule failed:', delErr)

      const { error: insErr } = await db.from('notification_schedule').upsert(
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
      if (insErr) {
        console.error('[push/subscribe] upsert notification_schedule failed:', insErr)
        return NextResponse.json({ error: insErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true, scheduled: schedule?.length ?? 0 })
  } catch (e) {
    console.error('[push/subscribe] unexpected error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
