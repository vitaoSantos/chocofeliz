import { motion, useInView } from 'motion/react'
import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { TbBrandWhatsapp, TbColorPicker, TbHandFinger, TbMinus, TbPhotoUp, TbPlus, TbX } from 'react-icons/tb'
import { useIntro } from '../../context/IntroContext'
import { MIN_QUANTITY, useOrder } from '../../context/OrderContext'
import { brand, whatsappUrl } from '../../data/brand'
import { ribbonColors, ribbonsName } from '../../data/options'
import { CUSTOM_ART, themeById } from '../../data/themes'
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
  const { order, update, chooseTheme, lines, art, chocolates, themes } = useOrder()
  const desktop = useIsDesktop()
  const reduced = useReducedMotion()
  const scrollTo = useScrollTo()
  const stage = useRef<HTMLDivElement>(null)
  const { heroReady, markReady } = useIntro()
  // O 3D daqui é preparado ainda durante a tela de carregamento (logo depois da abertura),
  // e não no meio do scroll: assim chegar nesta seção não engasga
  const near = useInView(stage, { margin: '600px 0px', once: true })
  const visible = useInView(stage)
  const [stageReady, setStageReady] = useState(false)
  const onStageReady = useCallback(() => {
    setStageReady(true)
    markReady('builder')
  }, [markReady])
  const theme = themeById(order.theme)
  const choc = chocolates.find((c) => c.id === order.chocolate) ?? chocolates[0]
  const customArtOn = themes.some((t) => t.id === CUSTOM_ART)

  const message = [
    `Olá, ${brand.name}! Montei meu pirulito no site e quero um orçamento:`,
    ...lines.map((line) => `• ${line}`),
    '• Data da festa: ',
  ].join('\n')

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
              {(heroReady || near) && (
                <StageBoundary fallback={null}>
                  <Suspense fallback={null}>
                    <BuilderStage
                      label={{ theme: order.theme, name: order.name, detail: order.detail }}
                      chocolate={order.chocolate}
                      ribbons={order.ribbons}
                      art={order.theme === CUSTOM_ART ? art : null}
                      wrapped={order.wrapped}
                      active={visible}
                      mobile={!desktop}
                      reduced={reduced}
                      onReady={onStageReady}
                    />
                  </Suspense>
                </StageBoundary>
              )}
              {!stageReady && (
                <div className="absolute inset-0 bg-cocoa-2">
                  <StageFallback />
                </div>
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
                {order.name && !(theme.sample.placeholder && order.name === theme.sample.name)
                  ? `o pirulito ${order.name.length > 14 ? 'da festa' : `de ${order.name}`}`
                  : 'o seu pirulito'}
              </motion.p>
            </div>
          </div>

          {/* Escolhas */}
          <form className="grid gap-8" onSubmit={(e) => e.preventDefault()}>
            <Group title="1 · Tema" hint={`${themes.length} opções`}>
              <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5 xl:grid-cols-6">
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
                          <LabelDisc
                            input={{ theme: t.id, name: t.sample.name, detail: t.sample.detail }}
                            image={t.id === CUSTOM_ART ? art : null}
                            size={160}
                          />
                        </span>
                        <span className={`text-center text-[11px] leading-tight sm:text-xs ${selected ? 'text-cream' : 'text-muted'}`}>{t.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {order.theme === CUSTOM_ART ? (
                <ArtUpload />
              ) : (
                customArtOn && (
                  <p className="mt-5 text-sm text-muted">
                    Não achou o tema?{' '}
                    <button type="button" onClick={() => chooseTheme(CUSTOM_ART)} className="font-semibold text-caramel underline-offset-4 hover:underline">
                      Escolha “Sua arte”
                    </button>{' '}
                    e envie a imagem do personagem: a gente monta o rótulo com ele.
                  </p>
                )
              )}
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

            <Group title="4 · Embalagem" hint={order.wrapped ? (order.ribbons.length > 1 ? 'Fitilho de duas cores' : 'Fitilho de uma cor') : 'Sem celofane'}>
              <button
                type="button"
                role="switch"
                aria-checked={order.wrapped}
                onClick={() => update({ wrapped: !order.wrapped })}
                className="mb-5 flex items-center gap-3 text-sm text-cream"
              >
                <span className={`relative block h-7 w-12 shrink-0 rounded-full transition-colors ${order.wrapped ? 'bg-gradient-brand' : 'bg-cream/15'}`}>
                  <span
                    className={`absolute left-1 top-1 size-5 rounded-full bg-cream shadow transition-transform duration-300 ${order.wrapped ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </span>
                Celofane com laço de fitilho
              </button>
              <RibbonPicker colors={order.ribbons} onChange={(ribbons) => update({ ribbons })} disabled={!order.wrapped} />
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
  const { order, art } = useOrder()
  return (
    <div className="grid h-full place-items-center p-12">
      <LabelDisc
        input={{ theme: order.theme, name: order.name, detail: order.detail }}
        image={order.theme === CUSTOM_ART ? art : null}
        size={512}
        className="w-3/4"
      />
    </div>
  )
}

// Tema "Sua arte": a pessoa escolhe a imagem do personagem (ou uma foto) e vê no pirulito.
// A imagem não sai do aparelho; no pedido pelo WhatsApp ela manda junto.
function ArtUpload() {
  const { art, setArtFile } = useOrder()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function choose(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      await setArtFile(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu para abrir essa imagem.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-dashed border-caramel/50 bg-caramel/[0.05] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-cream px-5 py-3 text-sm font-semibold text-cocoa transition-transform hover:-translate-y-0.5">
          <TbPhotoUp aria-hidden className="text-lg" />
          {busy ? 'Abrindo…' : art ? 'Trocar imagem' : 'Escolher imagem'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              void choose(file)
            }}
          />
        </label>
        {art && (
          <button type="button" onClick={() => void setArtFile(null)} className="text-sm text-muted hover:text-cream">
            Remover
          </button>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Personagem, desenho ou foto: a imagem aparece no pirulito ao lado. Ela fica só no seu aparelho; no pedido pelo WhatsApp é só mandar
        a imagem junto.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}

// Cores do fitilho: as prontas, qualquer outra no seletor e, se quiser, uma segunda cor
function RibbonPicker({ colors, onChange, disabled }: { colors: string[]; onChange: (colors: string[]) => void; disabled: boolean }) {
  const [slot, setSlot] = useState(0)
  const active = Math.min(slot, colors.length - 1)
  const current = colors[active].toLowerCase()
  const isPreset = ribbonColors.some((r) => r.color.toLowerCase() === current)

  function pick(color: string) {
    const next = [...colors]
    next[active] = color
    onChange(next)
  }

  function addSecond() {
    const yellow = ribbonColors.find((r) => r.label === 'Amarelo')?.color ?? '#f5c518'
    const green = ribbonColors.find((r) => r.label === 'Verde')?.color ?? '#1f9d55'
    onChange([colors[0], colors[0].toLowerCase() === yellow ? green : yellow])
    setSlot(1)
  }

  return (
    <div className={`transition-opacity ${disabled ? 'pointer-events-none opacity-30' : ''}`} aria-disabled={disabled}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {colors.map((color, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSlot(i)}
            aria-pressed={active === i}
            className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-sm transition-colors ${
              active === i ? 'border-caramel bg-caramel/10 text-cream' : 'border-line text-muted hover:text-cream'
            }`}
          >
            <span className="size-6 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)]" style={{ background: color }} />
            {i === 0 ? '1ª cor' : '2ª cor'}
          </button>
        ))}
        {colors.length === 1 ? (
          <button
            type="button"
            onClick={addSecond}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-strong px-4 py-2 text-sm text-muted transition-colors hover:border-caramel hover:text-cream"
          >
            <TbPlus aria-hidden /> segunda cor
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onChange([colors[0]])
              setSlot(0)
            }}
            aria-label="Usar uma cor só"
            title="Usar uma cor só"
            className="grid size-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-cream"
          >
            <TbX aria-hidden />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {ribbonColors.map((r) => {
          const selected = r.color.toLowerCase() === current
          return (
            <button
              key={r.color}
              type="button"
              onClick={() => pick(r.color)}
              aria-pressed={selected}
              aria-label={`Fitilho ${r.label.toLowerCase()}`}
              title={r.label}
              className={`size-9 rounded-full border-2 transition-transform ${selected ? 'scale-110 border-cream' : 'border-transparent hover:scale-105'}`}
              style={{ background: `radial-gradient(circle at 35% 30%, #ffffff88, ${r.color} 55%)` }}
            />
          )
        })}
        <label
          title="Qualquer outra cor"
          className={`relative grid size-9 cursor-pointer place-items-center rounded-full border-2 transition-transform hover:scale-105 ${
            isPreset ? 'border-transparent' : 'scale-110 border-cream'
          }`}
          style={{ background: 'conic-gradient(#ff4d4d, #ffd43b, #69db7c, #4dabf7, #b197fc, #f783ac, #ff4d4d)' }}
        >
          <span className="sr-only">Escolher qualquer outra cor</span>
          {!isPreset && <span className="size-4 rounded-full ring-2 ring-white" style={{ background: current }} />}
          {isPreset && <TbColorPicker aria-hidden className="text-base text-white drop-shadow" />}
          <input type="color" value={current} onChange={(e) => pick(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
      </div>
      <p className="mt-3 text-sm text-faint">Fitilho {ribbonsName(colors)}</p>
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
