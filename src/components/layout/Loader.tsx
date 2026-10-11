import { useLenis } from 'lenis/react'
import { animate, AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useIntro } from '../../context/IntroContext'
import { LogoMark } from '../ui/Logo'
import { easeExpo } from '../ui/motion'

// Onda da superfície do chocolate (repetida duas vezes para rolar sem emenda)
const WAVE =
  'M0 18 C 60 4, 120 4, 180 18 S 300 32, 360 18 S 480 4, 540 18 S 660 32, 720 18 V 40 H 0 Z'

// Gotas que ficam penduradas na barra da "cortina" de chocolate
const DRIPS =
  'M0 0 H1200 V18 C1188 18 1186 30 1184 52 C1182 70 1166 70 1164 52 C1162 34 1158 18 1140 18 H1010 C996 18 994 34 992 74 C990 100 970 100 968 74 C966 40 962 18 948 18 H820 C808 18 806 28 805 40 C804 52 792 52 791 40 C790 28 786 18 774 18 H640 C624 18 622 40 620 92 C618 124 596 124 594 92 C592 40 588 18 574 18 H430 C418 18 416 30 415 48 C414 64 400 64 399 48 C398 30 394 18 382 18 H250 C236 18 234 36 232 66 C230 88 212 88 210 66 C208 36 204 18 192 18 H70 C60 18 58 26 57 36 C56 46 46 46 45 36 C44 26 40 18 30 18 H0 Z'

// Tela de abertura: o chocolate derrete e enche a tela; quando as cenas 3D estão prontas,
// a "cortina" de chocolate sobe com gotas escorrendo.
// O enchimento e a cortina são animações de transform feitas pelo próprio navegador (fora da
// thread principal): continuam lisas mesmo enquanto o 3D está sendo preparado por trás.
const FILL_SECONDS = 1.6

export function Loader() {
  const { showLoader, finishIntro, heroReady, scenesReady } = useIntro()
  const lenis = useLenis()
  const counter = useRef<HTMLSpanElement>(null)
  const [filled, setFilled] = useState(false)
  const [visible, setVisible] = useState(showLoader)
  const released = useRef(false)
  const filledAt = useRef(0)
  const heroReadyAt = useRef(0)

  useEffect(() => {
    if (!visible) return
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
  }, [visible, lenis])

  useEffect(() => {
    if (!showLoader) return
    let cancelled = false
    // o número é escrito direto no DOM: sem re-render do React a cada quadro
    const controls = animate(0, 100, {
      duration: FILL_SECONDS,
      ease: [0.45, 0, 0.25, 1],
      onUpdate: (v) => {
        if (counter.current) counter.current.textContent = Math.round(v).toString().padStart(3, '0')
      },
    })
    Promise.all([controls, document.fonts.ready]).then(() => {
      if (cancelled) return
      filledAt.current = performance.now()
      setFilled(true)
    })
    return () => {
      cancelled = true
      controls.stop()
    }
  }, [showLoader])

  useEffect(() => {
    if (heroReady && !heroReadyAt.current) heroReadyAt.current = performance.now()
  }, [heroReady])

  // Sobe quando encheu e as cenas estão prontas. Se o aparelho for lento, não segura ninguém:
  // no máximo 1,2 s depois da abertura pronta (o configurador termina por trás) ou 3 s no total.
  useEffect(() => {
    if (!filled) return
    const go = () => {
      if (released.current) return
      released.current = true
      setVisible(false)
      setTimeout(finishIntro, 450)
    }
    const now = performance.now()
    const deadlines = [filledAt.current + 3000]
    if (heroReady) deadlines.push(heroReadyAt.current + 1200)
    if (scenesReady) deadlines.push(now + 150)
    const id = setTimeout(go, Math.max(0, Math.min(...deadlines) - now))
    return () => clearTimeout(id)
  }, [filled, heroReady, scenesReady, finishIntro])

  function release() {
    document.documentElement.style.overflow = ''
    lenis?.start()
  }

  return (
    <AnimatePresence onExitComplete={release}>
      {visible && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[95]"
          initial={{ transform: 'translateY(0%)' }}
          exit={{ transform: 'translateY(-118%)' }}
          transition={{ duration: 1.25, ease: easeExpo }}
        >
          <div className="absolute inset-0 overflow-hidden bg-cocoa">
            {/* chocolate subindo */}
            <div className="choco-fill absolute inset-0" style={{ animationDuration: `${FILL_SECONDS}s` }}>
              <svg
                viewBox="0 0 720 40"
                preserveAspectRatio="none"
                className="wave-track absolute bottom-full left-0 h-8 w-[200%] sm:h-10"
                style={{ ['--wave-duration' as string]: '2.4s' }}
              >
                <path d={WAVE} fill="#7a4529" />
              </svg>
              <div className="bg-chocolate h-full" />
            </div>
          </div>

          {/* gotas penduradas na barra da cortina */}
          <svg viewBox="0 0 1200 130" preserveAspectRatio="none" className="absolute left-0 top-full h-[16vh] w-full" aria-hidden>
            <path d={DRIPS} fill="#432314" transform="translate(0 -1)" />
          </svg>

          <div className="relative flex h-full flex-col justify-between p-6 sm:p-10">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              <span>ChocoFeliz</span>
              <span>Pirulitos de chocolate</span>
            </div>

            <div className="flex flex-col items-center gap-5 text-center">
              <div className="logo-pop">
                <div className="logo-wobble">
                  <LogoMark className="size-24 drop-shadow-[0_12px_30px_rgb(0_0_0/0.4)] sm:size-28" />
                </div>
              </div>
              <p className="font-hand text-3xl text-cream sm:text-4xl">
                {filled ? 'Pronto para desembrulhar!' : 'Derretendo o chocolate…'}
              </p>
            </div>

            <div className="flex items-end justify-between">
              <span className="max-w-[12rem] text-xs font-semibold uppercase tracking-[0.24em] text-cream/70">
                Temperando no ponto certo
              </span>
              <span className="font-display text-6xl font-semibold tabular-nums text-cream sm:text-8xl">
                <span ref={counter}>000</span>
                <span className="text-gradient">%</span>
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
