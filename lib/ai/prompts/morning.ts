import type { UserContext } from '@/lib/ai/context'
import { serializeContext } from '@/lib/ai/context'

export function buildMorningPrompt(params: {
  ctx: UserContext
  intention: string
  nichtTun: string
  energie: number
  gestrigeSummary: string | null
}): string {
  const { ctx, intention, nichtTun, energie, gestrigeSummary } = params

  const taskAnzahl =
    energie <= 2
      ? '2-3'
      : ctx.heute.naechsteKlausuren.some((k) => k.tageNoch <= 1)
      ? '2'
      : '3-4'

  return `
${serializeContext(ctx)}

USER INPUT HEUTE MORGEN:
- Intention: "${intention}"
- Bewusst NICHT: "${nichtTun}"
- Energie-Level: ${energie}/5
${gestrigeSummary ? `\nHinweis vom gestrigen Abend: "${gestrigeSummary}"` : ''}

Aufgabe: Erstelle das Morning Briefing.

BRIEFING (2-3 Sätze):
- Starte mit einem direkten Bezug auf die heutige Intention — nicht auf das Datum
- Wenn es einen gestrigen Abend-Hinweis gibt: baue ihn organisch ein
- Jarvis-Ton: präzise, kein Lob, keine Floskeln
- Wenn Klausur in ≤ 3 Tagen: erwähne sie konkret

TASKS (${taskAnzahl} Stück):
- Basiere sie auf der Intention, offenen Lernplan-Tasks und der Energie
- Energie 1-2: weniger Tasks, einfacher formuliert
- Energie 4-5: anspruchsvoller, mehr Tasks möglich
- Klausur heute oder morgen: mindestens 1 Lernplan-Task dabei
- Format: konkret, max. 8 Wörter, Verb am Anfang
- Priorität 1 = heute zwingend, 2 = heute idealerweise, 3 = wenn Zeit bleibt

Antworte NUR als JSON:
{
  "briefingText": "...",
  "tasks": [
    { "text": "...", "prioritaet": 1 },
    { "text": "...", "prioritaet": 2 }
  ]
}
`.trim()
}
