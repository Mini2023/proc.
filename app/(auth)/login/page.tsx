'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = 'magic' | 'password' | 'register'
type PwView = 'login' | 'reset' | 'reset-sent'
type RegView = 'form' | 'sent'

// ── Error mapping ─────────────────────────────────────────────────────────────

function mapError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid email or password'))
    return 'E-Mail oder Passwort falsch.'
  if (m.includes('email not confirmed'))
    return 'E-Mail noch nicht bestätigt. Prüfe dein Postfach.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Zu viele Versuche — bitte kurz warten.'
  if (m.includes('user not found'))
    return 'Kein Account mit dieser E-Mail gefunden.'
  if (m.includes('user already registered') || m.includes('already been registered') || m.includes('already registered'))
    return 'Diese E-Mail ist bereits registriert.'
  if (m.includes('password should be at least') || m.includes('password is too short'))
    return 'Passwort muss mindestens 6 Zeichen lang sein.'
  if (m.includes('signup is disabled') || m.includes('signups not allowed'))
    return 'Registrierung ist derzeit deaktiviert.'
  return msg
}

// ── Input Field ───────────────────────────────────────────────────────────────

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoFocus,
  suffix,
  hint,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  suffix?: React.ReactNode
  hint?: string
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
        <p className="text-section-label" style={{ margin: 0 }}>{label}</p>
        {hint && (
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text-30)', letterSpacing: '0.04em' }}>
            {hint}
          </span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="proc-input"
          autoFocus={autoFocus}
          style={{ paddingRight: suffix ? '44px' : undefined }}
        />
        {suffix && (
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            {suffix}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Submit Button ─────────────────────────────────────────────────────────────

function SubmitButton({
  loading,
  disabled,
  label,
  loadingLabel,
}: {
  loading: boolean
  disabled: boolean
  label: string
  loadingLabel: string
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      style={{
        width: '100%',
        padding: '13px 24px',
        background:
          loading || disabled
            ? 'rgba(45,79,215,0.38)'
            : 'linear-gradient(135deg, #3251e8 0%, #2640c8 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontFamily: 'Syne, sans-serif',
        fontSize: '15px',
        fontWeight: 600,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        transition: 'all 150ms cubic-bezier(0.16,1,0.3,1)',
        letterSpacing: '-0.01em',
        boxShadow:
          loading || disabled
            ? 'none'
            : '0 1px 0 rgba(255,255,255,0.2) inset, 0 4px 12px rgba(45,79,215,0.35)',
      }}
      onMouseEnter={(e) => {
        if (!loading && !disabled)
          (e.currentTarget as HTMLButtonElement).style.background =
            'linear-gradient(135deg, #3d5ef5 0%, #2d4de0 100%)'
      }}
      onMouseLeave={(e) => {
        if (!loading && !disabled)
          (e.currentTarget as HTMLButtonElement).style.background =
            'linear-gradient(135deg, #3251e8 0%, #2640c8 100%)'
      }}
    >
      {loading ? loadingLabel : label}
    </button>
  )
}

// ── Eye Icon ──────────────────────────────────────────────────────────────────

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

// ── Back Button ───────────────────────────────────────────────────────────────

function BackButton({ onClick, label = '← Zurück' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'DM Mono, monospace',
        fontSize: '11px',
        letterSpacing: '0.06em',
        color: 'var(--text-30)',
        padding: 0,
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'color 150ms',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-80)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
    >
      {label}
    </button>
  )
}

// ── Success Box ───────────────────────────────────────────────────────────────

function SuccessBox({
  title,
  body,
  email,
  backLabel,
  onBack,
}: {
  title: string
  body: string
  email: string
  backLabel: string
  onBack: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
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
        ✉
      </div>
      <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 600, color: 'var(--text-100)', letterSpacing: '-0.015em', marginBottom: '8px' }}>
        {title}
      </p>
      <p className="text-caption">
        {body}{' '}
        <span style={{ color: 'var(--text-80)', fontWeight: 500 }}>{email}</span>.
      </p>
      <button
        onClick={onBack}
        style={{
          marginTop: '20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'DM Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.06em',
          color: 'var(--text-30)',
          padding: 0,
          transition: 'color 150ms',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-text)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
      >
        {backLabel}
      </button>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('magic')
  const [pwView, setPwView] = useState<PwView>('login')
  const [regView, setRegView] = useState<RegView>('form')

  // Shared fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Register-only fields
  const [regName, setRegName] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [showRegConfirm, setShowRegConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  const supabase = createClient()

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setMagicSent(false)
    setPwView('login')
    setRegView('form')
    setPassword('')
    setRegConfirm('')
    setShowPassword(false)
    setShowRegConfirm(false)
  }

  // Magic link
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) { setError(mapError(error.message)); return }
    setMagicSent(true)
  }

  // Password login
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(mapError(error.message)); return }
    window.location.href = '/'
  }

  // Send password reset
  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    })
    setLoading(false)
    if (error) { setError(mapError(error.message)); return }
    setPwView('reset-sent')
  }

  // Register
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== regConfirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (password.length < 6) { setError('Passwort muss mindestens 6 Zeichen lang sein.'); return }
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: regName.trim() || email.split('@')[0] },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    if (error) { setError(mapError(error.message)); return }
    if (data.session) {
      window.location.href = '/'
    } else {
      setRegView('sent')
    }
  }

  const tabs: { id: Mode; label: string }[] = [
    { id: 'magic', label: 'Magic Link' },
    { id: 'password', label: 'Passwort' },
    { id: 'register', label: 'Registrieren' },
  ]

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

        {/* Card */}
        <div className="glass-card" style={{ padding: '32px 32px 36px' }}>

          {/* Tab Toggle */}
          <div
            style={{
              display: 'flex',
              gap: '3px',
              marginBottom: '28px',
              background: 'rgba(0,0,0,0.04)',
              borderRadius: '10px',
              padding: '3px',
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchMode(tab.id)}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: '7px',
                  border: 'none',
                  background: mode === tab.id ? 'rgba(255,255,255,0.96)' : 'transparent',
                  boxShadow: mode === tab.id ? '0 1px 4px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9) inset' : 'none',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '12px',
                  fontWeight: mode === tab.id ? 600 : 400,
                  color: mode === tab.id ? 'var(--text-100)' : 'var(--text-55)',
                  cursor: 'pointer',
                  transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
                  letterSpacing: '-0.01em',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">

            {/* ── Magic Link ── */}
            {mode === 'magic' && (
              <motion.div
                key="magic"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {!magicSent ? (
                  <>
                    <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 600, color: 'var(--text-100)', letterSpacing: '-0.015em', marginBottom: '6px' }}>
                      Einloggen.
                    </p>
                    <p className="text-caption" style={{ marginBottom: '24px' }}>
                      Wir schicken dir einen Link — kein Passwort nötig.
                    </p>
                    <form onSubmit={handleMagicLink}>
                      <Field label="E-Mail" type="email" value={email} onChange={setEmail} placeholder="deine@email.de" autoFocus />
                      {error && <ErrorMessage text={error} />}
                      <SubmitButton loading={loading} disabled={!email} label="Link anfordern →" loadingLabel="Sende Link…" />
                    </form>
                  </>
                ) : (
                  <SuccessBox
                    title="Link gesendet."
                    body="Prüfe dein Postfach für"
                    email={email}
                    backLabel="← Andere E-Mail verwenden"
                    onBack={() => setMagicSent(false)}
                  />
                )}
              </motion.div>
            )}

            {/* ── Password — Login ── */}
            {mode === 'password' && pwView === 'login' && (
              <motion.div
                key="pw-login"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 600, color: 'var(--text-100)', letterSpacing: '-0.015em', marginBottom: '6px' }}>
                  Willkommen zurück.
                </p>
                <p className="text-caption" style={{ marginBottom: '24px' }}>
                  Melde dich mit E-Mail und Passwort an.
                </p>
                <form onSubmit={handlePasswordLogin}>
                  <Field label="E-Mail" type="email" value={email} onChange={setEmail} placeholder="deine@email.de" autoFocus />
                  <Field
                    label="Passwort"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-30)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 150ms' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-80)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
                      >
                        <EyeIcon visible={showPassword} />
                      </button>
                    }
                  />
                  {error && <ErrorMessage text={error} />}
                  <SubmitButton loading={loading} disabled={!email || !password} label="Einloggen →" loadingLabel="Einloggen…" />
                </form>
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <button
                    onClick={() => { setError(''); setPwView('reset') }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.06em', color: 'var(--text-30)', padding: 0, transition: 'color 150ms' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-text)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
                  >
                    Passwort vergessen?
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Password — Reset form ── */}
            {mode === 'password' && pwView === 'reset' && (
              <motion.div
                key="pw-reset"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <BackButton onClick={() => { setError(''); setPwView('login') }} />
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 600, color: 'var(--text-100)', letterSpacing: '-0.015em', marginBottom: '6px' }}>
                  Passwort zurücksetzen.
                </p>
                <p className="text-caption" style={{ marginBottom: '24px' }}>
                  Wir schicken dir einen Reset-Link per Mail.
                </p>
                <form onSubmit={handlePasswordReset}>
                  <Field label="E-Mail" type="email" value={email} onChange={setEmail} placeholder="deine@email.de" autoFocus />
                  {error && <ErrorMessage text={error} />}
                  <SubmitButton loading={loading} disabled={!email} label="Reset-Link senden →" loadingLabel="Sende…" />
                </form>
              </motion.div>
            )}

            {/* ── Password — Reset sent ── */}
            {mode === 'password' && pwView === 'reset-sent' && (
              <motion.div
                key="pw-reset-sent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <SuccessBox
                  title="Mail gesendet."
                  body="Folge dem Link in deiner Mail für"
                  email={email}
                  backLabel="← Zurück zum Login"
                  onBack={() => { setPwView('login'); setError('') }}
                />
              </motion.div>
            )}

            {/* ── Register ── */}
            {mode === 'register' && regView === 'form' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 600, color: 'var(--text-100)', letterSpacing: '-0.015em', marginBottom: '6px' }}>
                  Account erstellen.
                </p>
                <p className="text-caption" style={{ marginBottom: '24px' }}>
                  Kostenlos registrieren — in 30 Sekunden.
                </p>
                <form onSubmit={handleRegister}>
                  <Field
                    label="Name"
                    hint="optional"
                    type="text"
                    value={regName}
                    onChange={setRegName}
                    placeholder="Dein Name"
                    autoFocus
                  />
                  <Field label="E-Mail" type="email" value={email} onChange={setEmail} placeholder="deine@email.de" />
                  <Field
                    label="Passwort"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    placeholder="min. 6 Zeichen"
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-30)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 150ms' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-80)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
                      >
                        <EyeIcon visible={showPassword} />
                      </button>
                    }
                  />
                  <Field
                    label="Passwort bestätigen"
                    type={showRegConfirm ? 'text' : 'password'}
                    value={regConfirm}
                    onChange={setRegConfirm}
                    placeholder="••••••••"
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowRegConfirm((v) => !v)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-30)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 150ms' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-80)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
                      >
                        <EyeIcon visible={showRegConfirm} />
                      </button>
                    }
                  />
                  {error && <ErrorMessage text={error} />}
                  <SubmitButton
                    loading={loading}
                    disabled={!email || !password || !regConfirm}
                    label="Account erstellen →"
                    loadingLabel="Erstellen…"
                  />
                </form>
              </motion.div>
            )}

            {/* ── Register — Sent ── */}
            {mode === 'register' && regView === 'sent' && (
              <motion.div
                key="register-sent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <SuccessBox
                  title="Fast geschafft."
                  body="Wir haben dir einen Bestätigungslink gesendet an"
                  email={email}
                  backLabel="← Andere E-Mail verwenden"
                  onBack={() => { setRegView('form'); setError('') }}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

// ── Error Message ─────────────────────────────────────────────────────────────

function ErrorMessage({ text }: { text: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '12px',
        color: 'var(--danger)',
        marginBottom: '14px',
        letterSpacing: '0.02em',
      }}
    >
      {text}
    </motion.p>
  )
}
