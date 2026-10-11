import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useReducedMotion } from '../hooks/useMediaQuery'

type IntroState = {
  // true quando a tela de carregamento terminou e a abertura pode animar
  introDone: boolean
  finishIntro: () => void
  showLoader: boolean
  // true quando a cena 3D da abertura já desenhou os primeiros quadros
  sceneReady: boolean
  markSceneReady: () => void
}

const IntroContext = createContext<IntroState | null>(null)

export function IntroProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  const [done, setDone] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const finishIntro = useCallback(() => setDone(true), [])
  const markSceneReady = useCallback(() => setSceneReady(true), [])

  return (
    <IntroContext.Provider value={{ introDone: done || reduced, finishIntro, showLoader: !reduced, sceneReady, markSceneReady }}>
      {children}
    </IntroContext.Provider>
  )
}

export function useIntro() {
  const ctx = useContext(IntroContext)
  if (!ctx) throw new Error('useIntro precisa estar dentro de IntroProvider')
  return ctx
}
