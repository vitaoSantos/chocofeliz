import { useEffect, useRef, useState } from 'react'
import { scheduleIdle } from '../../lib/idle'
import { drawLabel, labelFontsReady, type LabelInput } from '../../lib/labelArt'

// Miniatura 2D do pirulito: o rótulo desenhado no canvas, dentro de um aro de chocolate em CSS.
// Só desenha quando está chegando perto da tela, e nos momentos ociosos (um por vez),
// para não travar a abertura nem a rolagem.
export function LabelDisc({ input, size = 256, className = '' }: { input: LabelInput; size?: number; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [near, setNear] = useState(false)
  const { theme, name, detail } = input

  useEffect(() => {
    const el = canvas.current
    if (!el || near) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: '600px 200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [near])

  useEffect(() => {
    if (!near) return
    let cancelled = false
    labelFontsReady().then(() => {
      if (cancelled) return
      scheduleIdle(() => {
        if (!cancelled && canvas.current) drawLabel(canvas.current, { theme, name, detail })
      })
    })
    return () => {
      cancelled = true
    }
  }, [near, theme, name, detail])

  return (
    <span
      className={`relative block aspect-square rounded-full p-[9%] shadow-[inset_0_2px_3px_rgb(255_255_255/0.25),inset_0_-6px_10px_rgb(0_0_0/0.45),0_10px_24px_-8px_rgb(0_0_0/0.7)] ${className}`}
      style={{ background: 'radial-gradient(circle at 35% 28%, #8d5434 0%, #5c3320 45%, #3a1e12 100%)' }}
    >
      <canvas
        ref={canvas}
        width={size}
        height={size}
        className="block h-full w-full rounded-full bg-[#f3e2cc] shadow-[0_0_0_2px_rgb(40_20_10/0.35)]"
        aria-hidden
      />
    </span>
  )
}
