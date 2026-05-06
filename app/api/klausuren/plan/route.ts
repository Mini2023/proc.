import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai/client'
import { buildLernplanPrompt, getWerktage } from '@/lib/ai/prompts/lernplan'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { klausurId } = await req.json()
  if (!klausurId) return new NextResponse('klausurId fehlt', { status: 400 })

  const { data: klausur, error: klausurError } = await supabase
    .from('klausuren')
    .select('*')
    .eq('id', klausurId)
    .eq('user_id', user.id)
    .single()

  if (klausurError || !klausur)
    return new NextResponse('Klausur nicht gefunden', { status: 404 })

  const heute = new Date()
  const klausurDatum = new Date(klausur.datum)
  const tageVerfuegbar = getWerktage(heute, klausurDatum)

  if (tageVerfuegbar < 1) {
    return NextResponse.json({
      success: false,
      error: 'Klausur ist zu nah — keine Werktage mehr verfügbar.',
    })
  }

  const prompt = buildLernplanPrompt({
    fach: klausur.fach,
    thema: klausur.thema ?? '',
    klausurDatum: klausur.datum,
    heuteDatum: heute.toISOString().split('T')[0],
    tageVerfuegbar,
  })

  const raw = await callAI({
    system: 'Du bist ein präziser Lernplaner. Antworte ausschließlich als valides JSON ohne Kommentare.',
    userMessage: prompt,
    jsonMode: true,
    tier: 'heavy',
    maxTokens: 2000,
  })

  let lernplan: { tage: { datum: string; tasks: { text: string; done: boolean }[] }[] }

  try {
    lernplan = JSON.parse(raw)
  } catch {
    return new NextResponse('KI hat kein valides JSON geliefert.', { status: 500 })
  }

  // Lernplan in Klausur speichern
  await supabase
    .from('klausuren')
    .update({ lernplan: lernplan.tage, lernplan_generiert: true })
    .eq('id', klausurId)

  // Todos erstellen (alte Lernplan-Todos zuerst löschen, falls vorhanden)
  await supabase
    .from('todos')
    .delete()
    .eq('klausur_id', klausurId)
    .not('lernplan_datum', 'is', null)

  const todoInserts = lernplan.tage.flatMap((tag) =>
    tag.tasks.map((task) => ({
      user_id: user.id,
      text: task.text,
      klausur_id: klausurId,
      lernplan_datum: tag.datum,
      faellig_am: tag.datum,
      prioritaet: 1,
      kategorie: 'backlog',
      fertig: false,
    }))
  )

  if (todoInserts.length > 0) {
    await supabase.from('todos').insert(todoInserts)
  }

  return NextResponse.json({
    success: true,
    tage: lernplan.tage.length,
    tasksTotal: todoInserts.length,
  })
}
