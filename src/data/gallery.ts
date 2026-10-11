import futebolBrasil from '../assets/mostruario/futebol-brasil.webp'
import tresPalavrinhas from '../assets/mostruario/tres-palavrinhas.webp'

// Fotos do mostruário. Para incluir uma nova:
// 1. coloque a imagem em src/assets/mostruario (de preferência .webp, até ~1200px)
// 2. importe aqui em cima e adicione um item na lista
export type GalleryItem = {
  src: string
  alt: string
  theme: string
  occasion: string
  ribbon: string
}

export const gallery: GalleryItem[] = [
  {
    src: futebolBrasil,
    alt: 'Pirulitos de chocolate ao leite com rótulo de um menino jogador com a camisa do Brasil, embalados com fitilho verde e amarelo',
    theme: 'Futebol · Seleção',
    occasion: 'Aniversário de 5 anos',
    ribbon: 'Fitilho verde e amarelo',
  },
  {
    src: tresPalavrinhas,
    alt: 'Pirulitos de chocolate ao leite com rótulo do desenho 3 Palavrinhas, embalados com fitilho vermelho',
    theme: '3 Palavrinhas',
    occasion: 'Aniversário de 4 anos',
    ribbon: 'Fitilho vermelho',
  },
]
