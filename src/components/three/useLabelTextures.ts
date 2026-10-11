import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { drawLabel, labelFontsReady, type LabelInput } from '../../lib/labelArt'

function toTexture(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

// Uma textura por rótulo, desenhada depois que as fontes carregam
export function useLabelTextures(inputs: LabelInput[], size = 1024) {
  const key = JSON.stringify(inputs)
  const [textures, setTextures] = useState<THREE.CanvasTexture[]>([])

  useEffect(() => {
    let cancelled = false
    const list: LabelInput[] = JSON.parse(key)
    labelFontsReady().then(() => {
      if (cancelled) return
      setTextures(
        list.map((input) => {
          const canvas = document.createElement('canvas')
          canvas.width = canvas.height = size
          drawLabel(canvas, input)
          return toTexture(canvas)
        }),
      )
    })
    return () => {
      cancelled = true
    }
  }, [key, size])

  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures])

  return textures
}

// Uma textura só, redesenhada no mesmo canvas sempre que o rótulo muda (configurador)
export function useLiveLabelTexture(input: LabelInput, size = 1024) {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = size
    return { canvas: c, texture: toTexture(c) }
  }, [size])
  const [ready, setReady] = useState(false)

  const { theme, name, detail } = input
  useEffect(() => {
    let cancelled = false
    labelFontsReady().then(() => {
      if (cancelled) return
      drawLabel(canvas, { theme, name, detail })
      texture.needsUpdate = true
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [canvas, texture, theme, name, detail])

  useEffect(() => () => texture.dispose(), [texture])

  return ready ? texture : null
}
