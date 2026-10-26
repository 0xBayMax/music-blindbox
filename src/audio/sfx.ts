import * as Tone from 'tone'

/**
 * 8-bit UI 交互音效：原生 WebAudio 直出（不走引擎母带链，互不干扰）
 * 均在用户手势链路内触发，顺带 resume 挂起的 AudioContext
 */

export type SfxKind = 'draw' | 'insert' | 'reject' | 'ssr' | 'lock' | 'start' | 'easter'

export function sfx(kind: SfxKind) {
  const ctx = Tone.getContext().rawContext as AudioContext
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  const t = ctx.currentTime

  const beep = (freq: number, dur: number, at: number, vol: number, type: OscillatorType = 'square') => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t + at)
    g.gain.setValueAtTime(vol, t + at)
    g.gain.exponentialRampToValueAtTime(0.001, t + at + dur)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(t + at)
    osc.stop(t + at + dur)
  }

  switch (kind) {
    case 'draw': // 抽卡：上行三连 blip
      beep(523, 0.07, 0, 0.12)
      beep(659, 0.07, 0.08, 0.12)
      beep(784, 0.09, 0.16, 0.12)
      break
    case 'insert': // 入槽：高频咔 + 低频顿
      beep(1200, 0.03, 0, 0.1)
      beep(180, 0.06, 0.02, 0.18)
      break
    case 'reject': // 类型不匹配：低频双 buzz
      beep(110, 0.09, 0, 0.16, 'sawtooth')
      beep(110, 0.09, 0.12, 0.16, 'sawtooth')
      break
    case 'ssr': // SSR 出货：金光琶音
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => beep(f, 0.1, i * 0.06, 0.1))
      break
    case 'lock': // 锁定咔
      beep(880, 0.04, 0, 0.1)
      break
    case 'start': // START：双 blip
      beep(660, 0.08, 0, 0.12)
      beep(990, 0.1, 0.09, 0.1)
      break
    case 'easter': // 彩蛋触发：下行 glitch
      [880, 740, 622, 466].forEach((f, i) => beep(f, 0.06, i * 0.05, 0.1, 'sawtooth'))
      break
  }
}
