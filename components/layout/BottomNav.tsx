'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function FocusIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke={color} strokeWidth="1.4" />
      <circle cx="10" cy="10" r="3.5" stroke={color} strokeWidth="1.4" />
      <line x1="10" y1="2.5" x2="10" y2="4.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="10" y1="15.5" x2="10" y2="17.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="2.5" y1="10" x2="4.5" y2="10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="15.5" y1="10" x2="17.5" y2="10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

const navItems = [
  { icon: '⌂', label: 'Dashboard', href: '/', isSvg: false },
  { icon: '◎', label: 'Briefing', href: '/briefing', isSvg: false },
  { icon: null, label: 'Fokus', href: '/focus', isSvg: true },
  { icon: '◈', label: 'Klausuren', href: '/klausuren', isSvg: false },
  { icon: '✓', label: 'Todos', href: '/todos', isSvg: false },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="app-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(242,244,248,0.96)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 -1px 0 rgba(255,255,255,0.8)',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingTop: '8px',
        paddingLeft: '4px',
        paddingRight: '4px',
        height: 'calc(52px + env(safe-area-inset-bottom))',
      }}
    >
      {navItems.map((item) => {
        const isActive =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              textDecoration: 'none',
              padding: '2px 10px 6px',
              color: isActive ? 'var(--accent-proc)' : 'rgba(10,10,15,0.32)',
              transition: 'color 150ms',
              flex: 1,
              minWidth: 0,
            }}
          >
            {item.isSvg ? (
              <FocusIcon
                size={21}
                color={isActive ? 'var(--accent-proc)' : 'rgba(10,10,15,0.32)'}
              />
            ) : (
              <span
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '19px',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {item.icon}
              </span>
            )}
            <span
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '9px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                lineHeight: 1,
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
