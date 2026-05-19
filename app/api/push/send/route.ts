import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { getSupabase } from '@/lib/supabase'

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:hriday.kalita@vantagecircle.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function GET(req: NextRequest) {
  // Vercel automatically sets CRON_SECRET and passes it as Authorization header
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const db = getSupabase()
    if (!db) return NextResponse.json({ error: 'no db' }, { status: 500 })

    const now = Date.now()

    // Get the stored push subscription
    const { data: subRow } = await db
      .from('push_subscriptions')
      .select('subscription')
      .eq('id', 'main')
      .single()

    if (!subRow?.subscription) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no subscription' })
    }

    // Get all unfired notifications that are due
    const { data: due } = await db
      .from('notification_schedule')
      .select('*')
      .eq('fired', false)
      .lte('show_at', now)

    if (!due?.length) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    let sent = 0
    for (const n of due) {
      try {
        await webpush.sendNotification(
          subRow.subscription,
          JSON.stringify({
            title: n.title,
            body:  n.body,
            icon:  '/icon.png',
            badge: '/icon.png',
            tag:   n.id,
            data:  { url: n.url || '/' },
          })
        )
        await db.from('notification_schedule').update({ fired: true }).eq('id', n.id)
        sent++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        // 410 = subscription expired/invalid, clean it up
        if (status === 410) {
          await db.from('push_subscriptions').delete().eq('id', 'main')
          break
        }
      }
    }

    return NextResponse.json({ ok: true, sent })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
