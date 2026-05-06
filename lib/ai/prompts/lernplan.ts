export function buildLernplanPrompt(params: {
  fach: string
  thema: string
  klausurDatum: string
  heuteDatum: string
  tageVerfuegbar: number
}): string {
  return `
Du bist ein präziser Lernplaner. Erstelle einen progressiven Lernplan.

Fach: ${params.fach}
Thema: ${params.thema || '(kein spezifisches Thema angegeben)'}
Klausurdatum: ${params.klausurDatum}
Heute: ${params.heuteDatum}
Verfügbare Werktage: ${params.tageVerfuegbar}

REGELN:
- Maximal 3 Microtasks pro Tag.
- Tasks werden progressiv schwerer: Verstehen → Üben → Wiederholen → Testen.
- Letzter Tag vor Klausur: nur Wiederholung, kein neuer Stoff.
- Keine Wochenenden einplanen.
- Tasks sind konkret und umsetzbar (max. 8 Wörter).

Antworte NUR als valides JSON ohne Kommentar davor oder danach:
{
  "tage": [
    {
      "datum": "YYYY-MM-DD",
      "tasks": [
        {"text": "...", "done": false}
      ]
    }
  ]
}
`.trim()
}

export function getWerktage(von: Date, bis: Date): number {
  let count = 0
  const current = new Date(von)
  current.setHours(0, 0, 0, 0)
  const end = new Date(bis)
  end.setHours(0, 0, 0, 0)

  while (current < end) {
    current.setDate(current.getDate() + 1)
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}
