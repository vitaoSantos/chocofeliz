import { getStore } from '@netlify/blobs'
import { purgeCache } from '@netlify/functions'
// Traz a declaração do objeto global Netlify (Netlify.env)
import type {} from '@netlify/functions'
import type { MuralPhoto } from '../../src/lib/siteTypes'

// Armazenamento chave-valor do próprio Netlify (Netlify Blobs): sem banco de dados para manter
export const store = () => getStore({ name: 'chocofeliz', consistency: 'strong' })

export type PhotoIndex = { photos: MuralPhoto[] }
export const EMPTY_INDEX: PhotoIndex = { photos: [] }

export const KEYS = {
  photos: 'mural/index',
  settings: 'settings',
  photo: (id: string, size: 'thumb' | 'full') => `mural/${id}/${size}`,
}

// Ids gerados pelo painel: letras minúsculas e números
export const PHOTO_ID = /^[a-z0-9]{8,40}$/

// Respostas públicas (site e fotos) ficam guardadas na CDN do Netlify e são limpas quando o painel muda algo
export const CACHE_TAG = 'site'

export async function purgeSite(extraTags: string[] = []) {
  try {
    await purgeCache({ tags: [CACHE_TAG, ...extraTags] })
  } catch {
    // rodando fora do Netlify (local) não há cache para limpar
  }
}

// Lê, altera e grava um JSON com controle de concorrência (etag): se outra requisição
// gravou no meio do caminho, tenta de novo com o valor atualizado
export async function updateJSON<T>(key: string, fallback: T, update: (current: T) => T, attempts = 6): Promise<T> {
  const s = store()
  for (let i = 0; i < attempts; i++) {
    const entry = await s.getWithMetadata(key, { type: 'json' })
    const current = (entry?.data as T | undefined) ?? fallback
    const next = update(current)
    if (next === current) return current // nada mudou: não grava
    const result = !entry
      ? await s.setJSON(key, next, { onlyIfNew: true })
      : entry.etag
        ? await s.setJSON(key, next, { onlyIfMatch: entry.etag })
        : await s.setJSON(key, next)
    if (result.modified) return next
  }
  throw new Error('Conflito ao gravar, tente novamente')
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return new Uint8Array(digest)
}

export const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

// Comparação em tempo constante para não vazar a senha pelo tempo de resposta
export async function safeEqual(a: string, b: string) {
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)])
  let diff = 0
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i]
  return diff === 0
}

export function env(name: string) {
  return typeof Netlify !== 'undefined' ? Netlify.env.get(name) : undefined
}
