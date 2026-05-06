'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { pageVariants } from '@/lib/animations'
import { useTodos } from '@/lib/hooks/useTodos'
import type { TodoWithFach } from '@/lib/hooks/useTodos'
import { TodoItem } from '@/components/proc/TodoItem'
import { SwipeableTodoItem } from '@/components/proc/SwipeableTodoItem'
import { SkeletonLine } from '@/components/proc/Skeleton'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

// ── SortableTodo wrapper ──────────────────────────────────────────────────────

function SortableTodo({
  todo,
  onToggle,
  onDelete,
  onEdit,
}: {
  todo: TodoWithFach
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id })

  return (
    <motion.div
      ref={setNodeRef}
      layout={!isDragging}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        opacity: isDragging ? 0 : 1,
      }}
    >
      <TodoItem
        todo={todo}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={false}
      />
    </motion.div>
  )
}

// ── Quick Add Input ───────────────────────────────────────────────────────────

interface QuickAddInputProps {
  inputRef: React.RefObject<HTMLInputElement>
  kategorie: 'heute' | 'backlog'
  onKategorieChange: (k: 'heute' | 'backlog') => void
  onAdd: (text: string, kategorie: 'heute' | 'backlog', prio: 1 | 2 | 3) => void
}

function QuickAddInput({ inputRef, kategorie, onKategorieChange, onAdd }: QuickAddInputProps) {
  const [text, setText] = useState('')
  const [prio, setPrio] = useState<1 | 2 | 3>(2)
  const [isFocused, setIsFocused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  function submit() {
    if (!text.trim()) return
    onAdd(text.trim(), kategorie, prio)
    setText('')
    setPrio(2)
  }

  function cyclePrio() {
    setPrio((p) => (p === 1 ? 2 : p === 2 ? 3 : 1))
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '11px 14px',
        background: isFocused
          ? 'rgba(255,255,255,0.82)'
          : isHovered
          ? 'rgba(255,255,255,0.68)'
          : 'rgba(255,255,255,0.50)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${
          isFocused
            ? 'var(--accent-border)'
            : isHovered
            ? 'rgba(0,0,0,0.10)'
            : 'rgba(0,0,0,0.07)'
        }`,
        borderRadius: '12px',
        marginBottom: '32px',
        boxShadow: isFocused
          ? '0 0 0 3px var(--accent-soft), 0 2px 8px rgba(0,0,0,0.06)'
          : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <span
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '18px',
          color: isFocused ? 'var(--accent-text)' : 'rgba(0,0,0,0.20)',
          flexShrink: 0,
          lineHeight: 1,
          transition: 'color 180ms',
          userSelect: 'none',
        }}
      >
        +
      </span>

      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') {
            setText('')
            ;(e.currentTarget as HTMLInputElement).blur()
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Aufgabe hinzufügen..."
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontFamily: 'Syne, sans-serif',
          fontSize: '15px',
          color: 'var(--text-100)',
        }}
      />

      <button
        onClick={() => onKategorieChange(kategorie === 'heute' ? 'backlog' : 'heute')}
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          letterSpacing: '0.10em',
          padding: '4px 10px',
          borderRadius: '20px',
          cursor: 'pointer',
          flexShrink: 0,
          background: kategorie === 'heute' ? 'var(--accent-soft)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${
            kategorie === 'heute' ? 'var(--accent-border)' : 'rgba(0,0,0,0.08)'
          }`,
          color: kategorie === 'heute' ? 'var(--accent-text)' : 'var(--text-30)',
          transition: 'all 150ms',
          userSelect: 'none',
        }}
      >
        {kategorie === 'heute' ? 'HEUTE' : 'BACKLOG'}
      </button>

      <button
        onClick={cyclePrio}
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          letterSpacing: '0.08em',
          padding: '4px 9px',
          borderRadius: '6px',
          cursor: 'pointer',
          flexShrink: 0,
          background: 'transparent',
          border: '1px solid rgba(0,0,0,0.08)',
          color:
            prio === 1
              ? 'var(--accent-text)'
              : prio === 2
              ? 'var(--text-30)'
              : 'rgba(0,0,0,0.18)',
          transition: 'all 150ms',
          userSelect: 'none',
        }}
      >
        P{prio}
      </button>
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  openCount,
  total,
  accentColor,
  onAddClick,
}: {
  label: string
  openCount: number
  total: number
  accentColor?: string
  onAddClick: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '6px',
        marginTop: '8px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <span
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: accentColor ?? 'rgba(10,10,15,0.40)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '11px',
          color: 'var(--text-30)',
          letterSpacing: '0.06em',
        }}
      >
        {openCount}/{total}
      </span>
      <div style={{ flex: 1 }} />
      <button
        onClick={onAddClick}
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          letterSpacing: '0.08em',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-30)',
          padding: 0,
          transition: 'color 150ms',
          userSelect: 'none',
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-text)')
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-30)')
        }
      >
        + AUFGABE
      </button>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '18px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '5px',
          border: '1.5px solid rgba(0,0,0,0.10)',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '14px',
          color: 'var(--text-30)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Erledigte Section ─────────────────────────────────────────────────────────

function ErledigtSection({
  todos,
  onToggle,
  onDelete,
  onEdit,
}: {
  todos: TodoWithFach[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  if (todos.length === 0) return null

  return (
    <div style={{ marginTop: '6px' }}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '6px 0',
          width: '100%',
          userSelect: 'none',
        }}
      >
        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ color: 'var(--text-30)', fontSize: '9px', display: 'inline-block' }}
        >
          ▶
        </motion.span>
        <span
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            letterSpacing: '0.10em',
            color: 'var(--text-30)',
            textTransform: 'uppercase',
          }}
        >
          Erledigt · {todos.length}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '2px' }}>
              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Todo Section (with DnD) ───────────────────────────────────────────────────

function TodoSection({
  id,
  label,
  todos,
  onToggle,
  onDelete,
  onEdit,
  onAddClick,
  accentColor,
}: {
  id: 'heute' | 'backlog'
  label: string
  todos: TodoWithFach[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
  onAddClick: () => void
  accentColor?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const isMobile = useMediaQuery('(max-width: 767px)')
  const offene = todos.filter((t) => !t.fertig)
  const erledigte = todos.filter((t) => t.fertig)

  return (
    <div style={{ marginBottom: '32px' }}>
      <SectionHeader
        label={label}
        openCount={offene.length}
        total={todos.length}
        accentColor={accentColor}
        onAddClick={onAddClick}
      />

      <div
        ref={setNodeRef}
        style={{
          minHeight: '40px',
          borderRadius: '10px',
          background: isOver ? 'rgba(45,79,215,0.03)' : 'transparent',
          border: isOver ? '1px dashed var(--accent-border)' : '1px solid transparent',
          transition: 'background 200ms, border-color 200ms',
          padding: isOver ? '4px' : '0',
        }}
      >
        {isMobile ? (
          <AnimatePresence mode="popLayout">
            {offene.map((todo) => (
              <motion.div
                key={todo.id}
                layout
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <SwipeableTodoItem
                  todo={todo}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <SortableContext
            items={offene.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence mode="popLayout">
              {offene.map((todo) => (
                <SortableTodo
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        )}

        {offene.length === 0 && (
          <EmptyState
            label={
              id === 'heute'
                ? 'Keine offenen Tasks für heute.'
                : 'Backlog ist leer.'
            }
          />
        )}
      </div>

      <ErledigtSection
        todos={erledigte}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  )
}

// ── Lernplan Section ──────────────────────────────────────────────────────────

function LernplanSection({
  todos,
  onToggle,
  onDelete,
  onEdit,
}: {
  todos: TodoWithFach[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
}) {
  const grouped = todos.reduce<Record<string, TodoWithFach[]>>((acc, t) => {
    const fach = t.klausuren?.fach ?? 'Lernplan'
    if (!acc[fach]) acc[fach] = []
    acc[fach].push(t)
    return acc
  }, {})

  return (
    <div>
      {Object.entries(grouped).map(([fach, items]) => {
        const offene = items.filter((t) => !t.fertig)
        const erledigte = items.filter((t) => t.fertig)
        return (
          <div key={fach} style={{ marginBottom: '28px' }}>
            <SectionHeader
              label={fach}
              openCount={offene.length}
              total={items.length}
              accentColor="var(--accent-text)"
              onAddClick={() => {}}
            />
            <AnimatePresence mode="popLayout">
              {offene.map((todo) => (
                <motion.div
                  key={todo.id}
                  layout
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <TodoItem
                    todo={todo}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {offene.length === 0 && <EmptyState label="Keine offenen Lernplan-Tasks." />}
            <ErledigtSection
              todos={erledigte}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TodosPage() {
  const { todos, loading, addTodo, toggleTodo, moveTodo, deleteTodo, updateTodo } =
    useTodos()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [quickKategorie, setQuickKategorie] = useState<'heute' | 'backlog'>('heute')
  const quickAddRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>

  const today = new Date().toISOString().split('T')[0]

  const heuteTodos = todos.filter(
    (t) => t.kategorie === 'heute' || t.faellig_am === today
  )
  const backlogTodos = todos.filter(
    (t) =>
      t.kategorie !== 'heute' &&
      t.faellig_am !== today &&
      t.quelle !== 'lernplan'
  )
  const lernplanTodos = todos.filter(
    (t) =>
      t.quelle === 'lernplan' &&
      t.kategorie !== 'heute' &&
      t.faellig_am !== today
  )

  const activeTodo = todos.find((t) => t.id === activeId) ?? null
  const openCount = todos.filter((t) => !t.fertig).length

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeItemId = String(active.id)
    const overId = String(over.id)

    let targetKategorie: 'heute' | 'backlog'
    if (overId === 'heute' || overId === 'backlog') {
      targetKategorie = overId
    } else {
      const isOverHeute = heuteTodos.some((t) => t.id === overId)
      targetKategorie = isOverHeute ? 'heute' : 'backlog'
    }

    const isCurrentHeute = heuteTodos.some((t) => t.id === activeItemId)
    const currentKategorie = isCurrentHeute ? 'heute' : 'backlog'

    if (targetKategorie !== currentKategorie) {
      moveTodo(activeItemId, targetKategorie)
    }
  }

  const focusQuickAdd = useCallback((kategorie: 'heute' | 'backlog') => {
    setQuickKategorie(kategorie)
    setTimeout(() => quickAddRef.current?.focus(), 30)
  }, [])

  const handleEdit = useCallback(
    (id: string, text: string) => updateTodo(id, { text }),
    [updateTodo]
  )

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="text-headline" style={{ marginBottom: '4px' }}>
            Todos.
          </h1>
          <p
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '12px',
              color: 'var(--text-30)',
              letterSpacing: '0.04em',
            }}
          >
            {loading ? '…' : `${openCount} offen · ${todos.length} gesamt`}
          </p>
        </div>

        {loading ? (
          <div>
            <div
              style={{
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.50)',
                border: '1px solid rgba(0,0,0,0.07)',
                marginBottom: '32px',
              }}
            />
            {[1, 2].map((i) => (
              <div key={i} style={{ marginBottom: '32px' }}>
                <div
                  style={{
                    height: '1px',
                    background: 'rgba(0,0,0,0.06)',
                    marginBottom: '10px',
                  }}
                />
                <SkeletonLine
                  width="100%"
                  height={38}
                  style={{ marginBottom: '3px', borderRadius: '10px' }}
                />
                <SkeletonLine
                  width="100%"
                  height={38}
                  style={{ marginBottom: '3px', borderRadius: '10px' }}
                />
                <SkeletonLine width="75%" height={38} style={{ borderRadius: '10px' }} />
              </div>
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <QuickAddInput
              inputRef={quickAddRef}
              kategorie={quickKategorie}
              onKategorieChange={setQuickKategorie}
              onAdd={addTodo}
            />

            <TodoSection
              id="heute"
              label="Heute"
              todos={heuteTodos}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onEdit={handleEdit}
              onAddClick={() => focusQuickAdd('heute')}
            />

            <TodoSection
              id="backlog"
              label="Backlog"
              todos={backlogTodos}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onEdit={handleEdit}
              onAddClick={() => focusQuickAdd('backlog')}
            />

            {lernplanTodos.length > 0 && (
              <LernplanSection
                todos={lernplanTodos}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={handleEdit}
              />
            )}

            <DragOverlay
              dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.16,1,0.3,1)' }}
            >
              {activeTodo ? (
                <TodoItem
                  todo={activeTodo}
                  onToggle={() => {}}
                  onDelete={() => {}}
                  onEdit={() => {}}
                  isDragging
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </motion.div>
  )
}
