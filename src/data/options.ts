// Opções do "Monte o seu". Para tirar ou incluir uma opção, é só editar a lista.

export type Chocolate = { id: string; label: string; color: string; sheen: string }

export const chocolates: Chocolate[] = [
  { id: 'ao-leite', label: 'Ao leite', color: '#5c3320', sheen: '#c98a5e' },
  { id: 'meio-amargo', label: 'Meio amargo', color: '#341a0f', sheen: '#8a5236' },
  { id: 'branco', label: 'Branco', color: '#efdcbc', sheen: '#fff6e6' },
  { id: 'rosa', label: 'Branco rosa', color: '#f2a7bf', sheen: '#ffe3ec' },
]

export type Ribbon = { id: string; label: string; color: string }

export const ribbons: Ribbon[] = [
  { id: 'vermelho', label: 'Vermelho', color: '#e0213b' },
  { id: 'rosa', label: 'Rosa', color: '#ff5c8a' },
  { id: 'dourado', label: 'Dourado', color: '#e8b23a' },
  { id: 'verde', label: 'Verde', color: '#1f9d55' },
  { id: 'azul', label: 'Azul', color: '#2f74e0' },
  { id: 'lilas', label: 'Lilás', color: '#9b6bf0' },
]

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
