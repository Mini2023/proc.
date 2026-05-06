'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 10 10M4.2 4.3C2.8 5.3 1.7 6.7 1 8c1.1 2.3 3.7 5 7 5 1.3 0 2.6-.4 3.7-1.1M7 3.1C7.3 3 7.6 3 8 3c3.3 0 5.9 2.7 7 5-.4.9-1 1.8-1.8 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [checking, setChecking] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
      } else {
        setChecking(false)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (password.length < 6) { setError('Passwort muss mindestens 6 Zeichen lang sein.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/'), 2200)
  }

  if (checking) return null

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf4 50%, #f0f2f5 100%)',
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '36px', textAlign: 'center' }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '22px', fontWeight: 500, color: 'var(--accent-proc)', letterSpacing: '-0.01em' }}>
            p.
          </span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '22px', fontWeight: 500, color: 'var(--text-30)', letterSpacing: '-0.01em' }}>
            roc. 2.0
          </span>
        </div>

        <div className="glass-card" style={{ padding: '32px 32px 36px' }}>
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 600, color: 'var(--text-100)', letterSpacing: '-0.015em', marginBottom: '6px' }}>
                  Neues Passwort.
                </p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--text-30)', letterSpacing: '0.03em', marginBottom: '28px' }}>
                  Wähle ein sicheres Passwort für deinen Account.
                </p>

                <form onSubmit={handleSubmit}>
                  {/* New password */}
                  <div style={{ marginBottom: '16px' }}>
                    <p className="text-section-label" style={{ marginBottom: '8px' }}>Neues Passwort</p>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="min. 6 Zeichen"
                        className="proc-input"
                        autoFocus
                        style={{ paddingRight: '44px' }}
                      />
                      <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-30)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 150ms' }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-80)')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
                        >
                          <EyeIcon visible={showPassword} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Confirm */}
                  <div style={{ marginBottom: '20px' }}>
                    <p className="text-section-label" style={{ marginBottom: '8px' }}>Passwort bestätigen</p>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="proc-input"
                        style={{ paddingRight: '44px' }}
                      />
                      <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-30)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 150ms' }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-80)')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
                        >
                          <EyeIcon visible={showConfirm} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--danger)', marginBottom: '14px', letterSpacing: '0.02em' }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !password || !confirm}
                    style={{
                      width: '100%',
                      padding: '13px 24px',
                      background: loading || !password || !confirm
                        ? 'rgba(45,79,215,0.38)'
                        : 'linear-gradient(135deg, #3251e8 0%, #2640c8 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontFamily: 'Syne, sans-serif',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: loading || !password || !confirm ? 'not-allowed' : 'pointer',
                      transition: 'all 150ms cubic-bezier(0.16,1,0.3,1)',
                      letterSpacing: '-0.01em',
                      boxShadow: loading || !password || !confirm
                        ? 'none'
                        : '0 1px 0 rgba(255,255,255,0.2) inset, 0 4px 12px rgba(45,79,215,0.35)',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && password && confirm)
                        (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #3d5ef5 0%, #2d4de0 100%)'
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && password && confirm)
                        (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #3251e8 0%, #2640c8 100%)'
                    }}
                  >
                    {loading ? 'Speichern…' : 'Passwort speichern →'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(22,163,74,0.10)',
                    border: '1px solid rgba(22,163,74,0.20)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    fontSize: '18px',
                  }}
                >
                  ✓
                </div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 600, color: 'var(--text-100)', letterSpacing: '-0.015em', marginBottom: '8px' }}>
                  Passwort gesetzt.
                </p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--text-30)', letterSpacing: '0.03em' }}>
                  Du wirst in Kürze weitergeleitet…
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
