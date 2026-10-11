// Leitura e redução de imagens no navegador (foto do mural no painel e arte do tema "Sua arte").
// Fotos de celular chegam com 3 a 12 MB; aqui viram arquivos leves antes de ir para qualquer lugar.

export async function decodeImage(file: Blob): Promise<ImageBitmap> {
  try {
    // respeita a rotação gravada pela câmera (EXIF)
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return await createImageBitmap(img)
    } catch {
      throw new Error('Não deu para abrir essa imagem. Envie em JPG, PNG ou WebP.')
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

function drawScaled(source: ImageBitmap, max: number) {
  const scale = Math.min(1, max / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível processar a imagem.')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

// Reduz para no máximo `max` px no lado maior e salva em WebP (ou JPEG, se o navegador não gerar WebP)
export async function encodeImage(source: ImageBitmap, max: number, quality = 0.82) {
  const canvas = drawScaled(source, max)
  let blob = await toBlob(canvas, 'image/webp', quality)
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', Math.min(quality + 0.04, 0.9))
  if (!blob) throw new Error('Não foi possível processar a imagem.')
  return { blob, width: canvas.width, height: canvas.height }
}

// Versão reduzida para usar como textura (arte do tema "Sua arte")
export async function shrinkBitmap(source: ImageBitmap, max: number) {
  if (Math.max(source.width, source.height) <= max) return source
  const small = await createImageBitmap(drawScaled(source, max))
  source.close()
  return small
}

// Conteúdo do arquivo em base64 (sem o prefixo "data:...;base64,")
export function toBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).slice(String(reader.result).indexOf(',') + 1))
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(blob)
  })
}
