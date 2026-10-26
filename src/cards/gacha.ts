import type { Card, Rarity } from './types'

/** 稀有度权重：单次抽 SSR ≈ 12%，3 连出 SSR ≈ 32%（演示友好） */
const WEIGHTS: Record<Rarity, number> = { N: 56, R: 24, SR: 8, SSR: 12 }

/** 抽 count 张卡，同一次抽取内不重复 */
export function drawCards(pool: Card[], count = 3, excludeIds: string[] = []): Card[] {
  const used = new Set(excludeIds)
  const result: Card[] = []
  while (result.length < count) {
    const avail = pool.filter(c => !used.has(c.id))
    if (avail.length === 0) break
    const total = avail.reduce((s, c) => s + WEIGHTS[c.rarity], 0)
    let r = Math.random() * total
    let picked = avail[avail.length - 1]
    for (const c of avail) {
      r -= WEIGHTS[c.rarity]
      if (r <= 0) { picked = c; break }
    }
    used.add(picked.id)
    result.push(picked)
  }
  return result
}
