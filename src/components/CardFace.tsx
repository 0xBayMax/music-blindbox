import { useEffect, useRef } from 'react'
import type { Card, Rarity, SlotType } from '../cards/types'

export const SLOT_LABEL: Record<SlotType, string> = { groove: '节奏', harmony: '和声', timbre: '音色' }

const RARITY_SIGIL: Record<Rarity, [string, string]> = {
  N: ['#3a3a3c', '#c8c4b8'],
  R: ['#1c4d8f', '#58a6ff'],
  SR: ['#4b2a85', '#bc8cff'],
  SSR: ['#8a5a00', '#f7b731'],
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 由卡牌 id 确定性生成 8x8 左右对称像素图腾（零美术资源） */
function PixelSigil({ seed, colors }: { seed: string; colors: [string, string] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    let h = hash(seed)
    const rnd = () => {
      h ^= h << 13; h >>>= 0
      h ^= h >>> 17
      h ^= h << 5; h >>>= 0
      return h / 0xffffffff
    }
    ctx.clearRect(0, 0, 8, 8)
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 4; x++) {
        ctx.fillStyle = rnd() > 0.52 ? colors[0] : colors[1]
        ctx.fillRect(x, y, 1, 1)
        ctx.fillRect(7 - x, y, 1, 1)
      }
    }
  }, [seed, colors])
  return <canvas ref={ref} width={8} height={8} className="sigil" />
}

interface Props {
  card: Card
  /** 翻卡动画的错帧序号 */
  index?: number
  locked?: boolean
  onToggleLock?: () => void
  onPlay?: () => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  /** 槽内紧凑模式 */
  compact?: boolean
}

export default function CardFace({ card, index = 0, locked, onToggleLock, onPlay, onDragStart, onDragEnd, compact }: Props) {
  const slotText = card.slot === 'easter' ? '彩蛋' : SLOT_LABEL[card.slot as SlotType]
  return (
    <div
      className={`cart rarity-${card.rarity.toLowerCase()}${locked ? ' locked' : ''}${compact ? ' compact' : ''}${card.slot === 'easter' ? ' easter' : ''}`}
      style={{ animationDelay: `${index * 120}ms` }}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onPlay}
      role="button"
    >
      <div className="cart-notch" />
      <div className="cart-label">
        <div className="cart-head">
          <PixelSigil seed={card.id} colors={RARITY_SIGIL[card.rarity]} />
          <span className="cart-rarity">{card.rarity}</span>
        </div>
        <div className="cart-name">{card.name}</div>
        <div className="cart-meta">{card.rarity} · {slotText}</div>
        {!compact && <div className="cart-flavor">{card.flavor}</div>}
      </div>
      {onToggleLock && (
        <button
          className="cart-lock"
          title={locked ? '解锁' : '锁定（重抽保留）'}
          onClick={e => { e.stopPropagation(); onToggleLock() }}
        >
          {locked ? '[■]' : '[ ]'}
        </button>
      )}
    </div>
  )
}
