// Opções do "Monte o seu". Para tirar ou incluir uma opção, é só editar a lista.

// `ativo` é o padrão de cada chocolate. Dá para ligar e desligar na hora pelo painel (/admin),
// sem mexer no código; o que for salvo lá vale mais do que o padrão daqui.
export type Chocolate = { id: string; label: string; color: string; sheen: string; ativo: boolean }

export const chocolates: Chocolate[] = [
  { id: 'ao-leite', label: 'Ao leite', color: '#5c3320', sheen: '#c98a5e', ativo: true },
  { id: 'meio-amargo', label: 'Meio amargo', color: '#341a0f', sheen: '#8a5236', ativo: true },
  { id: 'branco', label: 'Branco', color: '#efdcbc', sheen: '#fff6e6', ativo: true },
  { id: 'rosa', label: 'Branco rosa', color: '#f2a7bf', sheen: '#ffe3ec', ativo: false },
]

// Cores prontas do fitilho. Além delas, a pessoa pode escolher qualquer cor no seletor.
export type RibbonColor = { label: string; color: string }

export const ribbonColors: RibbonColor[] = [
  { label: 'Vermelho', color: '#d7263d' },
  { label: 'Rosa', color: '#ff6f9f' },
  { label: 'Rosa bebê', color: '#f7b8cd' },
  { label: 'Pink', color: '#e0368a' },
  { label: 'Lilás', color: '#b48be6' },
  { label: 'Roxo', color: '#7a3cc8' },
  { label: 'Azul bebê', color: '#8cc8f2' },
  { label: 'Azul', color: '#2f74e0' },
  { label: 'Azul royal', color: '#1f3fa6' },
  { label: 'Verde água', color: '#3fbfae' },
  { label: 'Verde', color: '#1f9d55' },
  { label: 'Amarelo', color: '#f5c518' },
  { label: 'Laranja', color: '#f2852e' },
  { label: 'Dourado', color: '#d4a537' },
  { label: 'Prata', color: '#c3c7cf' },
  { label: 'Branco', color: '#f6f4ef' },
  { label: 'Preto', color: '#1d1d1f' },
]

export const DEFAULT_RIBBON = ribbonColors[0].color

function rgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Nome da cor para o pedido: o nome da cor pronta, ou "cor personalizada #… (tom de …)" para as outras
export function ribbonColorName(hex: string) {
  const value = hex.toLowerCase()
  const exact = ribbonColors.find((c) => c.color.toLowerCase() === value)
  if (exact) return exact.label.toLowerCase()
  const [r, g, b] = rgb(value)
  let nearest = ribbonColors[0]
  let best = Infinity
  for (const c of ribbonColors) {
    const [cr, cg, cb] = rgb(c.color)
    // distância com pesos aproximados da percepção de cor
    const d = 2 * (r - cr) ** 2 + 4 * (g - cg) ** 2 + 3 * (b - cb) ** 2
    if (d < best) {
      best = d
      nearest = c
    }
  }
  return `cor personalizada ${value} (tom de ${nearest.label.toLowerCase()})`
}

export function ribbonsName(colors: string[]) {
  return colors.map(ribbonColorName).join(' e ')
}

export const occasions = [
  'Aniversários',
  'Batizados',
  'Chá revelação',
  'Chá de bebê',
  'Páscoa',
  'Dia das Crianças',
  'Formaturas',
  'Casamentos',
  'Eventos corporativos',
  'Natal',
]
