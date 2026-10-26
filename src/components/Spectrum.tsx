import { useEffect, useRef } from 'react'
import type { BeatEngine } from '../audio/engine'

/** 像素块频谱条（AnalyserNode 驱动） */
export default function Spectrum({ engineRef, playing }: { engineRef: React.RefObject<BeatEngine | null>; playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const cv = canvasRef.current
      const eng = engineRef.current
      if (cv) {
        const ctx = cv.getContext('2d')!
        ctx.fillStyle = '#0f380f'
        ctx.fillRect(0, 0, cv.width, cv.height)
        const n = 32
        const bw = cv.width / n
        const data = eng && playing ? eng.getSpectrum() : null
        for (let i = 0; i < n; i++) {
          // 未播放时画一条待机虚线
          const v = data ? Math.max(0, ((data[i] as number) + 90) / 55) : 0.04
          const blocks = Math.max(1, Math.floor((v * cv.height) / 6))
          for (let b = 0; b < blocks; b++) {
            ctx.fillStyle = b > blocks * 0.75 ? '#9bbc0f' : b > blocks * 0.4 ? '#8bac0f' : '#306230'
            ctx.fillRect(i * bw + 1, cv.height - (b + 1) * 6, bw - 2, 4)
          }
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [engineRef, playing])

  return <canvas ref={canvasRef} width={480} height={72} className="spectrum" />
}
