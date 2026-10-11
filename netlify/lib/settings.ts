import { chocolates } from '../../src/data/options'
import { themes } from '../../src/data/themes'
import type { SiteSettings } from '../../src/lib/siteTypes'

// Só guarda liga/desliga (true/false) de opções que existem no site
export function cleanSettings(raw: unknown): SiteSettings {
  const out: SiteSettings = { chocolates: {}, themes: {} }
  if (!raw || typeof raw !== 'object') return out
  const groups = [
    ['chocolates', chocolates],
    ['themes', themes],
  ] as const
  for (const [group, list] of groups) {
    const source = (raw as Record<string, unknown>)[group]
    if (!source || typeof source !== 'object') continue
    for (const item of list) {
      const value = (source as Record<string, unknown>)[item.id]
      if (typeof value === 'boolean') out[group][item.id] = value
    }
  }
  return out
}

export function hasChocolateOn(settings: SiteSettings) {
  return chocolates.some((c) => settings.chocolates[c.id] ?? c.ativo)
}
