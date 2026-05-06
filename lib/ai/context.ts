import { createClient } from '@/lib/supabase/server'

export interface UserContext {
  profil: {
    name: string
    klasse: string
    schule: string
  }
  heute: {
    datum: string
    wochentag: string
    naechsteKlausuren: {
      fach: string
      thema: string | null
      datum: string
      tageNoch: number
      lernplanAktiv: boolean
    }[]
    offeneTodos: {
      text: string
      prioritaet: number
      faelligAm: string | null
    }[]
    focusSessions: {
      aufgabe: string
      kategorie: string
      dauerMinuten: number
      abgeschlossen: boolean
    }[]
  }
  woche: {
    gesamtFocusMinuten: number
    sessionsNachKategorie: Record<string, number>
    abgeschlosseneTodos: number
  }
  notenSchnitt: {
    gesamt: number | null
    nachFach: { fach: string; schnitt: number }[]
  }
}

function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
}

export async function buildUserContext(userId: string): Promise<UserContext> {
  const supabase = await createClient()

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const in14Days = new Date(now)
  in14Days.setDate(in14Days.getDate() + 14)

  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [
    profileRes,
    klausurRes,
    todoRes,
    sessionTodayRes,
    sessionWeekRes,
    completedTodosRes,
    noteRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase
      .from('klausuren')
      .select('*')
      .eq('user_id', userId)
      .gte('datum', today)
      .lte('datum', in14Days.toISOString().split('T')[0])
      .order('datum', { ascending: true }),
    supabase
      .from('todos')
      .select('text, prioritaet, faellig_am, fertig')
      .eq('user_id', userId)
      .or(`kategorie.eq.heute,faellig_am.eq.${today}`)
      .eq('fertig', false)
      .order('prioritaet', { ascending: true })
      .limit(10),
    supabase
      .from('focus_sessions')
      .select('aufgabe, kategorie, dauer_minuten, abgeschlossen')
      .eq('user_id', userId)
      .gte('gestartet_at', `${today}T00:00:00`)
      .order('gestartet_at', { ascending: false }),
    supabase
      .from('focus_sessions')
      .select('kategorie, dauer_minuten')
      .eq('user_id', userId)
      .gte('gestartet_at', weekAgo.toISOString())
      .eq('abgeschlossen', true),
    supabase
      .from('todos')
      .select('id')
      .eq('user_id', userId)
      .eq('fertig', true)
      .gte('erstellt_at', `${today}T00:00:00`),
    supabase
      .from('klausuren')
      .select('fach, note')
      .eq('user_id', userId)
      .not('note', 'is', null),
  ])

  const profile = profileRes.data
  const klausuren = klausurRes.data || []
  const todos = todoRes.data || []
  const todaySessions = sessionTodayRes.data || []
  const weekSessions = sessionWeekRes.data || []
  const completedTodos = completedTodosRes.data || []
  const noten = noteRes.data || []

  // Weekly stats
  const gesamtFocusMinuten = weekSessions.reduce(
    (sum: number, s: { dauer_minuten: number }) => sum + s.dauer_minuten,
    0
  )

  const sessionsNachKategorie: Record<string, number> = {}
  weekSessions.forEach((s: { kategorie: string; dauer_minuten: number }) => {
    sessionsNachKategorie[s.kategorie] =
      (sessionsNachKategorie[s.kategorie] || 0) + s.dauer_minuten
  })

  // Noten
  const noteMap: Record<string, number[]> = {}
  noten.forEach((k: { fach: string; note: number }) => {
    if (!noteMap[k.fach]) noteMap[k.fach] = []
    noteMap[k.fach].push(k.note)
  })

  const nachFach = Object.entries(noteMap).map(([fach, ns]) => ({
    fach,
    schnitt: ns.reduce((a, b) => a + b, 0) / ns.length,
  }))

  const alleNoten = noten.map((k: { note: number }) => k.note)
  const gesamt =
    alleNoten.length > 0
      ? alleNoten.reduce((a: number, b: number) => a + b, 0) / alleNoten.length
      : null

  const wochentag = now.toLocaleDateString('de-DE', { weekday: 'long' })

  return {
    profil: {
      name: profile?.display_name || 'Unbekannt',
      klasse: profile?.klasse || '',
      schule: profile?.schule || '',
    },
    heute: {
      datum: today,
      wochentag,
      naechsteKlausuren: klausuren.map(
        (k: {
          fach: string
          thema: string | null
          datum: string
          lernplan_generiert: boolean
        }) => ({
          fach: k.fach,
          thema: k.thema,
          datum: k.datum,
          tageNoch: getDaysUntil(k.datum),
          lernplanAktiv: k.lernplan_generiert,
        })
      ),
      offeneTodos: todos.map(
        (t: { text: string; prioritaet: number; faellig_am: string | null }) => ({
          text: t.text,
          prioritaet: t.prioritaet,
          faelligAm: t.faellig_am,
        })
      ),
      focusSessions: todaySessions.map(
        (s: {
          aufgabe: string
          kategorie: string
          dauer_minuten: number
          abgeschlossen: boolean
        }) => ({
          aufgabe: s.aufgabe,
          kategorie: s.kategorie,
          dauerMinuten: s.dauer_minuten,
          abgeschlossen: s.abgeschlossen,
        })
      ),
    },
    woche: {
      gesamtFocusMinuten,
      sessionsNachKategorie,
      abgeschlosseneTodos: completedTodos.length,
    },
    notenSchnitt: {
      gesamt,
      nachFach,
    },
  }
}

export function serializeContext(ctx: UserContext): string {
  const focusHeute =
    ctx.heute.focusSessions.length > 0
      ? ctx.heute.focusSessions
          .map(
            (s) =>
              `  - "${s.aufgabe}" (${s.dauerMinuten}min, ${s.kategorie}, ${
                s.abgeschlossen ? 'fertig' : 'abgebrochen'
              })`
          )
          .join('\n')
      : '  - Noch keine Sessions heute'

  const todosHeute =
    ctx.heute.offeneTodos.length > 0
      ? ctx.heute.offeneTodos
          .slice(0, 5)
          .map((t) => `  - [P${t.prioritaet}] ${t.text}`)
          .join('\n')
      : '  - Keine offenen Todos'

  const klausuren =
    ctx.heute.naechsteKlausuren.length > 0
      ? ctx.heute.naechsteKlausuren
          .map(
            (k) =>
              `  - ${k.fach}${k.thema ? ` (${k.thema})` : ''}: in ${
                k.tageNoch
              } Tagen${k.lernplanAktiv ? ' [Lernplan aktiv]' : ''}`
          )
          .join('\n')
      : '  - Keine Klausuren in den nächsten 14 Tagen'

  return `
=== PROC. 2.0 KONTEXT ===
Name: ${ctx.profil.name}${ctx.profil.klasse ? `, ${ctx.profil.klasse}` : ''}${
    ctx.profil.schule ? ` @ ${ctx.profil.schule}` : ''
  }
Heute: ${ctx.heute.wochentag}, ${ctx.heute.datum}

Anstehende Klausuren (nächste 14 Tage):
${klausuren}

Offene Todos heute: ${ctx.heute.offeneTodos.length}
${todosHeute}

Focus Sessions heute: ${ctx.heute.focusSessions.length}
${focusHeute}

Diese Woche: ${Math.round((ctx.woche.gesamtFocusMinuten / 60) * 10) / 10}h Focus-Zeit
Abgeschlossene Todos heute: ${ctx.woche.abgeschlosseneTodos}

Noten-Schnitt: ${
    ctx.notenSchnitt.gesamt !== null
      ? ctx.notenSchnitt.gesamt.toFixed(2)
      : 'Noch keine Noten'
  }
${ctx.notenSchnitt.nachFach
  .map((f) => `  - ${f.fach}: ${f.schnitt.toFixed(1)}`)
  .join('\n')}
=== ENDE KONTEXT ===
`.trim()
}
