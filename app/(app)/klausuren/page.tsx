'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { pageVariants, staggerContainer, staggerItem } from '@/lib/animations'
import { useKlausuren } from '@/lib/hooks/useKlausuren'
import { KlausurCard } from '@/components/proc/KlausurCard'
import { AddKlausurModal } from '@/components/proc/AddKlausurModal'
import { NoteCalc } from '@/components/proc/NoteCalc'
import { SkeletonCard } from '@/components/proc/Skeleton'
import { PrimaryButton } from '@/components/proc/Buttons'

type Tab = 'klausuren' | 'noten'

function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
}

export default function KlausurenPage() {
  const [tab, setTab] = useState<Tab>('klausuren')
  const [modalOpen, setModalOpen] = useState(false)
  const { klausuren, loading, addKlausur, updateNote, deleteKlausur, refetch } =
    useKlausuren()

  const benotet = klausuren.filter(
    (k) => k.note !== null && k.note !== undefined
  )

  const gesamtSchnitt = useMemo(() => {
    if (benotet.length === 0) return null
    return benotet.reduce((sum, k) => sum + k.note!, 0) / benotet.length
  }, [benotet])

  const schnittNachFach = useMemo(() => {
    const map: Record<string, number[]> = {}
    benotet.forEach((k) => {
      if (!map[k.fach]) map[k.fach] = []
      map[k.fach].push(k.note!)
    })
    return Object.entries(map)
      .map(([fach, noten]) => ({
        fach,
        schnitt: noten.reduce((s, n) => s + n, 0) / noten.length,
        anzahl: noten.length,
      }))
      .sort((a, b) => b.schnitt - a.schnitt) // schlechtester oben
  }, [benotet])

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '32px',
          }}
        >
          <div>
            <h1 className="text-headline" style={{ marginBottom: '4px' }}>
              Klausuren.
            </h1>
            <p className="text-section-label">
              {klausuren.length} Klausuren · {benotet.length} benotet
            </p>
          </div>
          {tab === 'klausuren' && (
            <div className="klausuren-add-btn">
              <PrimaryButton onClick={() => setModalOpen(true)} style={{ padding: '10px 20px', fontSize: '14px' }}>
                + Neue Klausur
              </PrimaryButton>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '28px',
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-0)',
            borderRadius: '12px',
            padding: '4px',
            width: 'fit-content',
          }}
        >
          {(['klausuren', 'noten'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background:
                  tab === t ? 'rgba(255,255,255,0.96)' : 'transparent',
                boxShadow:
                  tab === t ? 'var(--shadow-sm)' : 'none',
                fontFamily: 'Syne, sans-serif',
                fontSize: '14px',
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? 'var(--text-100)' : 'var(--text-55)',
                cursor: 'pointer',
                transition: 'all 200ms',
                letterSpacing: '-0.01em',
              }}
            >
              {t === 'klausuren' ? 'Klausuren' : 'Notenübersicht'}
            </button>
          ))}
        </div>

        {/* Tab: Klausuren */}
        {tab === 'klausuren' && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} lines={3} />
                ))}
              </div>
            ) : klausuren.length === 0 ? (
              <motion.div variants={staggerItem}>
                <div
                  className="glass-card"
                  style={{
                    padding: '48px',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '13px',
                      color: 'var(--text-30)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Keine Klausuren eingetragen.
                  </p>
                  <button
                    onClick={() => setModalOpen(true)}
                    style={{
                      marginTop: '16px',
                      padding: '10px 20px',
                      background: 'var(--accent-soft)',
                      border: '1px solid var(--accent-border)',
                      borderRadius: '10px',
                      fontFamily: 'Syne, sans-serif',
                      fontSize: '14px',
                      color: 'var(--accent-text)',
                      cursor: 'pointer',
                    }}
                  >
                    Erste Klausur eintragen →
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Upcoming */}
                {klausuren.filter((k) => getDaysUntil(k.datum) >= 0).length >
                  0 && (
                  <motion.div variants={staggerItem}>
                    <p
                      className="text-section-label"
                      style={{ marginBottom: '12px' }}
                    >
                      Anstehend
                    </p>
                    {klausuren
                      .filter((k) => getDaysUntil(k.datum) >= 0)
                      .map((k) => (
                        <KlausurCard
                          key={k.id}
                          klausur={k}
                          onUpdateNote={updateNote}
                          onDelete={deleteKlausur}
                          onRefetch={refetch}
                        />
                      ))}
                  </motion.div>
                )}

                {/* Past */}
                {klausuren.filter((k) => getDaysUntil(k.datum) < 0).length >
                  0 && (
                  <motion.div
                    variants={staggerItem}
                    style={{ marginTop: '24px' }}
                  >
                    <p
                      className="text-section-label"
                      style={{ marginBottom: '12px' }}
                    >
                      Vergangen
                    </p>
                    {klausuren
                      .filter((k) => getDaysUntil(k.datum) < 0)
                      .map((k) => (
                        <KlausurCard
                          key={k.id}
                          klausur={k}
                          onUpdateNote={updateNote}
                          onDelete={deleteKlausur}
                          onRefetch={refetch}
                        />
                      ))}
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Tab: Noten */}
        {tab === 'noten' && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Gesamtschnitt */}
            <motion.div variants={staggerItem}>
              <div className="glass-card" style={{ padding: '28px 32px', marginBottom: '16px' }}>
                <p className="text-section-label" style={{ marginBottom: '12px' }}>
                  Gesamtschnitt
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                  <span
                    style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '56px',
                      fontWeight: 300,
                      letterSpacing: '-0.04em',
                      color:
                        gesamtSchnitt === null
                          ? 'var(--text-30)'
                          : gesamtSchnitt <= 1.5
                          ? 'var(--positive)'
                          : gesamtSchnitt <= 2.5
                          ? 'var(--text-100)'
                          : gesamtSchnitt <= 3.5
                          ? 'var(--warning)'
                          : 'var(--danger)',
                    }}
                  >
                    {gesamtSchnitt !== null
                      ? gesamtSchnitt.toFixed(2)
                      : '—'}
                  </span>
                  <span className="text-caption">
                    {benotet.length > 0
                      ? `Basierend auf ${benotet.length} Klausur${benotet.length !== 1 ? 'en' : ''}`
                      : 'Noch keine benoteten Klausuren'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Per-Fach */}
            {schnittNachFach.length > 0 && (
              <motion.div variants={staggerItem}>
                <div className="glass-card" style={{ padding: '24px 28px' }}>
                  <p className="text-section-label" style={{ marginBottom: '16px' }}>
                    Nach Fach
                  </p>
                  {schnittNachFach.map(({ fach, schnitt, anzahl }) => (
                    <div
                      key={fach}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ width: '120px', flexShrink: 0 }}>
                        <span
                          style={{
                            fontFamily: 'Syne, sans-serif',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text-100)',
                          }}
                        >
                          {fach}
                        </span>
                        <br />
                        <span className="text-caption">
                          {anzahl} Note{anzahl !== 1 ? 'n' : ''}
                        </span>
                      </div>

                      {/* Bar visualization (1=gut/rechts, 6=schlecht/links) */}
                      <div
                        style={{
                          flex: 1,
                          height: '4px',
                          background: 'var(--border-0)',
                          borderRadius: '2px',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: `${((6 - schnitt) / 5) * 100}%`,
                            background:
                              schnitt <= 1.5
                                ? 'var(--positive)'
                                : schnitt <= 2.5
                                ? 'var(--accent-proc)'
                                : schnitt <= 3.5
                                ? 'var(--warning)'
                                : 'var(--danger)',
                            borderRadius: '2px',
                            transition: 'width 600ms ease',
                          }}
                        />
                      </div>

                      <span
                        style={{
                          fontFamily: 'DM Mono, monospace',
                          fontSize: '16px',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                          color:
                            schnitt <= 1.5
                              ? 'var(--positive)'
                              : schnitt <= 2.5
                              ? 'var(--text-100)'
                              : schnitt <= 3.5
                              ? 'var(--warning)'
                              : 'var(--danger)',
                          width: '36px',
                          textAlign: 'right',
                          flexShrink: 0,
                        }}
                      >
                        {schnitt.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Notenrechner */}
            <motion.div variants={staggerItem}>
              <NoteCalc klausuren={klausuren} />
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      <AddKlausurModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addKlausur}
      />
    </>
  )
}
