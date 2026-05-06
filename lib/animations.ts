import type { Variants } from 'framer-motion'

const spring = [0.16, 1, 0.3, 1] as [number, number, number, number]

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 16, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: spring },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
}

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: spring },
  },
}

// For interactive cards — pair with whileHover="hover" initial="rest"
export const floatCard: Variants = {
  rest: {
    y: 0,
    boxShadow:
      '0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.07), 0 24px 48px rgba(0,0,0,0.04)',
  },
  hover: {
    y: -3,
    boxShadow:
      '0 1px 0 rgba(255,255,255,0.95) inset, 0 4px 8px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.10), 0 32px 64px rgba(0,0,0,0.05)',
    transition: { duration: 0.25, ease: spring },
  },
}

// For SVG path checkmark draw-on animations
export const checkmarkDraw: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut', delay: 0.05 },
  },
}

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}
