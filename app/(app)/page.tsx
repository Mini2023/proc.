'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { pageVariants, staggerContainer, staggerItem } from '@/lib/animations'
import { createClient } from '@/lib/supabase/client'
import { SkeletonLine, SkeletonBlock } from '@/components/proc/Skeleton'
import type { Klausur, Briefing } from '@/types'

// ── Stoic quotes ──────────────────────────────────────────────────────────────

const STOIC_QUOTES = [
  { text: 'Verschwende keine Zeit damit zu argumentieren, was ein guter Mensch sein sollte. Sei einer.', author: 'Marc Aurel' },
  { text: 'Du hast Macht über deinen Geist, nicht über äußere Ereignisse. Erkenne das, und du wirst Stärke finden.', author: 'Marc Aurel' },
  { text: 'Wenn es dir schwer fällt aufzuwachen, denke daran: Ich stehe auf, um die Arbeit eines Menschen zu tun.', author: 'Marc Aurel' },
  { text: 'Das Glück liegt in dir selbst — es sei denn, du erlaubst Äußerem, es zu zerstören.', author: 'Marc Aurel' },
  { text: 'Verlust ist nichts anderes als Veränderung, und Veränderung ist Natur.', author: 'Marc Aurel' },
  { text: 'Handele so, als wäre jeder Moment deines Lebens der letzte.', author: 'Marc Aurel' },
  { text: 'Wir leiden mehr in der Vorstellung als in der Realität.', author: 'Seneca' },
  { text: 'Es ist nicht die Menge der Zeit, die zählt, sondern was du mit ihr machst.', author: 'Seneca' },
  { text: 'Lerne, dich zu begnügen. Das ist der reichste Schatz.', author: 'Seneca' },
  { text: 'Der Mensch leidet viel mehr unter dem, was er sich einbildet, als unter dem, was wirklich ist.', author: 'Seneca' },
  { text: 'Beile dich langsam.', author: 'Seneca' },
  { text: 'Nutze die Zeit. Sie läuft, ohne zurückzublicken.', author: 'Seneca' },
  { text: 'Suche nicht, dass die Dinge nach deinem Wunsch sich fügen — wünsche, dass sie sind, wie sie sind.', author: 'Epiktet' },
  { text: 'Die Menschen werden nicht durch Dinge beunruhigt, sondern durch ihre Urteile darüber.', author: 'Epiktet' },
  { text: 'Kein Mensch kann dir deinen Charakter nehmen.', author: 'Epiktet' },
  { text: 'Disziplin ist das Fundament, auf dem alle Tugenden aufgebaut sind.', author: 'Marc Aurel' },
  { text: 'Das erste Gebot: Lass dich nicht in Panik versetzen.', author: 'Epiktet' },
  { text: 'Fang an. Der Rest folgt von selbst.', author: 'Seneca' },
  { text: 'Was du heute aufverschiebst, wirst du morgen nicht weniger fürchten.', author: 'Seneca' },
  { text: 'Nicht was dir passiert bestimmt dein Leben, sondern wie du darauf reagierst.', author: 'Epiktet' },
]

// ── Module system ─────────────────────────────────────────────────────────────

type ModuleId = 'jarvis' | 'todos3days' | 'focuschart' | 'stoic' | 'quickactions'

const MODULE_CONFIG: { id: ModuleId; label: string; description: string }[] = [
  { id: 'jarvis',       label: 'J.A.R.V.I.S.',       description: 'Morgenbriefing-Vorschau' },
  { id: 'todos3days',   label: 'Todos & 3-Tage-Plan', description: 'Tagesplan & Ausblick' },
  { id: 'focuschart',   label: 'Fokus-Chart',          description: '7-Tage-Übersicht' },
  { id: 'stoic',        label: 'Gedanke des Tages',    description: 'Stoisches Zitat' },
  { id: 'quickactions', label: 'Schnellaktionen',      description: 'Direktlinks' },
]

const STORAGE_KEY = 'proc_dashboard_modules'

function loadModulePrefs(): Record<ModuleId, boolean> {
  if (typeof window === 'undefined') return defaultPrefs()
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // fill any new modules with true
      return Object.fromEntries(
        MODULE_CONFIG.map(({ id }) => [id, parsed[id] ?? true])
      ) as Record<ModuleId, boolean>
    }
  } catch {}
  return defaultPrefs()
}

function defaultPrefs(): Record<ModuleId, boolean> {
  return Object.fromEntries(MODULE_CONFIG.map(({ id }) => [id, true])) as Record<ModuleId, boolean>
}

function saveModulePrefs(prefs: Record<ModuleId, boolean>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)) } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function getDaysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

function formatDate() {
  return new Date().toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

interface WeekDay { label: string; minutes: number; isToday: boolean }
interface Next3Day { label: string; dateStr: string; isToday: boolean; klausuren: string[]; lernplanTasks: number }

// ── Module Settings Panel ─────────────────────────────────────────────────────

function ModuleSettingsPanel({
  prefs,
  onChange,
  onClose,
}: {
  prefs: Record<ModuleId, boolean>
  onChange: (id: ModuleId, value: boolean) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.9)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        borderRadius: '14px',
        padding: '16px',
        width: '240px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.9) inset',
      }}
    >
      <p
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          letterSpacing: '0.10em',
          color: 'rgba(10,10,15,0.40)',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}
      >
        Dashboard Module
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {MODULE_CONFIG.map(({ id, label, description }) => (
          <button
            key={id}
            onClick={() => onChange(id, !prefs[id])}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '9px 10px',
              background: prefs[id] ? 'var(--accent-soft)' : 'transparent',
              border: '1px solid',
              borderColor: prefs[id] ? 'var(--accent-border)' : 'transparent',
              borderRadius: '9px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 150ms',
            }}
          >
            {/* Toggle pill */}
            <div
              style={{
                width: '28px',
                height: '16px',
                borderRadius: '8px',
                background: prefs[id] ? 'var(--accent-proc)' : 'rgba(0,0,0,0.12)',
                flexShrink: 0,
                position: 'relative',
                transition: 'background 200ms',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: prefs[id] ? '14px' : '2px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 200ms cubic-bezier(0.16,1,0.3,1)',
                }}
              />
            </div>
            <div>
              <p
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: prefs[id] ? 'var(--text-100)' : 'var(--text-55)',
                  lineHeight: 1.2,
                  marginBottom: '1px',
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '10px',
                  color: 'rgba(10,10,15,0.35)',
                  letterSpacing: '0.02em',
                }}
              >
                {description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState<string | null>(null)
  const [naechsteKlausur, setNaechsteKlausur] = useState<Klausur | null>(null)
  const [morningBriefing, setMorningBriefing] = useState<Briefing | null>(null)
  const [eveningDone, setEveningDone] = useState(false)
  const [todayTodos, setTodayTodos] = useState({ total: 0, done: 0 })
  const [todayPomodoros, setTodayPomodoros] = useState({ count: 0, minutes: 0 })
  const [weekData, setWeekData] = useState<WeekDay[]>([])
  const [next3Days, setNext3Days] = useState<Next3Day[]>([])
  const [modulePrefs, setModulePrefs] = useState<Record<ModuleId, boolean>>(defaultPrefs)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const stoicQuote = STOIC_QUOTES[getDayOfYear() % STOIC_QUOTES.length]

  // Load module prefs from localStorage (client only)
  useEffect(() => {
    setModulePrefs(loadModulePrefs())
  }, [])

  function toggleModule(id: ModuleId, value: boolean) {
    setModulePrefs((prev) => {
      const next = { ...prev, [id]: value }
      saveModulePrefs(next)
      return next
    })
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const today = new Date().toISOString().split('T')[0]
      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const [profileRes, klausurenRes, briefingRes, todoRes, sessionTodayRes, sessionWeekRes] =
        await Promise.all([
          supabase.from('profiles').select('display_name').eq('id', user.id).single(),
          supabase.from('klausuren').select('fach, datum, lernplan').gte('datum', today).order('datum', { ascending: true }),
          supabase.from('briefings').select('*').eq('user_id', user.id).eq('datum', today),
          supabase.from('todos').select('fertig').or(`kategorie.eq.heute,faellig_am.eq.${today}`),
          supabase.from('focus_sessions').select('dauer_minuten').gte('gestartet_at', `${today}T00:00:00`).eq('abgeschlossen', true),
          supabase.from('focus_sessions').select('gestartet_at, dauer_minuten').gte('gestartet_at', `${sevenDaysAgo}T00:00:00`).eq('abgeschlossen', true),
        ])

      const rawName = profileRes.data?.display_name || null
      setName(rawName ? rawName.trim().replace(/\\/g, '') : null)

      // Klausuren → next klausur + 3-day view
      const klausuren = (klausurenRes.data || []) as { fach: string; datum: string; lernplan?: { datum: string; tasks: { done: boolean }[] }[] }[]
      if (klausuren.length > 0) setNaechsteKlausur(klausuren[0] as unknown as Klausur)

      const days3: Next3Day[] = []
      for (let i = 0; i < 3; i++) {
        const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000)
        const dateStr = d.toISOString().split('T')[0]
        const label = i === 0 ? 'Heute' : i === 1 ? 'Morgen' : d.toLocaleDateString('de-DE', { weekday: 'short' })
        const klausurenOnDay = klausuren.filter((k) => k.datum === dateStr).map((k) => k.fach)
        let lernplanTasks = 0
        klausuren.forEach((k) => {
          if (k.lernplan) {
            const dayPlan = k.lernplan.find((p) => p.datum === dateStr)
            if (dayPlan) lernplanTasks += dayPlan.tasks.filter((t) => !t.done).length
          }
        })
        days3.push({ label, dateStr, isToday: i === 0, klausuren: klausurenOnDay, lernplanTasks })
      }
      setNext3Days(days3)

      // Briefings
      if (briefingRes.data) {
        const morning = (briefingRes.data as unknown as Briefing[]).find((b) => b.typ === 'morning') || null
        setMorningBriefing(morning)
        setEveningDone(briefingRes.data.some((b: { typ: string }) => b.typ === 'evening'))
      }

      // Todos
      if (todoRes.data) {
        setTodayTodos({
          total: todoRes.data.length,
          done: todoRes.data.filter((t: { fertig: boolean }) => t.fertig).length,
        })
      }

      // Today sessions
      if (sessionTodayRes.data) {
        setTodayPomodoros({
          count: sessionTodayRes.data.length,
          minutes: sessionTodayRes.data.reduce((sum: number, s: { dauer_minuten: number }) => sum + s.dauer_minuten, 0),
        })
      }

      // 7-day chart
      if (sessionWeekRes.data) {
        const byDay: Record<string, number> = {}
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          byDay[d.toISOString().split('T')[0]] = 0
        }
        sessionWeekRes.data.forEach((s: { gestartet_at: string; dauer_minuten: number }) => {
          const day = s.gestartet_at.split('T')[0]
          if (byDay[day] !== undefined) byDay[day] += s.dauer_minuten
        })
        setWeekData(
          Object.entries(byDay).map(([date, minutes]) => ({
            label: DAY_LABELS[new Date(date + 'T12:00:00').getDay()],
            minutes,
            isToday: date === today,
          }))
        )
      }

      setLoading(false)
    }
    load()
  }, [])

  const maxWeekMinutes = Math.max(...(weekData.length > 0 ? weekData.map((d) => d.minutes) : [0]), 60)

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '44px',
        }}
      >
        <span
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--accent-proc)',
          }}
        >
          p.<span style={{ color: 'var(--text-30)' }}>roc. 2.0</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="text-caption hide-mobile">{formatDate()}</span>
          {/* Settings link — mobile only */}
          <Link
            href="/settings"
            className="show-mobile"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: '1px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-30)',
              transition: 'all 150ms',
              textDecoration: 'none',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="2.2" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M7.5 1v1.5M7.5 12.5V14M14 7.5h-1.5M2.5 7.5H1M11.7 3.3l-1.06 1.06M4.36 10.64l-1.06 1.06M11.7 11.7l-1.06-1.06M4.36 4.36L3.3 3.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </Link>
          {/* Module settings trigger */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              title="Dashboard anpassen"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                border: settingsOpen ? '1px solid var(--accent-border)' : '1px solid transparent',
                background: settingsOpen ? 'var(--accent-soft)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms',
                color: settingsOpen ? 'var(--accent-text)' : 'var(--text-30)',
              }}
              onMouseEnter={(e) => {
                if (!settingsOpen) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-55)'
                }
              }}
              onMouseLeave={(e) => {
                if (!settingsOpen) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)'
                }
              }}
            >
              {/* Sliders icon */}
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect x="1" y="3.5" width="9" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="11" y="3.5" width="3" height="1.5" rx="0.75" fill="currentColor"/>
                <circle cx="10" cy="4.25" r="1.75" fill="none" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="1" y="10" width="3" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="5" y="10" width="9" height="1.5" rx="0.75" fill="currentColor"/>
                <circle cx="5" cy="10.75" r="1.75" fill="none" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <ModuleSettingsPanel
                  prefs={modulePrefs}
                  onChange={toggleModule}
                  onClose={() => setSettingsOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Greeting ──────────────────────────────────────────────────────────── */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{ marginBottom: '36px' }}
      >
        <motion.h1 variants={staggerItem} className="text-headline">
          {getGreeting()}{name ? `, ${name}` : ''}.
        </motion.h1>
        <motion.p variants={staggerItem} className="text-section-label" style={{ marginTop: '6px' }}>
          {formatDate()}
        </motion.p>
      </motion.div>

      {/* ── Row 1: Status Widgets (always visible) ────────────────────────────── */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="dashboard-grid"
        style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}
      >
        {/* Briefing Widget */}
        <motion.div
          variants={staggerItem}
          className="glass-card"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{ padding: '20px 24px', minHeight: '140px', cursor: 'default' }}
        >
          <p className="text-section-label" style={{ marginBottom: '14px' }}>Briefing</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                background: morningBriefing ? 'var(--positive)' : 'rgba(0,0,0,0.12)',
                boxShadow: morningBriefing ? '0 0 6px rgba(22,163,74,0.4)' : 'none',
                transition: 'all 300ms',
              }} />
              <span style={{
                fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 500,
                color: morningBriefing ? 'var(--text-100)' : 'var(--text-55)',
              }}>
                Morgen {morningBriefing ? '✓' : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                background: eveningDone ? 'var(--positive)' : 'rgba(0,0,0,0.12)',
                boxShadow: eveningDone ? '0 0 6px rgba(22,163,74,0.4)' : 'none',
                transition: 'all 300ms',
              }} />
              <span style={{
                fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 500,
                color: eveningDone ? 'var(--positive)' : 'var(--text-55)',
              }}>
                Abend {eveningDone ? '✓' : '—'}
              </span>
            </div>
          </div>
          {!morningBriefing && (
            <Link href="/briefing" style={{
              fontFamily: 'DM Mono, monospace', fontSize: '11px',
              color: 'var(--accent-text)', textDecoration: 'none', letterSpacing: '0.06em',
            }}>
              Jetzt starten →
            </Link>
          )}
        </motion.div>

        {/* Nächste Klausur Widget */}
        <motion.div
          variants={staggerItem}
          className="glass-card"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{ padding: '20px 24px', minHeight: '140px', cursor: 'default' }}
        >
          <p className="text-section-label" style={{ marginBottom: '14px' }}>Nächste Klausur</p>
          {loading ? (
            <>
              <SkeletonLine width="60%" height={10} style={{ marginBottom: '10px' }} />
              <SkeletonLine width="35%" height={28} style={{ marginBottom: '6px' }} />
              <SkeletonLine width="45%" height={10} />
            </>
          ) : naechsteKlausur ? (
            <>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600, color: 'var(--text-100)', marginBottom: '6px' }}>
                {naechsteKlausur.fach}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'DM Mono, monospace', fontSize: '36px', fontWeight: 300,
                  letterSpacing: '-0.04em', color: 'var(--accent-proc)', lineHeight: 1,
                }}>
                  {getDaysUntil(naechsteKlausur.datum)}
                </span>
                <span className="text-caption">
                  {getDaysUntil(naechsteKlausur.datum) === 1 ? 'Tag' : 'Tage'}
                </span>
                {getDaysUntil(naechsteKlausur.datum) <= 3 && (
                  <motion.span
                    animate={{ opacity: [1, 0.45, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.10em',
                      color: getDaysUntil(naechsteKlausur.datum) <= 1 ? 'var(--danger)' : 'var(--warning)',
                      padding: '2px 7px', borderRadius: '4px',
                      background: getDaysUntil(naechsteKlausur.datum) <= 1 ? 'rgba(220,38,38,0.08)' : 'rgba(217,119,6,0.08)',
                      border: `1px solid ${getDaysUntil(naechsteKlausur.datum) <= 1 ? 'rgba(220,38,38,0.18)' : 'rgba(217,119,6,0.18)'}`,
                    }}
                  >
                    BALD
                  </motion.span>
                )}
              </div>
              <p className="text-caption" style={{ marginTop: '4px' }}>
                {new Date(naechsteKlausur.datum).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
              </p>
            </>
          ) : (
            <>
              <p style={{ color: 'var(--text-55)', fontFamily: 'Syne, sans-serif', fontSize: '14px', marginBottom: '12px' }}>
                Keine anstehend
              </p>
              <Link href="/klausuren" style={{
                fontFamily: 'DM Mono, monospace', fontSize: '11px',
                color: 'var(--accent-text)', textDecoration: 'none', letterSpacing: '0.06em',
              }}>
                Eintragen →
              </Link>
            </>
          )}
        </motion.div>

        {/* Fokus Widget */}
        <motion.div
          variants={staggerItem}
          className="glass-card"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{ padding: '20px 24px', minHeight: '140px', cursor: 'default' }}
        >
          <p className="text-section-label" style={{ marginBottom: '14px' }}>Heute</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontFamily: 'DM Mono, monospace', fontSize: '36px', fontWeight: 300,
              letterSpacing: '-0.04em', color: 'var(--text-100)', lineHeight: 1,
            }}>
              {todayPomodoros.count}
            </span>
            <span className="text-caption">
              Pomodoro{todayPomodoros.count !== 1 ? 's' : ''} · {todayPomodoros.minutes} min
            </span>
          </div>
          {todayTodos.total > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span className="text-caption">{todayTodos.done}/{todayTodos.total} Todos</span>
              </div>
              <div style={{ height: '3px', background: 'var(--border-0)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(todayTodos.done / todayTodos.total) * 100}%`,
                  background: todayTodos.done === todayTodos.total ? 'var(--positive)' : 'var(--accent-proc)',
                  borderRadius: '2px',
                  transition: 'width 600ms ease',
                }} />
              </div>
            </div>
          )}
          <Link href="/focus" style={{
            display: 'inline-block', marginTop: '12px',
            fontFamily: 'DM Mono, monospace', fontSize: '11px',
            color: 'var(--accent-text)', textDecoration: 'none', letterSpacing: '0.06em',
          }}>
            Fokus starten →
          </Link>
        </motion.div>
      </motion.div>

      {/* ── Row 2: Jarvis Preview ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {modulePrefs.jarvis && !loading && morningBriefing?.inhalt && (
          <motion.div
            key="jarvis"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card"
            style={{ padding: '20px 24px', marginBottom: '20px', borderLeft: '3px solid var(--accent-proc)' }}
          >
            <p className="text-section-label" style={{ marginBottom: '10px' }}>J.A.R.V.I.S.</p>
            <p style={{
              fontFamily: 'Syne, sans-serif', fontSize: '14px', color: 'var(--text-80)',
              lineHeight: 1.7, overflow: 'hidden', maxHeight: 'calc(1.7em * 3)',
            }}>
              {morningBriefing.inhalt}
            </p>
            <Link href="/briefing" style={{
              display: 'inline-block', marginTop: '10px',
              fontFamily: 'DM Mono, monospace', fontSize: '11px',
              color: 'var(--accent-text)', textDecoration: 'none', letterSpacing: '0.06em',
            }}>
              Vollständig lesen →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Row 3: Todos + Nächste 3 Tage ────────────────────────────────────── */}
      <AnimatePresence>
        {modulePrefs.todos3days && (
          <motion.div
            key="todos3days"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', marginBottom: '20px' }}
          >
            {/* Todos heute */}
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <p className="text-section-label">Todos heute</p>
                <Link
                  href="/todos"
                  style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text-30)', textDecoration: 'none', letterSpacing: '0.06em' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent-text)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-30)')}
                >
                  Alle →
                </Link>
              </div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <SkeletonLine width="80%" height={10} />
                  <SkeletonLine width="60%" height={10} />
                  <SkeletonLine width="70%" height={10} />
                </div>
              ) : todayTodos.total === 0 ? (
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--text-30)', letterSpacing: '0.04em' }}>
                  Keine Todos für heute
                </p>
              ) : (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text-30)' }}>Fortschritt</span>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text-55)' }}>{todayTodos.done}/{todayTodos.total}</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--border-0)', borderRadius: '2px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(todayTodos.done / todayTodos.total) * 100}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          height: '100%',
                          background: todayTodos.done === todayTodos.total ? 'var(--positive)' : 'var(--accent-proc)',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                  <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '0.04em', color: todayTodos.done === todayTodos.total ? 'var(--positive)' : 'var(--text-55)' }}>
                    {todayTodos.done === todayTodos.total ? '✓ Alle Todos erledigt' : `${todayTodos.total - todayTodos.done} offen`}
                  </p>
                </>
              )}
            </div>

            {/* Nächste 3 Tage */}
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              <p className="text-section-label" style={{ marginBottom: '14px' }}>Nächste 3 Tage</p>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <SkeletonLine width="90%" height={10} />
                  <SkeletonLine width="70%" height={10} />
                  <SkeletonLine width="80%" height={10} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {next3Days.map((day) => (
                    <div key={day.dateStr} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{
                        fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.06em',
                        color: day.isToday ? 'var(--accent-text)' : 'var(--text-30)',
                        width: '38px', flexShrink: 0, paddingTop: '1px',
                        fontWeight: day.isToday ? 500 : 400,
                      }}>
                        {day.label.toUpperCase()}
                      </span>
                      <div style={{ flex: 1 }}>
                        {day.klausuren.length === 0 && day.lernplanTasks === 0 ? (
                          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text-30)' }}>—</span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {day.klausuren.map((fach) => (
                              <span key={fach} style={{
                                fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.04em',
                                background: 'var(--accent-soft)', color: 'var(--accent-text)',
                                padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--accent-border)',
                              }}>
                                {fach}
                              </span>
                            ))}
                            {day.lernplanTasks > 0 && (
                              <span style={{
                                fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.04em',
                                background: 'rgba(0,0,0,0.04)', color: 'var(--text-55)',
                                padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-0)',
                              }}>
                                {day.lernplanTasks} LP
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Row 4: 7-day focus bar chart ─────────────────────────────────────── */}
      <AnimatePresence>
        {modulePrefs.focuschart && (
          <motion.div
            key="focuschart"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card"
            style={{ padding: '20px 24px', marginBottom: '20px' }}
          >
            <p className="text-section-label" style={{ marginBottom: '16px' }}>Fokus — 7 Tage</p>
            {loading ? (
              <div style={{ height: '72px', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                {[40, 65, 30, 80, 55, 20, 70].map((h, i) => (
                  <SkeletonBlock key={i} height={Math.round((h / 100) * 52)} style={{ flex: 1, borderRadius: '3px' }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '72px' }}>
                {weekData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      width: '100%',
                      height: `${d.minutes > 0 ? Math.max((d.minutes / maxWeekMinutes) * 52, 4) : 2}px`,
                      background: d.isToday ? 'var(--accent-proc)' : d.minutes > 0 ? 'rgba(45,79,215,0.30)' : 'var(--border-0)',
                      borderRadius: '3px 3px 2px 2px',
                      transition: 'height 600ms ease',
                    }} />
                    <span style={{
                      fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.04em',
                      color: d.isToday ? 'var(--accent-text)' : 'var(--text-30)',
                      fontWeight: d.isToday ? 500 : 400,
                    }}>
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Row 5: Daily Stoic Quote ──────────────────────────────────────────── */}
      <AnimatePresence>
        {modulePrefs.stoic && (
          <motion.div
            key="stoic"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card"
            style={{ padding: '20px 24px', marginBottom: '20px' }}
          >
            <p className="text-section-label" style={{ marginBottom: '10px' }}>Gedanke des Tages</p>
            <p style={{
              fontFamily: 'Syne, sans-serif', fontSize: '14px', fontStyle: 'italic',
              color: 'var(--text-80)', lineHeight: 1.7, marginBottom: '8px',
            }}>
              „{stoicQuote.text}"
            </p>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text-30)', letterSpacing: '0.04em' }}>
              — {stoicQuote.author}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Row 6: Quick Actions ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {modulePrefs.quickactions && (
          <motion.div
            key="quickactions"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="quick-actions-grid"
            style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
          >
            {!morningBriefing && (
              <Link href="/briefing" style={{
                padding: '11px 20px',
                background: 'linear-gradient(135deg, #3251e8 0%, #2640c8 100%)',
                color: '#fff', borderRadius: '10px',
                fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600,
                textDecoration: 'none', letterSpacing: '-0.01em',
                boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 12px rgba(45,79,215,0.35)',
                transition: 'all 150ms cubic-bezier(0.16,1,0.3,1)', userSelect: 'none',
              }}>
                Briefing starten →
              </Link>
            )}
            {[
              { href: '/focus', label: 'Pomodoro starten' },
              { href: '/klausuren', label: 'Klausur eintragen' },
              { href: '/todos', label: 'Todos →' },
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{
                padding: '11px 20px',
                background: 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: 'var(--text-80)', borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.08)',
                borderTop: '1px solid rgba(255,255,255,0.9)',
                fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 500,
                textDecoration: 'none', letterSpacing: '-0.01em',
                boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 150ms cubic-bezier(0.16,1,0.3,1)', userSelect: 'none',
              }}>
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
