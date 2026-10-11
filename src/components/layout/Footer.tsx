import { TbArrowUp, TbBrandInstagram, TbBrandWhatsapp, TbMail } from 'react-icons/tb'
import { brand, instagramUrl, whatsappUrl } from '../../data/brand'
import { navLinks } from '../../data/nav'
import { Logo } from '../ui/Logo'
import { useScrollTo } from './Navbar'

export function Footer() {
  const scrollTo = useScrollTo()

  return (
    <footer className="relative mt-10 overflow-hidden border-t border-line">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault()
              scrollTo('inicio')
            }}
            className="text-2xl"
          >
            <Logo />
          </a>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            {brand.tagline}. Feitos à mão, um por um, para deixar qualquer festa mais feliz.
          </p>
        </div>

        <nav aria-label="Rodapé">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-faint">Navegação</p>
          <ul className="grid gap-2 text-sm">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollTo(link.id)
                  }}
                  className="text-muted transition-colors hover:text-cream"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-faint">Fale com a gente</p>
          <ul className="grid gap-2 text-sm">
            <li>
              <a href={whatsappUrl(`Olá, ${brand.name}!`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-muted hover:text-cream">
                <TbBrandWhatsapp aria-hidden /> WhatsApp
              </a>
            </li>
            {instagramUrl && (
              <li>
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-muted hover:text-cream">
                  <TbBrandInstagram aria-hidden /> @{brand.instagram}
                </a>
              </li>
            )}
            {brand.email && (
              <li>
                <a href={`mailto:${brand.email}`} className="inline-flex items-center gap-2 text-muted hover:text-cream">
                  <TbMail aria-hidden /> {brand.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="container-x flex flex-col justify-between gap-3 border-t border-line py-6 text-xs text-faint sm:flex-row sm:items-center">
        <span>
          © {new Date().getFullYear()} {brand.name}
        </span>
        <span className="font-hand text-lg text-muted">feito com chocolate e carinho</span>
        <button type="button" onClick={() => scrollTo('inicio')} className="inline-flex items-center gap-1 hover:text-cream">
          Voltar ao topo <TbArrowUp aria-hidden />
        </button>
      </div>

      <p
        aria-hidden
        className="pointer-events-none select-none whitespace-nowrap text-center font-display text-[17vw] font-bold leading-[0.8] tracking-tighter text-transparent [-webkit-text-stroke:1px_rgb(247_234_216/0.08)]"
      >
        ChocoFeliz
      </p>
    </footer>
  )
}
