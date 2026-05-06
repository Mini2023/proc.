import type { UserContext } from '@/lib/ai/context'
import { serializeContext } from '@/lib/ai/context'

// Legacy export — used by old GET /api/briefing/evening route
export function buildEveningPrompt(ctx: UserContext): string {
  return buildEveningFeedbackPrompt({
    freitext: '',
    nachfragenAntworten: [],
    tagesStats: {},
    ctx,
  })
}

export function buildEveningAnalysePrompt(params: {
  freitext: string
  tagesStats: {
    erledigteTodos: number
    alleTodos: number
    sessions: { aufgabe: string; dauerMinuten: number; abgeschlossen: boolean }[]
    lernplanErledigt: number
    lernplanGesamt: number
    klausurFach: string | null
  }
  ctx: UserContext
}): string {
  const { freitext, tagesStats: s, ctx } = params
  return `
${serializeContext(ctx)}

TAGES-STATISTIKEN:
- Todos: ${s.erledigteTodos}/${s.alleTodos} erledigt
- Focus-Sessions: ${s.sessions.length} Sessions
${s.sessions.map((x) => `  · "${x.aufgabe}" (${x.dauerMinuten}min, ${x.abgeschlossen ? '✓' : 'abgebrochen'})`).join('\n')}
${s.lernplanGesamt > 0 ? `- Lernplan (${s.klausurFach}): ${s.lernplanErledigt}/${s.lernplanGesamt} Tasks` : ''}

USER FREITEXT:
"${freitext}"

Aufgabe: Analysiere den Freitext im Kontext der Tages-Statistiken.
Generiere 1-2 gezielte Nachfragen.

REGELN für Nachfragen:
- Nicht generisch ("Wie war dein Tag?" ist verboten)
- Immer konkret auf die Daten bezogen
- Wenn Lernplan-Lücke: frage danach
- Wenn Sessions sehr kurz oder abgebrochen: frage nach Ablenkungen
- Wenn Freitext positiv aber Stats schlecht: hinterfrage sanft
- Wenn alles gut und Stats gut: nur 1 kurze Frage nach dem Morgen

Antworte NUR als JSON:
{
  "nachfragen": [
    { "id": "nf1", "frage": "..." },
    { "id": "nf2", "frage": "..." }
  ]
}
`.trim()
}

export function buildEveningFeedbackPrompt(params: {
  freitext: string
  nachfragenAntworten: { frage: string; antwort: string }[]
  tagesStats: object
  ctx: UserContext
}): string {
  const { freitext, nachfragenAntworten, ctx } = params
  return `
${serializeContext(ctx)}

REFLEXION DES USERS:
Freitext: "${freitext}"

Nachfragen und Antworten:
${nachfragenAntworten.map((na) => `Frage: ${na.frage}\nAntwort: "${na.antwort}"`).join('\n\n')}

Aufgabe: Gib eine abschließende Rückmeldung zum Tag.

REGELN:
- 3-4 Sätze maximum
- Sachlich aber nicht kalt — du bist ein Mentor, kein Buchhalter
- Benenne klar was gut war und was morgen anders sein könnte
- Kein "Morgen wird besser!" — konkrete Empfehlung stattdessen
- Wenn der User frustriert klingt: stoische Perspektive anbieten (kurz)
- Letzter Satz: ruhig, abschließend — der Tag ist vorbei

DANACH — extrahiere einen Morgen-Hinweis als separaten JSON-Block.
Schreibe nach deiner Antwort exakt diesen Block (kein Markdown, direkt):
MORNING_HINT:{"text":"Ein konkreter Satz was morgen früh wichtig ist. Max. 15 Wörter."}
Wenn kein spezifischer Hinweis nötig ist: MORNING_HINT:{"text":null}

Format: Fließtext auf Deutsch, dann MORNING_HINT JSON.
`.trim()
}
