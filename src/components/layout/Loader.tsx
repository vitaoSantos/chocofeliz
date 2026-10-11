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

// Tela de abertura: o chocolate derrete e enche a tela; quando a cena 3D está pronta,
// a "cortina" de chocolate sobe com gotas escorrendo.
export function Loader() {
  const { showLoader, finishIntro, sceneReady } = useIntro()
  const lenis = useLenis()
  const [count, setCount] = useState(0)
  const [filled, setFilled] = useState(false)
  const [visible, setVisible] = useState(showLoader)
  const released = useRef(false)

  useEffect(() => {
    if (!visible) return
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
  }, [visible, lenis])

  useEffect(() => {
    if (!showLoader) return
    let cancelled = false
    const controls = animate(0, 100, {
      duration: 2.1,
      ease: [0.45, 0, 0.25, 1],
      onUpdate: (v) => setCount(Math.round(v)),
    })
    Promise.all([controls, document.fonts.ready]).then(() => {
      if (!cancelled) setFilled(true)
    })
    return () => {
      cancelled = true
      controls.stop()
    }
  }, [showLoader])

  // Sobe quando encheu e o 3D já desenhou (ou depois de um tempo máximo, para não travar ninguém)
  useEffect(() => {
    if (!filled) return
    const go = () => {
      if (released.current) return
      released.current = true
      setVisible(false)
      setTimeout(finishIntro, 450)
    }
    if (sceneReady) {
      const id = setTimeout(go, 250)
      return () => clearTimeout(id)
    }
    const id = setTimeout(go, 4000)
    return () => clearTimeout(id)
  }, [filled, sceneReady, finishIntro])

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
          exit={{ y: '-118%' }}
          transition={{ duration: 1.25, ease: easeExpo }}
        >
          <div className="absolute inset-0 overflow-hidden bg-cocoa">
            {/* chocolate subindo */}
            <div className="absolute inset-x-0 bottom-0" style={{ height: `${count}%` }}>
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
              <motion.div
                initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 160, damping: 12 }}
              >
                <motion.div animate={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
                  <LogoMark className="size-24 drop-shadow-[0_12px_30px_rgb(0_0_0/0.4)] sm:size-28" />
                </motion.div>
              </motion.div>
              <p className="font-hand text-3xl text-cream sm:text-4xl">
                {filled ? 'Pronto para desembrulhar!' : 'Derretendo o chocolate…'}
              </p>
            </div>

            <div className="flex items-end justify-between">
              <span className="max-w-[12rem] text-xs font-semibold uppercase tracking-[0.24em] text-cream/70">
                Temperando no ponto certo
              </span>
              <span className="font-display text-6xl font-semibold tabular-nums text-cream sm:text-8xl">
                {count.toString().padStart(3, '0')}
                <span className="text-gradient">%</span>
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
