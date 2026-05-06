'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

const navItems = [
  { icon: '⌂', label: 'Dashboard', href: '/' },
  { icon: '◎', label: 'Briefing', href: '/briefing' },
  { icon: '⏱', label: 'Fokus', href: '/focus' },
  { icon: '◈', label: 'Klausuren', href: '/klausuren' },
  { icon: '✓', label: 'Todos', href: '/todos' },
]

function NavItem({
  icon,
  label,
  href,
  isActive,
  isExpanded,
}: {
  icon: string
  label: string
  href: string
  isActive: boolean
  isExpanded: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '8px',
        textDecoration: 'none',
        transition: 'background 180ms, border-color 180ms',
        borderLeft: isActive
          ? '2px solid var(--accent-proc)'
          : '2px solid transparent',
        background: isActive
          ? 'rgba(45,79,215,0.09)'
          : 'transparent',
        boxShadow: isActive
          ? '2px 0 12px rgba(45,79,215,0.10) inset'
          : 'none',
        color: isActive ? 'var(--accent-text)' : 'var(--text-30)',
        marginBottom: '2px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          const el = e.currentTarget
          el.style.background = 'rgba(255,255,255,0.6)'
          el.style.borderLeftColor = 'var(--border-1)'
          el.style.color = 'var(--text-80)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          const el = e.currentTarget
          el.style.background = 'transparent'
          el.style.borderLeftColor = 'transparent'
          el.style.color = 'var(--text-30)'
        }
      }}
    >
      <span
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '15px',
          flexShrink: 0,
          width: '20px',
          textAlign: 'center',
        }}
      >
        {icon}
      </span>
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              overflow: 'hidden',
            }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: isExpanded ? '220px' : '56px',
        background: 'rgba(236,240,248,0.80)',
        backdropFilter: 'blur(32px) saturate(220%) brightness(1.04)',
        WebkitBackdropFilter: 'blur(32px) saturate(220%) brightness(1.04)',
        borderRight: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '1px 0 0 rgba(255,255,255,0.65) inset, 4px 0 24px rgba(0,0,0,0.06)',
        transition: 'width 280ms cubic-bezier(0.16,1,0.3,1)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px 32px' }}>
        <span
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '16px',
            fontWeight: 500,
            color: 'var(--accent-proc)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          p.
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ color: 'var(--text-30)' }}
              >
                roc.
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0 8px', flex: 1 }}>
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            }
            isExpanded={isExpanded}
          />
        ))}
      </nav>

      {/* Settings — bottom */}
      <div style={{ padding: '0 8px 20px' }}>
        <NavItem
          icon="⚙"
          label="Einstellungen"
          href="/settings"
          isActive={pathname === '/settings'}
          isExpanded={isExpanded}
        />
      </div>
    </aside>
  )
}
