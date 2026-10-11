import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { TbExternalLink, TbLock, TbLogout, TbPhoto, TbSettings } from 'react-icons/tb'
import { Logo } from '../components/ui/Logo'
import { adminLoad } from '../lib/api'
import type { SiteData } from '../lib/siteTypes'
import { MuralPanel } from './MuralPanel'
import { OptionsPanel } from './OptionsPanel'

const SESSION_KEY = 'chocofeliz-admin'

function readSaved() {
  try {
    return sessionStorage.getItem(SESSION_KEY) ?? ''
  } catch {
    return ''
  }
}

function save(password: string) {
  try {
    if (password) sessionStorage.setItem(SESSION_KEY, password)
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // sem sessionStorage: pede a senha de novo na próxima vez
  }
}

// Painel da ChocoFeliz: fotos do mural e opções do configurador. Não aparece no menu e não é indexado.
export default function AdminApp() {
  const [password, setPassword] = useState(readSaved)
  const [data, setData] = useState<SiteData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'mural' | 'opcoes'>('mural')

  useEffect(() => {
    document.title = 'Painel · ChocoFeliz'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  async function enter(pass: string) {
    setLoading(true)
    setError('')
    try {
      setData(await adminLoad(pass))
      setPassword(pass)
      save(pass)
    } catch (err) {
      setData(null)
      save('')
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }

  // senha guardada nesta aba: entra direto
  useEffect(() => {
    if (password) void enter(password)
  }, [])

  const update = useCallback((change: (d: SiteData) => SiteData) => setData((d) => (d ? change(d) : d)), [])

  function logout() {
    save('')
    setPassword('')
    setData(null)
  }

  if (!data) return <Login onSubmit={enter} error={error} loading={loading} />

  const tabs = [
    { id: 'mural' as const, label: 'Mural de fotos', icon: TbPhoto },
    { id: 'opcoes' as const, label: 'Opções do site', icon: TbSettings },
  ]

  return (
    <div className="min-h-svh bg-cocoa">
      <header className="sticky top-0 z-30 border-b border-line bg-cocoa">
        <div className="container-x flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg">
              <Logo />
            </span>
            <span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-caramel">Painel</span>
          </div>
          <nav className="order-3 flex w-full gap-1 sm:order-none sm:w-auto" aria-label="Seções do painel">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm transition-colors sm:flex-none ${
                  tab === t.id ? 'bg-cream/10 text-cream' : 'text-muted hover:text-cream'
                }`}
              >
                <t.icon aria-hidden /> {t.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            {/* no celular ficam só os ícones, para caber na mesma linha do logo */}
            <a href="/" aria-label="Ver site" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted hover:text-cream">
              <TbExternalLink aria-hidden className="text-lg sm:text-sm" /> <span className="hidden sm:inline">Ver site</span>
            </a>
            <button type="button" onClick={logout} aria-label="Sair" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted hover:text-cream">
              <TbLogout aria-hidden className="text-lg sm:text-sm" /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* as duas abas ficam montadas: trocar de aba não perde fotos na fila nem mudanças por salvar */}
      <main className="container-x py-10">
        <div hidden={tab !== 'mural'}>
          <MuralPanel password={password} data={data} update={update} />
        </div>
        <div hidden={tab !== 'opcoes'}>
          <OptionsPanel password={password} data={data} update={update} />
        </div>
      </main>
    </div>
  )
}

function Login({ onSubmit, error, loading }: { onSubmit: (password: string) => void; error: string; loading: boolean }) {
  const [value, setValue] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (value) onSubmit(value)
  }

  return (
    <div className="grid min-h-svh place-items-center bg-cocoa px-5">
      <form onSubmit={submit} className="border-gradient grid w-full max-w-sm gap-5 rounded-[2rem] bg-cocoa-2/80 p-8">
        <span className="text-2xl">
          <Logo />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Painel</h1>
          <p className="mt-1 text-sm text-muted">Fotos do mural e opções do configurador.</p>
        </div>
        <label className="grid gap-2 text-sm text-muted">
          Senha
          <input
            type="password"
            autoComplete="current-password"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-2xl border border-line bg-cream/[0.04] px-5 py-3.5 text-cream outline-none focus:border-caramel/70"
          />
        </label>
        {error && (
          <p role="alert" className="rounded-2xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !value}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-3.5 font-semibold text-cocoa disabled:opacity-60"
        >
          <TbLock aria-hidden /> {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
