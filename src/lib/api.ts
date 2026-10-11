import type { MuralPhoto, SiteData, SiteSettings } from './siteTypes'

// Chamadas às Netlify Functions (mural de fotos e opções do site), no mesmo padrão do portfólio
const FN = '/.netlify/functions'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${FN}/${path}`, init)
  const data = await res.json().catch(() => null)
  if (!res.ok || data === null) throw new Error(data?.error ?? 'Não foi possível completar a ação agora.')
  return data as T
}

export function fetchSiteData() {
  return request<SiteData>('site')
}

export function photoUrl(id: string, size: 'thumb' | 'full') {
  return `${FN}/mural-image?id=${encodeURIComponent(id)}&size=${size}`
}

// Painel (/admin): a senha vai em um cabeçalho e é conferida na função
const adminHeaders = (password: string) => ({ 'x-admin-password': password })

export function adminLoad(password: string) {
  return request<SiteData>('admin', { headers: adminHeaders(password) })
}

function adminAction<T>(password: string, body: object) {
  return request<T>('admin', {
    method: 'POST',
    headers: { ...adminHeaders(password), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export type PhotoFields = Pick<MuralPhoto, 'title' | 'theme' | 'date'>

// Foto já reduzida no navegador, em base64: a grande e a miniatura
export type PhotoUpload = PhotoFields & { full: string; thumb: string; width: number; height: number }

export function adminUpload(password: string, photo: PhotoUpload) {
  return adminAction<{ photo: MuralPhoto }>(password, { action: 'upload', ...photo })
}

export function adminEdit(password: string, id: string, fields: PhotoFields) {
  return adminAction<{ photo: MuralPhoto }>(password, { action: 'edit', id, ...fields })
}

export function adminDelete(password: string, id: string) {
  return adminAction<{ ok: true }>(password, { action: 'delete', id })
}

export function adminSaveSettings(password: string, settings: SiteSettings) {
  return adminAction<{ settings: SiteSettings }>(password, { action: 'settings', settings })
}
