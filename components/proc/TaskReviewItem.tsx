'use client'

import { useState, useRef, useEffect } from 'react'
import type { BriefingTask } from '@/types'

interface TaskReviewItemProps {
  task: BriefingTask
  onUpdate: (text: string) => void
  onDelete: () => void
}

export function TaskReviewItem({ task, onUpdate, onDelete }: TaskReviewItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.text)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed) onUpdate(trimmed)
    else setDraft(task.text) // revert if empty
    setEditing(false)
  }

  const priorityColor =
    task.prioritaet === 1
      ? 'var(--danger)'
      : task.prioritaet === 2
      ? 'var(--accent-proc)'
      : 'var(--text-30)'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 0',
        borderBottom: '1px solid var(--border-0)',
      }}
    >
      <span
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          letterSpacing: '0.04em',
          color: priorityColor,
          flexShrink: 0,
          width: '22px',
        }}
      >
        P{task.prioritaet}
      </span>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              setDraft(task.text)
              setEditing(false)
            }
          }}
          style={{
            flex: 1,
            border: 'none',
            borderBottom: '1px solid var(--accent-border)',
            background: 'transparent',
            fontFamily: 'Syne, sans-serif',
            fontSize: '14px',
            color: 'var(--text-80)',
            outline: 'none',
            padding: '2px 0',
          }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          style={{
            flex: 1,
            fontFamily: 'Syne, sans-serif',
            fontSize: '14px',
            color: 'var(--text-80)',
            cursor: 'text',
            padding: '2px 0',
          }}
        >
          {task.text}
        </span>
      )}

      <button
        onClick={onDelete}
        style={{
          background: 'none',
          border: 'none',
          fontFamily: 'DM Mono, monospace',
          fontSize: '14px',
          color: 'var(--text-30)',
          cursor: 'pointer',
          padding: '0 4px',
          lineHeight: 1,
          flexShrink: 0,
          transition: 'color 120ms',
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)')
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')
        }
        title="Löschen"
      >
        ×
      </button>
    </div>
  )
}
