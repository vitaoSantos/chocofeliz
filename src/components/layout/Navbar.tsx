import { useLenis } from 'lenis/react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useEffect, useState, type MouseEvent } from 'react'
import { TbBrandInstagram, TbBrandWhatsapp, TbMenu2, TbX } from 'react-icons/tb'
import { brand, instagramUrl, whatsappUrl } from '../../data/brand'
import { navLinks } from '../../data/nav'
import { Logo } from '../ui/Logo'
import { Magnetic } from '../ui/Magnetic'
import { easeExpo, easeOut } from '../ui/motion'

// Rola suavemente até a seção (com Lenis quando ativo)
export function useScrollTo() {
  const lenis = useLenis()
  return (id: string) => {
    const target = id === 'inicio' ? 0 : document.getElementById(id)
    if (target === null) return
    if (lenis) lenis.scrollTo(target, { offset: id === 'inicio' ? 0 : -72, duration: 1.6 })
    else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' })
    else target.scrollIntoView({ behavior: 'smooth' })
  }
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [active, setActive] = useState('inicio')
  const { scrollY } = useScroll()
  const scrollTo = useScrollTo()

  useMotionValueEvent(scrollY, 'change', (y) => {
    const previous = scrollY.getPrevious() ?? 0
    setScrolled(y > 24)
    setHidden(y > previous && y > 240)
    // seção ativa: a última cujo topo já passou de 40% da tela
    let current = navLinks[0].id
    for (const link of navLinks) {
      const el = document.getElementById(link.id)
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = link.id
    }
    setActive(current)
  })

  useEffect(() => {
    if (!open) return
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])

  function go(e: MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    setOpen(false)
    scrollTo(id)
  }

  const orderLink = whatsappUrl(`Olá, ${brand.name}! Quero fazer um orçamento de pirulitos de chocolate personalizados.`)

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6"
        animate={{ y: hidden && !open ? '-120%' : '0%' }}
        transition={{ duration: 0.45, ease: easeOut }}
      >
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between rounded-full border py-2 pl-5 pr-2 transition-[background-color,border-color] duration-500 ${
            scrolled || open ? 'glass border-line' : 'border-transparent'
          }`}
        >
          <a href="#inicio" onClick={(e) => go(e, 'inicio')} aria-label="ChocoFeliz — voltar ao início" className="text-lg">
            <Logo />
          </a>

          <nav aria-label="Seções" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = active === link.id
                return (
                  <li key={link.id}>
                    <a
                      href={`#${link.id}`}
                      onClick={(e) => go(e, link.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={`relative block rounded-full px-4 py-2 text-sm transition-colors duration-300 ${
                        isActive ? 'text-cream' : 'text-muted hover:text-cream'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-full border border-line bg-cream/[0.07]"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className="relative">{link.label}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="hidden size-10 place-items-center rounded-full text-muted transition-colors hover:text-cream sm:grid"
              >
                <TbBrandInstagram className="text-xl" aria-hidden />
              </a>
            )}
            <div className="hidden sm:block">
              <Magnetic>
                <a
                  href={orderLink}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-cocoa transition-[filter] hover:brightness-110"
                >
                  <TbBrandWhatsapp aria-hidden className="text-base" />
                  Fazer pedido
                </a>
              </Magnetic>
            </div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={open}
              className="grid size-11 place-items-center rounded-full border border-line text-cream lg:hidden"
            >
              {open ? <TbX className="text-xl" aria-hidden /> : <TbMenu2 className="text-xl" aria-hidden />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="bg-chocolate fixed inset-0 z-40 flex flex-col justify-between px-6 pb-10 pt-28 lg:hidden"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)', transition: { duration: 0.6, ease: easeExpo } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <nav aria-label="Menu">
              <ul className="flex flex-col gap-2">
                {navLinks.map((link, i) => (
                  <li key={link.id} className="overflow-hidden">
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: '0%' }}
                      transition={{ duration: 0.7, ease: easeOut, delay: 0.15 + i * 0.06 }}
                    >
                      <a
                        href={`#${link.id}`}
                        onClick={(e) => go(e, link.id)}
                        className={`flex items-baseline gap-4 font-display text-5xl font-semibold tracking-tight ${
                          active === link.id ? 'text-gradient' : 'text-cream'
                        }`}
                      >
                        <span className="font-sans text-xs text-cream/50">0{i + 1}</span>
                        {link.label}
                      </a>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </nav>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-4 border-t border-cream/15 pt-6"
            >
              <a
                href={orderLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cream px-6 py-4 font-semibold text-cocoa"
              >
                <TbBrandWhatsapp aria-hidden className="text-lg" /> Fazer pedido no WhatsApp
              </a>
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-cream/80">
                  <TbBrandInstagram aria-hidden /> @{brand.instagram}
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
