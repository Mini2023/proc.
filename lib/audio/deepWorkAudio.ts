export type SoundType = 'off' | 'brown' | 'white' | 'rain' | 'coffee' | 'gamma'

export class DeepWorkAudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private activeNodes: AudioScheduledSourceNode[] = []
  private freqData: Float32Array = new Float32Array(128)

  private init(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.6
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 512
      this.freqData = new Float32Array(this.analyser.frequencyBinCount)
      this.masterGain.connect(this.analyser)
      this.analyser.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  play(type: SoundType): void {
    this.stop()
    if (type === 'off') return
    const ctx = this.init()
    switch (type) {
      case 'brown': this.brown(ctx); break
      case 'white': this.white(ctx); break
      case 'rain': this.rain(ctx); break
      case 'coffee': this.coffee(ctx); break
      case 'gamma': this.gamma(ctx); break
    }
  }

  stop(): void {
    for (const n of this.activeNodes) {
      try { n.stop() } catch { /* already stopped */ }
    }
    this.activeNodes = []
  }

  setVolume(vol: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        Math.max(0, Math.min(1, vol)),
        this.ctx.currentTime,
        0.05
      )
    }
  }

  getFrequencyData(): Float32Array {
    if (this.analyser) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.analyser.getFloatFrequencyData(this.freqData as any)
    }
    return this.freqData
  }

  dispose(): void {
    this.stop()
    void this.ctx?.close()
    this.ctx = null
    this.masterGain = null
    this.analyser = null
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private buf(ctx: AudioContext, secs = 4): AudioBuffer {
    const b = ctx.createBuffer(2, ctx.sampleRate * secs, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
    return b
  }

  private loopSrc(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    this.activeNodes.push(src)
    return src
  }

  private osc(ctx: AudioContext, freq: number): OscillatorNode {
    const o = ctx.createOscillator()
    o.frequency.value = freq
    o.type = 'sine'
    this.activeNodes.push(o)
    return o
  }

  // ── Sound generators ─────────────────────────────────────────────────────────

  private brown(ctx: AudioContext): void {
    const buffer = ctx.createBuffer(2, ctx.sampleRate * 6, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = buffer.getChannelData(c)
      let last = 0
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1
        last = (last + 0.02 * w) / 1.02
        d[i] = last * 3.5
      }
    }
    const src = this.loopSrc(ctx, buffer)
    src.connect(this.masterGain!)
    src.start()
  }

  private white(ctx: AudioContext): void {
    const src = this.loopSrc(ctx, this.buf(ctx, 2))
    const g = ctx.createGain()
    g.gain.value = 0.22
    src.connect(g)
    g.connect(this.masterGain!)
    src.start()
  }

  private rain(ctx: AudioContext): void {
    const src1 = this.loopSrc(ctx, this.buf(ctx, 5))
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1400
    lp.Q.value = 0.4
    const g1 = ctx.createGain()
    g1.gain.value = 0.6
    src1.connect(lp); lp.connect(g1); g1.connect(this.masterGain!)
    src1.start()

    const src2 = this.loopSrc(ctx, this.buf(ctx, 3))
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 3500
    bp.Q.value = 2.5
    const g2 = ctx.createGain()
    g2.gain.value = 0.14
    src2.connect(bp); bp.connect(g2); g2.connect(this.masterGain!)
    src2.start()
  }

  private coffee(ctx: AudioContext): void {
    const layers: { freq: number; q: number; vol: number }[] = [
      { freq: 280, q: 2.5, vol: 0.28 },
      { freq: 560, q: 3.5, vol: 0.20 },
      { freq: 1100, q: 2.0, vol: 0.10 },
      { freq: 2200, q: 3.0, vol: 0.05 },
    ]
    for (const l of layers) {
      const src = this.loopSrc(ctx, this.buf(ctx, 4))
      const f = ctx.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = l.freq
      f.Q.value = l.q
      const g = ctx.createGain()
      g.gain.value = l.vol
      src.connect(f); f.connect(g); g.connect(this.masterGain!)
      src.start()
    }
  }

  private gamma(ctx: AudioContext): void {
    // 40Hz binaural beat: left channel 200Hz, right channel 240Hz
    const merger = ctx.createChannelMerger(2)
    merger.connect(this.masterGain!)

    const oscL = this.osc(ctx, 200)
    const gL = ctx.createGain(); gL.gain.value = 0.12
    oscL.connect(gL); gL.connect(merger, 0, 0)
    oscL.start()

    const oscR = this.osc(ctx, 240)
    const gR = ctx.createGain(); gR.gain.value = 0.12
    oscR.connect(gR); gR.connect(merger, 0, 1)
    oscR.start()

    // Sub-bass drone for grounding
    const drone = this.osc(ctx, 100)
    const gD = ctx.createGain(); gD.gain.value = 0.05
    drone.connect(gD); gD.connect(this.masterGain!)
    drone.start()

    // Quiet noise floor
    const src = this.loopSrc(ctx, this.buf(ctx, 3))
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 180
    const gN = ctx.createGain(); gN.gain.value = 0.04
    src.connect(lp); lp.connect(gN); gN.connect(this.masterGain!)
    src.start()
  }
}
