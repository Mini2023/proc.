'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfile } from '@/lib/hooks/useProfile'

type Step = 1 | 2 | 3

export function OnboardingModal() {
  const { profile, loading, updateProfile } = useProfile()
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [klasse, setKlasse] = useState('')
  const [schule, setSchule] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  if (loading || !profile || profile.onboarding_done || done) return null

  async function handleFinish() {
    setSaving(true)
    await updateProfile({
      display_name: name.trim() || null,
      klasse: klasse.trim() || null,
      schule: schule.trim() || null,
      onboarding_done: true,
    })
    setSaving(false)
    setDone(true)
  }

  const canNext1 = name.trim().length > 0
  const canNext2 = true // optional

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(240,242,245,0.88)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px 40px 36px',
        }}
      >
        {/* Logo */}
        <p
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '18px',
            fontWeight: 500,
            color: 'var(--accent-proc)',
            marginBottom: '32px',
            letterSpacing: '-0.01em',
          }}
        >
          p.<span style={{ color: 'var(--text-30)' }}>roc. 2.0</span>
        </p>

        {/* Step indicators */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '28px',
          }}
        >
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                height: '2px',
                flex: 1,
                borderRadius: '1px',
                background:
                  s <= step ? 'var(--accent-proc)' : 'var(--border-0)',
                transition: 'background 300ms',
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--text-100)',
                  letterSpacing: '-0.02em',
                  marginBottom: '8px',
                }}
              >
                Willkommen.
              </h2>
              <p
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '15px',
                  color: 'var(--text-55)',
                  marginBottom: '28px',
                  lineHeight: 1.6,
                }}
              >
                Wie soll ich dich nennen?
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canNext1 && setStep(2)}
                placeholder="Dein Name"
                autoFocus
                className="proc-input"
                style={{ width: '100%', marginBottom: '20px' }}
              />
              <button
                onClick={() => setStep(2)}
                disabled={!canNext1}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: canNext1 ? 'var(--accent-proc)' : 'rgba(45,79,215,0.3)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '15px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  cursor: canNext1 ? 'pointer' : 'not-allowed',
                  transition: 'background 150ms',
                }}
              >
                Weiter →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--text-100)',
                  letterSpacing: '-0.02em',
                  marginBottom: '8px',
                }}
              >
                Klasse oder Semester?
              </h2>
              <p
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '15px',
                  color: 'var(--text-55)',
                  marginBottom: '28px',
                  lineHeight: 1.6,
                }}
              >
                Optional — hilft mir beim Planen.
              </p>
              <input
                type="text"
                value={klasse}
                onChange={(e) => setKlasse(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setStep(3)}
                placeholder="z.B. Q11, 12. Klasse, 3. Semester"
                autoFocus
                className="proc-input"
                style={{ width: '100%', marginBottom: '20px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    padding: '13px 20px',
                    background: 'transparent',
                    color: 'var(--text-55)',
                    border: '1px solid var(--border-1)',
                    borderRadius: '10px',
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  ←
                </button>
                <button
                  onClick={() => setStep(3)}
                  style={{
                    flex: 1,
                    padding: '13px',
                    background: 'var(--accent-proc)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '15px',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    cursor: 'pointer',
                    transition: 'background 150ms',
                  }}
                >
                  Weiter →
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--text-100)',
                  letterSpacing: '-0.02em',
                  marginBottom: '8px',
                }}
              >
                Schule oder Uni?
              </h2>
              <p
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '15px',
                  color: 'var(--text-55)',
                  marginBottom: '28px',
                  lineHeight: 1.6,
                }}
              >
                Auch optional. Das war&apos;s — versprochen.
              </p>
              <input
                type="text"
                value={schule}
                onChange={(e) => setSchule(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !saving && handleFinish()}
                placeholder="Name deiner Schule oder Universität"
                autoFocus
                className="proc-input"
                style={{ width: '100%', marginBottom: '20px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    padding: '13px 20px',
                    background: 'transparent',
                    color: 'var(--text-55)',
                    border: '1px solid var(--border-1)',
                    borderRadius: '10px',
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  ←
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '13px',
                    background: saving
                      ? 'rgba(45,79,215,0.5)'
                      : 'var(--accent-proc)',
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
                  {saving ? 'Speichere...' : 'Loslegen →'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
