import type { AdminData, CommunityComment, CommunityConfig, MuralPhoto, SiteData, SiteSettings, StoredComment } from './siteTypes'

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

const postJSON = (body: object) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

// Conta a visita (o site chama no máximo uma vez por dia neste navegador)
export function postVisit() {
  return request<{ total: number; counted: boolean }>('visit', postJSON({}))
}

export type CommentDraft = { name: string; city: string; message: string; rating: number; website: string; elapsed: number }

// Recado da seção Comunidade. Volta "approved" (já aparece) ou "pending" (espera aprovação).
export function postComment(draft: CommentDraft) {
  return request<{ status: 'approved' | 'pending'; comment?: CommunityComment }>('comment', postJSON(draft))
}

// Painel (/admin): a senha vai em um cabeçalho e é conferida na função
const adminHeaders = (password: string) => ({ 'x-admin-password': password })

export function adminLoad(password: string) {
  return request<AdminData>('admin', { headers: adminHeaders(password) })
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

export function adminCommentStatus(password: string, id: string, status: StoredComment['status']) {
  return adminAction<{ comment: StoredComment }>(password, { action: 'comment-status', id, status })
}

export function adminCommentDelete(password: string, id: string) {
  return adminAction<{ ok: true }>(password, { action: 'comment-delete', id })
}

export function adminCommunity(password: string, community: CommunityConfig) {
  return adminAction<{ community: CommunityConfig }>(password, { action: 'community', community })
}
