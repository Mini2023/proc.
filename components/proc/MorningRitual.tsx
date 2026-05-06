'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TaskReviewItem } from './TaskReviewItem'
import type { BriefingTask, Briefing } from '@/types'

type Step =
  | 'context'
  | 'intention'
  | 'nicht_tun'
  | 'energie'
  | 'generating'
  | 'task_review'
  | 'done'

const STEP_ORDER: Step[] = [
  'context',
  'intention',
  'nicht_tun',
  'energie',
  'generating',
  'task_review',
  'done',
]

function stepIndex(s: Step) {
  return STEP_ORDER.indexOf(s)
}
function isPast(s: Step, current: Step) {
  return stepIndex(s) < stepIndex(current)
}

function JarvisLoader({ label = 'Analysiere...' }: { label?: string }) {
  return (
    <div style={{ padding: '8px 0 16px' }}>
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

function CompletedAnswer({ value }: { value: string }) {
  return (
    <p
      style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: '15px',
        color: 'var(--text-30)',
        marginTop: '6px',
        fontStyle: 'italic',
      }}
    >
      {value}
    </p>
  )
}

function EnergyButton({
  level,
  active,
  onClick,
}: {
  level: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: '56px',
        height: '72px',
        background: active ? 'var(--accent-soft)' : 'rgba(255,255,255,0.6)',
        border: active
          ? '1px solid var(--accent-border)'
          : '1px solid var(--border-0)',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 150ms',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '20px',
          fontWeight: 300,
          color: active ? 'var(--accent-text)' : 'var(--text-55)',
        }}
      >
        {level}
      </span>
      <div
        style={{
          display: 'flex',
          gap: '2px',
          alignItems: 'flex-end',
          height: '10px',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: '3px',
              height: `${4 + i * 1.2}px`,
              borderRadius: '1px',
              background: i <= level ? (active ? 'var(--accent-proc)' : 'var(--text-30)') : 'var(--border-0)',
            }}
          />
        ))}
      </div>
    </button>
  )
}

interface MorningRitualProps {
  gestrigeSummary: string | null
  onComplete: (briefing: Partial<Briefing>) => void
}

export function MorningRitual({ gestrigeSummary, onComplete }: MorningRitualProps) {
  const [step, setStep] = useState<Step>(gestrigeSummary ? 'context' : 'intention')
  const [intention, setIntention] = useState('')
  const [nichtTun, setNichtTun] = useState('')
  const [energie, setEnergie] = useState<number | null>(null)
  const [briefingText, setBriefingText] = useState('')
  const [tasks, setTasks] = useState<BriefingTask[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  const intentionRef = useRef<HTMLTextAreaElement>(null)
  const nichtTunRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus current step inputs
  useEffect(() => {
    if (step === 'intention') setTimeout(() => intentionRef.current?.focus(), 300)
    if (step === 'nicht_tun') setTimeout(() => nichtTunRef.current?.focus(), 300)
  }, [step])

  async function buildFallbackText(energieLevel: number): Promise<string> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return intention ? `Energie ${energieLevel}/5. Deine Intention: ${intention}.` : `Energie ${energieLevel}/5. Starte fokussiert in den Tag.`

    const today = new Date().toISOString().split('T')[0]
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [todoRes, klausurRes, sessionRes] = await Promise.all([
      supabase.from('todos').select('id').eq('user_id', user.id)
        .or(`kategorie.eq.heute,faellig_am.eq.${today}`).eq('fertig', false),
      supabase.from('klausuren').select('fach, datum').eq('user_id', user.id)
        .gte('datum', today).lte('datum', in7Days).order('datum').limit(1),
      supabase.from('focus_sessions').select('dauer_minuten').eq('user_id', user.id)
        .gte('gestartet_at', weekAgo).eq('abgeschlossen', true),
    ])

    const todoCount = todoRes.data?.length ?? 0
    const nextKlausur = klausurRes.data?.[0]
    const weekMin = (sessionRes.data ?? []).reduce((s, r) => s + (r.dauer_minuten as number), 0)

    const energyNote = energieLevel <= 2
      ? 'Schone deine Energie — Fokus auf das Wichtigste.'
      : energieLevel >= 4
      ? 'Gute Energie heute — nutze das Momentum.'
      : 'Ein solider Tag liegt vor dir.'

    const parts: string[] = [energyNote]
    if (intention) parts.push(`Deine Intention: ${intention}.`)
    if (todoCount > 0) parts.push(`${todoCount} offene Todo${todoCount !== 1 ? 's' : ''} warten auf dich.`)
    if (nextKlausur) {
      const days = Math.round((new Date(nextKlausur.datum).getTime() - new Date(today).getTime()) / 86400000)
      parts.push(`${nextKlausur.fach} in ${days} Tag${days !== 1 ? 'en' : ''}.`)
    }
    if (weekMin > 0) parts.push(`Diese Woche bereits ${(weekMin / 60).toFixed(1)}h fokussiert.`)

    return parts.join(' ')
  }

  async function generate(energieLevel: number) {
    setSchritt('generating')
    setError(null)
    try {
      const res = await fetch('/api/briefing/morning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intention, nichtTun, energie: energieLevel }),
      })
      if (!res.ok) {
        const fallback = await buildFallbackText(energieLevel)
        await persistBriefing(fallback, [], energieLevel)
        setBriefingText(fallback)
        setTasks([])
        setIsFallback(true)
        setSchritt('task_review')
        return
      }
      const data = await res.json()
      const text = data.briefingText || ''
      const taskList: BriefingTask[] = data.tasks || []
      await persistBriefing(text, taskList, energieLevel)
      setBriefingText(text)
      setTasks(taskList)
      setIsFallback(false)
      setSchritt('task_review')
    } catch {
      const fallback = await buildFallbackText(energieLevel)
      await persistBriefing(fallback, [], energieLevel)
      setBriefingText(fallback)
      setTasks([])
      setIsFallback(true)
      setSchritt('task_review')
    }
  }

  async function persistBriefing(text: string, taskList: BriefingTask[], energieLevel: number) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('briefings').upsert(
        {
          user_id: user.id,
          typ: 'morning',
          datum: today,
          inhalt: text,
          intention,
          nicht_tun: nichtTun,
          energie: energieLevel,
          bestaetigte_tasks: taskList,
        },
        { onConflict: 'user_id,datum,typ' }
      )
    } catch (e) {
      console.error('[Morning] Auto-save failed:', e)
    }
  }

  function setSchritt(s: Step) {
    setStep(s)
  }

  async function handleConfirm() {
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    // Save todos
    if (tasks.length > 0) {
      await supabase.from('todos').insert(
        tasks.map((t) => ({
          user_id: user.id,
          text: t.text,
          prioritaet: t.prioritaet,
          kategorie: 'heute',
          fertig: false,
          quelle: 'morning_briefing',
        }))
      )
    }

    // Save briefing
    const { data: briefing, error: saveError } = await supabase
      .from('briefings')
      .upsert(
        {
          user_id: user.id,
          typ: 'morning',
          datum: today,
          inhalt: briefingText,
          intention,
          nicht_tun: nichtTun,
          energie,
          bestaetigte_tasks: tasks,
        },
        { onConflict: 'user_id,datum,typ' }
      )
      .select()
      .single()

    setSaving(false)
    if (saveError) {
      console.error('[Morning] Save error:', saveError)
      setError('Speichern fehlgeschlagen: ' + saveError.message)
      return
    }
    setSchritt('done')
    onComplete(briefing || {})
  }

  const staggerIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Step: Context (gestrige Zusammenfassung) */}
      {gestrigeSummary && stepIndex(step) >= stepIndex('context') && (
        <motion.div {...staggerIn} style={{ marginBottom: '28px' }}>
          <div
            className="glass-card"
            style={{
              padding: '16px 20px',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              opacity: isPast('context', step) ? 0.5 : 1,
            }}
          >
            <p
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: 'var(--accent-text)',
                marginBottom: '6px',
              }}
            >
              GESTERN ABEND
            </p>
            <p
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '14px',
                color: 'var(--text-80)',
                lineHeight: 1.6,
              }}
            >
              {gestrigeSummary}
            </p>
          </div>
          {step === 'context' && (
            <button
              onClick={() => setSchritt('intention')}
              style={{
                marginTop: '12px',
                padding: '8px 18px',
                background: 'var(--accent-proc)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'Syne, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Weiter →
            </button>
          )}
        </motion.div>
      )}

      {/* Step: Intention */}
      {stepIndex(step) >= stepIndex('intention') && (
        <motion.div {...staggerIn} style={{ marginBottom: '28px' }}>
          <p
            className="text-section-label"
            style={{
              marginBottom: '6px',
              color: isPast('intention', step) ? 'var(--text-30)' : 'var(--text-55)',
            }}
          >
            Was möchtest du heute erreichen?
          </p>
          {isPast('intention', step) ? (
            <CompletedAnswer value={intention} />
          ) : (
            <>
              <textarea
                ref={intentionRef}
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && intention.trim()) {
                    setSchritt('nicht_tun')
                  }
                }}
                placeholder="Heute will ich..."
                rows={2}
                className="proc-input"
                style={{ marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => intention.trim() && setSchritt('nicht_tun')}
                  disabled={!intention.trim()}
                  style={{
                    padding: '8px 18px',
                    background: intention.trim() ? 'var(--accent-proc)' : 'rgba(45,79,215,0.3)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: intention.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Weiter →
                </button>
                <span
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '10px',
                    color: 'var(--text-30)',
                    letterSpacing: '0.04em',
                  }}
                >
                  ⌘ + ENTER
                </span>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Step: Nicht-Tun */}
      {stepIndex(step) >= stepIndex('nicht_tun') && (
        <motion.div {...staggerIn} style={{ marginBottom: '28px' }}>
          <p
            className="text-section-label"
            style={{
              marginBottom: '6px',
              color: isPast('nicht_tun', step) ? 'var(--text-30)' : 'var(--text-55)',
            }}
          >
            Was wirst du heute bewusst NICHT tun?
          </p>
          {isPast('nicht_tun', step) ? (
            <CompletedAnswer value={nichtTun || '(nichts festgelegt)'} />
          ) : (
            <>
              <textarea
                ref={nichtTunRef}
                value={nichtTun}
                onChange={(e) => setNichtTun(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    setSchritt('energie')
                  }
                }}
                placeholder="Heute nicht..."
                rows={2}
                className="proc-input"
                style={{ marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setSchritt('energie')}
                  style={{
                    padding: '8px 18px',
                    background: 'var(--accent-proc)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Weiter →
                </button>
                <span
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '10px',
                    color: 'var(--text-30)',
                    letterSpacing: '0.04em',
                  }}
                >
                  ⌘ + ENTER
                </span>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Step: Energie */}
      {stepIndex(step) >= stepIndex('energie') && (
        <motion.div {...staggerIn} style={{ marginBottom: '28px' }}>
          <p
            className="text-section-label"
            style={{
              marginBottom: '12px',
              color: isPast('energie', step) ? 'var(--text-30)' : 'var(--text-55)',
            }}
          >
            Wie ist deine Energie heute?
          </p>
          {isPast('energie', step) ? (
            <CompletedAnswer value={`${energie}/5`} />
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((level) => (
                <EnergyButton
                  key={level}
                  level={level}
                  active={energie === level}
                  onClick={() => {
                    setEnergie(level)
                    setTimeout(() => generate(level), 300)
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Step: Generating */}
      {step === 'generating' && (
        <motion.div {...staggerIn} style={{ marginBottom: '28px' }}>
          <JarvisLoader label="Analysiere deinen Tag..." />
          {error && (
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--danger)' }}>
              {error}
            </p>
          )}
        </motion.div>
      )}

      {/* Step: Task Review */}
      {step === 'task_review' && (
        <motion.div {...staggerIn} style={{ marginBottom: '28px' }}>
          {/* Briefing text */}
          <div
            className="glass-card"
            style={{ padding: '20px 24px', marginBottom: '20px' }}
          >
            {isFallback && (
              <p style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '9px',
                letterSpacing: '0.1em',
                color: 'var(--text-30)',
                marginBottom: '10px',
              }}>
                OFFLINE-MODUS — J.A.R.V.I.S. NICHT VERFÜGBAR
              </p>
            )}
            <p
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '16px',
                color: 'var(--text-80)',
                lineHeight: 1.8,
              }}
            >
              {briefingText}
            </p>
          </div>

          {/* Tasks */}
          <p className="text-section-label" style={{ marginBottom: '4px' }}>
            Vorgeschlagene Tasks für heute
          </p>
          <div style={{ marginBottom: '12px' }}>
            {tasks.map((task, i) => (
              <TaskReviewItem
                key={i}
                task={task}
                onUpdate={(text) =>
                  setTasks((prev) =>
                    prev.map((t, idx) => (idx === i ? { ...t, text } : t))
                  )
                }
                onDelete={() => setTasks((prev) => prev.filter((_, idx) => idx !== i))}
              />
            ))}
          </div>

          <button
            onClick={() =>
              setTasks((prev) => [
                ...prev,
                { text: 'Neue Aufgabe', prioritaet: 3 },
              ])
            }
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
              background: 'transparent',
              border: '1px dashed var(--border-1)',
              borderRadius: '8px',
              fontFamily: 'DM Mono, monospace',
              fontSize: '11px',
              letterSpacing: '0.06em',
              color: 'var(--text-30)',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-border)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-text)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-1)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)'
            }}
          >
            + TASK HINZUFÜGEN
          </button>

          <button
            onClick={handleConfirm}
            disabled={saving}
            style={{
              padding: '12px 28px',
              background: saving ? 'rgba(45,79,215,0.5)' : 'var(--accent-proc)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'Syne, sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 150ms',
            }}
          >
            {saving ? 'Speichere...' : `Tasks übernehmen → (${tasks.length})`}
          </button>
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
            Bereit.
          </h2>
          <p
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '15px',
              color: 'var(--text-55)',
              marginBottom: '20px',
            }}
          >
            {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'} für heute.
            {nichtTun && ` Nicht: ${nichtTun}`}
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/focus"
              style={{
                padding: '11px 22px',
                background: 'var(--accent-proc)',
                color: '#fff',
                borderRadius: '10px',
                fontFamily: 'Syne, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}
            >
              Fokus starten →
            </Link>
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
          </div>
        </motion.div>
      )}
    </div>
  )
}
