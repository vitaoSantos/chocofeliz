import { chocolates } from '../data/options'
import { themes } from '../data/themes'

// Tipos compartilhados entre o site e as Netlify Functions (netlify/functions)

// Foto do mural de festas, enviada pelo painel (/admin)
export type MuralPhoto = {
  id: string
  title: string
  theme: string
  date: string // "2025", "2025-03" ou "2025-03-15" (opcional, pode vir vazio)
  width: number
  height: number
  createdAt: string
}

// O que foi ligado/desligado no painel. Opção ausente = vale o padrão do código.
export type SiteSettings = {
  chocolates: Record<string, boolean>
  themes: Record<string, boolean>
}

export type SiteData = { settings: SiteSettings; photos: MuralPhoto[] }

export const emptySettings = (): SiteSettings => ({ chocolates: {}, themes: {} })

export function availableChocolates(settings: SiteSettings) {
  const list = chocolates.filter((c) => settings.chocolates[c.id] ?? c.ativo)
  return list.length ? list : [chocolates[0]]
}

export function availableThemes(settings: SiteSettings) {
  const list = themes.filter((t) => settings.themes[t.id] ?? true)
  return list.length ? list : themes
}

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

// Mais recentes primeiro, pela data do evento (ou do envio, se não tiver data)
export const newestFirst = (a: MuralPhoto, b: MuralPhoto) =>
  compare(b.date || b.createdAt, a.date || a.createdAt) || compare(b.createdAt, a.createdAt)

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

// "2025-03" → "março de 2025", "2025-03-15" → "15 de março de 2025", "2025" → "2025"
export function eventDateLabel(date: string) {
  const [year, month, day] = date.split('-')
  const name = month ? MONTHS[Number(month) - 1] : undefined
  if (!year || !name) return year ?? ''
  return day ? `${Number(day)} de ${name} de ${year}` : `${name} de ${year}`
}
