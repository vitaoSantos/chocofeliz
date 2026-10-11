import futebolBrasil from '../assets/mostruario/futebol-brasil.webp'
import tresPalavrinhas from '../assets/mostruario/tres-palavrinhas.webp'

// Fotos que vêm junto com o site. Elas aparecem no mural depois das fotos enviadas pelo painel (/admin),
// que é o jeito mais fácil de incluir festas novas. Para colocar uma foto aqui pelo código:
// 1. coloque a imagem em src/assets/mostruario (de preferência .webp, até ~1200px)
// 2. importe aqui em cima e adicione um item na lista, com a largura e a altura da imagem
export type GalleryItem = {
  src: string
  width: number
  height: number
  alt: string
  theme: string
  occasion: string
  ribbon: string
}

export const gallery: GalleryItem[] = [
  {
    src: futebolBrasil,
    width: 857,
    height: 846,
    alt: 'Pirulitos de chocolate ao leite com rótulo de um menino jogador com a camisa do Brasil, embalados com fitilho verde e amarelo',
    theme: 'Futebol · Seleção',
    occasion: 'Aniversário de 5 anos',
    ribbon: 'Fitilho verde e amarelo',
  },
  {
    src: tresPalavrinhas,
    width: 873,
    height: 862,
    alt: 'Pirulitos de chocolate ao leite com rótulo do desenho 3 Palavrinhas, embalados com fitilho vermelho',
    theme: '3 Palavrinhas',
    occasion: 'Aniversário de 4 anos',
    ribbon: 'Fitilho vermelho',
  },
]
