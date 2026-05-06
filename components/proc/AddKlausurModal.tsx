'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

interface AddKlausurModalProps {
  open: boolean
  onClose: () => void
  onAdd: (data: {
    fach: string
    thema?: string
    datum: string
    note_ziel?: number
  }) => Promise<void>
}

export function AddKlausurModal({
  open,
  onClose,
  onAdd,
}: AddKlausurModalProps) {
  const [fach, setFach] = useState('')
  const [thema, setThema] = useState('')
  const [datum, setDatum] = useState('')
  const [noteZiel, setNoteZiel] = useState('')
  const [loading, setLoading] = useState(false)

  const isMobile = useMediaQuery('(max-width: 767px)')
  const dragControls = useDragControls()

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fach || !datum) return

    setLoading(true)
    await onAdd({
      fach: fach.trim(),
      thema: thema.trim() || undefined,
      datum,
      note_ziel: noteZiel ? parseFloat(noteZiel) : undefined,
    })
    setLoading(false)
    setFach('')
    setThema('')
    setDatum('')
    setNoteZiel('')
    onClose()
  }

  const formContent = (
    <form onSubmit={handleSubmit}>
      {/* Fach */}
      <div style={{ marginBottom: '16px' }}>
        <p className="text-section-label" style={{ marginBottom: '6px' }}>Fach *</p>
        <input
          type="text"
          value={fach}
          onChange={(e) => setFach(e.target.value)}
          placeholder="Mathematik, Physik, ..."
          className="proc-input"
          autoFocus={!isMobile}
          required
        />
      </div>

      {/* Thema */}
      <div style={{ marginBottom: '16px' }}>
        <p className="text-section-label" style={{ marginBottom: '6px' }}>Thema (optional)</p>
        <input
          type="text"
          value={thema}
          onChange={(e) => setThema(e.target.value)}
          placeholder="Integralrechnung, Mechanik, ..."
          className="proc-input"
        />
      </div>

      {/* Datum + Zielnote */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div>
          <p className="text-section-label" style={{ marginBottom: '6px' }}>Datum *</p>
          <input
            type="date"
            value={datum}
            min={today}
            onChange={(e) => setDatum(e.target.value)}
            className="proc-input"
            required
            style={{ fontFamily: 'DM Mono, monospace' }}
          />
        </div>
        <div>
          <p className="text-section-label" style={{ marginBottom: '6px' }}>Zielnote (optional)</p>
          <input
            type="number"
            step="0.1"
            min="1"
            max="6"
            value={noteZiel}
            onChange={(e) => setNoteZiel(e.target.value)}
            placeholder="1.0 – 6.0"
            className="proc-input"
            style={{ fontFamily: 'DM Mono, monospace' }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="submit"
          disabled={loading || !fach || !datum}
          style={{
            flex: 1,
            padding: '13px',
            background:
              loading || !fach || !datum
                ? 'rgba(45,79,215,0.4)'
                : 'var(--accent-proc)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontFamily: 'Syne, sans-serif',
            fontSize: '15px',
            fontWeight: 600,
            cursor: loading || !fach || !datum ? 'not-allowed' : 'pointer',
            transition: 'background 150ms',
          }}
        >
          {loading ? 'Speichern...' : 'Hinzufügen →'}
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '13px 20px',
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid var(--border-1)',
            borderRadius: '10px',
            fontFamily: 'Syne, sans-serif',
            fontSize: '14px',
            color: 'var(--text-55)',
            cursor: 'pointer',
            transition: 'background 150ms',
          }}
        >
          Abbrechen
        </button>
      </div>
    </form>
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(10,10,15,0.25)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
            }}
          />

          {isMobile ? (
            /* ── Mobile: Bottom Sheet ── */
            <motion.div
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.02, bottom: 0.3 }}
              dragListener={false}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) onClose()
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '92svh',
                background: 'rgba(248,249,252,0.98)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderRadius: '20px 20px 0 0',
                borderTop: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.14)',
                zIndex: 101,
                overflowY: 'auto',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                style={{
                  padding: '12px 0 4px',
                  display: 'flex',
                  justifyContent: 'center',
                  cursor: 'grab',
                  touchAction: 'none',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'rgba(0,0,0,0.15)',
                  }}
                />
              </div>

              <div style={{ padding: '8px 24px 32px' }}>
                <p
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--text-100)',
                    letterSpacing: '-0.015em',
                    marginBottom: '24px',
                  }}
                >
                  Neue Klausur.
                </p>
                {formContent}
              </div>
            </motion.div>
          ) : (
            /* ── Desktop: Centered Modal ── */
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                maxWidth: '460px',
                zIndex: 101,
                padding: '0 16px',
              }}
            >
              <div
                className="glass-card"
                style={{ padding: '32px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <p
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--text-100)',
                    letterSpacing: '-0.015em',
                    marginBottom: '24px',
                  }}
                >
                  Neue Klausur.
                </p>
                {formContent}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}
