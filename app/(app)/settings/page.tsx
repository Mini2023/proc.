'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pageVariants, staggerContainer, staggerItem } from '@/lib/animations'
import { useProfile } from '@/lib/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <p className="text-section-label" style={{ marginBottom: '12px' }}>
        {label}
      </p>
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        {children}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <p
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-30)',
          marginBottom: '6px',
        }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 10 10M4.2 4.3C2.8 5.3 1.7 6.7 1 8c1.1 2.3 3.7 5 7 5 1.3 0 2.6-.4 3.7-1.1M7 3.1C7.3 3 7.6 3 8 3c3.3 0 5.9 2.7 7 5-.4.9-1 1.8-1.8 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function SettingsPage() {
  const { profile, email, loading, updateProfile, signOut } = useProfile()

  const [name, setName] = useState('')
  const [klasse, setKlasse] = useState('')
  const [schule, setSchule] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [signOutConfirm, setSignOutConfirm] = useState(false)

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  // Sync form with loaded profile
  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? '')
      setKlasse(profile.klasse ?? '')
      setSchule(profile.schule ?? '')
    }
  }, [profile])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    const ok = await updateProfile({
      display_name: name.trim() || null,
      klasse: klasse.trim() || null,
      schule: schule.trim() || null,
    })

    setSaving(false)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setPwError('Passwörter stimmen nicht überein.'); return }
    if (newPassword.length < 6) { setPwError('Passwort muss mindestens 6 Zeichen lang sein.'); return }
    setPwSaving(true)
    setPwError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    if (error) { setPwError(error.message); return }
    setPwSaved(true)
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPwSaved(false), 3500)
  }

  if (loading) {
    return (
      <div style={{ padding: '56px 0' }}>
        <div
          className="glass-card"
          style={{ height: '200px', opacity: 0.4 }}
        />
      </div>
    )
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div style={{ marginBottom: '40px' }}>
        <h1 className="text-headline" style={{ marginBottom: '4px' }}>
          Einstellungen.
        </h1>
        <p className="text-section-label">Profil & Account</p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Profil */}
        <motion.div variants={staggerItem}>
          <Section label="Profil">
            <form onSubmit={handleSave}>
              <Field label="Name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dein Name"
                  className="proc-input"
                />
              </Field>

              <Field label="Klasse / Semester">
                <input
                  type="text"
                  value={klasse}
                  onChange={(e) => setKlasse(e.target.value)}
                  placeholder="z.B. Q11, 12. Klasse, 3. Semester"
                  className="proc-input"
                />
              </Field>

              <Field label="Schule / Uni">
                <input
                  type="text"
                  value={schule}
                  onChange={(e) => setSchule(e.target.value)}
                  placeholder="Name deiner Schule oder Universität"
                  className="proc-input"
                />
              </Field>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '8px',
                }}
              >
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '11px 24px',
                    background: saving
                      ? 'rgba(45,79,215,0.5)'
                      : 'var(--accent-proc)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'background 150ms',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={(e) => {
                    if (!saving)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'var(--accent-light)'
                  }}
                  onMouseLeave={(e) => {
                    if (!saving)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'var(--accent-proc)'
                  }}
                >
                  {saving ? 'Speichern...' : 'Speichern'}
                </button>

                {saved && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      color: 'var(--positive)',
                    }}
                  >
                    GESPEICHERT
                  </motion.span>
                )}
              </div>
            </form>
          </Section>
        </motion.div>

        {/* Sicherheit */}
        <motion.div variants={staggerItem}>
          <Section label="Sicherheit">
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', color: 'var(--text-55)', marginBottom: '20px' }}>
              Passwort ändern oder neu setzen.
            </p>
            <form onSubmit={handlePasswordChange}>
              {/* New password */}
              <Field label="Neues Passwort">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="min. 6 Zeichen"
                    className="proc-input"
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-30)',
                      padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 150ms',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-80)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
                  >
                    <EyeIcon visible={showNewPw} />
                  </button>
                </div>
              </Field>

              {/* Confirm password */}
              <Field label="Passwort bestätigen">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="proc-input"
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-30)',
                      padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 150ms',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-80)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')}
                  >
                    <EyeIcon visible={showConfirmPw} />
                  </button>
                </div>
              </Field>

              <AnimatePresence>
                {pwError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--danger)', marginBottom: '12px', letterSpacing: '0.02em' }}
                  >
                    {pwError}
                  </motion.p>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  type="submit"
                  disabled={pwSaving || !newPassword || !confirmPassword}
                  style={{
                    padding: '11px 24px',
                    background: pwSaving || !newPassword || !confirmPassword ? 'rgba(45,79,215,0.38)' : 'var(--accent-proc)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: pwSaving || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer',
                    transition: 'background 150ms',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={(e) => {
                    if (!pwSaving && newPassword && confirmPassword)
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-light)'
                  }}
                  onMouseLeave={(e) => {
                    if (!pwSaving && newPassword && confirmPassword)
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-proc)'
                  }}
                >
                  {pwSaving ? 'Speichern...' : 'Passwort ändern'}
                </button>

                <AnimatePresence>
                  {pwSaved && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--positive)' }}
                    >
                      GESPEICHERT
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </Section>
        </motion.div>

        {/* Account */}
        <motion.div variants={staggerItem}>
          <Section label="Account">
            <Field label="E-Mail">
              <p
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '14px',
                  color: 'var(--text-55)',
                  padding: '12px 0 4px',
                }}
              >
                {email ?? '—'}
              </p>
            </Field>

            <div
              style={{
                height: '1px',
                background: 'var(--border-0)',
                margin: '16px 0',
              }}
            />

            {!signOutConfirm ? (
              <button
                onClick={() => setSignOutConfirm(true)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid var(--border-1)',
                  borderRadius: '10px',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-55)',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.borderColor = 'var(--border-2)'
                  el.style.color = 'var(--text-80)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.borderColor = 'var(--border-1)'
                  el.style.color = 'var(--text-55)'
                }}
              >
                Abmelden
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <p
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '14px',
                    color: 'var(--text-55)',
                  }}
                >
                  Sicher abmelden?
                </p>
                <button
                  onClick={signOut}
                  style={{
                    padding: '9px 18px',
                    background: 'rgba(220,38,38,0.08)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    borderRadius: '10px',
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(220,38,38,0.14)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(220,38,38,0.08)')
                  }
                >
                  Ja, abmelden
                </button>
                <button
                  onClick={() => setSignOutConfirm(false)}
                  style={{
                    padding: '9px 14px',
                    background: 'transparent',
                    border: 'none',
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.06em',
                    color: 'var(--text-30)',
                    cursor: 'pointer',
                  }}
                >
                  ABBRECHEN
                </button>
              </motion.div>
            )}
          </Section>
        </motion.div>

        {/* Build info */}
        <motion.div variants={staggerItem}>
          <p
            className="text-caption"
            style={{ textAlign: 'center', marginTop: '8px' }}
          >
            proc. 2.0 — Phase 2
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
