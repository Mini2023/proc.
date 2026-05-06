'use client'

import { useState, useMemo } from 'react'
import type { Klausur } from '@/types'

interface NoteCalcProps {
  klausuren: Klausur[]
}

export function NoteCalc({ klausuren }: NoteCalcProps) {
  const [hypothFach, setHypothFach] = useState('')
  const [hypothNote, setHypothNote] = useState('')

  const benotet = klausuren.filter(
    (k) => k.note !== null && k.note !== undefined
  )

  const faecher = useMemo(() => {
    const set = new Set(klausuren.map((k) => k.fach))
    return Array.from(set).sort()
  }, [klausuren])

  const currentAvg = useMemo(() => {
    if (benotet.length === 0) return null
    return benotet.reduce((sum, k) => sum + k.note!, 0) / benotet.length
  }, [benotet])

  const projectedAvg = useMemo(() => {
    const note = parseFloat(hypothNote)
    if (isNaN(note) || note < 1 || note > 6) return null
    const allNotes = [...benotet.map((k) => k.note!), note]
    return allNotes.reduce((sum, n) => sum + n, 0) / allNotes.length
  }, [benotet, hypothNote])

  const delta = useMemo(() => {
    if (currentAvg === null || projectedAvg === null) return null
    return projectedAvg - currentAvg
  }, [currentAvg, projectedAvg])

  return (
    <div className="glass-card" style={{ padding: '24px 28px', marginTop: '32px' }}>
      <p className="text-section-label" style={{ marginBottom: '16px' }}>
        Notenrechner
      </p>

      <p
        style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '14px',
          color: 'var(--text-55)',
          marginBottom: '20px',
        }}
      >
        Wenn ich in{' '}
        <select
          value={hypothFach}
          onChange={(e) => setHypothFach(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid var(--border-1)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontFamily: 'Syne, sans-serif',
            fontSize: '14px',
            color: 'var(--text-80)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">einem Fach</option>
          {faecher.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>{' '}
        eine{' '}
        <input
          type="number"
          step="0.1"
          min="1"
          max="6"
          value={hypothNote}
          onChange={(e) => setHypothNote(e.target.value)}
          placeholder="2.0"
          style={{
            width: '64px',
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid var(--border-1)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontFamily: 'DM Mono, monospace',
            fontSize: '14px',
            color: 'var(--text-80)',
            outline: 'none',
            textAlign: 'center',
          }}
        />{' '}
        schreibe, wird mein Schnitt...
      </p>

      {/* Result */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {projectedAvg !== null ? (
          <>
            <span
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '40px',
                fontWeight: 300,
                letterSpacing: '-0.04em',
                color:
                  projectedAvg <= 1.5
                    ? 'var(--positive)'
                    : projectedAvg <= 2.5
                    ? 'var(--text-100)'
                    : projectedAvg <= 3.5
                    ? 'var(--warning)'
                    : 'var(--danger)',
              }}
            >
              {projectedAvg.toFixed(2)}
            </span>

            {delta !== null && (
              <span
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '14px',
                  color: delta > 0 ? 'var(--danger)' : 'var(--positive)',
                }}
              >
                {delta > 0 ? '+' : ''}
                {delta.toFixed(2)}
              </span>
            )}

            {currentAvg !== null && (
              <span className="text-caption">
                (aktuell {currentAvg.toFixed(2)})
              </span>
            )}
          </>
        ) : currentAvg !== null ? (
          <span
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '40px',
              fontWeight: 300,
              letterSpacing: '-0.04em',
              color: 'var(--text-30)',
            }}
          >
            {currentAvg.toFixed(2)}
          </span>
        ) : (
          <span className="text-caption">Noch keine benoteten Klausuren</span>
        )}
      </div>
    </div>
  )
}
