import { cleanSettings } from '../lib/settings'
import { CACHE_TAG, KEYS, store, type PhotoIndex } from '../lib/store'

// Público: opções ligadas no painel e fotos do mural (uma chamada só ao abrir o site)
export default async () => {
  const s = store()
  const [settings, index] = await Promise.all([s.get(KEYS.settings, { type: 'json' }), s.get(KEYS.photos, { type: 'json' })])
  const body = { settings: cleanSettings(settings), photos: (index as PhotoIndex | null)?.photos ?? [] }
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // o navegador sempre confere; a CDN do Netlify guarda e é limpa quando o painel muda algo
      'cache-control': 'public, max-age=0, must-revalidate',
      'netlify-cdn-cache-control': 'public, durable, s-maxage=300, stale-while-revalidate=86400',
      'netlify-cache-tag': CACHE_TAG,
    },
  })
}
