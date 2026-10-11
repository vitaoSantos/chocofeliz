import { useEffect, useState } from 'react'
import { TbArrowBackUp, TbCheck, TbLoader2 } from 'react-icons/tb'
import { LabelDisc } from '../components/ui/LabelDisc'
import { chocolates } from '../data/options'
import { themes } from '../data/themes'
import { adminSaveSettings } from '../lib/api'
import { emptySettings, type SiteSettings } from '../lib/siteTypes'
import { Notice, PanelHeader, Switch, useLeaveWarning, type PanelProps } from './ui'

// O que está ligado: o que foi marcado no painel ou, se nunca foi mexido, o padrão do código
const chocolateOn = (s: SiteSettings, id: string) => s.chocolates[id] ?? chocolates.find((c) => c.id === id)?.ativo ?? false
const themeOn = (s: SiteSettings, id: string) => s.themes[id] ?? true

function sameChoices(a: SiteSettings, b: SiteSettings) {
  return chocolates.every((c) => chocolateOn(a, c.id) === chocolateOn(b, c.id)) && themes.every((t) => themeOn(a, t.id) === themeOn(b, t.id))
}

export function OptionsPanel({ password, data, update }: PanelProps) {
  const [draft, setDraft] = useState<SiteSettings>(data.settings)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const dirty = !sameChoices(draft, data.settings)
  useLeaveWarning(dirty)

  // ao entrar de novo (senha salva) o painel recarrega: começa do que está publicado
  useEffect(() => setDraft(data.settings), [data.settings])

  const chocolatesOn = chocolates.filter((c) => chocolateOn(draft, c.id)).length
  const themesOn = themes.filter((t) => themeOn(draft, t.id)).length

  function toggle(group: 'chocolates' | 'themes', id: string, on: boolean) {
    setNotice(null)
    setDraft((s) => ({ ...s, [group]: { ...s[group], [id]: on } }))
  }

  function setAllThemes(on: boolean) {
    setNotice(null)
    setDraft((s) => ({ ...s, themes: Object.fromEntries(themes.map((t) => [t.id, on])) }))
  }

  async function save() {
    setSaving(true)
    setNotice(null)
    try {
      const { settings } = await adminSaveSettings(password, draft)
      update((d) => ({ ...d, settings }))
      setNotice({ tone: 'ok', text: 'Salvo! Em alguns segundos o site já mostra as mudanças.' })
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Não foi possível salvar agora.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-12 pb-28">
      <PanelHeader title="Opções do site">
        Ligue ou desligue o que aparece no “Monte o seu”. O que estiver desligado some do site, mas fica guardado aqui para ligar de novo quando
        quiser.
      </PanelHeader>

      <section aria-labelledby="chocolates" className="grid gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-line pt-8">
          <h2 id="chocolates" className="font-display text-2xl font-semibold">
            Chocolates
          </h2>
          <p className="text-sm text-muted">Pelo menos um precisa ficar ligado.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {chocolates.map((c) => {
            const on = chocolateOn(draft, c.id)
            return (
              <li
                key={c.id}
                className={`flex items-center gap-4 rounded-[1.5rem] border p-4 transition-colors ${on ? 'border-caramel/50 bg-caramel/[0.06]' : 'border-line bg-cocoa-2'}`}
              >
                <span
                  className={`size-11 shrink-0 rounded-full shadow-[inset_0_2px_3px_rgb(255_255_255/0.35),inset_0_-3px_5px_rgb(0_0_0/0.35)] transition-opacity ${on ? '' : 'opacity-40'}`}
                  style={{ background: `radial-gradient(circle at 35% 30%, ${c.sheen}, ${c.color} 60%)` }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{c.label}</span>
                  <span className={`block text-sm ${on ? 'text-mint' : 'text-faint'}`}>{on ? 'Aparece no site' : 'Escondido'}</span>
                </span>
                <Switch
                  on={on}
                  label={`Mostrar chocolate ${c.label.toLowerCase()}`}
                  disabled={on && chocolatesOn === 1}
                  onToggle={() => toggle('chocolates', c.id, !on)}
                />
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="temas" className="grid gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-line pt-8">
          <h2 id="temas" className="font-display text-2xl font-semibold">
            Temas <span className="text-base font-normal text-muted">· {themesOn} de {themes.length} aparecendo</span>
          </h2>
          {themesOn < themes.length && (
            <button type="button" onClick={() => setAllThemes(true)} className="text-sm text-caramel hover:underline">
              Ligar todos
            </button>
          )}
        </div>
        <p className="-mt-2 text-sm text-muted">Toque no tema para mostrar ou esconder.</p>
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6 xl:grid-cols-7">
          {themes.map((t) => {
            const on = themeOn(draft, t.id)
            return (
              <li key={t.id}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`Mostrar tema ${t.label}`}
                  disabled={on && themesOn === 1}
                  onClick={() => toggle('themes', t.id, !on)}
                  className={`flex h-full w-full flex-col items-center gap-2.5 rounded-[1.25rem] border px-2 py-3 transition-colors disabled:cursor-not-allowed ${
                    on ? 'border-caramel/50 bg-caramel/[0.06]' : 'border-line bg-cocoa-2 hover:border-line-strong'
                  }`}
                >
                  <span className={`block w-16 transition-[opacity,filter] sm:w-20 ${on ? '' : 'opacity-35 grayscale'}`}>
                    <LabelDisc input={{ theme: t.id, name: t.sample.name, detail: t.sample.detail }} size={160} />
                  </span>
                  <span className={`flex items-start gap-1.5 text-left text-xs leading-tight sm:text-sm ${on ? 'text-cream' : 'text-faint'}`}>
                    <span
                      aria-hidden
                      className={`mt-px grid size-4 shrink-0 place-items-center rounded-full text-[10px] ${on ? 'bg-mint text-cocoa' : 'border border-line-strong'}`}
                    >
                      {on && <TbCheck />}
                    </span>
                    {t.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cocoa-2 transition-transform duration-300 ${
          dirty || saving ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
        aria-hidden={!dirty && !saving}
      >
        <div className="container-x flex flex-wrap items-center justify-between gap-3 py-4">
          <p className="text-sm text-muted">Você mudou algumas opções. Salve para valer no site.</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDraft(data.settings)}
              disabled={saving}
              tabIndex={dirty ? 0 : -1}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm text-muted hover:text-cream"
            >
              <TbArrowBackUp aria-hidden /> Desfazer
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              tabIndex={dirty ? 0 : -1}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-cocoa disabled:opacity-60"
            >
              {saving ? <TbLoader2 aria-hidden className="animate-spin" /> : <TbCheck aria-hidden />}
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-faint">
        Quer voltar tudo ao padrão?{' '}
        <button type="button" onClick={() => setDraft(emptySettings())} className="text-caramel hover:underline">
          Restaurar as opções originais
        </button>{' '}
        (depois é só salvar).
      </p>
    </div>
  )
}
