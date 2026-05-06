'use client'

import { useEffect, useRef } from 'react'
import type { DeepWorkAudioEngine } from '@/lib/audio/deepWorkAudio'

interface Props {
  audioEngine: DeepWorkAudioEngine | null
  isActive: boolean
}

export function DeepWorkVisualizer({ audioEngine, isActive }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let w = 0
    let h = 0
    let rafId = 0

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas!.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    let phase = 0

    const waves = [
      { color: 'rgba(45,79,215,0.20)', baseAmp: 42, freq: 0.5, phOffset: 0.0 },
      { color: 'rgba(45,79,215,0.12)', baseAmp: 28, freq: 0.9, phOffset: 1.4 },
      { color: 'rgba(255,255,255,0.07)', baseAmp: 58, freq: 0.35, phOffset: 2.8 },
      { color: 'rgba(255,255,255,0.04)', baseAmp: 18, freq: 1.7, phOffset: 4.2 },
    ]

    function draw() {
      rafId = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, w, h)
      phase += 0.005

      let mult = 0.4
      if (audioEngine && isActive) {
        const freq = audioEngine.getFrequencyData()
        let sum = 0
        const n = Math.min(24, freq.length)
        for (let i = 0; i < n; i++) sum += Math.max(0, (freq[i] + 90) / 90)
        mult = 0.3 + Math.min(1.6, (sum / n) * 2.0)
      }

      for (const wave of waves) {
        ctx.beginPath()
        const amp = wave.baseAmp * mult
        const yBase = h * 0.72

        for (let x = 0; x <= w; x += 3) {
          const y = yBase + Math.sin(
            (x / w) * wave.freq * Math.PI * 2 + phase + wave.phOffset
          ) * amp
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        ctx.strokeStyle = wave.color
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    draw()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [audioEngine, isActive])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: isActive ? 1 : 0.25,
        transition: 'opacity 1.5s',
        pointerEvents: 'none',
      }}
    />
  )
}
