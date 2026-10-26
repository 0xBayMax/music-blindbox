import QRCode from 'qrcode'
import type { Card, Rarity, SlotType } from './cards/types'

/**
 * 分享海报：Canvas 手绘导出 PNG（零美术资源，风格与 CRT 屏一致）
 * 内容 = 作品名 + 三张卡面 + 稀有度 + 二维码
 */

const RARITY_COLOR: Record<Rarity, string> = { N: '#8b949e', R: '#58a6ff', SR: '#bc8cff', SSR: '#f7b731' }
const RARITY_SIGIL: Record<Rarity, [string, string]> = {
  N: ['#3a3a3c', '#c8c4b8'],
  R: ['#1c4d8f', '#58a6ff'],
  SR: ['#4b2a85', '#bc8cff'],
  SSR: ['#8a5a00', '#f7b731'],
}
const SLOT_TEXT: Record<SlotType, string> = { groove: '节奏', harmony: '和声', timbre: '音色' }

const SHARE_URL = 'https://0xbaymax.github.io/music-blindbox/'

/** 作品名梗池：程序员 × 音乐（按三卡组合哈希确定性抽取，同组合同名） */
const BEAT_TITLES = [
  '凌晨三点的 Groove', '祖传代码 Blues', '内存泄漏圆舞曲', '编译通过颂',
  '并发死锁 Dubstep', '删库跑路 Freestyle', '祖传正则 Riddim', '996 摇篮曲',
  '赛博烧仙草', '重构失败进行曲', '递归没有出口', '屎山交响诗',
]

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 与 CardFace.PixelSigil 相同的确定性 8x8 对称像素图腾，直接画进海报 */
function drawSigil(ctx: CanvasRenderingContext2D, seed: string, x: number, y: number, cell: number, colors: [string, string]) {
  let h = hash(seed)
  const rnd = () => {
    h ^= h << 13; h >>>= 0
    h ^= h >>> 17
    h ^= h << 5; h >>>= 0
    return h / 0xffffffff
  }
  for (let py = 0; py < 8; py++) {
    for (let px = 0; px < 4; px++) {
      ctx.fillStyle = rnd() > 0.52 ? colors[0] : colors[1]
      ctx.fillRect(x + px * cell, y + py * cell, cell, cell)
      ctx.fillRect(x + (7 - px) * cell, y + py * cell, cell, cell)
    }
  }
}

/** 中文卡名按像素宽度切两行 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > maxWidth && cur) {
      lines.push(cur)
      cur = ch
    } else {
      cur += ch
    }
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 2)
}

export async function makePoster(cards: Card[], golden: boolean): Promise<void> {
  const W = 640, H = 1000
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')!

  // 字体预热（Press Start 2P 页面已加载，这里确保 canvas 可用）
  try {
    await Promise.all([
      document.fonts.load('28px "Press Start 2P"'),
      document.fonts.load('14px "Press Start 2P"'),
    ])
  } catch { /* 字体缺失则回退等宽体，不阻断导出 */ }

  // ---- 背景：GB 深绿 + 微弱像素网格 ----
  ctx.fillStyle = '#0f380f'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#16351a'
  for (let gy = 0; gy < H; gy += 20) ctx.fillRect(0, gy, W, 1)
  for (let gx = 0; gx < W; gx += 20) ctx.fillRect(gx, 0, 1, H)

  ctx.textAlign = 'center'

  // ---- 标题区 ----
  ctx.fillStyle = '#9bbc0f'
  ctx.font = '28px "Press Start 2P", monospace'
  ctx.fillText('BEAT GACHA', W / 2, 64)
  ctx.fillStyle = '#8bac0f'
  ctx.font = 'bold 18px "Microsoft YaHei", sans-serif'
  ctx.fillText('抽个 Beat · 音乐盲盒机', W / 2, 102)

  // ---- Combo 徽章 ----
  ctx.font = '14px "Press Start 2P", monospace'
  ctx.fillStyle = golden ? '#f7b731' : '#306230'
  ctx.fillText(golden ? '★ GOLDEN COMBO ★' : 'MY BEAT COLLECTION', W / 2, 148)

  // ---- 作品名（组合哈希确定性抽取）----
  const titleIdx = hash(cards.map(c => c.id).join('+')) % BEAT_TITLES.length
  ctx.fillStyle = '#1a3a1a'
  ctx.fillRect(90, 176, W - 180, 46)
  ctx.strokeStyle = '#306230'; ctx.lineWidth = 2
  ctx.strokeRect(90, 176, W - 180, 46)
  ctx.fillStyle = '#9bbc0f'
  ctx.font = 'bold 20px "Microsoft YaHei", sans-serif'
  ctx.fillText(`《${BEAT_TITLES[titleIdx]}》`, W / 2, 207)

  // ---- 三张卡面 ----
  const cardW = 176, cardH = 300, gap = 24
  const x0 = (W - 3 * cardW - 2 * gap) / 2
  cards.forEach((card, i) => {
    const x = x0 + i * (cardW + gap)
    const y = 252
    // 卡身（深灰卡带）
    ctx.fillStyle = '#333338'
    ctx.fillRect(x, y, cardW, cardH)
    ctx.fillStyle = '#1a1a1e'
    ctx.fillRect(x, y, cardW, 10) // 顶部防滑纹区域
    ctx.fillStyle = '#333338'
    for (let n = 0; n < 6; n++) ctx.fillRect(x + 10 + n * 26, y + 2, 16, 6)
    // 标签贴纸（稀有度边框）
    const pad = 12
    const lx = x + pad, ly = y + 22, lw = cardW - pad * 2, lh = cardH - 34
    ctx.fillStyle = '#e8e4d8'
    ctx.fillRect(lx, ly, lw, lh)
    ctx.strokeStyle = RARITY_COLOR[card.rarity]
    ctx.lineWidth = 4
    ctx.strokeRect(lx, ly, lw, lh)
    // 图腾
    drawSigil(ctx, card.id, lx + (lw - 48) / 2, ly + 16, 6, RARITY_SIGIL[card.rarity])
    // 卡名（可两行）
    ctx.fillStyle = '#1a1a1e'
    ctx.font = 'bold 15px "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    const nameLines = wrapText(ctx, card.name, lw - 16)
    nameLines.forEach((ln, li) => ctx.fillText(ln, x + cardW / 2, ly + 100 + li * 22))
    // 元信息
    const slotText = card.slot === 'easter' ? '彩蛋' : SLOT_TEXT[card.slot as SlotType]
    ctx.font = '12px "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#55534a'
    ctx.fillText(`${slotText} · ${card.rarity}`, x + cardW / 2, ly + 100 + nameLines.length * 22 + 8)
    // flavor
    ctx.font = '11px "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#7c786c'
    const flavorLines = wrapText(ctx, card.flavor, lw - 16)
    flavorLines.forEach((ln, li) => ctx.fillText(ln, x + cardW / 2, ly + lh - 30 + li * 15))
  })

  // ---- 频谱装饰（确定性伪随机高度）----
  let sh = hash(cards.map(c => c.id).join('|'))
  const srnd = () => {
    sh ^= sh << 13; sh >>>= 0
    sh ^= sh >>> 17
    sh ^= sh << 5; sh >>>= 0
    return sh / 0xffffffff
  }
  const specY = 596, specH = 64, n = 48, bw = (W - 80) / n
  for (let i = 0; i < n; i++) {
    const v = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.35)) * srnd()
    const blocks = Math.max(1, Math.round(v * specH / 8))
    for (let b = 0; b < blocks; b++) {
      ctx.fillStyle = b > blocks * 0.7 ? '#9bbc0f' : b > blocks * 0.35 ? '#8bac0f' : '#306230'
      ctx.fillRect(40 + i * bw + 1, specY + specH - (b + 1) * 8, bw - 2, 6)
    }
  }

  // ---- 二维码 ----
  const qrData = await QRCode.toDataURL(SHARE_URL, {
    margin: 1, width: 220,
    color: { dark: '#0f380f', light: '#9bbc0f' },
  })
  const qrImg = new Image()
  await new Promise<void>((res, rej) => {
    qrImg.onload = () => res()
    qrImg.onerror = () => rej(new Error('二维码渲染失败'))
    qrImg.src = qrData
  })
  const qrSize = 200, qrX = (W - qrSize) / 2, qrY = 700
  ctx.fillStyle = '#9bbc0f'
  ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16)
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
  ctx.fillStyle = '#8bac0f'
  ctx.font = '12px "Microsoft YaHei", sans-serif'
  ctx.fillText('扫码 · 抽 3 张卡 · 合成你的 Beat', W / 2, qrY + qrSize + 34)

  // ---- 落款 ----
  ctx.fillStyle = '#306230'
  ctx.font = '10px "Press Start 2P", monospace'
  ctx.fillText('42 CARDS · 8 LAYERS · 0 SAMPLES', W / 2, H - 44)
  ctx.font = '11px "Microsoft YaHei", sans-serif'
  ctx.fillText('Trae 1024 程序员节参赛作品', W / 2, H - 22)

  // ---- 导出下载 ----
  const a = document.createElement('a')
  a.download = `beat-gacha-${BEAT_TITLES[titleIdx]}-${Date.now() % 10000}.png`
  a.href = cv.toDataURL('image/png')
  a.click()
}
