import { useEffect, useRef, useState } from 'react'
import { CARDS } from './cards/cards'
import { drawCards } from './cards/gacha'
import { BeatEngine, HIDDEN_COMBO } from './audio/engine'
import { sfx } from './audio/sfx'
import { makePoster } from './poster'
import type { Card, SlotType } from './cards/types'
import CardFace, { SLOT_LABEL } from './components/CardFace'
import Spectrum from './components/Spectrum'

const SLOT_ORDER: SlotType[] = ['groove', 'harmony', 'timbre']
const SLOT_ICON: Record<SlotType, string> = { groove: '🥁', harmony: '🎹', timbre: '🎸' }

const BOOT_LINES = [
  '$ boot beat-gacha.exe',
  '> mount /cards ......... 42 OK',
  '> audio-engine ......... OK',
  '> crt-monitor .......... OK',
  '',
  '抽个 BEAT  v0.1',
]

interface HandItem { card: Card; locked: boolean }

export default function App() {
  const engineRef = useRef<BeatEngine | null>(null)
  const [booted, setBooted] = useState(false)
  const [bootLines, setBootLines] = useState(0)
  const [hand, setHand] = useState<HandItem[]>([])
  const [slots, setSlots] = useState<Partial<Record<SlotType, Card>>>({})
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState('PRESS Ⓐ TO DRAW')
  const [drawSeq, setDrawSeq] = useState(0)
  const [glitch, setGlitch] = useState(0)
  const [golden, setGolden] = useState(false)
  const [shakeSlot, setShakeSlot] = useState<SlotType | null>(null)
  const [dragCard, setDragCard] = useState<Card | null>(null)
  const [flash, setFlash] = useState(false)
  const [achieve, setAchieve] = useState(false)

  const engine = () => (engineRef.current ??= newEngine())

  const newEngine = () => {
    const e = new BeatEngine()
    e.onEaster = msg => { setToast(msg); setGlitch(g => g + 1) }
    e.onHiddenCombo = () => {
      setGolden(true)
      setGlitch(g => g + 1)
      setAchieve(true)
      setToast('★ 隐藏曲 GOLDEN COMBO 触发！★')
    }
    ;(window as unknown as { __engine: BeatEngine }).__engine = e
    return e
  }

  // 开机终端逐行打印
  useEffect(() => {
    if (booted || bootLines >= BOOT_LINES.length) return
    const t = setTimeout(() => setBootLines(n => n + 1), 260)
    return () => clearTimeout(t)
  }, [booted, bootLines])

  // 换掉任一 SSR 卡后撤销金屏（置位路径只有 onHiddenCombo 回调）
  useEffect(() => {
    const ids = SLOT_ORDER.map(t => slots[t]?.id)
    if (!HIDDEN_COMBO.every(id => ids.includes(id))) setGolden(false)
  }, [slots])

  // 演示后门：?golden=1 开机后直接装配 3SSR 隐藏曲（现场演示用）
  useEffect(() => {
    if (!booted) return
    if (!new URLSearchParams(location.search).has('golden')) return
    const combo = HIDDEN_COMBO.map(id => CARDS.find(c => c.id === id)!)
    const eng = engine()
    combo.forEach(c => eng.setCard(c))
    setSlots({ groove: combo[0], harmony: combo[1], timbre: combo[2] })
    setToast('★ GOLDEN COMBO 已装配 — PRESS START')
  }, [booted])

  const fireGlitch = () => {
    setGlitch(g => g + 1)
  }

  const draw = () => {
    const cards = drawCards(CARDS, 3)
    setHand(cards.map(card => ({ card, locked: false })))
    setDrawSeq(s => s + 1)
    setToast('NEW BEAT+ x3 — 点卡 / 拖卡入槽')
    sfx('draw')
    // SSR 出货音对齐翻卡错帧动画（index×120ms + 翻面约 300ms）
    cards.forEach((c, i) => {
      if (c.rarity === 'SSR') setTimeout(() => sfx('ssr'), 420 + i * 120)
    })
  }

  const redraw = () => {
    const locked = hand.filter(h => h.locked)
    const need = 3 - locked.length
    if (need <= 0) { setToast('ALL LOCKED — 先解锁再重抽'); sfx('reject'); return }
    const exclude = [...locked.map(h => h.card.id), ...Object.values(slots).map(c => c!.id)]
    const fresh = drawCards(CARDS, need, exclude).map(card => ({ card, locked: false }))
    setHand([...locked, ...fresh])
    setDrawSeq(s => s + 1)
    setToast(`REDRAW x${need} — 已保留 ${locked.length} 张锁定卡`)
    sfx('draw')
    fresh.forEach((h, i) => {
      if (h.card.rarity === 'SSR') setTimeout(() => sfx('ssr'), 420 + i * 120)
    })
  }

  const playCard = (item: HandItem) => {
    const { card } = item
    const eng = engine()
    if (card.slot === 'easter') {
      eng.triggerEaster(card)
      setHand(h => h.filter(x => x.card.id !== card.id))
      sfx('easter')
      return
    }
    const slot = card.slot as SlotType
    setSlots(s => ({ ...s, [slot]: card }))
    eng.setCard(card)
    setHand(h => h.filter(x => x.card.id !== card.id))
    setToast(`${card.name} → ${SLOT_LABEL[slot]}槽`)
    setFlash(true)
    setTimeout(() => setFlash(false), 220)
    sfx('insert')
    if (card.rarity === 'SSR') { fireGlitch(); sfx('ssr') }
  }

  const togglePlay = async () => {
    const eng = engine()
    sfx('start')
    if (!playing) {
      await eng.start()
      setPlaying(true)
      setToast('NOW PLAYING — 换卡不中断')
    } else {
      eng.stop()
      setPlaying(false)
      setToast('PAUSED')
    }
  }

  const share = async () => {
    const cards = SLOT_ORDER.map(t => slots[t])
    if (cards.some(c => !c)) {
      setToast('SHARE — 先集齐 3 张卡再导出海报')
      return
    }
    try {
      await makePoster(cards as Card[], golden)
      setToast('POSTER 已导出 PNG — 晒出来吧')
    } catch (e) {
      setToast('POSTER 导出失败 — ' + (e as Error).message)
    }
  }

  const onDropToSlot = (slot: SlotType) => {
    if (!dragCard) return
    if (dragCard.slot !== slot) {
      setShakeSlot(slot)
      setToast(`TYPE MISMATCH — ${dragCard.name} 进不了${SLOT_LABEL[slot]}槽`)
      sfx('reject')
      setTimeout(() => setShakeSlot(null), 450)
      return
    }
    const item = hand.find(h => h.card.id === dragCard.id)
    if (item) playCard(item)
  }

  return (
    <div className="page">
      {!booted && (
        <div className="boot" onClick={() => setBooted(true)}>
          <div className="boot-term">
            {BOOT_LINES.slice(0, bootLines).map((l, i) => <div key={i}>{l}</div>)}
            {bootLines >= BOOT_LINES.length && (
              <div className="boot-go">▶ CLICK TO POWER ON<span className="cursor">_</span></div>
            )}
          </div>
        </div>
      )}

      {glitch > 0 && <div key={glitch} className="glitch-overlay" />}

      {achieve && (
        <div className="achieve-mask" onClick={() => setAchieve(false)}>
          <div className="achieve" onClick={e => e.stopPropagation()}>
            <div className="achieve-title">★ GOLDEN COMBO ★</div>
            <div className="achieve-sub">ACHIEVEMENT UNLOCKED</div>
            <div className="achieve-body">
              三张 SSR 同槽共振<br />隐藏曲目 · 黄金铃音已激活
            </div>
            <div className="achieve-cards">
              {SLOT_ORDER.map(t => slots[t] && <CardFace key={t} card={slots[t]!} compact />)}
            </div>
            <button className="achieve-btn" onClick={() => setAchieve(false)}>CONTINUE ▶</button>
          </div>
        </div>
      )}

      <div className="console">
        <div className="console-top">
          <span className="brand">BEAT-BOY <i> pocket</i></span>
          <span className={`led${playing ? ' on' : ''}`} />
        </div>

        <div className="screen-bezel">
          <div className={`screen${golden ? ' golden' : ''}${flash ? ' flash' : ''}`}>
            <div className="screen-head">
              <span>抽个 BEAT</span>
              <span className="blink">{golden ? '★ GOLDEN COMBO ★' : Object.keys(slots).length < 3 ? 'INSERT CARD' : 'NOW LOADING BEAT'}</span>
            </div>

            <div className="slots-row">
              {SLOT_ORDER.map(t => {
                const c = slots[t]
                return (
                  <div
                    key={t}
                    className={`slot${c ? ' filled' : ''}${shakeSlot === t ? ' shake' : ''}${dragCard ? (dragCard.slot === t ? ' drop-ok' : ' drop-no') : ''}`}
                    onDragOver={e => { if (dragCard?.slot === t) e.preventDefault() }}
                    onDrop={e => { e.preventDefault(); onDropToSlot(t) }}
                  >
                    <div className="slot-label">{SLOT_ICON[t]} {SLOT_LABEL[t]}槽</div>
                    {c
                      ? <CardFace card={c} compact />
                      : <div className="slot-empty">— EMPTY —</div>}
                  </div>
                )
              })}
            </div>

            <Spectrum engineRef={engineRef} playing={playing} />

            <div className="hand" key={drawSeq}>
              {hand.length === 0 && <div className="hand-hint">手卡区 · 按 Ⓐ 抽卡</div>}
              {hand.map((h, i) => (
                <CardFace
                  key={h.card.id}
                  card={h.card}
                  index={i}
                  locked={h.locked}
                  onToggleLock={() => { sfx('lock'); setHand(cur => cur.map(x => x.card.id === h.card.id ? { ...x, locked: !x.locked } : x)) }}
                  onPlay={() => playCard(h)}
                  onDragStart={e => { e.dataTransfer.setData('text/plain', h.card.id); setDragCard(h.card) }}
                  onDragEnd={() => setDragCard(null)}
                />
              ))}
            </div>

            <div className="term-line">&gt; {toast}<span className="cursor">_</span></div>
          </div>
        </div>

        <div className="controls-row">
          <div className="dpad"><div className="dpad-h" /><div className="dpad-v" /></div>
          <div className="start-cluster">
            <div className="start-pair">
              <div className="pill-item">
                <button className="btn-pill" onClick={share}>SELECT</button>
                <div className="btn-cap">分享海报</div>
              </div>
              <div className="pill-item">
                <button className="btn-pill" onClick={togglePlay}>{playing ? '❚❚ PAUSE' : '▶ START'}</button>
                <div className="btn-cap">播放/暂停</div>
              </div>
            </div>
          </div>
          <div className="ab-cluster">
            <div className="ab-item">
              <button className="btn-round btn-b" onClick={redraw}>B</button>
              <div className="btn-cap">重抽</div>
            </div>
            <div className="ab-item">
              <button className="btn-round btn-a" onClick={draw}>A</button>
              <div className="btn-cap">抽卡</div>
            </div>
          </div>
          <div className="speaker" />
        </div>
      </div>
    </div>
  )
}
