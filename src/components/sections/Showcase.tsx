import { useLenis } from 'lenis/react'
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react'
import { useCallback, useEffect, useState, type PointerEvent } from 'react'
import { TbArrowLeft, TbArrowRight, TbMaximize, TbX } from 'react-icons/tb'
import { useOrder } from '../../context/OrderContext'
import { gallery, type GalleryItem } from '../../data/gallery'
import { themes } from '../../data/themes'
import { useFinePointer } from '../../hooks/useMediaQuery'
import { useScrollTo } from '../layout/Navbar'
import { LabelDisc } from '../ui/LabelDisc'
import { easeOut } from '../ui/motion'
import { Reveal } from '../ui/Reveal'
import { SectionLabel } from '../ui/SectionLabel'

function PhotoCard({ item, index, onOpen }: { item: GalleryItem; index: number; onOpen: () => void }) {
  const fine = useFinePointer()
  const rx = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 })
  const ry = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 })
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const glare = useMotionTemplate`radial-gradient(500px circle at ${gx}% ${gy}%, rgb(255 240 220 / 0.16), transparent 45%)`

  function onMove(e: PointerEvent<HTMLButtonElement>) {
    if (!fine) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * 10)
    rx.set(-(py - 0.5) * 10)
    gx.set(px * 100)
    gy.set(py * 100)
  }

  return (
    <Reveal delay={index * 0.1} className="[perspective:1400px]">
      <motion.button
        type="button"
        onClick={onOpen}
        onPointerMove={onMove}
        onPointerLeave={() => {
          rx.set(0)
          ry.set(0)
        }}
        style={{ rotateX: rx, rotateY: ry }}
        className="group relative block w-full overflow-hidden rounded-[2rem] border border-line bg-cocoa-2 text-left [transform-style:preserve-3d]"
        aria-label={`Ampliar foto: ${item.theme}`}
      >
        <div className="aspect-square overflow-hidden">
          <img
            src={item.src}
            alt={item.alt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(20_11_7/0.92),transparent_45%)]" />
        {fine && <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glare }} />}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-caramel">{item.occasion}</p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{item.theme}</p>
            <p className="mt-1 text-sm text-muted">{item.ribbon}</p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-full border border-line-strong bg-cocoa/60 text-xl text-cream transition-colors group-hover:border-caramel group-hover:text-caramel">
            <TbMaximize aria-hidden />
          </span>
        </div>
      </motion.button>
    </Reveal>
  )
}

function Lightbox({ index, onClose, onStep }: { index: number; onClose: () => void; onStep: (dir: 1 | -1) => void }) {
  const lenis = useLenis()
  const item = gallery[index]

  useEffect(() => {
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onStep(1)
      if (e.key === 'ArrowLeft') onStep(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      lenis?.start()
    }
  }, [lenis, onClose, onStep])

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={item.theme}
      className="fixed inset-0 z-[90] flex flex-col bg-cocoa/95 p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          <span className="font-display text-lg text-cream">{item.theme}</span> · {item.occasion}
        </p>
        <button type="button" onClick={onClose} aria-label="Fechar" className="grid size-11 place-items-center rounded-full border border-line-strong text-xl">
          <TbX aria-hidden />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center py-4">
        <AnimatePresence mode="wait">
          <motion.img
            key={item.src}
            src={item.src}
            alt={item.alt}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="max-h-full max-w-full rounded-3xl object-contain shadow-2xl"
          />
        </AnimatePresence>
      </div>
      {gallery.length > 1 && (
        <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => onStep(-1)} aria-label="Foto anterior" className="grid size-12 place-items-center rounded-full border border-line-strong text-xl hover:border-caramel">
            <TbArrowLeft aria-hidden />
          </button>
          <span className="w-16 text-center text-sm tabular-nums text-muted">
            {index + 1} / {gallery.length}
          </span>
          <button type="button" onClick={() => onStep(1)} aria-label="Próxima foto" className="grid size-12 place-items-center rounded-full border border-line-strong text-xl hover:border-caramel">
            <TbArrowRight aria-hidden />
          </button>
        </div>
      )}
    </motion.div>
  )
}

function ThemeStrip() {
  const { chooseTheme } = useOrder()
  const scrollTo = useScrollTo()

  function choose(id: string) {
    chooseTheme(id)
    scrollTo('monte')
  }

  return (
    <div className="relative mt-20 sm:mt-28">
      <Reveal className="container-x flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-hand text-3xl text-caramel">temas que a gente adora fazer</p>
          <p className="mt-1 max-w-md text-muted">Toque em um tema para ver como fica no seu pirulito.</p>
        </div>
      </Reveal>
      <div className="mt-8 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max gap-5 px-5 sm:gap-7 sm:px-8 xl:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          {themes.map((t, i) => (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, y: 30, rotate: -8 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, ease: easeOut, delay: Math.min(i, 8) * 0.05 }}
            >
              <button type="button" onClick={() => choose(t.id)} className="group flex w-36 flex-col items-center gap-3 sm:w-44">
                <LabelDisc
                  input={{ theme: t.id, name: t.sample.name, detail: t.sample.detail }}
                  className="w-full transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:rotate-[8deg]"
                />
                <span className="text-sm font-medium text-muted transition-colors group-hover:text-cream">{t.label}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function Showcase() {
  const [open, setOpen] = useState<number | null>(null)
  const close = useCallback(() => setOpen(null), [])
  const step = useCallback((dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + gallery.length) % gallery.length)), [])

  return (
    <section id="mostruario" className="relative py-24 sm:py-32">
      <div className="container-x">
        <Reveal>
          <SectionLabel>Mostruário</SectionLabel>
          <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <h2 className="max-w-3xl font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.98] tracking-tight">
              Cada festa ganha um pirulito <span className="wonk text-gradient">só dela.</span>
            </h2>
            <p className="max-w-sm text-muted">
              Alguns trabalhos que já saíram da nossa cozinha, do jeitinho que chegaram na festa. Toque na foto para ver de perto.
            </p>
          </div>
        </Reveal>

        <div className={`mt-14 grid gap-6 ${gallery.length > 1 ? 'md:grid-cols-2' : ''} ${gallery.length > 2 ? 'lg:grid-cols-3' : ''}`}>
          {gallery.map((item, i) => (
            <PhotoCard key={item.src} item={item} index={i} onOpen={() => setOpen(i)} />
          ))}
        </div>
      </div>

      <ThemeStrip />

      <AnimatePresence>{open !== null && <Lightbox index={open} onClose={close} onStep={step} />}</AnimatePresence>
    </section>
  )
}
