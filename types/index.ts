export interface Profile {
  id: string
  display_name: string | null
  klasse: string | null
  schule: string | null
  timezone: string
  onboarding_done: boolean
  morning_briefing_done_today: boolean
  evening_briefing_done_today: boolean
  last_briefing_date: string | null
  created_at: string
}

export interface Klausur {
  id: string
  user_id: string
  fach: string
  thema: string | null
  datum: string
  note: number | null
  note_ziel: number | null
  gewichtung: number
  lernplan: LernplanTag[] | null
  lernplan_generiert: boolean
  created_at: string
}

export interface LernplanTag {
  datum: string
  tasks: LernplanTask[]
}

export interface LernplanTask {
  text: string
  done: boolean
}

export interface Fach {
  id: string
  user_id: string
  name: string
  farbe: string
  aktiv: boolean
  created_at: string
}

export interface FocusSession {
  id: string
  user_id: string
  aufgabe: string
  kategorie: 'Lernen' | 'Projekt' | 'Kreativ' | 'Admin' | 'Sonstiges'
  dauer_minuten: number
  abgeschlossen: boolean
  abgebrochen: boolean
  notiz: string | null
  gestartet_at: string
  beendet_at: string | null
}

export interface Todo {
  id: string
  user_id: string
  text: string
  fertig: boolean
  prioritaet: 1 | 2 | 3
  faellig_am: string | null
  kategorie: string | null
  klausur_id: string | null
  lernplan_datum: string | null
  sort_order: number
  erstellt_at: string
  quelle: 'manual' | 'morning_briefing' | 'lernplan' | 'evening_gedanke'
}

export interface BriefingTask {
  text: string
  prioritaet: 1 | 2 | 3
}

export interface BriefingNachfrage {
  frage: string
  antwort: string
}

export interface Briefing {
  id: string
  user_id: string
  typ: 'morning' | 'evening'
  datum: string
  inhalt: string | null
  kontext_snapshot: unknown
  erstellt_at: string
  // Phase 5: Morning fields
  intention: string | null
  nicht_tun: string | null
  energie: number | null
  vorgeschlagene_tasks: BriefingTask[] | null
  bestaetigte_tasks: BriefingTask[] | null
  // Phase 5: Evening fields
  freitext: string | null
  nachfragen: BriefingNachfrage[] | null
  ki_feedback: string | null
  morgen_hinweis: string | null
  tages_stats: unknown | null
}
