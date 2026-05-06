import type { CSSProperties } from 'react'

export function SkeletonLine({
  width = '100%',
  height = 14,
  style,
}: {
  width?: string | number
  height?: number
  style?: CSSProperties
}) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: '6px', marginBottom: '8px', ...style }}
    />
  )
}

export function SkeletonBlock({
  height,
  style,
}: {
  height: number
  style?: CSSProperties
}) {
  return (
    <div
      className="skeleton"
      style={{ width: '100%', height, borderRadius: '12px', ...style }}
    />
  )
}

export function SkeletonCircle({ size }: { size: number }) {
  return (
    <div
      className="skeleton"
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }}
    />
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div
      className="glass-card"
      style={{ padding: '20px 24px', marginBottom: '12px' }}
    >
      <SkeletonLine width="45%" height={12} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === lines - 2 ? '65%' : '90%'}
          height={14}
        />
      ))}
    </div>
  )
}
