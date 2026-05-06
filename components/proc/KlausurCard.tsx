'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Klausur, LernplanTag } from '@/types'

function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
}

function getNoteColor(note: number): string {
  if (note <= 1.5) return 'var(--positive)'
  if (note <= 2.5) return 'var(--text-100)'
  if (note <= 3.5) return 'var(--warning)'
  return 'var(--danger)'
}

function DaysBadge({ days }: { days: number }) {
  const urgent = days >= 0 && days <= 2
  const color =
    days < 0 ? 'var(--text-30)'
    : days <= 2 ? 'var(--danger)'
    : days <= 7 ? 'var(--warning)'
    : 'var(--accent-proc)'

  const label =
    days < 0 ? `vor ${Math.abs(days)} Tagen`
    : days === 0 ? 'Heute'
    : `in ${days} Tagen`

  return (
    <motion.span
      animate={urgent ? { opacity: [1, 0.55, 1] } : {}}
      transition={urgent ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
      style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '11px',
        letterSpacing: '0.04em',
        color,
        background:
          days <= 2 && days >= 0 ? 'rgba(220,38,38,0.08)'
          : days <= 7 && days >= 0 ? 'rgba(217,119,6,0.08)'
          : 'var(--accent-soft)',
        padding: '3px 8px',
        borderRadius: '6px',
        display: 'inline-block',
      }}
    >
      {label}
    </motion.span>
  )
}

function LernplanTimeline({
  lernplan,
  onToggleTask,
}: {
  lernplan: LernplanTag[]
  onToggleTask: (datum: string, taskIndex: number) => void
}) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ marginTop: '20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
        }}
      >
        <span
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--positive)',
          }}
        >
          LERNPLAN
        </span>
        <div
          style={{
            flex: 1,
            height: '1px',
            background: 'var(--border-0)',
          }}
        />
        <span
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--text-30)',
          }}
        >
          {lernplan.reduce((s, t) => s + t.tasks.filter((tk) => tk.done).length, 0)}/
          {lernplan.reduce((s, t) => s + t.tasks.length, 0)}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {lernplan.map((tag) => {
          const isPast = tag.datum < today
          const isToday = tag.datum === today
          const allDone = tag.tasks.every((t) => t.done)

          return (
            <div key={tag.datum}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: allDone
                      ? 'var(--positive)'
                      : isToday
                      ? 'var(--accent-proc)'
                      : isPast
                      ? 'var(--text-30)'
                      : 'var(--border-1)',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.04em',
                    color: isToday
                      ? 'var(--accent-text)'
                      : isPast
                      ? 'var(--text-30)'
                      : 'var(--text-55)',
                    fontWeight: isToday ? 600 : 400,
                  }}
                >
                  {new Date(tag.datum + 'T12:00:00').toLocaleDateString('de-DE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                  {isToday && (
                    <span
                      style={{
                        marginLeft: '6px',
                        background: 'var(--accent-soft)',
                        color: 'var(--accent-text)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                      }}
                    >
                      heute
                    </span>
                  )}
                </span>
              </div>

              <div
                style={{
                  marginLeft: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {tag.tasks.map((task, i) => (
                  <label
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => onToggleTask(tag.datum, i)}
                      style={{
                        marginTop: '2px',
                        accentColor: 'var(--accent-proc)',
                        flexShrink: 0,
                        cursor: 'pointer',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: '13px',
                        color: task.done ? 'var(--text-30)' : 'var(--text-80)',
                        textDecoration: task.done ? 'line-through' : 'none',
                        lineHeight: '1.4',
                        transition: 'color 150ms',
                      }}
                    >
                      {task.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface KlausurCardProps {
  klausur: Klausur
  onUpdateNote: (id: string, note: number) => void
  onDelete: (id: string) => void
  onRefetch: () => void
}

export function KlausurCard({
  klausur,
  onUpdateNote,
  onDelete,
  onRefetch,
}: KlausurCardProps) {
  const [editingNote, setEditingNote] = useState(false)
  const [noteInput, setNoteInput] = useState(klausur.note?.toString() || '')
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [showPlan, setShowPlan] = useState(false)
  const [localLernplan, setLocalLernplan] = useState<LernplanTag[] | null>(
    klausur.lernplan
  )

  const days = getDaysUntil(klausur.datum)
  const isPast = days < 0

  function handleNoteSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(noteInput)
    if (!isNaN(val) && val >= 1.0 && val <= 6.0) {
      onUpdateNote(klausur.id, Math.round(val * 10) / 10)
      setEditingNote(false)
    }
  }

  async function handleGeneratePlan() {
    setGeneratingPlan(true)
    setPlanError(null)
    try {
      const res = await fetch('/api/klausuren/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ klausurId: klausur.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setPlanError(data.error ?? 'Fehler beim Generieren.')
      } else {
        onRefetch()
        setShowPlan(true)
      }
    } catch {
      setPlanError('Netzwerkfehler.')
    } finally {
      setGeneratingPlan(false)
    }
  }

  async function handleToggleTask(datum: string, taskIndex: number) {
    if (!localLernplan) return
    const updated = localLernplan.map((tag) => {
      if (tag.datum !== datum) return tag
      return {
        ...tag,
        tasks: tag.tasks.map((task, i) =>
          i === taskIndex ? { ...task, done: !task.done } : task
        ),
      }
    })
    setLocalLernplan(updated)

    await fetch('/api/klausuren/lernplan-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ klausurId: klausur.id, lernplan: updated }),
    })
  }

  // Sync localLernplan when parent refetches
  const currentPlan = localLernplan ?? klausur.lernplan
  const hasPlan = klausur.lernplan_generiert && currentPlan && currentPlan.length > 0

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 1px 0 rgba(255,255,255,0.95) inset, 0 4px 8px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.10)' }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: '20px 24px',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        {/* Left: Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '4px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-100)',
              }}
            >
              {klausur.fach}
            </span>
            <DaysBadge days={days} />
          </div>

          {klausur.thema && (
            <p className="text-caption" style={{ marginBottom: '8px' }}>
              {klausur.thema}
            </p>
          )}

          <p className="text-caption">
            {new Date(klausur.datum + 'T12:00:00').toLocaleDateString('de-DE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>

          {/* Lernplan controls */}
          {!isPast && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {!hasPlan ? (
                <button
                  onClick={handleGeneratePlan}
                  disabled={generatingPlan}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    background: generatingPlan
                      ? 'rgba(45,79,215,0.06)'
                      : 'rgba(45,79,215,0.08)',
                    border: '1px solid rgba(45,79,215,0.2)',
                    borderRadius: '8px',
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.06em',
                    color: generatingPlan ? 'var(--text-30)' : 'var(--accent-text)',
                    cursor: generatingPlan ? 'not-allowed' : 'pointer',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={(e) => {
                    if (!generatingPlan)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(45,79,215,0.14)'
                  }}
                  onMouseLeave={(e) => {
                    if (!generatingPlan)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(45,79,215,0.08)'
                  }}
                >
                  {generatingPlan ? (
                    <>
                      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>◌</span>
                      GENERIERE...
                    </>
                  ) : (
                    'LERNPLAN GENERIEREN'
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowPlan((v) => !v)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      background: 'rgba(34,197,94,0.08)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      borderRadius: '8px',
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '11px',
                      letterSpacing: '0.06em',
                      color: 'var(--positive)',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    {showPlan ? '▲ LERNPLAN' : '▼ LERNPLAN'}
                  </button>
                  <button
                    onClick={handleGeneratePlan}
                    disabled={generatingPlan}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: 'none',
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '10px',
                      letterSpacing: '0.06em',
                      color: 'var(--text-30)',
                      cursor: generatingPlan ? 'not-allowed' : 'pointer',
                      transition: 'color 150ms',
                    }}
                    onMouseEnter={(e) => {
                      if (!generatingPlan)
                        (e.currentTarget as HTMLButtonElement).style.color =
                          'var(--text-55)'
                    }}
                    onMouseLeave={(e) => {
                      if (!generatingPlan)
                        (e.currentTarget as HTMLButtonElement).style.color =
                          'var(--text-30)'
                    }}
                  >
                    {generatingPlan ? 'GENERIERE...' : 'NEU GENERIEREN'}
                  </button>
                </>
              )}

              {planError && (
                <span
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '10px',
                    color: 'var(--danger)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {planError}
                </span>
              )}
            </div>
          )}

          {/* Lernplan timeline */}
          <AnimatePresence>
            {showPlan && hasPlan && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <LernplanTimeline
                  lernplan={currentPlan!}
                  onToggleTask={handleToggleTask}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Note */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          {klausur.note !== null && klausur.note !== undefined ? (
            <span
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '28px',
                fontWeight: 300,
                letterSpacing: '-0.03em',
                color: getNoteColor(klausur.note),
              }}
            >
              {klausur.note.toFixed(1)}
            </span>
          ) : (
            <span
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '18px',
                fontWeight: 300,
                color: 'var(--text-30)',
                letterSpacing: '-0.02em',
              }}
            >
              —
            </span>
          )}

          {klausur.note_ziel && (
            <span className="text-caption">Ziel: {klausur.note_ziel.toFixed(1)}</span>
          )}

          {editingNote ? (
            <form onSubmit={handleNoteSubmit} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="number"
                step="0.1"
                min="1"
                max="6"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                autoFocus
                style={{
                  width: '64px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-1)',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '13px',
                  background: 'rgba(255,255,255,0.9)',
                  color: 'var(--text-100)',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '4px 10px',
                  background: 'var(--accent-proc)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => setEditingNote(false)}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  color: 'var(--text-55)',
                  border: '1px solid var(--border-1)',
                  borderRadius: '6px',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </form>
          ) : (
            <button
              onClick={() => setEditingNote(true)}
              style={{
                background: 'none',
                border: 'none',
                fontFamily: 'DM Mono, monospace',
                fontSize: '11px',
                letterSpacing: '0.04em',
                color: 'var(--text-30)',
                cursor: 'pointer',
                padding: '0',
                transition: 'color 150ms',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  'var(--accent-text)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  'var(--text-30)')
              }
            >
              {klausur.note !== null ? 'Note ändern' : 'Note eintragen'}
            </button>
          )}

          <button
            onClick={() => {
              if (confirm(`${klausur.fach} wirklich löschen?`)) onDelete(klausur.id)
            }}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
              letterSpacing: '0.04em',
              color: 'var(--text-30)',
              cursor: 'pointer',
              padding: '0',
              transition: 'color 150ms',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')
            }
          >
            Löschen
          </button>
        </div>
      </div>
    </motion.div>
  )
}
