import { KEYS, PHOTO_ID, store } from '../lib/store'

const TYPES = new Set(['image/webp', 'image/jpeg', 'image/png'])

// Público: entrega a foto do mural (miniatura ou tamanho grande). Cada foto tem id único,
// então pode ficar em cache "para sempre" no navegador e na CDN.
export default async (req: Request) => {
  const url = new URL(req.url)
  const id = url.searchParams.get('id') ?? ''
  const size = url.searchParams.get('size') === 'full' ? 'full' : 'thumb'
  if (!PHOTO_ID.test(id)) return new Response('Foto inválida', { status: 400 })

  const entry = await store().getWithMetadata(KEYS.photo(id, size), { type: 'stream' })
  if (!entry) return new Response('Foto não encontrada', { status: 404, headers: { 'cache-control': 'no-store' } })

  const type = typeof entry.metadata.type === 'string' && TYPES.has(entry.metadata.type) ? entry.metadata.type : 'image/jpeg'
  return new Response(entry.data, {
    headers: {
      'content-type': type,
      'cache-control': 'public, max-age=31536000, immutable',
      'netlify-cdn-cache-control': 'public, durable, s-maxage=31536000, immutable',
      'netlify-cache-tag': `photo-${id}`,
      'x-content-type-options': 'nosniff',
    },
  })
}
