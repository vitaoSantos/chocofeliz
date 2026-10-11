// Temas de rótulo. A arte de cada um é desenhada em código (src/lib/labelArt.ts),
// então o nome e a idade digitados aparecem na hora, no 3D e nas miniaturas.
// Todos começam ligados; dá para esconder um tema pelo painel (/admin), sem mexer no código.
export type Theme = {
  id: string
  label: string
  // texto de exemplo do rótulo; `placeholder` = é só um lugar para a pessoa preencher (não vai no pedido)
  sample: { name: string; detail: string; placeholder?: boolean }
  nameColor: string
  detailColor: string
  stroke: string
}

// Tema em que o cliente envia a imagem do personagem (ou foto) e vê no pirulito
export const CUSTOM_ART = 'sua-arte'

export const themes: Theme[] = [
  { id: 'futebol', label: 'Futebol', sample: { name: 'Davi', detail: '5 anos' }, nameColor: '#ffd43b', detailColor: '#ffffff', stroke: '#123a8f' },
  { id: 'fundo-do-mar', label: 'Fundo do mar', sample: { name: 'Alice', detail: '4 anos' }, nameColor: '#ffe066', detailColor: '#ffffff', stroke: '#0b3d91' },
  { id: 'unicornio', label: 'Unicórnio', sample: { name: 'Laura', detail: '6 anos' }, nameColor: '#e64980', detailColor: '#9c36b5', stroke: '#ffffff' },
  { id: 'espaco', label: 'Espaço', sample: { name: 'Miguel', detail: '7 anos' }, nameColor: '#ffd43b', detailColor: '#ffffff', stroke: '#4c2fa3' },
  { id: 'dinossauros', label: 'Dinossauros', sample: { name: 'Bento', detail: '3 anos' }, nameColor: '#f76707', detailColor: '#2b8a3e', stroke: '#ffffff' },
  { id: 'princesa', label: 'Princesa', sample: { name: 'Sofia', detail: '5 anos' }, nameColor: '#9c36b5', detailColor: '#d6336c', stroke: '#ffffff' },
  { id: 'realeza', label: 'Realeza', sample: { name: 'Arthur', detail: '1 aninho' }, nameColor: '#f7d774', detailColor: '#ffffff', stroke: '#0b1f5c' },
  { id: 'super-heroi', label: 'Super-herói', sample: { name: 'Lucas', detail: '6 anos' }, nameColor: '#ffd43b', detailColor: '#ffffff', stroke: '#1c3faa' },
  { id: 'games', label: 'Games', sample: { name: 'Enzo', detail: '7 anos' }, nameColor: '#ffd43b', detailColor: '#ffffff', stroke: '#2b1a6b' },
  { id: 'magia', label: 'Magia', sample: { name: 'Isadora', detail: '10 anos' }, nameColor: '#fcc419', detailColor: '#e5dbff', stroke: '#2b0f4c' },
  { id: 'reino-do-gelo', label: 'Reino do gelo', sample: { name: 'Maria', detail: '4 anos' }, nameColor: '#ffffff', detailColor: '#e7f5ff', stroke: '#1864ab' },
  { id: 'bailarina', label: 'Bailarina', sample: { name: 'Lívia', detail: '3 anos' }, nameColor: '#c2255c', detailColor: '#e64980', stroke: '#ffffff' },
  { id: 'ursinho', label: 'Ursinho', sample: { name: 'Clara', detail: '2 anos' }, nameColor: '#e8590c', detailColor: '#2b8a3e', stroke: '#ffffff' },
  { id: 'tropical', label: 'Tropical', sample: { name: 'Luna', detail: '1 ano' }, nameColor: '#ffffff', detailColor: '#fff3bf', stroke: '#d6336c' },
  { id: 'monstrinhos', label: 'Monstrinhos', sample: { name: 'Benício', detail: '1 aninho' }, nameColor: '#5f3dc4', detailColor: '#ae3ec9', stroke: '#ffffff' },
  { id: 'safari', label: 'Safari', sample: { name: 'Theo', detail: '2 anos' }, nameColor: '#ffffff', detailColor: '#fff3bf', stroke: '#a8480a' },
  { id: 'fazendinha', label: 'Fazendinha', sample: { name: 'Pedro', detail: '1 aninho' }, nameColor: '#2b8a3e', detailColor: '#e8590c', stroke: '#ffffff' },
  { id: 'carros', label: 'Carros', sample: { name: 'Gael', detail: '4 anos' }, nameColor: '#e03131', detailColor: '#212529', stroke: '#ffffff' },
  { id: 'musical', label: 'Musical', sample: { name: 'Antônia', detail: '1 aninho' }, nameColor: '#f08c00', detailColor: '#1c7ed6', stroke: '#ffffff' },
  { id: 'festa', label: 'Festa', sample: { name: 'Manu', detail: '8 anos' }, nameColor: '#ffffff', detailColor: '#ffe066', stroke: '#5f3dc4' },
  { id: 'cha-revelacao', label: 'Chá revelação', sample: { name: 'Ele ou ela?', detail: 'Chá revelação' }, nameColor: '#ffffff', detailColor: '#ffffff', stroke: '#845ef7' },
  { id: 'batizado', label: 'Batizado', sample: { name: 'Helena', detail: 'Batizado' }, nameColor: '#1c7ed6', detailColor: '#c98a1d', stroke: '#ffffff' },
  { id: 'natal', label: 'Natal', sample: { name: 'Feliz Natal', detail: 'Boas festas!' }, nameColor: '#ffffff', detailColor: '#ffd43b', stroke: '#8a0f0f' },
  { id: 'pascoa', label: 'Páscoa', sample: { name: 'Feliz Páscoa', detail: 'Com carinho' }, nameColor: '#ae3ec9', detailColor: '#e8590c', stroke: '#ffffff' },
  { id: CUSTOM_ART, label: 'Sua arte', sample: { name: 'Seu nome', detail: 'Sua idade', placeholder: true }, nameColor: '#ffffff', detailColor: '#ffffff', stroke: '#2b1a10' },
  { id: 'logo', label: 'Sua logo', sample: { name: 'Sua empresa', detail: 'Obrigado!', placeholder: true }, nameColor: '#2b1a10', detailColor: '#c2410c', stroke: '#ffffff' },
]

export const DEFAULT_THEME = 'futebol'

export const themeById = (id: string) => themes.find((t) => t.id === id) ?? themes[0]
