import type { Context } from '@netlify/functions'
import { newestFirst, type AdminData, type MuralPhoto } from '../../src/lib/siteTypes'
import { cleanSettings, hasChocolateOn } from '../lib/settings'
import { clean } from '../lib/text'
import {
  EMPTY_COMMENTS,
  EMPTY_INDEX,
  env,
  hex,
  ITEM_ID,
  json,
  KEYS,
  newId,
  purgeSite,
  readComments,
  readCommunity,
  readVisits,
  safeEqual,
  sha256,
  store,
  updateJSON,
  type CommentIndex,
  type PhotoIndex,
} from '../lib/store'

// Painel (/admin), protegido pela senha da variável de ambiente ADMIN_PASSWORD.
// GET: tudo o que o painel mostra. POST JSON { action }: fotos (enviar, editar, apagar), opções,
// recados (aprovar, esconder, apagar) e se os recados entram direto ou esperam aprovação.

// O Netlify aceita até 6 MB por chamada (contando o base64): a foto grande cabe com folga
const LIMITS = { title: 90, theme: 40, thumb: 600 * 1024, full: 3 * 1024 * 1024, photos: 400 }
const LOCK = { attempts: 8, ms: 15 * 60_000 }

// Data do evento: "2025", "2025-03" ou "2025-03-15" (opcional)
function cleanDate(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : ''
  return /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/.test(text) ? text : ''
}

function size(value: unknown) {
  const n = Math.round(Number(value))
  return Number.isFinite(n) && n >= 1 && n <= 10000 ? n : 0
}

// A foto chega em base64 dentro do JSON (o mesmo caminho funciona no Netlify e no `npm run dev`)
function bytes(value: unknown, max: number) {
  if (typeof value !== 'string' || !value || value.length > Math.ceil(max / 3) * 4) return null
  try {
    return Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
  } catch {
    return null
  }
}

// Confere os primeiros bytes do arquivo: só aceita imagem de verdade (WebP, JPEG ou PNG)
function sniff(b: Uint8Array) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  return null
}

async function loadAll(): Promise<AdminData> {
  const s = store()
  const [settings, index, comments, visits, community] = await Promise.all([
    s.get(KEYS.settings, { type: 'json' }),
    s.get(KEYS.photos, { type: 'json' }),
    readComments(),
    readVisits(),
    readCommunity(),
  ])
  return { settings: cleanSettings(settings), photos: (index as PhotoIndex | null)?.photos ?? [], comments, visits, community }
}

async function upload(body: Record<string, unknown>) {
  if (typeof body.full !== 'string' || typeof body.thumb !== 'string') return json({ error: 'Envie a foto.' }, 400)
  const full = bytes(body.full, LIMITS.full)
  const thumb = bytes(body.thumb, LIMITS.thumb)
  if (!full || !thumb) return json({ error: 'Foto grande demais ou com defeito.' }, 413)

  const fullType = sniff(full)
  const thumbType = sniff(thumb)
  if (!fullType || !thumbType) return json({ error: 'Formato de imagem não aceito. Use JPG, PNG ou WebP.' }, 415)

  const width = size(body.width)
  const height = size(body.height)
  if (!width || !height) return json({ error: 'Envio inválido.' }, 400)

  const s = store()
  const index = (await s.get(KEYS.photos, { type: 'json' })) as PhotoIndex | null
  if ((index?.photos.length ?? 0) >= LIMITS.photos) {
    return json({ error: `O mural chegou a ${LIMITS.photos} fotos. Apague algumas antigas para enviar novas.` }, 409)
  }

  const id = newId()
  const photo: MuralPhoto = {
    id,
    title: clean(body.title, LIMITS.title),
    theme: clean(body.theme, LIMITS.theme),
    date: cleanDate(body.date),
    width,
    height,
    createdAt: new Date().toISOString(),
  }

  await Promise.all([
    s.set(KEYS.photo(id, 'full'), full.buffer, { metadata: { type: fullType } }),
    s.set(KEYS.photo(id, 'thumb'), thumb.buffer, { metadata: { type: thumbType } }),
  ])
  await updateJSON<PhotoIndex>(KEYS.photos, EMPTY_INDEX, (current) => ({
    photos: [photo, ...current.photos.filter((p) => p.id !== id)].sort(newestFirst),
  }))
  await purgeSite()
  return json({ photo }, 201)
}

// Corrige título, tema ou data de uma foto já publicada
async function edit(body: Record<string, unknown>) {
  const id = body.id
  if (typeof id !== 'string' || !ITEM_ID.test(id)) return json({ error: 'Foto inválida.' }, 400)
  const fields = { title: clean(body.title, LIMITS.title), theme: clean(body.theme, LIMITS.theme), date: cleanDate(body.date) }
  const index = await updateJSON<PhotoIndex>(KEYS.photos, EMPTY_INDEX, (current) =>
    current.photos.some((p) => p.id === id)
      ? { photos: current.photos.map((p) => (p.id === id ? { ...p, ...fields } : p)).sort(newestFirst) }
      : current,
  )
  const photo = index.photos.find((p) => p.id === id)
  if (!photo) return json({ error: 'Foto não encontrada.' }, 404)
  await purgeSite()
  return json({ photo })
}

async function remove(id: unknown) {
  if (typeof id !== 'string' || !ITEM_ID.test(id)) return json({ error: 'Foto inválida.' }, 400)
  const s = store()
  await updateJSON<PhotoIndex>(KEYS.photos, EMPTY_INDEX, (current) => ({ photos: current.photos.filter((p) => p.id !== id) }))
  await Promise.all([s.delete(KEYS.photo(id, 'full')), s.delete(KEYS.photo(id, 'thumb'))])
  await purgeSite([`photo-${id}`])
  return json({ ok: true })
}

async function saveSettings(raw: unknown) {
  const settings = cleanSettings(raw)
  if (!hasChocolateOn(settings)) return json({ error: 'Deixe pelo menos um chocolate ligado.' }, 400)
  await store().setJSON(KEYS.settings, settings)
  await purgeSite()
  return json({ settings })
}

// Recado: aprovar (aparece no site) ou esconder (volta para "aguardando")
async function setCommentStatus(id: unknown, status: unknown) {
  if (typeof id !== 'string' || !ITEM_ID.test(id)) return json({ error: 'Recado inválido.' }, 400)
  if (status !== 'approved' && status !== 'pending') return json({ error: 'Ação inválida.' }, 400)
  const index = await updateJSON<CommentIndex>(KEYS.comments, EMPTY_COMMENTS, (current) =>
    current.comments.some((c) => c.id === id) ? { comments: current.comments.map((c) => (c.id === id ? { ...c, status } : c)) } : current,
  )
  const comment = index.comments.find((c) => c.id === id)
  if (!comment) return json({ error: 'Recado não encontrado.' }, 404)
  await purgeSite()
  return json({ comment })
}

async function deleteComment(id: unknown) {
  if (typeof id !== 'string' || !ITEM_ID.test(id)) return json({ error: 'Recado inválido.' }, 400)
  await updateJSON<CommentIndex>(KEYS.comments, EMPTY_COMMENTS, (current) => ({ comments: current.comments.filter((c) => c.id !== id) }))
  await purgeSite()
  return json({ ok: true })
}

async function saveCommunity(raw: unknown) {
  const community = { autoPublish: (raw as { autoPublish?: unknown } | null)?.autoPublish === true }
  await store().setJSON(KEYS.community, community)
  await purgeSite()
  return json({ community })
}

// Trava por alguns minutos depois de várias senhas erradas seguidas (por IP)
async function lockKey(ip: string) {
  return 'admin-lock/' + hex((await sha256(`${ip}:chocofeliz`)).slice(0, 12))
}

export default async (req: Request, context: Context) => {
  const password = env('ADMIN_PASSWORD')
  if (!password) return json({ error: 'Defina a variável ADMIN_PASSWORD no Netlify para usar o painel.' }, 503)

  const s = store()
  const key = await lockKey(context.ip ?? 'desconhecido')
  const lock = (await s.get(key, { type: 'json' })) as { fails: number; until: number; last?: number } | null
  const now = Date.now()
  if (lock && lock.until > now) return json({ error: 'Muitas tentativas erradas. Tente de novo em alguns minutos.' }, 429)

  const sent = req.headers.get('x-admin-password') ?? ''
  if (!(await safeEqual(sent, password))) {
    // erros antigos (mais de 15 minutos atrás) não contam
    const recent = lock && now - (lock.last ?? 0) < LOCK.ms ? lock.fails : 0
    const fails = recent + 1
    await s.setJSON(key, fails >= LOCK.attempts ? { fails: 0, until: now + LOCK.ms, last: now } : { fails, until: 0, last: now })
    return json({ error: 'Senha incorreta.' }, 401)
  }
  if (lock) await s.delete(key)

  if (req.method === 'GET') return json(await loadAll())
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Envio inválido.' }, 400)
  }
  if (body.action === 'upload') return upload(body)
  if (body.action === 'edit') return edit(body)
  if (body.action === 'delete') return remove(body.id)
  if (body.action === 'settings') return saveSettings(body.settings)
  if (body.action === 'comment-status') return setCommentStatus(body.id, body.status)
  if (body.action === 'comment-delete') return deleteComment(body.id)
  if (body.action === 'community') return saveCommunity(body.community)
  return json({ error: 'Ação inválida.' }, 400)
}
