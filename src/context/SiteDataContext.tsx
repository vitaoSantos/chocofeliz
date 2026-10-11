import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchSiteData } from '../lib/api'
import { emptySettings, type SiteData } from '../lib/siteTypes'

type SiteDataState = SiteData & { loaded: boolean }

const SiteDataContext = createContext<SiteDataState | null>(null)

// Opções ligadas no painel e fotos do mural. Se a função não responder (rodando sem o Netlify,
// por exemplo), o site segue com os padrões do código e as fotos que vêm no projeto.
export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SiteDataState>({ settings: emptySettings(), photos: [], loaded: false })

  useEffect(() => {
    let cancelled = false
    fetchSiteData()
      .then((data) => {
        if (cancelled) return
        setState({
          settings: { ...emptySettings(), ...data.settings },
          photos: Array.isArray(data.photos) ? data.photos : [],
          loaded: true,
        })
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, loaded: true }))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return <SiteDataContext.Provider value={state}>{children}</SiteDataContext.Provider>
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext)
  if (!ctx) throw new Error('useSiteData precisa estar dentro de SiteDataProvider')
  return ctx
}
