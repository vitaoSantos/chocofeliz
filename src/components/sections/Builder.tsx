import { motion, useInView } from 'motion/react'
import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { TbBrandWhatsapp, TbHandFinger, TbMinus, TbPlus } from 'react-icons/tb'
import { MIN_QUANTITY, useOrder } from '../../context/OrderContext'
import { brand, whatsappUrl } from '../../data/brand'
import { chocolates, ribbons } from '../../data/options'
import { themeById, themes } from '../../data/themes'
import { useIsDesktop, useReducedMotion } from '../../hooks/useMediaQuery'
import { useScrollTo } from '../layout/Navbar'
import { LabelDisc } from '../ui/LabelDisc'
import { Magnetic } from '../ui/Magnetic'
import { Reveal } from '../ui/Reveal'
import { SectionLabel } from '../ui/SectionLabel'

const BuilderStage = lazy(() => import('../three/BuilderStage'))

class StageBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function Group({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return (
    <fieldset className="border-t border-line pt-6">
      <legend className="sr-only">{title}</legend>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <p aria-hidden className="text-xs font-semibold uppercase tracking-[0.22em] text-caramel">
          {title}
        </p>
        {hint && <p className="text-sm text-faint">{hint}</p>}
      </div>
      {children}
    </fieldset>
  )
}

export function Builder() {
  const { order, update, chooseTheme } = useOrder()
  const desktop = useIsDesktop()
  const reduced = useReducedMotion()
  const scrollTo = useScrollTo()
  const stage = useRef<HTMLDivElement>(null)
  const near = useInView(stage, { margin: '400px 0px', once: true })
  const visible = useInView(stage)
  const theme = themeById(order.theme)
  const choc = chocolates.find((c) => c.id === order.chocolate) ?? chocolates[0]
  const ribbon = ribbons.find((r) => r.id === order.ribbon) ?? ribbons[0]

  const message = [
    `Olá, ${brand.name}! Montei meu pirulito no site e quero um orçamento:`,
    `• Tema: ${theme.label}`,
    (order.name || order.detail) && `• Rótulo: ${[order.name, order.detail].filter(Boolean).join(', ')}`,
    `• Chocolate: ${choc.label.toLowerCase()}`,
    order.wrapped ? `• Embalagem: celofane com fitilho ${ribbon.label.toLowerCase()}` : '• Embalagem: sem celofane',
    `• Quantidade: ${order.quantity}`,
    '• Data da festa: ',
  ]
    .filter(Boolean)
    .join('\n')

  const input =
    'w-full rounded-2xl border border-line bg-cream/[0.04] px-5 py-3.5 text-cream placeholder:text-faint outline-none transition-colors focus:border-caramel/70 focus:bg-caramel/[0.06]'

  return (
    <section id="monte" className="relative py-24 sm:py-32">
      <div className="container-x">
        <Reveal>
          <SectionLabel>Monte o seu</SectionLabel>
          <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <h2 className="max-w-3xl font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.98] tracking-tight">
              Brinque de <span className="wonk text-gradient">confeiteiro.</span>
            </h2>
            <p className="max-w-sm text-muted">
              Escolha o tema, escreva o nome, troque o chocolate e a cor do laço. O pirulito ao lado muda na hora — depois é só pedir.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          {/* Palco 3D */}
          {/* no celular o palco fica grudado no topo enquanto a pessoa escolhe as opções */}
          <div className="sticky top-0 z-20 -mx-5 bg-cocoa px-5 pb-3 pt-2 shadow-[0_18px_24px_-12px_rgb(20_11_7)] sm:-mx-8 sm:px-8 lg:top-24 lg:z-auto lg:mx-0 lg:self-start lg:bg-transparent lg:p-0 lg:shadow-none">
            <div
              ref={stage}
              data-cursor="drag"
              className="border-gradient relative h-[42svh] overflow-hidden rounded-[2rem] bg-cocoa-2 lg:h-auto lg:aspect-[4/5]"
            >
              {near && (
                <StageBoundary fallback={<StageFallback />}>
                  <Suspense fallback={<StageFallback />}>
                    <BuilderStage
                      label={{ theme: order.theme, name: order.name, detail: order.detail }}
                      chocolate={order.chocolate}
                      ribbon={order.ribbon}
                      wrapped={order.wrapped}
                      active={visible}
                      mobile={!desktop}
                      reduced={reduced}
                    />
                  </Suspense>
                </StageBoundary>
              )}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5">
                <span className="rounded-full border border-line bg-cocoa/60 px-3 py-1.5 text-xs text-muted">{theme.label}</span>
                <span className="flex items-center gap-1.5 rounded-full border border-line bg-cocoa/60 px-3 py-1.5 text-xs text-muted">
                  <TbHandFinger aria-hidden /> arraste para girar
                </span>
              </div>
              <motion.p
                key={`${order.name}-${order.detail}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-none absolute inset-x-0 bottom-3 hidden text-center font-hand text-2xl text-cream/85 lg:block"
              >
                {order.name ? `o pirulito ${order.name.length > 14 ? 'da festa' : `de ${order.name}`}` : 'o seu pirulito'}
              </motion.p>
            </div>
          </div>

          {/* Escolhas */}
          <form className="grid gap-8" onSubmit={(e) => e.preventDefault()}>
            <Group title="1 · Tema" hint={`${themes.length} opções`}>
              <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {themes.map((t) => {
                  const selected = t.id === order.theme
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => chooseTheme(t.id)}
                        aria-pressed={selected}
                        className="group flex w-full flex-col items-center gap-2"
                      >
                        <span
                          className={`block w-full rounded-full p-0.5 transition-[box-shadow,transform] duration-300 ${
                            selected ? 'scale-105 shadow-[0_0_0_2px_var(--color-caramel),0_0_24px_-4px_rgb(234_162_76/0.8)]' : 'group-hover:scale-105'
                          }`}
                        >
                          <LabelDisc input={{ theme: t.id, name: t.sample.name, detail: t.sample.detail }} size={160} />
                        </span>
                        <span className={`text-center text-[11px] leading-tight sm:text-xs ${selected ? 'text-cream' : 'text-muted'}`}>{t.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Group>

            <Group title="2 · Rótulo" hint="aparece no pirulito">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-muted">
                  Nome
                  <input
                    className={input}
                    value={order.name}
                    maxLength={16}
                    placeholder="Ex.: Davi"
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </label>
                <label className="grid gap-2 text-sm text-muted">
                  Idade ou frase
                  <input
                    className={input}
                    value={order.detail}
                    maxLength={18}
                    placeholder="Ex.: 5 anos"
                    onChange={(e) => update({ detail: e.target.value })}
                  />
                </label>
              </div>
            </Group>

            <Group title="3 · Chocolate" hint={choc.label}>
              <div className="flex flex-wrap gap-3">
                {chocolates.map((c) => {
                  const selected = c.id === order.chocolate
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => update({ chocolate: c.id })}
                      aria-pressed={selected}
                      className={`flex items-center gap-3 rounded-full border py-2 pl-2 pr-4 text-sm transition-colors ${
                        selected ? 'border-caramel bg-caramel/10 text-cream' : 'border-line text-muted hover:border-line-strong hover:text-cream'
                      }`}
                    >
                      <span
                        className="size-7 rounded-full shadow-[inset_0_2px_3px_rgb(255_255_255/0.35),inset_0_-3px_5px_rgb(0_0_0/0.35)]"
                        style={{ background: `radial-gradient(circle at 35% 30%, ${c.sheen}, ${c.color} 60%)` }}
                      />
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </Group>

            <Group title="4 · Embalagem" hint={order.wrapped ? `Fitilho ${ribbon.label.toLowerCase()}` : 'Sem celofane'}>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  role="switch"
                  aria-checked={order.wrapped}
                  onClick={() => update({ wrapped: !order.wrapped })}
                  className="flex items-center gap-3 text-sm text-cream"
                >
                  <span className={`relative block h-7 w-12 shrink-0 rounded-full transition-colors ${order.wrapped ? 'bg-gradient-brand' : 'bg-cream/15'}`}>
                    <span
                      className={`absolute left-1 top-1 size-5 rounded-full bg-cream shadow transition-transform duration-300 ${order.wrapped ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </span>
                  Celofane com laço
                </button>
                <div className={`flex flex-wrap gap-2 transition-opacity ${order.wrapped ? '' : 'pointer-events-none opacity-30'}`}>
                  {ribbons.map((r) => {
                    const selected = r.id === order.ribbon
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => update({ ribbon: r.id })}
                        aria-pressed={selected}
                        aria-label={`Fitilho ${r.label.toLowerCase()}`}
                        title={r.label}
                        className={`size-9 rounded-full border-2 transition-transform ${selected ? 'scale-110 border-cream' : 'border-transparent hover:scale-105'}`}
                        style={{ background: `radial-gradient(circle at 35% 30%, #ffffff88, ${r.color} 55%)` }}
                      />
                    )
                  })}
                </div>
              </div>
            </Group>

            <Group title="5 · Quantidade">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Menos 10"
                  onClick={() => update({ quantity: Math.max(MIN_QUANTITY, order.quantity - 10) })}
                  className="grid size-12 place-items-center rounded-full border border-line-strong text-lg hover:border-caramel"
                >
                  <TbMinus aria-hidden />
                </button>
                <QuantityInput className={input} value={order.quantity} onChange={(quantity) => update({ quantity })} />
                <button
                  type="button"
                  aria-label="Mais 10"
                  onClick={() => update({ quantity: order.quantity + 10 })}
                  className="grid size-12 place-items-center rounded-full border border-line-strong text-lg hover:border-caramel"
                >
                  <TbPlus aria-hidden />
                </button>
                <span className="text-sm text-muted">pirulitos</span>
              </div>
            </Group>

            <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center">
              <Magnetic>
                <a
                  href={whatsappUrl(message)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-7 py-4 font-semibold text-cocoa shadow-[0_0_44px_-10px_rgb(255_92_138/0.8)] transition-[filter] hover:brightness-110"
                >
                  <TbBrandWhatsapp aria-hidden className="text-lg" />
                  Pedir este pirulito
                </a>
              </Magnetic>
              <button
                type="button"
                onClick={() => scrollTo('contato')}
                className="rounded-full border border-line-strong px-7 py-4 font-medium text-cream transition-colors hover:border-caramel/60 hover:bg-caramel/10"
              >
                Prefiro o formulário
              </button>
            </div>
            <p className="-mt-4 text-sm text-faint">Valores, prazos e entrega a gente combina na conversa.</p>
          </form>
        </div>
      </div>
    </section>
  )
}

function StageFallback() {
  const { order } = useOrder()
  return (
    <div className="grid h-full place-items-center p-12">
      <LabelDisc input={{ theme: order.theme, name: order.name, detail: order.detail }} size={512} className="w-3/4" />
    </div>
  )
}

// Campo de quantidade que deixa apagar e digitar livremente; corrige ao sair do campo
function QuantityInput({ value, onChange, className }: { value: number; onChange: (v: number) => void; className: string }) {
  const [text, setText] = useState(String(value))

  useEffect(() => setText(String(value)), [value])

  return (
    <input
      type="number"
      inputMode="numeric"
      min={MIN_QUANTITY}
      aria-label="Quantidade de pirulitos"
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        const n = Math.round(Number(e.target.value))
        if (n >= MIN_QUANTITY) onChange(n)
      }}
      onBlur={() => setText(String(value))}
      className={`${className} w-28 text-center font-display text-2xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
    />
  )
}
