// Temas de rótulo. A arte de cada um é desenhada em código (src/lib/labelArt.ts),
// então o nome e a idade digitados aparecem na hora, no 3D e nas miniaturas.
export type Theme = {
  id: string
  label: string
  sample: { name: string; detail: string }
  nameColor: string
  detailColor: string
  stroke: string
}

export const themes: Theme[] = [
  { id: 'futebol', label: 'Futebol', sample: { name: 'Davi', detail: '5 anos' }, nameColor: '#ffd43b', detailColor: '#ffffff', stroke: '#123a8f' },
  { id: 'fundo-do-mar', label: 'Fundo do mar', sample: { name: 'Alice', detail: '4 anos' }, nameColor: '#ffe066', detailColor: '#ffffff', stroke: '#0b3d91' },
  { id: 'unicornio', label: 'Unicórnio', sample: { name: 'Laura', detail: '6 anos' }, nameColor: '#e64980', detailColor: '#9c36b5', stroke: '#ffffff' },
  { id: 'espaco', label: 'Espaço', sample: { name: 'Miguel', detail: '7 anos' }, nameColor: '#ffd43b', detailColor: '#ffffff', stroke: '#4c2fa3' },
  { id: 'dinossauros', label: 'Dinossauros', sample: { name: 'Bento', detail: '3 anos' }, nameColor: '#f76707', detailColor: '#2b8a3e', stroke: '#ffffff' },
  { id: 'princesa', label: 'Princesa', sample: { name: 'Sofia', detail: '5 anos' }, nameColor: '#9c36b5', detailColor: '#d6336c', stroke: '#ffffff' },
  { id: 'safari', label: 'Safari', sample: { name: 'Theo', detail: '2 anos' }, nameColor: '#ffffff', detailColor: '#fff3bf', stroke: '#a8480a' },
  { id: 'festa', label: 'Festa', sample: { name: 'Manu', detail: '8 anos' }, nameColor: '#ffffff', detailColor: '#ffe066', stroke: '#5f3dc4' },
  { id: 'fazendinha', label: 'Fazendinha', sample: { name: 'Pedro', detail: '1 aninho' }, nameColor: '#2b8a3e', detailColor: '#e8590c', stroke: '#ffffff' },
  { id: 'cha-revelacao', label: 'Chá revelação', sample: { name: 'Ele ou ela?', detail: 'Chá revelação' }, nameColor: '#ffffff', detailColor: '#ffffff', stroke: '#845ef7' },
  { id: 'batizado', label: 'Batizado', sample: { name: 'Helena', detail: 'Batizado' }, nameColor: '#1c7ed6', detailColor: '#c98a1d', stroke: '#ffffff' },
  { id: 'pascoa', label: 'Páscoa', sample: { name: 'Feliz Páscoa', detail: 'Com carinho' }, nameColor: '#ae3ec9', detailColor: '#e8590c', stroke: '#ffffff' },
  { id: 'logo', label: 'Sua logo', sample: { name: 'Sua empresa', detail: 'Obrigado!' }, nameColor: '#2b1a10', detailColor: '#c2410c', stroke: '#ffffff' },
]

export const themeById = (id: string) => themes.find((t) => t.id === id) ?? themes[0]
