import { motion, useInView, useScroll, useTransform, type MotionValue } from 'motion/react'
import { Component, lazy, Suspense, useRef, type ReactNode } from 'react'
import { TbArrowDown, TbArrowRight } from 'react-icons/tb'
import { useIntro } from '../../context/IntroContext'
import { gallery } from '../../data/gallery'
import { useIsDesktop, useReducedMotion } from '../../hooks/useMediaQuery'
import { useScrollTo } from '../layout/Navbar'
import { Magnetic } from '../ui/Magnetic'
import { easeOut } from '../ui/motion'
import { SplitText } from '../ui/SplitText'

const HeroStage = lazy(() => import('../three/HeroStage'))

// Se o WebGL falhar, mostra uma foto real no lugar do 3D
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

const steps = [
  {
    range: [0.1, 0.27],
    n: '01',
    kicker: 'O laço',
    title: 'Amarrado à mão, um por um.',
    text: 'Fitilho cacheado na cor da festa. É o primeiro “uau” de quem ganha.',
  },
  {
    range: [0.29, 0.5],
    n: '02',
    kicker: 'O celofane',
    title: 'Brilha por fora, protege por dentro.',
    text: 'Embalagem individual e transparente: o pirulito chega inteirinho e já pronto para a mesa de doces.',
  },
  {
    range: [0.53, 0.77],
    n: '03',
    kicker: 'Por dentro',
    title: 'Três camadas de carinho.',
    text: 'Chocolate de verdade, rótulo comestível com a arte da festa e um palito firme para segurar.',
  },
  {
    range: [0.8, 1],
    n: '04',
    kicker: 'Do seu jeito',
    title: 'Qualquer tema. Qualquer nome.',
    text: 'Futebol, unicórnio, fundo do mar, a logo da sua empresa… a gente cria a arte e você aprova antes.',
  },
] as const

function Step({ progress, step, last }: { progress: MotionValue<number>; step: (typeof steps)[number]; last: boolean }) {
  const [a, b] = step.range
  const opacity = useTransform(progress, last ? [a - 0.03, a + 0.02] : [a - 0.03, a + 0.02, b - 0.03, b], last ? [0, 1] : [0, 1, 1, 0])
  const y = useTransform(progress, [a - 0.03, a + 0.03], [40, 0])
  const pointerEvents = useTransform(opacity, (v) => (v > 0.5 ? 'auto' : 'none'))
  const scrollTo = useScrollTo()

  return (
    <motion.div style={{ opacity, y, pointerEvents }} className="absolute inset-x-0 bottom-0 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
      <div className="container-x pb-14 lg:pb-0">
        <div className="max-w-md">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-caramel">
            <span className="font-display text-2xl font-semibold tracking-normal text-cream/40">{step.n}</span>
            {step.kicker}
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.1rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-tight">{step.title}</h2>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{step.text}</p>
          {last && (
            <button
              type="button"
              onClick={() => scrollTo('monte')}
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-7 py-4 font-semibold text-cocoa transition-[filter] hover:brightness-110"
            >
              Monte o seu pirulito
              <TbArrowDown aria-hidden className="transition-transform group-hover:translate-y-0.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function Intro({ progress }: { progress: MotionValue<number> }) {
  const { introDone } = useIntro()
  const scrollTo = useScrollTo()
  const opacity = useTransform(progress, [0, 0.07], [1, 0])
  const y = useTransform(progress, [0, 0.08], [0, -60])
  const pointerEvents = useTransform(opacity, (v) => (v > 0.5 ? 'auto' : 'none'))
  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    transition: { duration: 0.9, ease: easeOut, delay },
  })

  return (
    <motion.div style={{ opacity, y, pointerEvents }} className="absolute inset-x-0 bottom-0 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
      <div className="container-x pb-28 lg:pb-0">
        <motion.p {...fade(0)} className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-caramel">
          <span aria-hidden className="h-px w-10 bg-gradient-brand" />
          Pirulitos de chocolate personalizados
        </motion.p>
        <h1 className="max-w-3xl font-display text-[clamp(2.75rem,8.4vw,7.25rem)] font-semibold leading-[0.92] tracking-tight">
          <SplitText text="Desembrulhe a" play={introDone} delay={0.1} />
          <br />
          <span className="wonk text-gradient inline-block pr-3">
            <SplitText text="felicidade." play={introDone} delay={0.45} />
          </span>
        </h1>
        <motion.p {...fade(0.8)} className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:mt-6 sm:text-lg">
          <span className="sm:hidden">Com o tema da festa, o nome e a idade de quem é celebrado.</span>
          <span className="hidden sm:inline">
            Pirulitos de chocolate com rótulo comestível: o tema da festa, o nome e a idade de quem é celebrado. A lembrancinha que
            todo mundo quer guardar — e ninguém consegue.
          </span>
        </motion.p>
        <motion.div {...fade(1)} className="mt-7 flex flex-wrap items-center gap-3 sm:mt-9 sm:gap-4">
          <Magnetic>
            <button
              type="button"
              onClick={() => scrollTo('monte')}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3.5 font-semibold text-cocoa shadow-[0_0_44px_-10px_rgb(255_92_138/0.8)] transition-[filter] hover:brightness-110 sm:px-7 sm:py-4"
            >
              Monte o seu
              <TbArrowRight aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </Magnetic>
          <Magnetic>
            <button
              type="button"
              onClick={() => scrollTo('mostruario')}
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-6 py-3.5 font-medium text-cream transition-colors hover:border-caramel/60 hover:bg-caramel/10 sm:px-7 sm:py-4"
            >
              Ver mostruário
            </button>
          </Magnetic>
        </motion.div>
      </div>
    </motion.div>
  )
}

function ScrollHint({ progress }: { progress: MotionValue<number> }) {
  const { introDone } = useIntro()
  const opacity = useTransform(progress, [0, 0.04], [1, 0])
  return (
    <motion.div style={{ opacity }} className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: introDone ? 1 : 0 }}
        transition={{ delay: 3.6, duration: 1 }}
        className="flex flex-col items-center gap-2"
      >
        <span className="font-hand text-xl text-cream/80">role para desembrulhar</span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="grid size-9 place-items-center rounded-full border border-line-strong text-caramel"
        >
          <TbArrowDown aria-hidden />
        </motion.span>
      </motion.div>
    </motion.div>
  )
}

function Rail({ progress }: { progress: MotionValue<number> }) {
  const height = useTransform(progress, [0.08, 1], ['0%', '100%'])
  return (
    <div aria-hidden className="absolute left-5 top-1/2 hidden h-56 -translate-y-1/2 items-stretch gap-3 xl:flex">
      <div className="relative w-px bg-line-strong">
        <motion.div style={{ height }} className="absolute inset-x-0 top-0 bg-gradient-to-b from-caramel to-berry" />
      </div>
      <ol className="flex flex-col justify-between font-display text-xs text-cream/40">
        {steps.map((s) => (
          <li key={s.n}>{s.n}</li>
        ))}
      </ol>
    </div>
  )
}

export function Hero() {
  const section = useRef<HTMLElement>(null)
  const desktop = useIsDesktop()
  const reduced = useReducedMotion()
  const { introDone, markSceneReady } = useIntro()
  const inView = useInView(section)
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })

  const fallback = (
    <img src={gallery[0]?.src} alt="" className="h-full w-full object-cover opacity-40" />
  )

  return (
    <section id="inicio" ref={section} aria-label="Abertura" className="relative h-[480vh] lg:h-[560vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0" data-cursor="scene">
          <SceneBoundary fallback={fallback}>
            <Suspense fallback={null}>
              <HeroStage progress={scrollYProgress} play={introDone} reduced={reduced} mobile={!desktop} active={inView} onReady={markSceneReady} />
            </Suspense>
          </SceneBoundary>
        </div>

        {/* garante a leitura do texto sobre o 3D */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(20_11_7/0.95)_0%,rgb(20_11_7/0.6)_32%,transparent_60%)] lg:bg-[radial-gradient(ellipse_70%_90%_at_10%_50%,rgb(20_11_7/0.88),transparent_70%)]"
        />

        <div className="pointer-events-none absolute inset-0">
          <Intro progress={scrollYProgress} />
          {steps.map((step, i) => (
            <Step key={step.n} progress={scrollYProgress} step={step} last={i === steps.length - 1} />
          ))}
        </div>

        {/* emenda suave com a seção seguinte */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-cocoa" />

        <Rail progress={scrollYProgress} />
        <ScrollHint progress={scrollYProgress} />
      </div>
    </section>
  )
}
