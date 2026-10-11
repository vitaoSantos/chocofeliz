import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import {
  BandCurve,
  createDiskGeometry,
  createSkirtGeometry,
  createWrapGeometry,
  CurlCurve,
  DISK,
  LoopCurve,
  NECK_Y,
  ribbonStrip,
  sampleWrapPoints,
  STICK,
} from './geometry'
import { createSparkMaterial, createWrapMaterial, getChocolateNoise } from './materials'

// Estado do pirulito, de 0 a 1 em cada etapa. Quem controla (abertura, scroll, configurador)
// escreve aqui a cada quadro; o componente só aplica.
export type LollipopState = {
  form: number // 0 gota derretida → 1 disco
  stretch: number // estica (+) / achata (-) o chocolate
  dropY: number // deslocamento vertical do chocolate
  stick: number // palito entrando
  label: number // rótulo aplicado
  wrap: number // celofane aparecendo
  loose: number // franzido afrouxando
  bloom: number // pétalas do celofane abrindo
  dissolve: number // celofane sumindo
  ribbon: number // 1 = laço amarrado, 0 = laço longe
  burst: number // faíscas
  explode: number // vista explodida
}

export const builtState = (): LollipopState => ({
  form: 1,
  stretch: 0,
  dropY: 0,
  stick: 1,
  label: 1,
  wrap: 1,
  loose: 0,
  bloom: 0,
  dissolve: 0,
  ribbon: 1,
  burst: 0,
  explode: 0,
})

type Props = {
  state: RefObject<LollipopState>
  chocolate: { color: string; sheen: string }
  ribbonColor: string
  labelMaterial: RefObject<THREE.MeshPhysicalMaterial | null>
  labelMap: THREE.Texture | null
  detail?: number
  annotations?: boolean
  compactNotes?: boolean
}

const ease = {
  backOut: (t: number) => {
    const c = 1.9
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
  },
}

type RibbonPiece = {
  geometry: THREE.BufferGeometry
  fly: THREE.Vector3
  spin: THREE.Vector3
  pivot: THREE.Vector3
}

function buildRibbon(): RibbonPiece[] {
  const knot = new THREE.Vector3(0, NECK_Y + 0.01, 0.07)
  const pieces: RibbonPiece[] = []
  pieces.push({
    geometry: ribbonStrip(new BandCurve(NECK_Y + 0.035, 0.1), 0.05, new THREE.Vector3(0, 1, 0), 90),
    fly: new THREE.Vector3(0, -0.9, 0.2),
    spin: new THREE.Vector3(0, 2.5, 0),
    pivot: new THREE.Vector3(0, NECK_Y, 0),
  })
  for (const side of [-1, 1]) {
    const loop = new LoopCurve(knot, side, 0.26)
    pieces.push({
      geometry: ribbonStrip(loop, 0.048, loop.axis, 80),
      fly: new THREE.Vector3(side * 1.6, 0.5, 0.8),
      spin: new THREE.Vector3(0.6, side * 2, side * 3),
      pivot: knot.clone().add(new THREE.Vector3(side * 0.15, 0, 0)),
    })
  }
  const curls = [
    { dir: [-0.6, -1, 0.25], len: 0.9, turns: 6.5, phase: 0.3 },
    { dir: [-0.18, -1, 0.4], len: 1.15, turns: 8.5, phase: 1.7 },
    { dir: [0.22, -1, 0.35], len: 1.05, turns: 8, phase: 2.6 },
    { dir: [0.62, -1, 0.2], len: 0.85, turns: 6, phase: 4.1 },
  ]
  curls.forEach(({ dir, len, turns, phase }, i) => {
    const d = new THREE.Vector3(...(dir as [number, number, number])).normalize()
    const start = knot.clone().add(new THREE.Vector3((i - 1.5) * 0.02, -0.02, 0.02))
    pieces.push({
      geometry: ribbonStrip(new CurlCurve(start, d, len, 0.075, turns, phase), 0.042, d, 320),
      fly: new THREE.Vector3(d.x * 2.2, -0.6, 0.6 + i * 0.15),
      spin: new THREE.Vector3(1.2, i % 2 ? 2 : -2, i % 2 ? -1.5 : 1.5),
      pivot: start.clone().addScaledVector(d, len * 0.5),
    })
  })
  return pieces
}

const tmpVec = new THREE.Vector3()

// Notas da vista explodida, presas a cada peça (deslocamento a partir do centro da peça)
const NOTES = [
  { part: 'label', offset: [0.42, 0.62, 0.02], text: 'Rótulo comestível com a arte da sua festa' },
  { part: 'chocolate', offset: [0.92, -0.45, 0], text: 'Chocolate de verdade, moldado à mão' },
  { part: 'stick', offset: [0.05, 0.55, 0], text: 'Palito firme, preso no chocolate' },
] as const

export function Lollipop({ state, chocolate, ribbonColor, labelMaterial, labelMap, detail = 1, annotations = false, compactNotes = false }: Props) {
  const dpr = useThree((s) => s.viewport.dpr)
  const chocolateMesh = useRef<THREE.Mesh>(null)
  const label = useRef<THREE.Mesh>(null)
  const stick = useRef<THREE.Mesh>(null)
  const wrap = useRef<THREE.Group>(null)
  const skirt = useRef<THREE.Mesh>(null)
  const ribbonGroup = useRef<THREE.Group>(null)
  const notes = useRef<(HTMLDivElement | null)[]>([])
  const noteGroups = useRef<(THREE.Group | null)[]>([])
  // As notas em HTML só montam depois do primeiro quadro: antes disso o R3F ainda troca o
  // elemento que recebe o HTML, e o drei perde o conteúdo da primeira nota montada
  const [notesReady, setNotesReady] = useState(false)

  const diskGeo = useMemo(() => createDiskGeometry(Math.round(96 * detail)), [detail])
  const wrapGeo = useMemo(() => createWrapGeometry(detail), [detail])
  const skirtGeo = useMemo(() => createSkirtGeometry(detail), [detail])
  const wrapMat = useMemo(() => createWrapMaterial(), [])
  const skirtMat = useMemo(() => createWrapMaterial(), [])
  const ribbon = useMemo(() => buildRibbon(), [])
  const sparks = useMemo(() => {
    const count = Math.round(220 * detail)
    const positions = sampleWrapPoints(count)
    const vel = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const palette = ['#ffd27a', '#ffffff', '#ff8fb0', '#ffe7b0'].map((c) => new THREE.Color(c))
    for (let i = 0; i < count; i++) {
      tmpVec.fromArray(positions, i * 3)
      tmpVec.z *= 2.2
      tmpVec.normalize().multiplyScalar(0.6 + ((i * 37) % 10) / 10)
      tmpVec.y += 0.3
      vel.set([tmpVec.x, tmpVec.y, tmpVec.z], i * 3)
      const c = palette[i % palette.length]
      colors.set([c.r, c.g, c.b], i * 3)
      seeds[i] = ((i * 53) % 100) / 100
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aVel', new THREE.BufferAttribute(vel, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    return geo
  }, [detail])
  const sparkMat = useMemo(() => createSparkMaterial(13 * dpr), [dpr])

  const chocolateMat = useMemo(() => {
    const noise = getChocolateNoise()
    return new THREE.MeshPhysicalMaterial({
      color: chocolate.color,
      roughness: 0.34,
      roughnessMap: noise,
      bumpMap: noise,
      bumpScale: 0.6,
      clearcoat: 0.7,
      clearcoatRoughness: 0.22,
      sheen: 0.5,
      sheenColor: new THREE.Color(chocolate.sheen),
      sheenRoughness: 0.45,
    })
    // a cor é atualizada no efeito abaixo, sem recriar o material
  }, [])

  const ribbonMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: ribbonColor,
        roughness: 0.28,
        metalness: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        side: THREE.DoubleSide,
        transparent: true,
      }),
    [],
  )

  useEffect(() => {
    chocolateMat.color.set(chocolate.color)
    chocolateMat.sheenColor.set(chocolate.sheen)
  }, [chocolate.color, chocolate.sheen, chocolateMat])

  useEffect(() => {
    ribbonMat.color.set(ribbonColor)
  }, [ribbonColor, ribbonMat])

  useEffect(
    () => () => {
      diskGeo.dispose()
      wrapGeo.dispose()
      skirtGeo.dispose()
      sparks.dispose()
    },
    [diskGeo, wrapGeo, skirtGeo, sparks],
  )

  useEffect(
    () => () => {
      wrapMat.dispose()
      skirtMat.dispose()
      sparkMat.dispose()
      chocolateMat.dispose()
      ribbonMat.dispose()
      ribbon.forEach((p) => p.geometry.dispose())
    },
    [wrapMat, skirtMat, sparkMat, chocolateMat, ribbonMat, ribbon],
  )

  useFrame((frame) => {
    const s = state.current
    if (!s) return
    if (annotations && !notesReady) setNotesReady(true)

    // Chocolate: gota → disco, com estica-e-achata de gelatina
    const choc = chocolateMesh.current
    if (choc?.morphTargetInfluences) {
      choc.morphTargetInfluences[0] = 1 - s.form
      choc.position.y = s.dropY
      const st = s.stretch
      choc.scale.set(1 - st * 0.22, 1 + st * 0.32, 1 - st * 0.22)
      choc.position.z = -s.explode * 0.15
    }

    // Palito sobe por baixo
    if (stick.current) {
      stick.current.visible = s.stick > 0.001
      stick.current.position.y = (STICK.top + STICK.bottom) / 2 - (1 - s.stick) * 3.2 - s.explode * 0.75
    }

    // Rótulo gira como moeda e assenta na cama do chocolate
    if (label.current) {
      const l = THREE.MathUtils.clamp(s.label, 0, 1)
      label.current.visible = l > 0.001
      const k = ease.backOut(l)
      label.current.scale.setScalar(Math.max(k, 0.0001))
      label.current.rotation.z = (1 - l) * -2.6
      label.current.position.set(0, 0, DISK.front + 0.004 + (1 - l) * 0.9 + s.explode * 0.95)
    }

    // Celofane
    const wrapVisible = s.wrap > 0.001 && s.dissolve < 0.999
    if (wrap.current) wrap.current.visible = wrapVisible
    for (const m of [wrapMat, skirtMat]) {
      m.uniforms.uReveal.value = s.wrap
      m.uniforms.uDissolve.value = s.dissolve
      m.uniforms.uLoose.value = s.loose
    }
    wrapMat.uniforms.uBloom.value = s.bloom
    if (skirt.current) {
      skirt.current.position.y = -s.bloom * 0.9
      skirt.current.rotation.y = s.bloom * 0.8
    }

    // Fitilho voando (ou chegando para amarrar)
    const off = 1 - THREE.MathUtils.clamp(s.ribbon, 0, 1)
    if (ribbonGroup.current) {
      ribbonGroup.current.visible = off < 0.999
      ribbonGroup.current.children.forEach((child, i) => {
        const piece = ribbon[i]
        child.position.copy(piece.pivot).addScaledVector(piece.fly, off).add(tmpVec.set(0, -off * off * 1.4, 0))
        child.rotation.set(piece.spin.x * off, piece.spin.y * off, piece.spin.z * off)
        child.scale.setScalar(1 + (i === 0 ? off * 0.8 : 0))
      })
      ribbonMat.opacity = 1 - THREE.MathUtils.smoothstep(off, 0.55, 1)
    }

    // Faíscas
    sparkMat.uniforms.uBurst.value = s.burst
    sparkMat.uniforms.uTime.value = frame.clock.elapsedTime

    // Anotações da vista explodida: cada uma segue a sua peça
    if (annotations) {
      const a = THREE.MathUtils.smoothstep(s.explode, 0.55, 1)
      NOTES.forEach((note, i) => {
        const g = noteGroups.current[i]
        const target = note.part === 'label' ? label.current : note.part === 'stick' ? stick.current : chocolateMesh.current
        if (g && target) g.position.copy(target.position).add(tmpVec.fromArray(note.offset))
      })
      notes.current.forEach((el, i) => {
        if (!el) return
        const local = THREE.MathUtils.clamp(a * 1.6 - i * 0.25, 0, 1)
        el.style.opacity = String(local)
        el.style.transform = `translateY(${(1 - local) * 10}px)`
      })
    }
  })

  return (
    <group>
      <mesh ref={chocolateMesh} geometry={diskGeo} material={chocolateMat} morphTargetInfluences={[0]} />

      <mesh ref={label}>
        <circleGeometry args={[DISK.labelRadius, Math.round(96 * detail)]} />
        <meshPhysicalMaterial
          ref={labelMaterial}
          map={labelMap}
          roughness={0.42}
          clearcoat={0.5}
          clearcoatRoughness={0.3}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>

      <mesh ref={stick}>
        <cylinderGeometry args={[STICK.radius, STICK.radius, STICK.top - STICK.bottom, 20]} />
        <meshStandardMaterial color="#efe0c2" roughness={0.75} />
      </mesh>

      {annotations &&
        notesReady &&
        NOTES.map((note, i) => (
          <group key={note.text} ref={(g) => void (noteGroups.current[i] = g)}>
            <Html zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
              <Note refCallback={(el) => void (notes.current[i] = el)} text={note.text} compact={compactNotes} />
            </Html>
          </group>
        ))}

      <group ref={wrap}>
        <mesh geometry={wrapGeo} material={wrapMat} renderOrder={2} />
        <mesh ref={skirt} geometry={skirtGeo} material={skirtMat} renderOrder={2} />
      </group>

      <group ref={ribbonGroup}>
        {ribbon.map((piece, i) => (
          <group key={i} position={piece.pivot.toArray()}>
            <group>
              <mesh
                geometry={piece.geometry}
                material={ribbonMat}
                position={piece.pivot.clone().negate().toArray()}
                renderOrder={1}
              />
            </group>
          </group>
        ))}
      </group>

      <points geometry={sparks} material={sparkMat} renderOrder={3} frustumCulled={false} />
    </group>
  )
}

function Note({ text, compact, refCallback }: { text: string; compact: boolean; refCallback: (el: HTMLDivElement | null) => void }) {
  return (
    <div ref={refCallback} className="flex w-max items-center gap-2 opacity-0" style={{ transition: 'none' }}>
      <span className="block size-2.5 shrink-0 rounded-full bg-caramel shadow-[0_0_12px_2px_rgb(234_162_76/0.8)]" />
      <span className={`block h-px bg-caramel/70 ${compact ? 'w-4' : 'w-10'}`} />
      <span className={`font-hand leading-tight text-cream ${compact ? 'max-w-[6.5rem] text-base' : 'max-w-[13rem] text-xl sm:text-2xl'}`}>{text}</span>
    </div>
  )
}
