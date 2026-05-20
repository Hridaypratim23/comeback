import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const db = getSupabase()
  if (!db) return NextResponse.json({ error: 'no db' })

  const { error } = await db.from('notification_schedule').upsert(
    {
      id: 'test_ping',
      show_at: Date.now() - 5000,
      title: 'COMEBACK IS ALIVE.',
      body: 'Push notifications are working. See you at 5:30AM.',
      url: '/',
      fired: false,
    },
    { onConflict: 'id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, message: 'test notification inserted — now call /api/push/send' })
}
