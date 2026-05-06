'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatRow } from './StatRow'
import type { Briefing } from '@/types'

type EveningStep =
  | 'loading'
  | 'stats'
  | 'freitext'
  | 'analysing'
  | 'nachfragen'
  | 'analysing2'
  | 'feedback'
  | 'done'

interface TagesStats {
  erledigteTodos: number
  alleTodos: number
  sessions: { aufgabe: string; dauerMinuten: number; abgeschlossen: boolean; kategorie: string }[]
  lernplanErledigt: number
  lernplanGesamt: number
  klausurFach: string | null
  gesamtMinuten: number
}

interface Nachfrage {
  id: string
  frage: string
}

function JarvisLoader({ label = 'Analysiere deinen Tag...' }: { label?: string }) {
  return (
    <div style={{ padding: '16px 0 20px' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
          style={{
            height: '1px',
            width: i === 0 ? '48px' : i === 1 ? '32px' : '40px',
            background: 'var(--accent-proc)',
            marginBottom: '6px',
          }}
        />
      ))}
      <p
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.08em',
          color: 'var(--text-30)',
          marginTop: '8px',
        }}
      >
        {label}
      </p>
    </div>
  )
}

function generateAlgorithmFeedback(stats: TagesStats): string {
  const { erledigteTodos, alleTodos, gesamtMinuten, sessions, lernplanErledigt, lernplanGesamt, klausurFach } = stats
  const parts: string[] = []

  if (alleTodos > 0) {
    parts.push(`${erledigteTodos} von ${alleTodos} Todo${alleTodos !== 1 ? 's' : ''} erledigt.`)
  }
  if (gesamtMinuten > 0) {
    parts.push(`${gesamtMinuten} Minuten fokussiert gearbeitet${sessions.length > 1 ? ` (${sessions.length} Sessions)` : ''}.`)
  } else {
    parts.push('Heute keine Focus-Sessions.')
  }
  if (lernplanGesamt > 0 && klausurFach) {
    parts.push(`Lernplan ${klausurFach}: ${lernplanErledigt}/${lernplanGesamt} Tasks erledigt.`)
  }

  const productive = erledigteTodos > 0 || gesamtMinuten >= 30
  parts.push(productive ? 'Guter Tag.' : 'Morgen ist eine neue Chance.')

  return parts.join(' ')
}

interface EveningRitualProps {
  onComplete: (briefing: Partial<Briefing>) => void
}

export function EveningRitual({ onComplete }: EveningRitualProps) {
  const [step, setStep] = useState<EveningStep>('loading')
  const [stats, setStats] = useState<TagesStats | null>(null)
  const [freitext, setFreitext] = useState('')
  const [nachfragen, setNachfragen] = useState<Nachfrage[]>([])
  const [nachfragenAntworten, setNachfragenAntworten] = useState<Record<string, string>>({})
  const [feedbackText, setFeedbackText] = useState('')
  const [displayText, setDisplayText] = useState('')
  const [morgenHinweis, setMorgenHinweis] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const freitextRef = useRef<HTMLTextAreaElement>(null)

  // Load today's stats on mount
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]

      const [todoRes, sessionRes, lernplanRes] = await Promise.all([
        supabase
          .from('todos')
          .select('fertig, kategorie, faellig_am')
          .or(`kategorie.eq.heute,faellig_am.eq.${today}`),
        supabase
          .from('focus_sessions')
          .select('aufgabe, kategorie, dauer_minuten, abgeschlossen')
          .gte('gestartet_at', `${today}T00:00:00`),
        supabase
          .from('todos')
          .select('fertig, klausur_id')
          .eq('lernplan_datum', today),
      ])

      const todos = todoRes.data || []
      const sessions = (sessionRes.data || []) as {
        aufgabe: string
        kategorie: string
        dauer_minuten: number
        abgeschlossen: boolean
      }[]
      const lernplanTodos = lernplanRes.data || []

      // Find klausur fach for lernplan
      let klausurFach: string | null = null
      if (lernplanTodos.length > 0 && lernplanTodos[0]?.klausur_id) {
        const { data: klausur } = await supabase
          .from('klausuren')
          .select('fach')
          .eq('id', lernplanTodos[0].klausur_id)
          .single()
        klausurFach = klausur?.fach || null
      }

      setStats({
        erledigteTodos: todos.filter((t: { fertig: boolean }) => t.fertig).length,
        alleTodos: todos.length,
        sessions: sessions.map((s) => ({
          aufgabe: s.aufgabe,
          kategorie: s.kategorie,
          dauerMinuten: s.dauer_minuten,
          abgeschlossen: s.abgeschlossen,
        })),
        gesamtMinuten: sessions.reduce((sum, s) => sum + s.dauer_minuten, 0),
        lernplanErledigt: lernplanTodos.filter((t: { fertig: boolean }) => t.fertig).length,
        lernplanGesamt: lernplanTodos.length,
        klausurFach,
      })
      setStep('stats')
    }
    load()
  }, [])

  // Auto-focus freitext when step changes
  useEffect(() => {
    if (step === 'freitext') setTimeout(() => freitextRef.current?.focus(), 300)
  }, [step])

  // Parse MORNING_HINT from streaming feedback
  useEffect(() => {
    const marker = 'MORNING_HINT:'
    const idx = feedbackText.indexOf(marker)
    if (idx >= 0) {
      setDisplayText(feedbackText.slice(0, idx).trim())
      try {
        const jsonStr = feedbackText.slice(idx + marker.length).trim()
        const parsed = JSON.parse(jsonStr)
        if (parsed.text !== undefined) setMorgenHinweis(parsed.text)
      } catch {
        // Still streaming, JSON not complete yet
      }
    } else {
      setDisplayText(feedbackText)
    }
  }, [feedbackText])

  async function handleFreitextSubmit() {
    if (!freitext.trim()) return
    setStep('analysing')

    try {
      const res = await fetch('/api/briefing/evening/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freitext,
          tagesStats: stats
            ? {
                erledigteTodos: stats.erledigteTodos,
                alleTodos: stats.alleTodos,
                sessions: stats.sessions,
                lernplanErledigt: stats.lernplanErledigt,
                lernplanGesamt: stats.lernplanGesamt,
                klausurFach: stats.klausurFach,
              }
            : {},
        }),
      })

      if (!res.ok) throw new Error('analyse unavailable')

      const data = await res.json()
      setNachfragen(data.nachfragen || [])
      const initAnswers: Record<string, string> = {}
      ;(data.nachfragen || []).forEach((nf: Nachfrage) => {
        initAnswers[nf.id] = ''
      })
      setNachfragenAntworten(initAnswers)
      setStep('nachfragen')
    } catch {
      const fallback = stats ? generateAlgorithmFeedback(stats) : 'Tagesreflexion gespeichert.'
      setDisplayText(fallback)
      setFeedbackText(fallback)
      setIsFallback(true)
      setStep('feedback')
    }
  }

  async function handleNachfragenSubmit() {
    setStep('analysing2')

    const nachfragenArr = nachfragen.map((nf) => ({
      frage: nf.frage,
      antwort: nachfragenAntworten[nf.id] || '',
    }))

    try {
      const res = await fetch('/api/briefing/evening/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freitext,
          nachfragenAntworten: nachfragenArr,
          tagesStats: stats,
        }),
      })

      if (!res.ok || !res.body) {
        const fallback = stats ? generateAlgorithmFeedback(stats) : 'Feedback nicht verfügbar.'
        setDisplayText(fallback)
        setFeedbackText(fallback)
        setIsFallback(true)
        setStep('feedback')
        return
      }

      setStep('feedback')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setFeedbackText((prev) => prev + decoder.decode(value, { stream: true }))
      }
    } catch {
      const fallback = stats ? generateAlgorithmFeedback(stats) : 'Feedback nicht verfügbar.'
      setDisplayText(fallback)
      setFeedbackText(fallback)
      setIsFallback(true)
      setStep('feedback')
    }
  }

  async function handleSaveAndDone() {
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    const { data: briefing, error: saveError } = await supabase
      .from('briefings')
      .upsert(
        {
          user_id: user.id,
          typ: 'evening',
          datum: today,
          inhalt: displayText,
          freitext,
          nachfragen: nachfragen.map((nf) => ({
            frage: nf.frage,
            antwort: nachfragenAntworten[nf.id] || '',
          })),
          ki_feedback: displayText,
          morgen_hinweis: morgenHinweis,
          tages_stats: stats,
        },
        { onConflict: 'user_id,datum,typ' }
      )
      .select()
      .single()

    setSaving(false)
    if (saveError) {
      console.error('[Evening] Save error:', saveError)
      // Still proceed to done — user sees feedback even if save failed
      // The error is logged; a retry would require starting over
    }
    setStep('done')
    onComplete(briefing || {})
  }

  const staggerIn = {
    initial: { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
  }

  if (step === 'loading') {
    return (
      <div className="glass-card" style={{ padding: '32px', opacity: 0.5 }}>
        <JarvisLoader label="Lade Tagesdaten..." />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Stats Card — always visible */}
      {stats && (
        <motion.div {...staggerIn} style={{ marginBottom: '28px' }}>
          <div className="glass-card" style={{ padding: '24px 28px' }}>
            <p className="text-section-label" style={{ marginBottom: '16px' }}>
              Dein heutiger Tag
            </p>
            <StatRow
              label="Todos erledigt"
              value={`${stats.erledigteTodos} / ${stats.alleTodos}`}
              barFilled={stats.alleTodos > 0 ? stats.erledigteTodos / stats.alleTodos : 0}
            />
            <StatRow
              label="Focus-Sessions"
              value={`${stats.sessions.length} Sessions · ${stats.gesamtMinuten} min`}
              detail={
                stats.sessions.length > 0
                  ? stats.sessions
                      .map((s) => `${s.aufgabe} (${s.dauerMinuten}min)`)
                      .join(', ')
                  : undefined
              }
            />
            {stats.lernplanGesamt > 0 && (
              <StatRow
                label={`Lernplan${stats.klausurFach ? ` · ${stats.klausurFach}` : ''}`}
                value={`${stats.lernplanErledigt} / ${stats.lernplanGesamt} Tasks`}
                barFilled={stats.lernplanErledigt / stats.lernplanGesamt}
              />
            )}
          </div>
        </motion.div>
      )}

      {/* Step: Freitext */}
      <AnimatePresence>
        {(step === 'stats' || step === 'freitext') && (
          <motion.div {...staggerIn} key="freitext-section" style={{ marginBottom: '28px' }}>
            {step === 'stats' && (
              <button
                onClick={() => setStep('freitext')}
                style={{
                  padding: '12px 24px',
                  background: 'var(--accent-proc)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 150ms',
                }}
              >
                Reflexion starten →
              </button>
            )}

            {step === 'freitext' && (
              <>
                <p className="text-section-label" style={{ marginBottom: '6px' }}>
                  Wie war dein Tag?
                </p>
                <p
                  className="text-caption"
                  style={{ marginBottom: '12px', color: 'var(--text-30)' }}
                >
                  Was war gut? Was war schwierig? Was hast du heute gelernt?
                </p>
                <textarea
                  ref={freitextRef}
                  value={freitext}
                  onChange={(e) => setFreitext(e.target.value)}
                  placeholder="Heute war..."
                  rows={4}
                  className="proc-input"
                  style={{ marginBottom: '12px' }}
                />
                <button
                  onClick={handleFreitextSubmit}
                  disabled={!freitext.trim()}
                  style={{
                    padding: '11px 24px',
                    background: freitext.trim() ? 'var(--accent-proc)' : 'rgba(45,79,215,0.3)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: freitext.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Absenden →
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysing animation */}
      {step === 'analysing' && (
        <motion.div {...staggerIn} style={{ marginBottom: '28px' }}>
          <JarvisLoader label="Analysiere deinen Tag..." />
        </motion.div>
      )}

      {/* Step: Nachfragen */}
      {step === 'nachfragen' && (
        <motion.div {...staggerIn} style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
            {nachfragen.map((nf) => (
              <div key={nf.id}>
                <p
                  className="text-section-label"
                  style={{ marginBottom: '8px' }}
                >
                  {nf.frage}
                </p>
                <textarea
                  value={nachfragenAntworten[nf.id] || ''}
                  onChange={(e) =>
                    setNachfragenAntworten((prev) => ({
                      ...prev,
                      [nf.id]: e.target.value,
                    }))
                  }
                  placeholder="..."
                  rows={2}
                  className="proc-input"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleNachfragenSubmit}
            style={{
              padding: '11px 24px',
              background: 'var(--accent-proc)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'Syne, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Fertig für heute →
          </button>
        </motion.div>
      )}

      {/* Analysing 2 */}
      {step === 'analysing2' && (
        <motion.div {...staggerIn} style={{ marginBottom: '28px' }}>
          <JarvisLoader label="Erstelle deine Rückmeldung..." />
        </motion.div>
      )}

      {/* Step: Feedback (streaming) */}
      {step === 'feedback' && (
        <motion.div {...staggerIn} style={{ marginBottom: '28px' }}>
          <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '16px' }}>
            <p className="text-section-label" style={{ marginBottom: '12px' }}>
              {isFallback ? 'TAGESÜBERSICHT' : 'J.A.R.V.I.S.'}
            </p>
            <p
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '16px',
                color: 'var(--text-80)',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {displayText}
              {!displayText && feedbackText.length === 0 && (
                <span className="cursor-blink"> ▋</span>
              )}
              {displayText && !morgenHinweis && !isFallback && (
                <span className="cursor-blink"> ▋</span>
              )}
            </p>

            {morgenHinweis && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: 'var(--accent-soft)',
                  borderRadius: '10px',
                  border: '1px solid var(--accent-border)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    color: 'var(--accent-text)',
                    marginBottom: '4px',
                  }}
                >
                  FÜR MORGEN FRÜH
                </p>
                <p
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '14px',
                    color: 'var(--text-80)',
                  }}
                >
                  {morgenHinweis}
                </p>
              </motion.div>
            )}
          </div>

          {morgenHinweis !== undefined && displayText && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={handleSaveAndDone}
              disabled={saving}
              style={{
                padding: '11px 24px',
                background: saving ? 'rgba(45,79,215,0.5)' : 'var(--accent-proc)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontFamily: 'Syne, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background 150ms',
              }}
            >
              {saving ? 'Speichere...' : 'Abschluss →'}
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '28px' }}
        >
          <h2
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text-100)',
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            Gute Nacht.
          </h2>
          <p
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '15px',
              color: 'var(--text-55)',
              marginBottom: '20px',
            }}
          >
            Der Tag ist vorbei. Das Wichtige ist gespeichert.
          </p>
          <Link
            href="/"
            style={{
              padding: '11px 22px',
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(8px)',
              color: 'var(--text-80)',
              borderRadius: '10px',
              border: '1px solid var(--border-1)',
              fontFamily: 'Syne, sans-serif',
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            Dashboard
          </Link>
        </motion.div>
      )}
    </div>
  )
}
