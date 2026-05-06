'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { pageVariants, staggerContainer, staggerItem } from '@/lib/animations'
import { MorningRitual } from '@/components/proc/MorningRitual'
import { EveningRitual } from '@/components/proc/EveningRitual'
import { createClient } from '@/lib/supabase/client'
import type { Briefing } from '@/types'

type Mode = 'morning' | 'between' | 'evening' | 'loading'

function getMode(): Mode {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h >= 17) return 'evening'
  return 'between'
}

function ReadonlyMorningView({ briefing }: { briefing: Briefing }) {
  return (
    <div className="glass-card" style={{ padding: '24px 28px' }}>
      <p className="text-section-label" style={{ marginBottom: '12px' }}>
        Morning Briefing — bereits abgeschlossen
      </p>
      {briefing.inhalt && (
        <p
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '16px',
            color: 'var(--text-80)',
            lineHeight: 1.8,
            marginBottom: briefing.bestaetigte_tasks?.length ? '16px' : '0',
          }}
        >
          {briefing.inhalt}
        </p>
      )}
      {briefing.bestaetigte_tasks && briefing.bestaetigte_tasks.length > 0 && (
        <div>
          <p className="text-section-label" style={{ marginBottom: '8px' }}>
            Tasks heute
          </p>
          {briefing.bestaetigte_tasks.map((t, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 0',
                borderBottom: '1px solid var(--border-0)',
              }}
            >
              <span
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '10px',
                  color:
                    t.prioritaet === 1
                      ? 'var(--danger)'
                      : t.prioritaet === 2
                      ? 'var(--accent-proc)'
                      : 'var(--text-30)',
                }}
              >
                P{t.prioritaet}
              </span>
              <span
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '14px',
                  color: 'var(--text-80)',
                }}
              >
                {t.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReadonlyEveningView({ briefing }: { briefing: Briefing }) {
  return (
    <div className="glass-card" style={{ padding: '24px 28px' }}>
      <p className="text-section-label" style={{ marginBottom: '12px' }}>
        Evening Review — bereits abgeschlossen
      </p>
      {briefing.ki_feedback && (
        <p
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '16px',
            color: 'var(--text-80)',
            lineHeight: 1.8,
          }}
        >
          {briefing.ki_feedback}
        </p>
      )}
      {briefing.morgen_hinweis && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: 'var(--accent-soft)',
            borderRadius: '8px',
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
            {briefing.morgen_hinweis}
          </p>
        </div>
      )}
    </div>
  )
}

function ModeHint() {
  return (
    <div className="glass-card" style={{ padding: '24px 28px' }}>
      <p className="text-section-label" style={{ marginBottom: '8px' }}>
        Abend-Review
      </p>
      <p
        style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '15px',
          color: 'var(--text-55)',
        }}
      >
        Das Evening Review wird ab 17 Uhr verfügbar.
      </p>
    </div>
  )
}

export default function BriefingPage() {
  const [mode, setMode] = useState<Mode>('loading')
  const [morningBriefing, setMorningBriefing] = useState<Briefing | null>(null)
  const [eveningBriefing, setEveningBriefing] = useState<Briefing | null>(null)
  const [gestrigeSummary, setGestrigeSummary] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    setMode(getMode())
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      const gestern = new Date()
      gestern.setDate(gestern.getDate() - 1)
      const gesternStr = gestern.toISOString().split('T')[0]

      const [todayRes, gesternRes] = await Promise.all([
        supabase
          .from('briefings')
          .select('*')
          .eq('user_id', user.id)
          .eq('datum', today),
        supabase
          .from('briefings')
          .select('morgen_hinweis')
          .eq('user_id', user.id)
          .eq('datum', gesternStr)
          .eq('typ', 'evening')
          .maybeSingle(),
      ])

      if (todayRes.data) {
        for (const b of todayRes.data) {
          if (b.typ === 'morning') setMorningBriefing(b as Briefing)
          if (b.typ === 'evening') setEveningBriefing(b as Briefing)
        }
      }

      if (gesternRes.data?.morgen_hinweis) {
        setGestrigeSummary(gesternRes.data.morgen_hinweis)
      }

      setDataLoaded(true)
    }

    load()
  }, [])

  if (mode === 'loading' || !dataLoaded) return null

  const showMorning = mode === 'morning' || mode === 'between' || mode === 'evening'
  const showEvening = mode === 'evening'

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 className="text-headline" style={{ marginBottom: '4px' }}>
          {mode === 'morning'
            ? 'Morning Briefing.'
            : mode === 'evening'
            ? 'Evening Review.'
            : 'Briefing.'}
        </h1>
        <p className="text-section-label">
          {new Date().toLocaleDateString('de-DE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate">
        {/* Morning section */}
        {showMorning && (
          <motion.div variants={staggerItem} style={{ marginBottom: '32px' }}>
            {(mode === 'between' || mode === 'evening') && (
              <p className="text-section-label" style={{ marginBottom: '12px' }}>
                Morning Briefing
              </p>
            )}

            {morningBriefing ? (
              <ReadonlyMorningView briefing={morningBriefing} />
            ) : (
              <MorningRitual
                gestrigeSummary={gestrigeSummary}
                onComplete={(b) => setMorningBriefing(b as Briefing)}
              />
            )}
          </motion.div>
        )}

        {/* Between: hint that evening is not yet available */}
        {mode === 'between' && (
          <motion.div variants={staggerItem}>
            <ModeHint />
          </motion.div>
        )}

        {/* Evening section */}
        {showEvening && (
          <motion.div variants={staggerItem} style={{ marginTop: morningBriefing ? '40px' : '0' }}>
            <p className="text-section-label" style={{ marginBottom: '12px' }}>
              Evening Review
            </p>

            {eveningBriefing ? (
              <ReadonlyEveningView briefing={eveningBriefing} />
            ) : (
              <EveningRitual
                onComplete={(b) => setEveningBriefing(b as Briefing)}
              />
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
