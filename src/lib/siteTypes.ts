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

// Recado deixado na seção Comunidade
export type CommunityComment = {
  id: string
  name: string
  city: string
  message: string
  rating: number // 1 a 5; 0 = sem nota
  createdAt: string
}

// Como o recado fica guardado: só os aprovados aparecem no site
export type StoredComment = CommunityComment & { status: 'pending' | 'approved' }

// Configuração dos recados: publicar direto ou esperar aprovação no painel
export type CommunityConfig = { autoPublish: boolean }

// Visitas por dia ("2026-10-11"), mais o total desde o começo
export type VisitStats = { total: number; days: Record<string, number> }

// O que o site recebe ao abrir (público)
export type SiteData = {
  settings: SiteSettings
  photos: MuralPhoto[]
  comments: CommunityComment[] // só os aprovados, mais recentes primeiro
  visits: number
  moderated: boolean // recados passam por aprovação antes de aparecer
}

// O que o painel recebe (com senha)
export type AdminData = {
  settings: SiteSettings
  photos: MuralPhoto[]
  comments: StoredComment[]
  visits: VisitStats
  community: CommunityConfig
}

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

// Média das notas (só conta quem deu nota)
export function averageRating(comments: CommunityComment[]) {
  const rated = comments.filter((c) => c.rating > 0)
  return { count: rated.length, average: rated.length ? rated.reduce((sum, c) => sum + c.rating, 0) / rated.length : 0 }
}
