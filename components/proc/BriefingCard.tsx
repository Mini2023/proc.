'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// ── Jarvis loader ─────────────────────────────────────────────────────────────

function JarvisLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 0 16px' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
          style={{
            height: '1px',
            width: i === 0 ? '48px' : i === 1 ? '32px' : '40px',
            background: 'var(--accent-proc)',
          }}
        />
      ))}
      <p
        className="text-section-label"
        style={{ marginTop: '8px', color: 'var(--text-30)' }}
      >
        Analysiere deinen Tag...
      </p>
    </div>
  )
}

// ── BriefingCard ──────────────────────────────────────────────────────────────

interface BriefingCardProps {
  typ: 'morning' | 'evening'
  cachedText?: string        // already saved briefing — skip AI call
  onDone: (text: string) => void
}

export function BriefingCard({ typ, cachedText, onDone }: BriefingCardProps) {
  const [text, setText] = useState(cachedText ?? '')
  const [streaming, setStreaming] = useState(!cachedText)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (cachedText) return // Nothing to do

    const controller = new AbortController()
    abortRef.current = controller

    async function stream() {
      try {
        const response = await fetch(`/api/briefing/${typ}`, {
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          const fallback = await response.text()
          setText(fallback)
          setStreaming(false)
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setText((prev) => prev + decoder.decode(value, { stream: true }))
        }

        setStreaming(false)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError('Verbindung unterbrochen.')
        setStreaming(false)
      }
    }

    stream()

    return () => controller.abort()
  }, [typ, cachedText])

  const isLoading = streaming && text.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card"
      style={{ padding: '28px 32px' }}
    >
      {isLoading && <JarvisLoader />}

      {error && (
        <p
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '12px',
            color: 'var(--danger)',
            marginBottom: '12px',
          }}
        >
          {error}
        </p>
      )}

      {text && (
        <p
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '17px',
            color: 'var(--text-80)',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
          {streaming && <span className="cursor-blink"> ▋</span>}
        </p>
      )}

      {!streaming && text && !cachedText && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{ marginTop: '24px' }}
        >
          <button
            onClick={() => onDone(text)}
            style={{
              padding: '10px 24px',
              background: 'var(--accent-proc)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'Syne, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              transition: 'background 150ms',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                'var(--accent-light)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                'var(--accent-proc)')
            }
          >
            Gelesen →
          </button>
        </motion.div>
      )}

      {cachedText && (
        <p
          className="text-caption"
          style={{ marginTop: '16px', color: 'var(--text-30)' }}
        >
          {typ === 'morning' ? 'Morning Briefing' : 'Evening Review'} — bereits gelesen
        </p>
      )}
    </motion.div>
  )
}
