import type { SiteData } from '../../src/lib/siteTypes'
import { cleanSettings } from '../lib/settings'
import { CACHE_TAG, KEYS, readComments, readCommunity, readVisits, store, type PhotoIndex } from '../lib/store'

// Público: tudo o que o site precisa ao abrir, numa chamada só: opções ligadas no painel,
// fotos do mural, recados aprovados e o contador de visitas
export default async () => {
  const s = store()
  const [settings, index, comments, visits, community] = await Promise.all([
    s.get(KEYS.settings, { type: 'json' }),
    s.get(KEYS.photos, { type: 'json' }),
    readComments(),
    readVisits(),
    readCommunity(),
  ])
  const body: SiteData = {
    settings: cleanSettings(settings),
    photos: (index as PhotoIndex | null)?.photos ?? [],
    // só os aprovados, sem o status; os mais recentes primeiro
    comments: comments
      .filter((c) => c.status === 'approved')
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 120)
      .map(({ status: _status, ...c }) => c),
    visits: visits.total,
    moderated: !community.autoPublish,
  }
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // o navegador sempre confere; a CDN do Netlify guarda e é limpa quando o painel muda algo
      // (o número de visitas pode ficar alguns minutos atrasado, sem problema)
      'cache-control': 'public, max-age=0, must-revalidate',
      'netlify-cdn-cache-control': 'public, durable, s-maxage=300, stale-while-revalidate=86400',
      'netlify-cache-tag': CACHE_TAG,
    },
  })
}
