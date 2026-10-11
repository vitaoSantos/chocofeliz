import { useLenis } from 'lenis/react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { TbArrowLeft, TbArrowRight, TbPlus, TbX } from 'react-icons/tb'
import { useOrder } from '../../context/OrderContext'
import { useSiteData } from '../../context/SiteDataContext'
import { brand } from '../../data/brand'
import { gallery } from '../../data/gallery'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { photoUrl } from '../../lib/api'
import { toColumns } from '../../lib/masonry'
import { eventDateLabel, type MuralPhoto } from '../../lib/siteTypes'
import { useScrollTo } from '../layout/Navbar'
import { LabelDisc } from '../ui/LabelDisc'
import { easeOut } from '../ui/motion'
import { Reveal } from '../ui/Reveal'
import { SectionLabel } from '../ui/SectionLabel'

// Uma foto do mural: enviada pelo painel (/admin) ou que veio junto com o site
type MuralItem = {
  key: string
  thumb: string
  full: string
  width: number
  height: number
  title: string
  note: string
  alt: string
}

function fromPanel(photo: MuralPhoto): MuralItem {
  // o que tiver primeiro (título, tema, data) vira a legenda escrita à mão; o resto vai embaixo
  const parts = [photo.title, photo.theme, eventDateLabel(photo.date)].filter(Boolean)
  return {
    key: photo.id,
    thumb: photoUrl(photo.id, 'thumb'),
    full: photoUrl(photo.id, 'full'),
    width: photo.width,
    height: photo.height,
    title: parts[0] ?? 'Mais uma festa feliz',
    note: parts.slice(1).join(' · '),
    alt: [`Pirulitos de chocolate da ${brand.name}`, photo.theme && `tema ${photo.theme}`, photo.title].filter(Boolean).join(', '),
  }
}

const bundled: MuralItem[] = gallery.map((g) => ({
  key: g.src,
  thumb: g.src,
  full: g.src,
  width: g.width,
  height: g.height,
  title: g.occasion,
  note: `${g.theme} · ${g.ribbon}`,
  alt: g.alt,
}))

const PAGE = 9
// inclinação de cada foto no mural, em graus (repete a cada seis)
const TILTS = [-2.2, 1.6, -1.2, 2.3, -1.7, 1.1]

// altura relativa de cada foto no mural: a foto + moldura e legenda
const photoHeight = (item: MuralItem) => item.height / item.width + 0.3

function Polaroid({ item, index, onOpen }: { item: MuralItem; index: number; onOpen: () => void }) {
  return (
    <motion.li
      initial={{ opacity: 0, transform: 'translateY(40px)' }}
      whileInView={{ opacity: 1, transform: 'translateY(0px)', transitionEnd: { transform: 'none' } }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: easeOut, delay: (index % 3) * 0.08 }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver de perto: ${item.title}`}
        style={{ '--tilt': `${TILTS[index % TILTS.length]}deg` } as CSSProperties}
        className="group relative block w-full rotate-(--tilt) rounded-md bg-[#f6ead9] p-2 pb-3 text-left shadow-[0_24px_40px_-20px_rgb(0_0_0/0.85),0_2px_6px_rgb(0_0_0/0.35)] transition-[rotate,translate] duration-500 ease-out hover:-translate-y-1.5 hover:rotate-0 focus-visible:rotate-0 sm:p-3.5 sm:pb-5"
      >
        <span aria-hidden className="absolute -top-2.5 left-1/2 h-5 w-14 -translate-x-1/2 -rotate-3 rounded-[2px] bg-caramel-soft/60 shadow-sm sm:-top-3 sm:h-6 sm:w-20" />
        <span className="block overflow-hidden rounded-[3px] bg-cocoa-3" style={{ aspectRatio: `${item.width} / ${item.height}` }}>
          <Thumb item={item} />
        </span>
        <span className="mt-2 block px-0.5 font-hand text-xl leading-none text-[#3a1e12] sm:mt-3 sm:px-1 sm:text-[1.7rem]">{item.title}</span>
        {item.note && (
          <span className="mt-1.5 block px-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9a6a48] sm:mt-2 sm:px-1 sm:text-[11px] sm:tracking-[0.14em]">
            {item.note}
          </span>
        )}
      </button>
    </motion.li>
  )
}

// Miniatura do mural. Se a foto falhar (rede instável), tenta mais uma vez; depois fica só o fundo, sem ícone quebrado.
function Thumb({ item }: { item: MuralItem }) {
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      src={attempt ? `${item.thumb}${item.thumb.includes('?') ? '&' : '?'}de-novo=${attempt}` : item.thumb}
      alt={item.alt}
      width={item.width}
      height={item.height}
      loading="lazy"
      decoding="async"
      onError={() => (attempt ? setFailed(true) : window.setTimeout(() => setAttempt(1), 1500))}
      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
    />
  )
}

function FullImage({ item }: { item: MuralItem }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={item.full}
      alt={item.alt}
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  )
}

function Lightbox({ items, index, onClose, onStep }: { items: MuralItem[]; index: number; onClose: () => void; onStep: (dir: 1 | -1) => void }) {
  const lenis = useLenis()
  const item = items[index]

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

  // já baixa a anterior e a próxima, para a troca ser imediata
  useEffect(() => {
    for (const dir of [1, -1]) {
      const next = items[(index + dir + items.length) % items.length]
      if (next && next !== item) new Image().src = next.full
    }
  }, [items, index, item])

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[90] flex flex-col bg-cocoa/95 p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="min-w-0 text-sm text-muted">
          <span className="font-hand text-2xl text-cream">{item.title}</span>
          {item.note && <span className="block truncate sm:ml-3 sm:inline">{item.note}</span>}
        </p>
        <button type="button" onClick={onClose} aria-label="Fechar" className="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong text-xl">
          <TbX aria-hidden />
        </button>
      </div>
      {/* a foto ocupa o maior espaço possível sem cortar; a miniatura já carregada aparece enquanto a grande chega */}
      <div className="relative my-4 min-h-0 flex-1 [container-type:size]">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.key}
            className="absolute inset-0 grid place-items-center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: easeOut }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="overflow-hidden rounded-3xl bg-cocoa-3 bg-cover bg-center shadow-2xl"
              style={{
                aspectRatio: `${item.width} / ${item.height}`,
                width: `min(100cqw, 100cqh * ${(item.width / item.height).toFixed(4)})`,
                backgroundImage: `url("${item.thumb}")`,
              }}
            >
              <FullImage item={item} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => onStep(-1)} aria-label="Foto anterior" className="grid size-12 place-items-center rounded-full border border-line-strong text-xl hover:border-caramel">
            <TbArrowLeft aria-hidden />
          </button>
          <span className="w-20 text-center text-sm tabular-nums text-muted">
            {index + 1} / {items.length}
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
  const { chooseTheme, themes } = useOrder()
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
  const { photos } = useSiteData()
  const items = useMemo(() => [...photos.map(fromPanel), ...bundled], [photos])
  const [shown, setShown] = useState(PAGE)
  const [open, setOpen] = useState<number | null>(null)
  const close = useCallback(() => setOpen(null), [])
  const step = useCallback((dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + items.length) % items.length)), [items.length])

  const lg = useMediaQuery('(min-width: 1024px)')
  const visible = useMemo(() => items.slice(0, shown), [items, shown])
  // duas colunas já no celular (fica com cara de mural e a rolagem não fica enorme), três no computador
  const count = Math.max(1, Math.min(lg ? 3 : 2, visible.length))
  const columns = useMemo(() => toColumns(visible, count, photoHeight), [visible, count])
  const rest = items.length - visible.length

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
              O nosso mural de festas: pirulitos que já saíram da cozinha, do jeitinho que chegaram na mesa. Toque na foto para ver de perto.
            </p>
          </div>
        </Reveal>

        {/* cada coluna é uma lista; a ordem de leitura segue a das fotos, das mais novas para as mais antigas */}
        <div
          className={`mx-auto mt-16 grid items-start gap-x-4 sm:gap-x-10 ${count === 1 ? 'max-w-md' : count === 2 && lg ? 'max-w-4xl' : ''}`}
          style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        >
          {columns.map((column, c) => (
            <ul key={c} className="grid gap-7 sm:gap-12">
              {column.items.map(({ item, index }) => (
                <Polaroid key={item.key} item={item} index={index} onOpen={() => setOpen(index)} />
              ))}
            </ul>
          ))}
        </div>

        {rest > 0 && (
          <div className="mt-14 flex justify-center">
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-7 py-3.5 font-medium text-cream transition-colors hover:border-caramel/60 hover:bg-caramel/10"
            >
              <TbPlus aria-hidden /> Ver mais festas <span className="text-muted">({rest})</span>
            </button>
          </div>
        )}
      </div>

      <ThemeStrip />

      <AnimatePresence>{open !== null && items[open] && <Lightbox items={items} index={open} onClose={close} onStep={step} />}</AnimatePresence>
    </section>
  )
}
