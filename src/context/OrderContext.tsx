import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { chocolates, DEFAULT_RIBBON, ribbonsName, type Chocolate } from '../data/options'
import { CUSTOM_ART, DEFAULT_THEME, themeById, type Theme } from '../data/themes'
import { decodeImage, shrinkBitmap } from '../lib/images'
import { availableChocolates, availableThemes } from '../lib/siteTypes'
import { useSiteData } from './SiteDataContext'

// Escolhas do "Monte o seu". Ficam aqui para o formulário de contato levar o pedido junto.
export type Order = {
  theme: string
  name: string
  detail: string
  chocolate: string
  ribbons: string[] // uma ou duas cores do fitilho (hex)
  wrapped: boolean
  quantity: number
}

type OrderState = {
  order: Order
  update: (patch: Partial<Order>) => void
  // troca o tema; o texto de exemplo acompanha, a não ser que a pessoa já tenha digitado o dela
  chooseTheme: (id: string) => void
  touched: boolean
  // pedido em linhas (mensagem do WhatsApp) e numa linha só (formulário)
  lines: string[]
  summary: string
  // imagem do tema "Sua arte": fica só no navegador de quem está montando
  art: ImageBitmap | null
  setArtFile: (file: File | null) => Promise<void>
  // o que está ligado no painel
  chocolates: Chocolate[]
  themes: Theme[]
}

const OrderContext = createContext<OrderState | null>(null)

export const MIN_QUANTITY = 1

export function orderLines(order: Order) {
  const theme = themeById(order.theme)
  const choc = chocolates.find((c) => c.id === order.chocolate) ?? chocolates[0]
  const who = [order.name.trim(), order.detail.trim()].filter(Boolean).join(', ')
  // texto de exemplo que ninguém trocou ("Seu nome", "Sua empresa") não vai no pedido
  const unfilled = theme.sample.placeholder && order.name === theme.sample.name && order.detail === theme.sample.detail
  return [
    order.theme === CUSTOM_ART ? 'Tema: arte própria (vou enviar a imagem)' : `Tema: ${theme.label}`,
    unfilled ? 'Rótulo: texto a combinar' : who && `Rótulo: ${who}`,
    `Chocolate: ${choc.label.toLowerCase()}`,
    order.wrapped ? `Embalagem: celofane com fitilho ${ribbonsName(order.ribbons)}` : 'Embalagem: sem celofane',
    `Quantidade: ${order.quantity}`,
  ].filter((line): line is string => Boolean(line))
}

function withTheme(o: Order, id: string): Order {
  const current = themeById(o.theme).sample
  const next = themeById(id)
  const untouched = o.name === current.name && o.detail === current.detail
  return untouched ? { ...o, theme: next.id, name: next.sample.name, detail: next.sample.detail } : { ...o, theme: next.id }
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const { settings } = useSiteData()
  const enabledChocolates = useMemo(() => availableChocolates(settings), [settings])
  const enabledThemes = useMemo(() => availableThemes(settings), [settings])
  const first = themeById(DEFAULT_THEME)
  const [order, setOrder] = useState<Order>({
    theme: first.id,
    name: first.sample.name,
    detail: first.sample.detail,
    chocolate: chocolates[0].id,
    ribbons: [DEFAULT_RIBBON],
    wrapped: true,
    quantity: 30,
  })
  const [touched, setTouched] = useState(false)
  const [art, setArt] = useState<ImageBitmap | null>(null)

  // Se uma opção escolhida foi desligada no painel, troca pela primeira disponível
  useEffect(() => {
    setOrder((o) => {
      let next = o
      if (!enabledChocolates.some((c) => c.id === o.chocolate)) next = { ...next, chocolate: enabledChocolates[0].id }
      if (!enabledThemes.some((t) => t.id === o.theme)) next = withTheme(next, enabledThemes[0].id)
      return next
    })
  }, [enabledChocolates, enabledThemes])

  const setArtFile = useCallback(async (file: File | null) => {
    // a imagem anterior não é fechada na hora: pode haver um desenho dela ainda na fila
    const bitmap = file ? await shrinkBitmap(await decodeImage(file), 1024) : null
    setArt(bitmap)
    if (file) setTouched(true)
  }, [])

  const value = useMemo<OrderState>(() => {
    const lines = orderLines(order)
    return {
      order,
      touched,
      lines,
      summary: lines.join(' · '),
      art,
      setArtFile,
      chocolates: enabledChocolates,
      themes: enabledThemes,
      update: (patch) => {
        setTouched(true)
        setOrder((o) => ({ ...o, ...patch }))
      },
      chooseTheme: (id) => {
        setTouched(true)
        setOrder((o) => withTheme(o, id))
      },
    }
  }, [order, touched, art, setArtFile, enabledChocolates, enabledThemes])

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrder() {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrder precisa estar dentro de OrderProvider')
  return ctx
}
