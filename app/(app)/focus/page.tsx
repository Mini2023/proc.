'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pageVariants } from '@/lib/animations'
import type { FocusSession, Todo } from '@/types'
import { DeepWorkAudioEngine, type SoundType } from '@/lib/audio/deepWorkAudio'
import { DeepWorkVisualizer } from '@/components/proc/DeepWorkVisualizer'
import { createClient } from '@/lib/supabase/client'

// ── Constants ─────────────────────────────────────────────────────────────────

const KATEGORIEN: FocusSession['kategorie'][] = ['Lernen', 'Projekt', 'Kreativ', 'Admin', 'Sonstiges']
const DAUERN = [15, 25, 45, 60, 90]
const BREAK_DURATIONS = [5, 10, 15, 20]
const ROUNDS_OPTIONS = [2, 3, 4, 5]
const CIRCUMFERENCE = 2 * Math.PI * 120

const SOUNDS: { id: SoundType; label: string; icon: string }[] = [
  { id: 'off',    label: 'Kein Sound',  icon: '∅' },
  { id: 'brown',  label: 'Brown Noise', icon: '≋' },
  { id: 'white',  label: 'White Noise', icon: '◌' },
  { id: 'rain',   label: 'Regen',       icon: '⋮' },
  { id: 'coffee', label: 'Café',        icon: '◉' },
  { id: 'gamma',  label: '40 Hz',       icon: '∿' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type State = 'setup' | 'running' | 'paused' | 'done' | 'deepwork' | 'break'
type SessionMode = 'single' | 'pomodoro'
interface PomodoroConfig { focusMin: number; breakMin: number; rounds: number }
const DEFAULT_POMODORO: PomodoroConfig = { focusMin: 25, breakMin: 10, rounds: 3 }

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

async function saveSession(data: {
  aufgabe: string; kategorie: string; dauer_minuten: number
  abgeschlossen: boolean; abgebrochen: boolean; notiz: string | null
  gestartet_at: string; beendet_at: string
}) {
  await fetch('/api/focus/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

// ── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 16px', borderRadius: '20px',
        border: active ? 'none' : '1px solid var(--border-1)',
        background: active ? 'var(--accent-proc)' : 'rgba(255,255,255,0.7)',
        color: active ? '#fff' : 'var(--text-55)',
        fontFamily: 'Syne, sans-serif', fontSize: '14px',
        fontWeight: active ? 600 : 400, cursor: 'pointer',
        transition: 'all 180ms', backdropFilter: 'blur(8px)',
        boxShadow: active ? '0 2px 8px rgba(45,79,215,0.25)' : 'var(--shadow-sm)',
        letterSpacing: '-0.01em',
      }}
    >
      {label}
    </button>
  )
}

// ── Round Dots ────────────────────────────────────────────────────────────────

function RoundDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i < current ? '8px' : '6px',
            height: i < current ? '8px' : '6px',
            borderRadius: '50%',
            background: i < current ? 'var(--accent-proc)' : 'var(--border-1)',
            transition: 'all 300ms',
          }}
        />
      ))}
    </div>
  )
}

// ── Setup view ────────────────────────────────────────────────────────────────

function SetupView({
  aufgabe, setAufgabe, kategorie, setKategorie, dauer, setDauer,
  sessionMode, setSessionMode, pomodoroConfig, setPomodoroConfig,
  onStart, onDeepWork,
}: {
  aufgabe: string; setAufgabe: (v: string) => void
  kategorie: string; setKategorie: (v: FocusSession['kategorie']) => void
  dauer: number; setDauer: (v: number) => void
  sessionMode: SessionMode; setSessionMode: (v: SessionMode) => void
  pomodoroConfig: PomodoroConfig; setPomodoroConfig: (v: PomodoroConfig) => void
  onStart: () => void; onDeepWork: () => void
}) {
  const canStart = aufgabe.trim().length > 0 && kategorie !== ''

  return (
    <motion.div
      variants={pageVariants} initial="initial" animate="animate" exit="exit"
      style={{ maxWidth: '640px' }}
    >
      <h1 className="text-headline" style={{ marginBottom: '48px' }}>Fokus.</h1>

      <section style={{ marginBottom: '32px' }}>
        <p className="text-section-label" style={{ marginBottom: '10px' }}>Woran arbeitest du?</p>
        <input
          className="proc-input" value={aufgabe} onChange={(e) => setAufgabe(e.target.value)}
          placeholder="Aufgabe beschreiben..." autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter' && canStart) onStart() }}
        />
      </section>

      <section style={{ marginBottom: '32px' }}>
        <p className="text-section-label" style={{ marginBottom: '10px' }}>Kategorie</p>
        <div className="mobile-kategorie-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {KATEGORIEN.map((k) => <Pill key={k} label={k} active={kategorie === k} onClick={() => setKategorie(k)} />)}
        </div>
      </section>

      {/* Session type */}
      <section style={{ marginBottom: '28px' }}>
        <p className="text-section-label" style={{ marginBottom: '10px' }}>Session-Typ</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Pill label="Einzelsession" active={sessionMode === 'single'} onClick={() => setSessionMode('single')} />
          <Pill label="Pomodoro" active={sessionMode === 'pomodoro'} onClick={() => setSessionMode('pomodoro')} />
        </div>
      </section>

      {/* Single: duration */}
      {sessionMode === 'single' && (
        <section style={{ marginBottom: '40px' }}>
          <p className="text-section-label" style={{ marginBottom: '10px' }}>Dauer</p>
          <div className="mobile-dauer-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {DAUERN.map((d) => <Pill key={d} label={`${d} min`} active={dauer === d} onClick={() => setDauer(d)} />)}
          </div>
        </section>
      )}

      {/* Pomodoro config */}
      {sessionMode === 'pomodoro' && (
        <motion.section
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            marginBottom: '40px', padding: '20px 22px',
            background: 'rgba(45,79,215,0.04)',
            border: '1px solid rgba(45,79,215,0.10)',
            borderRadius: '14px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Focus duration */}
            <div>
              <p className="text-section-label" style={{ marginBottom: '10px' }}>Fokus-Dauer</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DAUERN.map((d) => (
                  <Pill
                    key={d} label={`${d} min`}
                    active={pomodoroConfig.focusMin === d}
                    onClick={() => setPomodoroConfig({ ...pomodoroConfig, focusMin: d })}
                  />
                ))}
              </div>
            </div>
            {/* Break duration */}
            <div>
              <p className="text-section-label" style={{ marginBottom: '10px' }}>Pausen-Dauer</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {BREAK_DURATIONS.map((d) => (
                  <Pill
                    key={d} label={`${d} min`}
                    active={pomodoroConfig.breakMin === d}
                    onClick={() => setPomodoroConfig({ ...pomodoroConfig, breakMin: d })}
                  />
                ))}
              </div>
            </div>
            {/* Rounds */}
            <div>
              <p className="text-section-label" style={{ marginBottom: '10px' }}>Runden</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {ROUNDS_OPTIONS.map((r) => (
                  <Pill
                    key={r} label={`${r}×`}
                    active={pomodoroConfig.rounds === r}
                    onClick={() => setPomodoroConfig({ ...pomodoroConfig, rounds: r })}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <p style={{
            marginTop: '16px', fontFamily: 'DM Mono, monospace', fontSize: '11px',
            letterSpacing: '0.06em', color: 'var(--text-30)',
          }}>
            {pomodoroConfig.rounds}× {pomodoroConfig.focusMin} min Fokus · {pomodoroConfig.breakMin} min Pause
            {' '}· {Math.round(pomodoroConfig.rounds * pomodoroConfig.focusMin + (pomodoroConfig.rounds - 1) * pomodoroConfig.breakMin)} min gesamt
          </p>
        </motion.section>
      )}

      <div className="mobile-focus-actions" style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onStart} disabled={!canStart}
          style={{
            padding: '13px 32px',
            background: canStart ? 'var(--accent-proc)' : 'rgba(45,79,215,0.35)',
            color: '#fff', border: 'none', borderRadius: '12px',
            fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 600,
            cursor: canStart ? 'pointer' : 'not-allowed',
            letterSpacing: '-0.01em', transition: 'background 150ms',
          }}
          onMouseEnter={(e) => { if (canStart) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-light)' }}
          onMouseLeave={(e) => { if (canStart) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-proc)' }}
        >
          {sessionMode === 'pomodoro' ? `${pomodoroConfig.rounds} Runden starten →` : 'Starten →'}
        </button>
        <button
          onClick={onDeepWork} disabled={!canStart}
          style={{
            padding: '13px 24px',
            background: canStart ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
            border: '1px solid var(--border-1)', borderRadius: '12px',
            fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 500,
            color: canStart ? 'var(--text-80)' : 'var(--text-30)',
            cursor: canStart ? 'pointer' : 'not-allowed',
            backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-sm)',
            letterSpacing: '-0.01em', transition: 'all 150ms',
          }}
        >
          Deep Work
        </button>
      </div>
    </motion.div>
  )
}

// ── SVG Arc Timer ─────────────────────────────────────────────────────────────

function ArcTimer({ remaining, total, deepWork, isBreak = false }: {
  remaining: number; total: number; deepWork: boolean; isBreak?: boolean
}) {
  const progress = total > 0 ? remaining / total : 1
  const offset = CIRCUMFERENCE * (1 - progress)
  const isLow = progress < 0.25

  const arcColor = deepWork
    ? isLow ? '#d97706' : 'rgba(255,255,255,0.7)'
    : isBreak
    ? isLow ? 'var(--warning)' : 'rgba(22,163,74,0.65)'
    : isLow ? 'var(--warning)' : 'var(--accent-proc)'

  const glowColor = deepWork
    ? isLow ? 'rgba(217,119,6,0.6)' : 'rgba(255,255,255,0.3)'
    : isBreak
    ? isLow ? 'rgba(217,119,6,0.5)' : 'rgba(22,163,74,0.4)'
    : isLow ? 'rgba(217,119,6,0.5)' : 'rgba(45,79,215,0.45)'

  return (
    <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="140" cy="140" r="120" fill="none"
        stroke={deepWork ? 'rgba(255,255,255,0.08)' : 'var(--border-0)'} strokeWidth="1.5" />
      <circle cx="140" cy="140" r="120" fill="none"
        stroke={arcColor} strokeWidth="1.5"
        strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset} strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 1s linear, stroke 600ms',
          filter: `drop-shadow(0 0 6px ${glowColor})`,
        }}
      />
    </svg>
  )
}

// ── Timer view ────────────────────────────────────────────────────────────────

function TimerView({
  aufgabe, kategorie, remaining, total, state,
  sessionMode, currentRound, totalRounds,
  onPause, onResume, onAbort, onDeepWork,
}: {
  aufgabe: string; kategorie: string; remaining: number; total: number
  state: 'running' | 'paused'
  sessionMode: SessionMode; currentRound: number; totalRounds: number
  onPause: () => void; onResume: () => void; onAbort: () => void; onDeepWork: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf4 50%, #f0f2f5 100%)',
        zIndex: 100, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: 280, height: 280 }}>
        <ArcTimer remaining={remaining} total={total} deepWork={false} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <span style={{
            fontFamily: 'DM Mono, monospace', fontSize: '48px', fontWeight: 300,
            letterSpacing: '-0.04em', color: 'var(--text-100)', lineHeight: 1,
          }}>
            {formatTime(remaining)}
          </span>
          {state === 'paused' && (
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-30)' }}>
              PAUSIERT
            </span>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '40px' }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', color: 'var(--text-100)', marginBottom: '6px', maxWidth: '320px' }}>
          {aufgabe}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-30)' }}>
            {kategorie.toUpperCase()}
          </span>
          {sessionMode === 'pomodoro' && (
            <>
              <span style={{ color: 'var(--border-1)', fontSize: '10px' }}>·</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--accent-text)' }}>
                RUNDE {currentRound}/{totalRounds}
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={state === 'running' ? onPause : onResume}
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            border: '1px solid var(--border-1)', background: 'rgba(255,255,255,0.9)',
            color: 'var(--text-80)', fontSize: '18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms',
          }}
        >
          {state === 'running' ? '⏸' : '▶'}
        </button>
        <button
          onClick={onAbort}
          style={{
            padding: '10px 18px', borderRadius: '10px', border: '1px solid var(--border-1)',
            background: 'transparent', color: 'var(--text-30)',
            fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.08em',
            cursor: 'pointer', transition: 'color 150ms',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
        >
          ABBRECHEN
        </button>
        <button
          onClick={onDeepWork}
          style={{
            padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border-1)',
            background: 'transparent', color: 'var(--text-30)',
            fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.08em',
            cursor: 'pointer', transition: 'color 150ms',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-80)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
        >
          DEEP WORK
        </button>
      </div>
    </motion.div>
  )
}

// ── Break View ────────────────────────────────────────────────────────────────

function BreakView({
  remaining, total, sessionMode, currentRound, totalRounds, onSkip, onAbort,
}: {
  remaining: number; total: number
  sessionMode: SessionMode; currentRound: number; totalRounds: number
  onSkip: () => void; onAbort: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(135deg, #f0f7f2 0%, #e8f4ec 50%, #f0f7f2 100%)',
        zIndex: 100, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: 280, height: 280 }}>
        <ArcTimer remaining={remaining} total={total} deepWork={false} isBreak />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <span style={{
            fontFamily: 'DM Mono, monospace', fontSize: '48px', fontWeight: 300,
            letterSpacing: '-0.04em', color: 'var(--text-100)', lineHeight: 1,
          }}>
            {formatTime(remaining)}
          </span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(22,163,74,0.55)' }}>
            PAUSE
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '40px' }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 600, color: 'var(--text-100)', marginBottom: '8px' }}>
          {sessionMode === 'pomodoro' ? (
            currentRound < totalRounds ? `Runde ${currentRound} geschafft — durchatmen.` : 'Letzte Runde geschafft!'
          ) : 'Pause.'}
        </p>
        {sessionMode === 'pomodoro' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RoundDots current={currentRound} total={totalRounds} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={onSkip}
          style={{
            padding: '12px 28px', borderRadius: '12px',
            background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.25)',
            fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600,
            color: 'rgba(22,163,74,0.85)', cursor: 'pointer',
            letterSpacing: '-0.01em', transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(22,163,74,0.18)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(22,163,74,0.12)'
          }}
        >
          {sessionMode === 'pomodoro' && currentRound < totalRounds ? 'Pause überspringen →' : 'Fertig'}
        </button>
        <button
          onClick={onAbort}
          style={{
            padding: '10px 18px', borderRadius: '10px', border: '1px solid var(--border-1)',
            background: 'transparent', color: 'var(--text-30)',
            fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.08em',
            cursor: 'pointer', transition: 'color 150ms',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
        >
          ABBRECHEN
        </button>
      </div>
    </motion.div>
  )
}

// ── Sound Picker Modal ────────────────────────────────────────────────────────

function SoundPickerModal({ selected, onSelect, onConfirm, onCancel }: {
  selected: SoundType; onSelect: (s: SoundType) => void; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed', inset: 0, background: '#080810', zIndex: 200,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: '32px' }}>
        AMBIENT SOUND
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '300px', marginBottom: '40px' }}>
        {SOUNDS.map((s) => (
          <button
            key={s.id} onClick={() => onSelect(s.id)}
            style={{
              padding: '18px 10px', borderRadius: '12px',
              background: selected === s.id ? 'rgba(45,79,215,0.28)' : 'rgba(255,255,255,0.04)',
              border: selected === s.id ? '1px solid rgba(45,79,215,0.45)' : '1px solid rgba(255,255,255,0.08)',
              color: selected === s.id ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.35)',
              cursor: 'pointer', textAlign: 'center', transition: 'all 150ms',
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '8px', lineHeight: 1 }}>{s.icon}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.08em', lineHeight: 1.3 }}>{s.label}</div>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '12px 24px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
            fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
          }}
        >
          ZURÜCK
        </button>
        <button
          onClick={onConfirm}
          style={{
            padding: '12px 48px', background: 'rgba(45,79,215,0.55)',
            border: '1px solid rgba(45,79,215,0.4)', borderRadius: '12px',
            fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 600,
            color: 'rgba(255,255,255,0.9)', cursor: 'pointer', letterSpacing: '-0.01em',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(45,79,215,0.7)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(45,79,215,0.55)')}
        >
          STARTEN
        </button>
      </div>
    </motion.div>
  )
}

// ── Deep Work Screen ──────────────────────────────────────────────────────────

function DeepWorkScreen({
  aufgabe, kategorie, remaining, total,
  todos, onTodoToggle, audioEngine, selectedSound,
  volume, onVolumeChange, onExitRequest, onAbort,
}: {
  aufgabe: string; kategorie: string; remaining: number; total: number
  todos: Todo[]; onTodoToggle: (id: string, fertig: boolean) => void
  audioEngine: DeepWorkAudioEngine | null; selectedSound: SoundType
  volume: number; onVolumeChange: (v: number) => void
  onExitRequest: () => void; onAbort: () => void
}) {
  const [showTodos, setShowTodos] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setShowExitConfirm(true) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const soundLabel = SOUNDS.find((s) => s.id === selectedSound)?.label ?? ''
  const soundIcon  = SOUNDS.find((s) => s.id === selectedSound)?.icon ?? ''

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ position: 'fixed', inset: 0, background: '#080810', zIndex: 100, overflow: 'hidden' }}
    >
      <DeepWorkVisualizer audioEngine={audioEngine} isActive={selectedSound !== 'off'} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', zIndex: 1 }}>
        <div style={{ position: 'relative', width: 280, height: 280 }}>
          <ArcTimer remaining={remaining} total={total} deepWork />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '48px', fontWeight: 300, letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.9)', lineHeight: 1 }}>
              {formatTime(remaining)}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '48px' }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', maxWidth: '360px' }}>
            {aufgabe}
          </p>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.22)' }}>
            {kategorie.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={onAbort}
            style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.22)', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.08em', cursor: 'pointer', transition: 'color 150ms' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.22)')}
          >
            ABBRECHEN
          </button>
          <button onClick={() => { setShowVolume((v) => !v); setShowTodos(false) }}
            style={{ padding: '10px 14px', borderRadius: '10px', border: showVolume ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.08)', background: showVolume ? 'rgba(255,255,255,0.08)' : 'transparent', color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Mono, monospace', fontSize: '13px', cursor: 'pointer', transition: 'all 150ms' }}
          >◎</button>
          <button onClick={() => { setShowTodos((v) => !v); setShowVolume(false) }}
            style={{ padding: '10px 14px', borderRadius: '10px', border: showTodos ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.08)', background: showTodos ? 'rgba(255,255,255,0.08)' : 'transparent', color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Mono, monospace', fontSize: '13px', cursor: 'pointer', transition: 'all 150ms' }}
          >✓</button>
          {selectedSound !== 'off' && (
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.18)' }}>
              {soundIcon} {soundLabel}
            </span>
          )}
        </div>

        <p style={{ marginTop: '24px', fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.12)' }}>
          ESC — BEENDEN
        </p>
      </div>

      <AnimatePresence>
        {showVolume && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}
            style={{ position: 'absolute', bottom: '120px', left: '50%', transform: 'translateX(-50%)', zIndex: 5, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px 20px', width: '200px' }}
          >
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>LAUTSTÄRKE</p>
            <input type="range" className="deep-work-slider" min={0} max={1} step={0.02} value={volume} onChange={(e) => onVolumeChange(parseFloat(e.target.value))} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTodos && (
          <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 272, background: 'rgba(255,255,255,0.035)', borderLeft: '1px solid rgba(255,255,255,0.07)', padding: '40px 20px', overflowY: 'auto', zIndex: 5 }}
          >
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: '24px' }}>HEUTE</p>
            {todos.length === 0 && <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>Keine offenen Todos.</p>}
            {todos.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => onTodoToggle(t.id, !t.fertig)}
                  style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, border: t.fertig ? '1px solid rgba(45,79,215,0.6)' : '1px solid rgba(255,255,255,0.2)', background: t.fertig ? 'rgba(45,79,215,0.5)' : 'transparent', cursor: 'pointer', marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
                >
                  {t.fertig && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.06em', color: t.prioritaet === 1 ? '#d97706' : t.prioritaet === 2 ? 'rgba(45,79,215,0.7)' : 'rgba(255,255,255,0.2)', marginRight: '6px' }}>P{t.prioritaet}</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', color: t.fertig ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', textDecoration: t.fertig ? 'line-through' : 'none', transition: 'color 150ms', wordBreak: 'break-word' }}>{t.text}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,16,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}
          >
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} transition={{ duration: 0.18 }}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px 40px', textAlign: 'center' }}
            >
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>Deep Work beenden?</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '28px' }}>Timer läuft weiter im normalen Modus.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={() => setShowExitConfirm(false)} style={{ padding: '10px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', fontFamily: 'Syne, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Zurück</button>
                <button onClick={onExitRequest} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>Beenden</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Completion / Post-Focus View ──────────────────────────────────────────────

function CompletionView({
  aufgabe, sessionDurationMin, notiz, setNotiz,
  sessionMode, currentRound, totalRounds, breakMin,
  singleBreakMin, setSingleBreakMin,
  onStartBreak, onNextSession, onDone,
}: {
  aufgabe: string; sessionDurationMin: number; notiz: string; setNotiz: (v: string) => void
  sessionMode: SessionMode; currentRound: number; totalRounds: number; breakMin: number
  singleBreakMin: number; setSingleBreakMin: (v: number) => void
  onStartBreak: () => void; onNextSession: () => void; onDone: () => void
}) {
  const isPomodoro = sessionMode === 'pomodoro'
  const isLastRound = currentRound >= totalRounds
  const allDone = isPomodoro && isLastRound

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf4 50%, #f0f2f5 100%)',
        zIndex: 100, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '32px',
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(22,163,74,0.1)', border: '1.5px solid rgba(22,163,74,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <motion.path d="M8 16 L13 21 L24 10" stroke="var(--positive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }} />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{ textAlign: 'center', maxWidth: '420px', width: '100%' }}
      >
        {/* Title */}
        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 600, color: 'var(--text-100)', letterSpacing: '-0.015em', marginBottom: '6px' }}>
          {allDone
            ? `Alle ${totalRounds} Runden geschafft!`
            : isPomodoro
            ? `Runde ${currentRound} von ${totalRounds}.`
            : `${sessionDurationMin} Minuten.`}
        </p>
        <p className="text-caption" style={{ marginBottom: '8px' }}>{aufgabe}</p>

        {/* Pomodoro progress */}
        {isPomodoro && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <RoundDots current={currentRound} total={totalRounds} />
          </div>
        )}

        {/* Notiz */}
        <div style={{ marginBottom: '24px' }}>
          <p className="text-section-label" style={{ marginBottom: '8px' }}>Notiz (optional)</p>
          <textarea className="proc-input" value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="Kurze Notiz zur Session..." rows={2} style={{ resize: 'none' }} />
        </div>

        {/* Pomodoro mid-session: break or skip */}
        {isPomodoro && !isLastRound && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '0' }}>
            <button
              onClick={onStartBreak}
              style={{
                padding: '13px 28px', borderRadius: '12px',
                background: 'var(--accent-proc)', color: '#fff', border: 'none',
                fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 600,
                cursor: 'pointer', letterSpacing: '-0.01em', transition: 'background 150ms',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-light)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-proc)')}
            >
              Pause starten ({breakMin} min) →
            </button>
            <button
              onClick={onNextSession}
              style={{
                padding: '11px 20px', background: 'rgba(255,255,255,0.8)',
                border: '1px solid var(--border-1)', borderRadius: '10px',
                fontFamily: 'Syne, sans-serif', fontSize: '14px', color: 'var(--text-80)',
                cursor: 'pointer', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-sm)',
              }}
            >
              Runde {currentRound + 1} direkt starten
            </button>
            <button
              onClick={onDone}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.06em',
                color: 'var(--text-30)', padding: '4px', transition: 'color 150ms',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
            >
              SESSION BEENDEN
            </button>
          </div>
        )}

        {/* Single mode or last pomodoro round: break option + done */}
        {(!isPomodoro || isLastRound) && (
          <>
            {/* Break picker */}
            <div style={{ marginBottom: '20px', padding: '16px 18px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-0)', borderRadius: '12px' }}>
              <p className="text-section-label" style={{ marginBottom: '10px' }}>Kurze Pause einlegen?</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {BREAK_DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSingleBreakMin(d)}
                    style={{
                      padding: '6px 14px', borderRadius: '20px',
                      border: singleBreakMin === d ? 'none' : '1px solid var(--border-1)',
                      background: singleBreakMin === d ? 'var(--accent-proc)' : 'rgba(255,255,255,0.7)',
                      color: singleBreakMin === d ? '#fff' : 'var(--text-55)',
                      fontFamily: 'Syne, sans-serif', fontSize: '13px',
                      fontWeight: singleBreakMin === d ? 600 : 400,
                      cursor: 'pointer', transition: 'all 150ms',
                    }}
                  >
                    {d} min
                  </button>
                ))}
              </div>
              <button
                onClick={onStartBreak}
                style={{
                  width: '100%', padding: '10px',
                  background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.22)',
                  borderRadius: '10px', fontFamily: 'Syne, sans-serif', fontSize: '14px',
                  fontWeight: 600, color: 'rgba(22,163,74,0.8)', cursor: 'pointer', transition: 'all 150ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(22,163,74,0.16)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(22,163,74,0.10)'
                }}
              >
                {singleBreakMin} min Pause starten
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {!isPomodoro && (
                <button onClick={onNextSession}
                  style={{ padding: '11px 24px', background: 'var(--accent-proc)', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em' }}
                >
                  Nächste Session
                </button>
              )}
              <button onClick={onDone}
                style={{ padding: '11px 20px', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--border-1)', borderRadius: '10px', fontFamily: 'Syne, sans-serif', fontSize: '14px', color: 'var(--text-80)', cursor: 'pointer', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-sm)' }}
              >
                Fertig
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FocusPage() {
  const [timerState, setTimerState] = useState<State>('setup')
  const [aufgabe, setAufgabe] = useState('')
  const [kategorie, setKategorie] = useState<FocusSession['kategorie'] | ''>('')
  const [dauer, setDauer] = useState(25)
  const [remaining, setRemaining] = useState(0)
  const [total, setTotal] = useState(0)
  const [notiz, setNotiz] = useState('')
  const [gestartetAt, setGestartetAt] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pomodoro
  const [sessionMode, setSessionMode] = useState<SessionMode>('single')
  const [pomodoroConfig, setPomodoroConfig] = useState<PomodoroConfig>(DEFAULT_POMODORO)
  const [currentRound, setCurrentRound] = useState(1)
  const [singleBreakMin, setSingleBreakMin] = useState(10)
  const [sessionDurationMin, setSessionDurationMin] = useState(25)

  // Deep work
  const [soundPickerIntent, setSoundPickerIntent] = useState<'fromSetup' | 'fromTimer' | null>(null)
  const [selectedSound, setSelectedSound] = useState<SoundType>('brown')
  const [volume, setVolume] = useState(0.6)
  const [deepWorkTodos, setDeepWorkTodos] = useState<Todo[]>([])
  const audioRef = useRef<DeepWorkAudioEngine | null>(null)

  // Ref-based callbacks so interval never has stale state
  const handleBreakDoneRef = useRef<() => void>(() => {})
  const handleFocusDoneRef = useRef<() => void>(() => {})

  handleFocusDoneRef.current = () => {
    const durMin = sessionMode === 'pomodoro' ? pomodoroConfig.focusMin : dauer
    saveSession({
      aufgabe, kategorie, dauer_minuten: durMin,
      abgeschlossen: true, abgebrochen: false,
      notiz: notiz || null,
      gestartet_at: gestartetAt, beendet_at: new Date().toISOString(),
    })
    setTimerState('done')
  }

  handleBreakDoneRef.current = () => {
    if (sessionMode === 'pomodoro' && currentRound < pomodoroConfig.rounds) {
      const nextRound = currentRound + 1
      const secs = pomodoroConfig.focusMin * 60
      setCurrentRound(nextRound)
      setTotal(secs)
      setRemaining(secs)
      setGestartetAt(new Date().toISOString())
      setNotiz('')
      setTimerState('running')
    } else {
      setTimerState('setup')
    }
  }

  // Tab title
  useEffect(() => {
    if (['running', 'paused', 'deepwork', 'break'].includes(timerState)) {
      document.title = `${formatTime(remaining)} — ${timerState === 'break' ? 'Pause' : aufgabe || 'Fokus'}`
    } else {
      document.title = 'proc. 2.0'
    }
    return () => { document.title = 'proc. 2.0' }
  }, [remaining, timerState, aufgabe])

  // Countdown — handles focus, deepwork, and break
  useEffect(() => {
    const isActive = timerState === 'running' || timerState === 'deepwork' || timerState === 'break'
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    const isBreakPhase = timerState === 'break'
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          if (isBreakPhase) {
            handleBreakDoneRef.current()
          } else {
            handleFocusDoneRef.current()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState])

  // Cleanup audio
  useEffect(() => { return () => { audioRef.current?.dispose() } }, [])

  function startTimer(deepWork = false) {
    const mins = sessionMode === 'pomodoro' ? pomodoroConfig.focusMin : dauer
    setSessionDurationMin(mins)
    const totalSecs = mins * 60
    setTotal(totalSecs)
    setRemaining(totalSecs)
    setGestartetAt(new Date().toISOString())
    setNotiz('')
    setCurrentRound(1)
    setTimerState(deepWork ? 'deepwork' : 'running')
  }

  function startBreak(breakMin: number) {
    const secs = breakMin * 60
    setTotal(secs)
    setRemaining(secs)
    setTimerState('break')
  }

  function handleAbort() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timerState !== 'break') {
      const durMin = sessionMode === 'pomodoro' ? pomodoroConfig.focusMin : dauer
      saveSession({
        aufgabe, kategorie, dauer_minuten: durMin,
        abgeschlossen: false, abgebrochen: true,
        notiz: null, gestartet_at: gestartetAt, beendet_at: new Date().toISOString(),
      })
    }
    setTimerState('setup')
    setCurrentRound(1)
  }

  function handleCompletionDone() {
    setTimerState('setup')
    setAufgabe('')
    setKategorie('')
    setNotiz('')
    setCurrentRound(1)
  }

  function handleNextSession() {
    if (sessionMode === 'pomodoro' && currentRound < pomodoroConfig.rounds) {
      const nextRound = currentRound + 1
      const secs = pomodoroConfig.focusMin * 60
      setCurrentRound(nextRound)
      setTotal(secs)
      setRemaining(secs)
      setGestartetAt(new Date().toISOString())
      setNotiz('')
      setTimerState('running')
    } else {
      setTimerState('setup')
      setNotiz('')
      setCurrentRound(1)
    }
  }

  async function loadDeepWorkTodos() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('todos').select('*')
      .eq('user_id', user.id).eq('fertig', false)
      .or(`kategorie.eq.heute,faellig_am.eq.${today}`)
      .order('prioritaet', { ascending: true }).limit(12)
    if (data) setDeepWorkTodos(data as Todo[])
  }

  function handleSoundPickerConfirm() {
    if (!audioRef.current) audioRef.current = new DeepWorkAudioEngine()
    audioRef.current.play(selectedSound)
    audioRef.current.setVolume(volume)
    if (soundPickerIntent === 'fromSetup') {
      startTimer(true)
    } else {
      setTimerState('deepwork')
    }
    void loadDeepWorkTodos()
    setSoundPickerIntent(null)
  }

  function handleTodoToggle(id: string, fertig: boolean) {
    setDeepWorkTodos((prev) => prev.map((t) => t.id === id ? { ...t, fertig } : t))
    const supabase = createClient()
    void supabase.from('todos').update({ fertig }).eq('id', id)
  }

  return (
    <>
      <AnimatePresence>
        {soundPickerIntent && (
          <SoundPickerModal
            key="sound-picker" selected={selectedSound} onSelect={setSelectedSound}
            onConfirm={handleSoundPickerConfirm}
            onCancel={() => setSoundPickerIntent(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {timerState === 'setup' && (
          <SetupView
            key="setup" aufgabe={aufgabe} setAufgabe={setAufgabe}
            kategorie={kategorie} setKategorie={(v) => setKategorie(v)}
            dauer={dauer} setDauer={setDauer}
            sessionMode={sessionMode} setSessionMode={setSessionMode}
            pomodoroConfig={pomodoroConfig} setPomodoroConfig={setPomodoroConfig}
            onStart={() => startTimer(false)}
            onDeepWork={() => setSoundPickerIntent('fromSetup')}
          />
        )}

        {(timerState === 'running' || timerState === 'paused') && (
          <TimerView
            key="timer" aufgabe={aufgabe} kategorie={kategorie}
            remaining={remaining} total={total} state={timerState as 'running' | 'paused'}
            sessionMode={sessionMode} currentRound={currentRound} totalRounds={pomodoroConfig.rounds}
            onPause={() => setTimerState('paused')}
            onResume={() => setTimerState('running')}
            onAbort={handleAbort}
            onDeepWork={() => setSoundPickerIntent('fromTimer')}
          />
        )}

        {timerState === 'break' && (
          <BreakView
            key="break" remaining={remaining} total={total}
            sessionMode={sessionMode} currentRound={currentRound} totalRounds={pomodoroConfig.rounds}
            onSkip={() => handleBreakDoneRef.current()}
            onAbort={handleAbort}
          />
        )}

        {timerState === 'deepwork' && (
          <DeepWorkScreen
            key="deepwork" aufgabe={aufgabe} kategorie={kategorie}
            remaining={remaining} total={total}
            todos={deepWorkTodos} onTodoToggle={handleTodoToggle}
            audioEngine={audioRef.current} selectedSound={selectedSound}
            volume={volume}
            onVolumeChange={(v) => { setVolume(v); audioRef.current?.setVolume(v) }}
            onExitRequest={() => { audioRef.current?.stop(); setTimerState('running') }}
            onAbort={() => { audioRef.current?.stop(); handleAbort() }}
          />
        )}

        {timerState === 'done' && (
          <CompletionView
            key="done" aufgabe={aufgabe} sessionDurationMin={sessionDurationMin}
            notiz={notiz} setNotiz={setNotiz}
            sessionMode={sessionMode} currentRound={currentRound} totalRounds={pomodoroConfig.rounds}
            breakMin={sessionMode === 'pomodoro' ? pomodoroConfig.breakMin : singleBreakMin}
            singleBreakMin={singleBreakMin} setSingleBreakMin={setSingleBreakMin}
            onStartBreak={() => startBreak(sessionMode === 'pomodoro' ? pomodoroConfig.breakMin : singleBreakMin)}
            onNextSession={handleNextSession}
            onDone={handleCompletionDone}
          />
        )}
      </AnimatePresence>

      {timerState === 'setup' && (
        <motion.div variants={pageVariants} initial="initial" animate="animate" style={{ position: 'relative' }} />
      )}
    </>
  )
}
