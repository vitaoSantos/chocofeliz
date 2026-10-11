import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { chocolates, ribbons } from '../data/options'
import { themeById, themes } from '../data/themes'

// Escolhas do "Monte o seu". Ficam aqui para o formulário de contato levar o pedido junto.
export type Order = {
  theme: string
  name: string
  detail: string
  chocolate: string
  ribbon: string
  wrapped: boolean
  quantity: number
}

type OrderState = {
  order: Order
  update: (patch: Partial<Order>) => void
  // troca o tema; o texto de exemplo acompanha, a não ser que a pessoa já tenha digitado o dela
  chooseTheme: (id: string) => void
  touched: boolean
  summary: string
}

const OrderContext = createContext<OrderState | null>(null)

export const MIN_QUANTITY = 1

export function orderSummary(order: Order) {
  const theme = themeById(order.theme)
  const choc = chocolates.find((c) => c.id === order.chocolate) ?? chocolates[0]
  const ribbon = ribbons.find((r) => r.id === order.ribbon) ?? ribbons[0]
  const who = [order.name.trim(), order.detail.trim()].filter(Boolean).join(', ')
  return [
    `Tema: ${theme.label}`,
    who && `Rótulo: ${who}`,
    `Chocolate: ${choc.label.toLowerCase()}`,
    `Fitilho: ${ribbon.label.toLowerCase()}`,
    `Quantidade: ${order.quantity}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const first = themes[0]
  const [order, setOrder] = useState<Order>({
    theme: first.id,
    name: first.sample.name,
    detail: first.sample.detail,
    chocolate: chocolates[0].id,
    ribbon: ribbons[0].id,
    wrapped: true,
    quantity: 30,
  })
  const [touched, setTouched] = useState(false)

  const value = useMemo<OrderState>(
    () => ({
      order,
      touched,
      summary: orderSummary(order),
      update: (patch) => {
        setTouched(true)
        setOrder((o) => ({ ...o, ...patch }))
      },
      chooseTheme: (id) => {
        setTouched(true)
        setOrder((o) => {
          const current = themeById(o.theme).sample
          const next = themeById(id)
          const untouched = o.name === current.name && o.detail === current.detail
          return untouched ? { ...o, theme: next.id, name: next.sample.name, detail: next.sample.detail } : { ...o, theme: next.id }
        })
      },
    }),
    [order, touched],
  )

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrder() {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrder precisa estar dentro de OrderProvider')
  return ctx
}
