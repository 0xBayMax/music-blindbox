import * as Tone from 'tone'
import type { Card, GrooveParams, HarmonyParams, TimbreParams } from '../cards/types'

type LeadSynth = Tone.Synth | Tone.FMSynth | Tone.MonoSynth

const LAYERS = ['kick', 'snare', 'hat', 'perc', 'bass', 'pad', 'lead', 'arp'] as const
type LayerName = typeof LAYERS[number]

/** 3SSR 隐藏曲判定：节奏/和声/音色三张 SSR 同槽 */
export const HIDDEN_COMBO = ['groove-quantum', 'harmony-golden', 'timbre-golden-chip']

/** Lead 合成器工厂 */
function makeLead(kind: string): LeadSynth {
  switch (kind) {
    case 'fm':
      return new Tone.FMSynth({
        harmonicity: 8, modulationIndex: 12,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.4 },
      })
    case 'vibra':
      return new Tone.FMSynth({
        harmonicity: 3, modulationIndex: 6,
        envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.8 },
      })
    case 'vox':
      return new Tone.FMSynth({
        harmonicity: 2.5, modulationIndex: 8,
        envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.2 },
      })
    case 'acid':
      return new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        filter: { Q: 8, frequency: 600, type: 'lowpass' },
        filterEnvelope: { attack: 0.001, decay: 0.2, sustain: 0.2, release: 0.2, baseFrequency: 200, octaves: 3 },
        portamento: 0.06,
      })
    case 'organ':
      return new Tone.Synth({
        oscillator: { type: 'fatsquare', count: 3, spread: 15 },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.8, release: 0.3 },
      })
    case 'strings':
      return new Tone.Synth({
        oscillator: { type: 'fatsawtooth', count: 3, spread: 25 },
        envelope: { attack: 0.35, decay: 0.3, sustain: 0.8, release: 1 },
      })
    case 'gold':
      return new Tone.Synth({
        oscillator: { type: 'fatsquare', count: 4, spread: 40 },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.2, release: 0.3 },
      })
    case 'dist':
      return new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.002, decay: 0.3, sustain: 0.4, release: 0.3 },
      })
    case 'sawtooth':
      return new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.2 },
      })
    case 'triangle':
      return new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.4, sustain: 0, release: 0.6 },
      })
    default: // square
      return new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.15 },
      })
  }
}

/**
 * 8 层 Beat 引擎：Kick / Snare / Hat / Perc / Bass / Pad / Lead / Arp
 * 3 张卡 = 参数包，驱动 8 个声音层；loop = 4 小节 × 16 步。
 */
export class BeatEngine {
  private built = false
  private running = false
  private step = 0
  private chordIdx = -1
  private arpIdx = 0
  private tickLogged = false
  private tickErrLogged = false

  // ---- 自管调度器（绕开 Tone.Transport，只依赖 ctx.currentTime 前进）----
  private bpm = 120
  private swing = 0
  private secPerStep = 60 / 120 / 4
  private nextTime = 0
  private timerId: ReturnType<typeof setInterval> | null = null
  private watchdogId: ReturnType<typeof setInterval> | null = null
  /** 看门狗检测到时钟冻结后置位；下一次 START（用户手势内）重建全新 AudioContext */
  private needCtxReset = false
  /** 首次 START 时换掉页面加载时创建（生来 suspended）的 context */
  private ctxSwapped = false

  // ---- 当前卡片与参数 ----
  private grooveCard?: Card
  private harmonyCard?: Card
  private timbreCard?: Card
  private groove?: GrooveParams
  private harmony?: HarmonyParams
  private timbre?: TimbreParams
  private pending: { groove?: Card; harmony?: Card; timbre?: Card } = {}

  // ---- 彩蛋状态 ----
  private mutedLayer: LayerName | null = null
  private dropNextBar = false
  private dropBar = false
  private overload = false
  private golden = false
  private hidden = false

  // ---- 节点 ----
  private layerGain!: Record<LayerName, Tone.Gain>
  private bus!: Tone.Gain
  private duck!: Tone.Gain
  private masterDist!: Tone.Distortion
  private analyser!: Tone.Analyser

  // ---- 乐器 ----
  private kick!: Tone.MembraneSynth
  private snare!: Tone.NoiseSynth
  private hat!: Tone.MetalSynth
  private perc!: Tone.MembraneSynth
  private bass!: Tone.MonoSynth
  private pad!: Tone.PolySynth
  private lead!: LeadSynth
  private arp!: Tone.Synth
  private leadDist!: Tone.Distortion
  /** 隐藏曲黄金铃音层 */
  private bell!: Tone.FMSynth

  onStep?: (step: number, bar: number) => void
  onEaster?: (msg: string) => void
  onHiddenCombo?: () => void

  // ================= 构建音频图 =================
  private build() {
    if (this.built) return

    const dest = Tone.getDestination()
    this.analyser = new Tone.Analyser('fft', 64)
    const limiter = new Tone.Limiter(-1).connect(this.analyser)
    this.analyser.connect(dest)
    const comp = new Tone.Compressor(-18, 3).connect(limiter)
    const eq = new Tone.EQ3(0, 0, 2).connect(comp)
    this.masterDist = new Tone.Distortion(0.5).connect(eq)
    this.masterDist.wet.value = 0
    this.bus = new Tone.Gain(1).connect(this.masterDist)

    // 发送效果
    const reverb = new Tone.Reverb({ decay: 3, wet: 1 }).connect(this.bus)
    const delay = new Tone.PingPongDelay({ delayTime: '8n.', feedback: 0.3, wet: 1 }).connect(this.bus)
    const revSend = new Tone.Gain(0.35).connect(reverb)
    const delSend = new Tone.Gain(0.25).connect(delay)

    this.duck = new Tone.Gain(1).connect(this.bus)

    this.layerGain = Object.fromEntries(
      LAYERS.map(n => [n, new Tone.Gain(1)]),
    ) as Record<LayerName, Tone.Gain>

    // 鼓组 → 直通 bus
    this.kick = new Tone.MembraneSynth({ pitchDecay: 0.04, envelope: { attack: 0.001, decay: 0.35, sustain: 0 } })
    this.kick.volume.value = -2
    this.kick.connect(this.layerGain.kick); this.layerGain.kick.connect(this.bus)

    this.snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.18, sustain: 0 } })
    this.snare.volume.value = -8
    this.snare.connect(this.layerGain.snare); this.layerGain.snare.connect(this.bus)

    this.hat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.06, release: 0.02 },
      harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
    })
    this.hat.volume.value = -17
    this.hat.connect(this.layerGain.hat); this.layerGain.hat.connect(this.bus)

    this.perc = new Tone.MembraneSynth({ pitchDecay: 0.008, octaves: 2, envelope: { attack: 0.001, decay: 0.08, sustain: 0 } })
    this.perc.volume.value = -14
    this.perc.connect(this.layerGain.perc); this.layerGain.perc.connect(this.bus)

    // Bass / Pad → 侧链 duck
    this.bass = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { Q: 2, frequency: 400, type: 'lowpass' },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.2 },
    })
    this.bass.volume.value = -9
    this.bass.connect(this.layerGain.bass); this.layerGain.bass.connect(this.duck)

    this.pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.08, decay: 0.3, sustain: 0.7, release: 0.8 },
    })
    this.pad.volume.value = -15
    this.pad.connect(this.layerGain.pad); this.layerGain.pad.connect(this.duck)
    this.layerGain.pad.connect(revSend)

    // Lead / Arp → 声场拓宽 + delay/reverb 发送
    const widener = new Tone.StereoWidener(0.7).connect(this.bus)
    this.leadDist = new Tone.Distortion(0).connect(widener)
    this.leadDist.wet.value = 0
    this.layerGain.lead.connect(this.leadDist)
    this.layerGain.lead.connect(delSend)
    this.layerGain.lead.connect(revSend)
    this.lead = makeLead('square')
    this.lead.volume.value = -8
    this.lead.connect(this.layerGain.lead)

    this.arp = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.1 },
    })
    this.arp.volume.value = -21
    this.arp.connect(this.layerGain.arp); this.layerGain.arp.connect(this.bus)
    this.layerGain.arp.connect(delSend)

    // 隐藏曲黄金铃音层：玻璃质感，走 delay+reverb 制造圣光尾音
    this.bell = new Tone.FMSynth({
      harmonicity: 12, modulationIndex: 8,
      envelope: { attack: 0.002, decay: 0.9, sustain: 0, release: 1.2 },
      modulationEnvelope: { attack: 0.002, decay: 0.3, sustain: 0, release: 0.4 },
    })
    this.bell.volume.value = -19
    this.bell.connect(this.bus)
    this.bell.connect(revSend)
    this.bell.connect(delSend)

    this.built = true
  }

  // ================= 对外 API =================

  /** 必须在用户手势中调用 */
  async start() {
    // 页面加载时 Tone 创建的 context 生来 suspended，期间遇到音频端点异常
    // （蓝牙断连/默认设备切换），resume 后渲染循环可能已死（currentTime 冻结）。
    // 因此首次 START 就换一个手势内新建的 context；看门狗检测到冻结时同样触发重建。
    if (this.needCtxReset || !this.ctxSwapped) {
      const frozen = this.needCtxReset
      this.needCtxReset = false
      this.ctxSwapped = true
      console.log(frozen
        ? '[BeatEngine] 重建 AudioContext（旧上下文时钟冻结）…'
        : '[BeatEngine] 使用手势内新建的 AudioContext')
      try {
        Tone.setContext(new AudioContext())
        this.built = false // 音频图全部绑定旧 context，必须重建
      } catch (e) {
        // 浏览器 AudioContext 数量上限等极端情况：沿用现有 context
        console.warn('[BeatEngine] 新建 AudioContext 失败，沿用现有 context', e)
      }
    }
    // 某些浏览器手势链路异常时 resume() 可能一直挂起，800ms 超时兜底
    await Promise.race([Tone.start(), new Promise(r => setTimeout(r, 800))])
    const ctx = Tone.getContext()
    this.build()
    this.step = 0
    this.chordIdx = -1
    this.tickLogged = false
    this.tickErrLogged = false
    this.applyPending()
    console.log(`[BeatEngine] start: ctx=${ctx.state} sampleRate=${ctx.sampleRate} t=${ctx.currentTime.toFixed(3)} bpm=${this.bpm}`)
    // 调度起点：100ms 后，look-ahead 窗口 120ms，25ms 泵一次。
    // 以旧会话高水位为下限——时钟冻结时二次 START 会排出与上一会话完全
    // 相同的时间戳，触发 Tone 的 Source「strictly greater」断言
    this.nextTime = Math.max(ctx.currentTime, this.nextTime + this.secPerStep) + 0.1
    this.running = true
    if (this.timerId !== null) clearInterval(this.timerId)
    this.timerId = setInterval(() => this.pump(), 25)
    this.startWatchdog()
  }

  stop() {
    this.running = false
    if (this.timerId !== null) { clearInterval(this.timerId); this.timerId = null }
    if (this.watchdogId !== null) { clearInterval(this.watchdogId); this.watchdogId = null }
    this.pad?.releaseAll()
  }

  /** 调度泵：把未来 120ms 内的 16 分音符步进全部排进音频时钟 */
  private pump() {
    if (!this.running) return
    const now = Tone.getContext().currentTime
    // 页面后台 setInterval 被节流导致追帧过度时，直接对齐到当下，避免"机关枪"
    if (this.nextTime < now - 0.05) this.nextTime = now + 0.02
    while (this.nextTime < now + 0.12) {
      const s16 = this.step % 16
      // swing：奇数 16 分音符向后推 swing × 半步
      const swingDelay = s16 % 2 === 1 ? this.swing * this.secPerStep / 2 : 0
      this.tick(this.nextTime + swingDelay)
      this.nextTime += this.secPerStep
    }
  }

  /** 健康监测：区分「音频时钟冻结（环境问题）」和「引擎内部错误」 */
  private startWatchdog() {
    if (this.watchdogId !== null) clearInterval(this.watchdogId)
    let lastTime = Tone.getContext().currentTime
    let lastStep = 0
    let samples = 0
    let frozenReported = false
    this.watchdogId = setInterval(() => {
      if (!this.running) return
      const ctx = Tone.getContext()
      samples++
      const dt = ctx.currentTime - lastTime
      const moved = this.step !== lastStep
      if (samples <= 5) {
        console.log(`[BeatEngine] health#${samples} ctx=${ctx.state} ctxTime=${ctx.currentTime.toFixed(3)} Δt=${dt.toFixed(3)} step=${this.step}`)
      }
      if (samples >= 2 && Math.abs(dt) < 0.05 && !frozenReported) {
        frozenReported = true
        this.needCtxReset = true
        console.warn('[BeatEngine] ⚠️ AudioContext.currentTime 冻结（Δt≈0）——请再点一次 START，引擎将重建音频上下文。若重建后仍无声音，则是系统输出设备问题（检查耳机/默认设备/换浏览器）。')
        this.onEaster?.('AUDIO CONTEXT 冻结 — 请再点一次 START 重建')
      } else if (samples >= 3 && dt > 0.05 && !moved) {
        console.error('[BeatEngine] 时钟正常但调度未推进——引擎内部错误，请把以上 health 日志反馈')
      }
      lastTime = ctx.currentTime
      lastStep = this.step
      if (samples >= 12 && this.watchdogId !== null) { clearInterval(this.watchdogId); this.watchdogId = null }
    }, 400)
  }

  /** 原生 WebAudio 蜂鸣（绕过 Tone 全链路），用于隔离系统音频输出问题 */
  testBeep() {
    const raw = Tone.getContext().rawContext as AudioContext
    const osc = raw.createOscillator()
    const g = raw.createGain()
    osc.frequency.value = 440
    g.gain.setValueAtTime(0.2, raw.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, raw.currentTime + 0.5)
    osc.connect(g)
    g.connect(raw.destination)
    osc.start()
    osc.stop(raw.currentTime + 0.5)
    console.log('[BeatEngine] testBeep: 原生 440Hz 0.5s —— 听不到则是系统输出问题，与引擎无关')
  }

  get isRunning() { return this.running }
  get isGolden() { return this.golden }
  get isOverload() { return this.overload }
  get isHidden() { return this.hidden }

  /** 新卡入槽：立即记下，下一小节边界生效（播放中无缝换轨） */
  setCard(card: Card) {
    this.build() // 首次入槽可能早于 START，先确保音频图已构建
    if (card.slot === 'groove') this.pending.groove = card
    else if (card.slot === 'harmony') this.pending.harmony = card
    else if (card.slot === 'timbre') this.pending.timbre = card
    if (!this.running) this.applyPending()
  }

  /** 彩蛋卡触发 */
  triggerEaster(card: Card) {
    this.build()
    switch (card.effect) {
      case 'rm-rf': {
        if (this.mutedLayer) {
          this.layerGain[this.mutedLayer].gain.rampTo(1, 0.1)
          this.onEaster?.(`恢复音轨: ${this.mutedLayer}`)
          this.mutedLayer = null
        } else {
          const pick = LAYERS[Math.floor(Math.random() * LAYERS.length)]
          this.layerGain[pick].gain.rampTo(0, 0.1)
          this.mutedLayer = pick
          this.onEaster?.(`rm -rf: 已删除音轨 ${pick}`)
        }
        break
      }
      case 'copy-paste': {
        if (this.groove) {
          this.groove = { ...this.groove, perc: [...this.groove.hat] }
          this.onEaster?.('Ctrl+C/V: hat pattern 已粘贴到 perc')
        }
        break
      }
      case 'stack-overflow': {
        this.overload = !this.overload
        this.masterDist.wet.value = this.overload ? 0.7 : 0
        this.bus.gain.rampTo(this.overload ? 1.5 : 1, 0.1)
        this.onEaster?.(this.overload ? 'STACK OVERFLOW: 全局过载！' : '栈已恢复')
        break
      }
      case 'not-found': {
        this.dropNextBar = true
        this.onEaster?.('404: 下一小节鼓点将失踪')
        break
      }
      case 'hello-world': {
        const notes = ['C5', 'E5', 'G5', 'C6']
        notes.forEach((n, i) => this.lead.triggerAttackRelease(n, '16n', Tone.now() + i * 0.13, 0.8))
        this.onEaster?.('Hello, World!')
        break
      }
      case 'sudo': {
        this.golden = !this.golden
        LAYERS.forEach(n => this.layerGain[n].gain.rampTo(this.golden ? 1.35 : 1, 0.1))
        this.onEaster?.(this.golden ? 'sudo: 已获得 root 音量权限' : 'sudo 权限已回收')
        break
      }
    }
  }

  getSpectrum(): Float32Array {
    return this.analyser ? (this.analyser.getValue() as Float32Array) : new Float32Array(64).fill(-100)
  }

  /** 调试探针 */
  debugState() {
    const ctx = Tone.getContext()
    return {
      ctx: ctx.state,
      ctxTime: Math.round(ctx.currentTime * 1000) / 1000,
      bpm: Math.round(this.bpm),
      step: this.step,
      running: this.running,
      built: this.built,
      nextInMs: this.running ? Math.round((this.nextTime - ctx.currentTime) * 1000) : null,
      cards: { groove: !!this.groove, harmony: !!this.harmony, timbre: !!this.timbre },
      spec: Array.from(this.getSpectrum().slice(0, 8)).map(v => Math.round(v)),
    }
  }

  // ================= 内部：换卡 / 步进 =================

  private applyPending() {
    if (this.pending.groove) {
      this.grooveCard = this.pending.groove
      this.groove = this.grooveCard.params as GrooveParams
      // 护栏：非法 bpm/swing 一律忽略，避免毒死调度器
      const b = this.groove.bpm
      if (typeof b === 'number' && b >= 40 && b <= 300) {
        this.bpm = b
        this.secPerStep = 60 / b / 4
      } else {
        console.warn('[BeatEngine] 非法 bpm，已忽略：', b)
      }
      const sw = this.groove.swing
      this.swing = typeof sw === 'number' && sw >= 0 && sw <= 1 ? sw : 0
      this.pending.groove = undefined
    }
    if (this.pending.harmony) {
      this.harmonyCard = this.pending.harmony
      this.harmony = this.harmonyCard.params as HarmonyParams
      this.pad.set({ oscillator: { type: this.harmony.padOsc } })
      this.chordIdx = -1
      this.pending.harmony = undefined
    }
    if (this.pending.timbre) {
      this.timbreCard = this.pending.timbre
      const p = this.timbreCard.params as TimbreParams
      const changed = this.timbre?.leadOsc !== p.leadOsc
      this.timbre = p
      if (changed || !this.lead) {
        this.lead?.disconnect(); this.lead?.dispose()
        this.lead = makeLead(p.leadOsc)
        this.lead.volume.value = -8
        this.lead.connect(this.layerGain.lead)
      }
      const d = p.distort ?? 0
      this.leadDist.distortion = d
      this.leadDist.wet.value = d > 0 ? 0.8 : 0
      this.pending.timbre = undefined
    }
    // 3 SSR 隐藏曲检测
    const ids = [this.grooveCard?.id, this.harmonyCard?.id, this.timbreCard?.id]
    const hit = HIDDEN_COMBO.every(id => ids.includes(id))
    if (hit && !this.hidden) {
      this.hidden = true
      this.playGoldenIntro()
      this.onHiddenCombo?.()
    } else if (!hit) {
      this.hidden = false
    }
  }

  private chordAt(step: number): number {
    if (!this.harmony) return -1
    const beat = step / 4
    let acc = 0
    const prog = this.harmony.progression
    for (let i = 0; i < prog.length; i++) {
      acc += prog[i].beats
      if (beat < acc) return i
    }
    return prog.length - 1
  }

  private leadNote(deg: number): string {
    const scale = this.timbre!.scale
    const len = scale.length
    const oct = Math.floor(deg / len)
    const note = scale[((deg % len) + len) % len]
    return Tone.Frequency(note).transpose(oct * 12).toNote()
  }

  private tick(time: number) {
    if (!this.tickLogged) {
      this.tickLogged = true
      console.log('[BeatEngine] tick live — 16n 回调已触发')
    }
    try {
      this.doTick(time)
    } catch (e) {
      // 单步异常不应杀死整个循环；首个异常打日志便于定位
      if (!this.tickErrLogged) {
        this.tickErrLogged = true
        console.error('[BeatEngine] tick error:', e)
      }
    }
  }

  private doTick(time: number) {
    const step = this.step
    const bar = Math.floor(step / 16)
    const s16 = step % 16
    const bpm = this.bpm
    const secPerBeat = 60 / bpm

    // 小节边界：应用换卡 / 处理 404 丢拍
    if (s16 === 0) {
      this.applyPending()
      this.dropBar = this.dropNextBar
      this.dropNextBar = false
    }

    // ---- 和声层 ----
    let chordNotes: string[] = []
    if (this.harmony) {
      const idx = this.chordAt(step)
      const prog = this.harmony.progression
      if (idx >= 0 && idx !== this.chordIdx) {
        this.chordIdx = idx
        const ev = prog[idx]
        chordNotes = ev.pad
        const dur = ev.beats * secPerBeat * 0.95
        this.pad.triggerAttackRelease(ev.pad, dur, time, 0.7)
        // bass：换和弦时给根音；但若本步稍后会被 pulse/walk 风格分支
        // 再触发一次（同一 time 二次 start 会触发 Tone 的 Source 断言），则跳过
        if (this.harmony.bassStyle !== 'drone') {
          const willFire =
            (this.harmony.bassStyle === 'pulse' && s16 % 2 === 0) ||
            (this.harmony.bassStyle === 'walk' && s16 % 4 === 0)
          if (!willFire) {
            this.bass.triggerAttackRelease(ev.root, secPerBeat * 0.9, time, 0.9)
          }
        }
      } else if (idx >= 0) {
        chordNotes = prog[idx].pad
      }

      const ev = prog[Math.max(0, idx)]
      // bass 风格
      if (this.harmony.bassStyle === 'pulse' && s16 % 2 === 0 && this.chordIdx === idx) {
        this.bass.triggerAttackRelease(ev.root, secPerBeat * 0.4, time, 0.7)
      } else if (this.harmony.bassStyle === 'walk' && s16 % 4 === 0) {
        const beatInBar = s16 / 4
        const walkNotes = [
          ev.root,
          Tone.Frequency(ev.root).transpose(7).toNote(),
          Tone.Frequency(ev.root).transpose(12).toNote(),
          Tone.Frequency(ev.root).transpose(10).toNote(),
        ]
        this.bass.triggerAttackRelease(walkNotes[beatInBar], secPerBeat * 0.85, time, 0.8)
      } else if (this.harmony.bassStyle === 'drone' && s16 === 0) {
        this.bass.triggerAttackRelease(ev.root, secPerBeat * 3.8, time, 0.6)
      }
    }

    // ---- 鼓组（第 4 小节用 fill，404 时静默）----
    const g = this.groove
    if (g && !this.dropBar) {
      const fill = bar === 3 ? g.fill : undefined
      const pick = (base: number[], over?: number[]) => over ?? base
      const kv = pick(g.kick, fill?.kick)[s16]
      const sv = pick(g.snare, fill?.snare)[s16]
      const hv = pick(g.hat, fill?.hat)[s16]
      const pv = pick(g.perc, fill?.perc)[s16]
      if (kv > 0) {
        this.kick.triggerAttackRelease('C1', '8n', time, Math.min(1, kv))
        // 侧链：bass/pad 呼吸感
        this.duck.gain.setValueAtTime(0.35, time)
        this.duck.gain.linearRampToValueAtTime(1, time + secPerBeat * 0.9)
      }
      if (sv > 0) this.snare.triggerAttackRelease('16n', time, Math.min(1, sv))
      if (hv > 0) {
        this.hat.envelope.decay = hv >= 2 ? 0.3 : 0.06
        this.hat.triggerAttackRelease('G5', '64n', time, Math.min(1, hv >= 2 ? 0.8 : hv))
      }
      if (pv > 0) this.perc.triggerAttackRelease('G3', '32n', time, Math.min(1, pv))
    }

    // ---- Lead（motif，第 4 小节翻高八度）----
    if (this.timbre) {
      let deg = this.timbre.motif[s16]
      if (deg >= 0) {
        if (bar === 3 && this.timbre.leadOsc !== 'strings') deg += this.timbre.scale.length
        this.lead.triggerAttackRelease(this.leadNote(deg), '16n', time, 0.8)
      }
    }

    // ---- Arp（跟随当前和弦音，与 Lead 错开八度；隐藏曲强制 16n）----
    if (this.timbre && this.timbre.arpMode !== 'off' && chordNotes.length > 0) {
      const rate16 = this.timbre.arpRate === '16n' || this.hidden
      if (rate16 || s16 % 2 === 0) {
        const mode = this.timbre.arpMode
        const n = chordNotes.length
        let idx: number
        if (mode === 'random') idx = Math.floor(Math.random() * n)
        else if (mode === 'down') { this.arpIdx = (this.arpIdx - 1 + n) % n; idx = this.arpIdx }
        else if (mode === 'updown') {
          const cycle = Math.max(1, n * 2 - 2)
          const pos = this.arpIdx % cycle
          idx = pos < n ? pos : cycle - pos
          this.arpIdx++
        } else { this.arpIdx = (this.arpIdx + 1) % n; idx = this.arpIdx }
        this.playArp(chordNotes[idx], time)
      }
    }

    // ---- 隐藏曲：黄金铃音在和弦高点缀 ----
    if (this.hidden && chordNotes.length > 0) {
      const top = chordNotes[chordNotes.length - 1]
      if (s16 === 0) {
        // 小节头：高八度长铃
        this.bell.triggerAttackRelease(Tone.Frequency(top).transpose(12).toNote(), '4n', time, 0.45)
      } else if (s16 === 10) {
        // 后半小节：五度短铃回应
        this.bell.triggerAttackRelease(Tone.Frequency(top).transpose(19).toNote(), '8n', time, 0.3)
      }
    }

    this.finishTick(step, bar, time)
  }

  /** 隐藏曲解锁仪式：黄金铃音上行琶音（C 大调五声爬升两个八度） */
  private playGoldenIntro() {
    const notes = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'E5', 'G5', 'C6']
    const t0 = Tone.now() + 0.05
    notes.forEach((n, i) => {
      this.bell.triggerAttackRelease(n, '8n', t0 + i * 0.09, 0.5)
    })
  }

  private playArp(note: string, time: number) {
    const up = Tone.Frequency(note).transpose(12).toNote()
    this.arp.triggerAttackRelease(up, '32n', time, 0.6)
  }

  private finishTick(step: number, bar: number, time: number) {
    const s = step
    // UI 回调用 setTimeout 即可（不依赖 Tone.Draw 的 context tick 事件）
    const delay = Math.max(0, (time - Tone.getContext().currentTime) * 1000)
    setTimeout(() => this.onStep?.(s, bar), delay)
    this.step = (step + 1) % 64
  }
}
