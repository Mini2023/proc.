'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { checkmarkDraw } from '@/lib/animations'
import type { TodoWithFach } from '@/lib/hooks/useTodos'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isUeberfaellig(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  return date < today
}

function formatShortDate(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'heute'
  if (diff === 1) return 'morgen'
  if (diff === -1) return 'gestern'
  return new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

// ── Grip icon ─────────────────────────────────────────────────────────────────

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
      <circle cx="2.5" cy="2.5" r="1.2" fill="currentColor" />
      <circle cx="7.5" cy="2.5" r="1.2" fill="currentColor" />
      <circle cx="2.5" cy="7" r="1.2" fill="currentColor" />
      <circle cx="7.5" cy="7" r="1.2" fill="currentColor" />
      <circle cx="2.5" cy="11.5" r="1.2" fill="currentColor" />
      <circle cx="7.5" cy="11.5" r="1.2" fill="currentColor" />
    </svg>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface TodoItemProps {
  todo: TodoWithFach
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
  dragHandleProps?: Record<string, unknown>
  isDragging?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
  dragHandleProps,
  isDragging,
}: TodoItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const klausurFach = todo.klausuren?.fach ?? null

  const bg = isDragging
    ? 'rgba(255,255,255,0.97)'
    : isHovered
    ? 'rgba(255,255,255,0.80)'
    : 'transparent'

  const border = isDragging
    ? '1px solid rgba(255,255,255,0.92)'
    : isHovered
    ? '1px solid rgba(255,255,255,0.82)'
    : '1px solid transparent'

  const shadow = isDragging
    ? '0 8px 28px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9) inset'
    : isHovered
    ? '0 2px 10px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.9) inset'
    : 'none'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px 10px 10px',
        borderRadius: '10px',
        marginBottom: '2px',
        cursor: isDragging ? 'grabbing' : 'default',
        background: bg,
        backdropFilter: isHovered || isDragging ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: isHovered || isDragging ? 'blur(16px)' : 'none',
        border,
        boxShadow: shadow,
        transform: isDragging ? 'rotate(0.8deg) scale(1.02)' : isHovered ? 'translateY(-1px)' : 'translateY(0)',
        transition:
          'background 180ms cubic-bezier(0.16,1,0.3,1), border-color 180ms, box-shadow 180ms, transform 180ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Drag handle */}
      <div
        {...(dragHandleProps ?? {})}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          color: 'var(--text-30)',
          flexShrink: 0,
          opacity: isHovered || isDragging ? 1 : 0,
          transition: 'opacity 150ms',
          pointerEvents: isHovered ? 'auto' : 'none',
          display: 'flex',
          alignItems: 'center',
          userSelect: 'none',
          width: '14px',
        }}
      >
        <GripIcon />
      </div>

      {/* Checkbox */}
      <motion.button
        onClick={() => onToggle(todo.id)}
        whileTap={{ scale: 0.82 }}
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '5px',
          border: `1.5px solid ${
            todo.fertig ? '#16a34a' : isHovered ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.15)'
          }`,
          background: todo.fertig ? 'rgba(22,163,74,0.10)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          padding: 0,
          transition: 'all 150ms cubic-bezier(0.16,1,0.3,1)',
          userSelect: 'none',
        }}
      >
        <AnimatePresence>
          {todo.fertig && (
            <motion.svg
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
            >
              <motion.polyline
                points="1.5,5 4,7.5 8.5,2.5"
                stroke="#16a34a"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={checkmarkDraw}
                initial="initial"
                animate="animate"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Text / inline edit */}
      {isEditing ? (
        <input
          autoFocus
          defaultValue={todo.text}
          onBlur={(e) => {
            const val = e.target.value.trim()
            if (val) onEdit(todo.id, val)
            setIsEditing(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = e.currentTarget.value.trim()
              if (val) onEdit(todo.id, val)
              setIsEditing(false)
            }
            if (e.key === 'Escape') setIsEditing(false)
          }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'Syne, sans-serif',
            fontSize: '14px',
            color: 'var(--text-100)',
          }}
        />
      ) : (
        <motion.span
          onDoubleClick={() => { if (!todo.fertig) setIsEditing(true) }}
          animate={{
            color: todo.fertig ? 'var(--text-30)' : 'var(--text-80)',
          }}
          transition={{ duration: 0.2 }}
          style={{
            flex: 1,
            fontFamily: 'Syne, sans-serif',
            fontSize: '14px',
            textDecoration: todo.fertig ? 'line-through' : 'none',
            textDecorationColor: 'rgba(0,0,0,0.20)',
            lineHeight: 1.4,
            userSelect: 'none',
          }}
        >
          {todo.text}
        </motion.span>
      )}

      {/* Badges + actions */}
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
        {/* Lernplan fach badge */}
        {todo.quelle === 'lernplan' && klausurFach && (
          <span
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
              letterSpacing: '0.05em',
              padding: '2px 7px',
              borderRadius: '20px',
              background: 'rgba(45,79,215,0.07)',
              border: '1px solid rgba(45,79,215,0.18)',
              color: 'var(--accent-text)',
              whiteSpace: 'nowrap',
            }}
          >
            {klausurFach}
          </span>
        )}

        {/* JARVIS badge */}
        {todo.quelle === 'morning_briefing' && (
          <span
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
              letterSpacing: '0.05em',
              padding: '2px 7px',
              borderRadius: '20px',
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.07)',
              color: 'var(--text-30)',
              whiteSpace: 'nowrap',
            }}
          >
            JARVIS
          </span>
        )}

        {/* Priority — P1 always visible, P2/P3 on hover */}
        <AnimatePresence>
          {!todo.fertig && (todo.prioritaet === 1 || isHovered) && (
            <motion.span
              key="prio"
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.75 }}
              transition={{ duration: 0.13 }}
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '10px',
                letterSpacing: '0.05em',
                color:
                  todo.prioritaet === 1
                    ? 'var(--accent-text)'
                    : todo.prioritaet === 2
                    ? 'var(--text-30)'
                    : 'rgba(0,0,0,0.18)',
              }}
            >
              P{todo.prioritaet}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Due date — always if overdue, hover otherwise */}
        {todo.faellig_am && (
          <AnimatePresence>
            {(isHovered || isUeberfaellig(todo.faellig_am)) && (
              <motion.span
                key="date"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.13 }}
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '10px',
                  letterSpacing: '0.04em',
                  color: isUeberfaellig(todo.faellig_am) ? 'var(--danger)' : 'var(--text-30)',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatShortDate(todo.faellig_am)}
              </motion.span>
            )}
          </AnimatePresence>
        )}

        {/* Delete — hover only */}
        <AnimatePresence>
          {isHovered && (
            <motion.button
              key="del"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.13 }}
              onClick={() => onDelete(todo.id)}
              whileHover={{ color: 'var(--danger)' } as Record<string, string>}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-30)',
                padding: '2px 3px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '15px',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              ×
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
