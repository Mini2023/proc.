'use client'

import { useState } from 'react'
import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from 'react'

// ── PrimaryButton ─────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  fullWidth?: boolean
}

export function PrimaryButton({ children, disabled, fullWidth, style, ...rest }: ButtonProps) {
  const [pressed, setPressed] = useState(false)

  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 24px',
    width: fullWidth ? '100%' : undefined,
    background: disabled
      ? 'rgba(45,79,215,0.35)'
      : 'linear-gradient(135deg, #3251e8 0%, #2640c8 100%)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'Syne, sans-serif',
    fontWeight: 600,
    letterSpacing: '0.01em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    boxShadow: disabled
      ? 'none'
      : pressed
      ? '0 1px 0 rgba(255,255,255,0.15) inset, 0 1px 4px rgba(45,79,215,0.2)'
      : '0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 12px rgba(45,79,215,0.35)',
    transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
    transition: 'all 150ms cubic-bezier(0.16,1,0.3,1)',
    outline: 'none',
    ...style,
  }

  return (
    <button
      {...rest}
      disabled={disabled}
      style={base}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background =
            'linear-gradient(135deg, #3d5ef5 0%, #2d4de0 100%)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 1px 0 rgba(255,255,255,0.3) inset, 0 6px 18px rgba(45,79,215,0.45)'
        }
        rest.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background =
            'linear-gradient(135deg, #3251e8 0%, #2640c8 100%)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 12px rgba(45,79,215,0.35)'
        }
        rest.onMouseLeave?.(e)
      }}
      onMouseDown={(e) => { if (!disabled) setPressed(true); rest.onMouseDown?.(e) }}
      onMouseUp={(e) => { setPressed(false); rest.onMouseUp?.(e) }}
    >
      {children}
    </button>
  )
}

// ── SecondaryButton ───────────────────────────────────────────────────────────

export function SecondaryButton({ children, disabled, fullWidth, style, ...rest }: ButtonProps) {
  const [pressed, setPressed] = useState(false)

  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 24px',
    width: fullWidth ? '100%' : undefined,
    background: pressed ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(0,0,0,0.08)',
    borderTop: '1px solid rgba(255,255,255,0.9)',
    borderRadius: '10px',
    color: disabled ? 'var(--text-30)' : 'rgba(10,10,15,0.75)',
    fontSize: '14px',
    fontFamily: 'Syne, sans-serif',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 8px rgba(0,0,0,0.06)',
    transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
    transition: 'all 150ms cubic-bezier(0.16,1,0.3,1)',
    outline: 'none',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }

  return (
    <button
      {...rest}
      disabled={disabled}
      style={base}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.88)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 12px rgba(0,0,0,0.08)'
        }
        rest.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.65)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 8px rgba(0,0,0,0.06)'
        }
        rest.onMouseLeave?.(e)
      }}
      onMouseDown={(e) => { if (!disabled) setPressed(true); rest.onMouseDown?.(e) }}
      onMouseUp={(e) => { setPressed(false); rest.onMouseUp?.(e) }}
    >
      {children}
    </button>
  )
}

// ── GhostButton ───────────────────────────────────────────────────────────────

export function GhostButton({ children, disabled, fullWidth, style, ...rest }: ButtonProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 20px',
    width: fullWidth ? '100%' : undefined,
    background: 'transparent',
    border: '1px solid rgba(0,0,0,0.09)',
    borderRadius: '8px',
    color: disabled ? 'var(--text-30)' : 'rgba(10,10,15,0.45)',
    fontSize: '13px',
    fontFamily: 'Syne, sans-serif',
    fontWeight: 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    transition: 'all 150ms',
    outline: 'none',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }

  return (
    <button
      {...rest}
      disabled={disabled}
      style={base}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.15)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(10,10,15,0.7)'
        }
        rest.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.09)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(10,10,15,0.45)'
        }
        rest.onMouseLeave?.(e)
      }}
    >
      {children}
    </button>
  )
}
