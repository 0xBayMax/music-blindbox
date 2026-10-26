export type SlotType = 'groove' | 'harmony' | 'timbre'
export type Rarity = 'N' | 'R' | 'SR' | 'SSR'

export interface DrumFill {
  kick?: number[]
  snare?: number[]
  hat?: number[]
  perc?: number[]
}

export interface GrooveParams {
  bpm: number
  swing: number
  /** 16 步，数值 = 力度 0~1，hat 中 2 表示开镲 */
  kick: number[]
  snare: number[]
  hat: number[]
  perc: number[]
  /** 第 4 小节 fill */
  fill?: DrumFill
}

export interface ChordEvent {
  /** Pad 和弦音 */
  pad: string[]
  /** Bass 根音 */
  root: string
  /** 持续拍数（整段进行总拍数 = 16，即 4 小节） */
  beats: number
}

export interface HarmonyParams {
  progression: ChordEvent[]
  bassStyle: 'root' | 'pulse' | 'walk' | 'drone'
  padOsc: 'sine' | 'triangle' | 'sawtooth' | 'square'
}

export interface TimbreParams {
  /** Lead 合成器类型，见 engine.makeLead */
  leadOsc: string
  /** 音阶（已统一到 C 系），motif 度数超出长度自动翻八度 */
  scale: string[]
  /** 16 步 motif：-1 休止，其余为音阶度数 */
  motif: number[]
  arpMode: 'up' | 'down' | 'updown' | 'random' | 'off'
  arpRate: '8n' | '16n'
  /** Lead 失真量 0~1 */
  distort?: number
}

export interface Card {
  id: string
  name: string
  slot: SlotType | 'easter'
  rarity: Rarity
  flavor: string
  params?: GrooveParams | HarmonyParams | TimbreParams
  /** 彩蛋卡效果 id */
  effect?: 'rm-rf' | 'copy-paste' | 'stack-overflow' | 'not-found' | 'hello-world' | 'sudo'
}
