'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { TodoItem } from '@/components/proc/TodoItem'
import type { TodoWithFach } from '@/lib/hooks/useTodos'

interface SwipeableTodoItemProps {
  todo: TodoWithFach
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
}

export function SwipeableTodoItem({ todo, onToggle, onDelete, onEdit }: SwipeableTodoItemProps) {
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [-120, -40], [1, 0])
  const deleteScale = useTransform(x, [-120, -60], [1, 0.7])
  const isDeleting = useRef(false)

  function handleDragEnd() {
    if (isDeleting.current) return
    if (x.get() < -90) {
      isDeleting.current = true
      animate(x, -420, {
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1],
        onComplete: () => onDelete(todo.id),
      })
    } else {
      animate(x, 0, { duration: 0.3, ease: [0.16, 1, 0.3, 1] })
    }
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px', marginBottom: '2px' }}>
      {/* Delete background */}
      <motion.div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '10px',
          opacity: deleteOpacity,
        }}
      >
        <motion.div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(220,38,38,0.12)',
            border: '1px solid rgba(220,38,38,0.20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            scale: deleteScale,
          }}
        >
          <span style={{ color: 'rgba(220,38,38,0.80)', fontSize: '16px', lineHeight: 1 }}>×</span>
        </motion.div>
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.1, right: 0.05 }}
        style={{ x, position: 'relative', zIndex: 1 }}
        onDragEnd={handleDragEnd}
      >
        <TodoItem
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </motion.div>
    </div>
  )
}
