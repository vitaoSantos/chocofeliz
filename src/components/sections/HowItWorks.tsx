import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { TbChefHat, TbGift, TbMessageCircle, TbPalette } from 'react-icons/tb'
import { easeOut } from '../ui/motion'
import { Reveal } from '../ui/Reveal'
import { SectionLabel } from '../ui/SectionLabel'

const steps = [
  {
    icon: TbMessageCircle,
    title: 'Você conta a ideia',
    text: 'Tema da festa, nome, idade, data e quantidade. Pode mandar referência, foto do convite, o que tiver.',
    note: 'pelo WhatsApp ou formulário',
  },
  {
    icon: TbPalette,
    title: 'A gente cria a arte',
    text: 'Desenhamos o rótulo com o tema escolhido e mandamos para você aprovar antes de ir para o chocolate.',
    note: 'nada é produzido sem o seu ok',
  },
  {
    icon: TbChefHat,
    title: 'Mãos no chocolate',
    text: 'Chocolate derretido no ponto, moldado um a um, com o palito e o rótulo aplicados enquanto ainda está macio.',
    note: 'feito à mão, sem pressa',
  },
  {
    icon: TbGift,
    title: 'Laço e entrega',
    text: 'Cada pirulito vai no celofane com fitilho cacheado na cor da festa, prontinho para a mesa ou para a lembrancinha.',
    note: 'é só distribuir os sorrisos',
  },
]

export function HowItWorks() {
  const list = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: list, offset: ['start 75%', 'end 55%'] })
  // scaleY em vez de height: a "calda" escorre sem recalcular o layout a cada quadro
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section id="como-funciona" className="relative py-24 sm:py-32">
      <div className="container-x grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <SectionLabel>Como funciona</SectionLabel>
            <h2 className="mt-6 font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.98] tracking-tight">
              Do derretido ao <span className="wonk text-gradient">embrulhado.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              Quatro passos entre a sua ideia e a festa. Você acompanha tudo e aprova a arte antes de qualquer chocolate derreter.
            </p>
          </Reveal>
        </div>

        <ol ref={list} className="relative grid gap-6 pl-10 sm:pl-14">
          {/* "calda" que escorre conforme a página rola */}
          <span aria-hidden className="absolute bottom-6 left-[11px] top-6 w-[6px] rounded-full bg-cream/[0.06] sm:left-[19px]" />
          <motion.span
            aria-hidden
            style={{ scaleY: fill }}
            className="absolute bottom-6 left-[11px] top-6 w-[6px] origin-top rounded-full bg-gradient-to-b from-milk-soft via-milk to-caramel shadow-[0_0_18px_rgb(234_162_76/0.45)] sm:left-[19px]"
          />
          {steps.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: easeOut }}
              className="border-gradient relative rounded-[1.75rem] bg-cocoa-2/80 p-6 sm:p-8"
            >
              <span
                aria-hidden
                className="bg-chocolate absolute -left-10 top-7 grid size-7 place-items-center rounded-full text-[11px] font-bold text-cream ring-4 ring-cocoa sm:-left-14 sm:size-11 sm:text-sm"
              >
                {i + 1}
              </span>
              <div className="flex items-start gap-5">
                <span className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-caramel/10 text-3xl text-caramel sm:grid">
                  <step.icon aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{step.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{step.text}</p>
                  <p className="mt-4 font-hand text-2xl text-berry-soft">{step.note}</p>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
