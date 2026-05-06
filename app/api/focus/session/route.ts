import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const body = await req.json()

  const { error } = await supabase.from('focus_sessions').insert({
    user_id: user.id,
    aufgabe: body.aufgabe,
    kategorie: body.kategorie,
    dauer_minuten: body.dauer_minuten,
    abgeschlossen: body.abgeschlossen ?? false,
    abgebrochen: body.abgebrochen ?? false,
    notiz: body.notiz ?? null,
    gestartet_at: body.gestartet_at,
    beendet_at: body.beendet_at,
  })

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json({ success: true })
}
