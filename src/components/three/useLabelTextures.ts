import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { idle } from '../../lib/idle'
import { drawLabel, labelFontsReady, type LabelInput } from '../../lib/labelArt'

// A textura existe desde o início (canvas em branco) para o shader já ser compilado com ela;
// o desenho entra depois, sem recompilar nada
function blankTexture(size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

// Uma textura por rótulo. Desenha um por vez, nos momentos ociosos, para não travar a abertura.
export function useLabelTextures(inputs: LabelInput[], size: number) {
  const key = JSON.stringify(inputs)
  const textures = useMemo(() => (JSON.parse(key) as LabelInput[]).map(() => blankTexture(size)), [key, size])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const list: LabelInput[] = JSON.parse(key)
    labelFontsReady().then(async () => {
      for (let i = 0; i < list.length; i++) {
        if (i > 0) await idle(200)
        if (cancelled) return
        drawLabel(textures[i].image as HTMLCanvasElement, list[i])
        textures[i].needsUpdate = true
      }
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [key, textures])

  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures])

  return { textures, ready }
}

// Uma textura só, redesenhada quando o rótulo muda (configurador).
// Digitando, espera a pessoa dar uma pausa antes de redesenhar; trocando o tema ou a imagem, redesenha na hora.
export function useLiveLabelTexture({ theme, name, detail }: LabelInput, size: number, image: ImageBitmap | null = null, typingDelay = 160) {
  const texture = useMemo(() => blankTexture(size), [size])
  const [ready, setReady] = useState(false)
  const lastTheme = useRef<string | null>(null)
  const lastImage = useRef<ImageBitmap | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer = 0
    const draw = () => {
      if (cancelled) return
      drawLabel(texture.image as HTMLCanvasElement, { theme, name, detail }, image)
      texture.needsUpdate = true
      lastTheme.current = theme
      lastImage.current = image
      setReady(true)
    }
    labelFontsReady().then(() => {
      if (cancelled) return
      if (lastTheme.current === null || lastTheme.current !== theme || lastImage.current !== image) draw()
      else timer = window.setTimeout(draw, typingDelay)
    })
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [texture, theme, name, detail, image, typingDelay])

  useEffect(() => () => texture.dispose(), [texture])

  return { texture, ready }
}
