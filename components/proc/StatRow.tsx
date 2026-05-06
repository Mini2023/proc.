interface StatRowProps {
  label: string
  value: string
  detail?: string
  barFilled?: number  // 0-1
}

export function StatRow({ label, value, detail, barFilled }: StatRowProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: barFilled !== undefined ? '6px' : '2px',
        }}
      >
        <span
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-30)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '13px',
            color: 'var(--text-80)',
            letterSpacing: '-0.01em',
          }}
        >
          {value}
        </span>
      </div>

      {barFilled !== undefined && (
        <div
          style={{
            height: '2px',
            background: 'var(--border-0)',
            borderRadius: '1px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(barFilled * 100, 100)}%`,
              background:
                barFilled >= 0.8
                  ? 'var(--positive)'
                  : barFilled >= 0.5
                  ? 'var(--accent-proc)'
                  : 'var(--warning)',
              borderRadius: '1px',
              transition: 'width 600ms ease',
            }}
          />
        </div>
      )}

      {detail && (
        <p
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '11px',
            color: 'var(--text-30)',
            marginTop: '3px',
          }}
        >
          {detail}
        </p>
      )}
    </div>
  )
}
