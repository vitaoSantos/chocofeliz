import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import type { MotionValue } from 'motion/react'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { chocolates, ribbons } from '../../data/options'
import { BRAND_LABEL, type LabelInput } from '../../lib/labelArt'
import { builtState, Lollipop, type LollipopState } from './Lollipop'
import { Glow, Sprinkles, Studio } from './Studio'
import { useLabelTextures } from './useLabelTextures'

// Rótulos que aparecem na abertura: primeiro o da marca, depois os temas girando
export const heroLabels: LabelInput[] = [
  { theme: BRAND_LABEL, name: '', detail: '' },
  { theme: 'futebol', name: 'Davi', detail: '5 anos' },
  { theme: 'unicornio', name: 'Laura', detail: '6 anos' },
  { theme: 'fundo-do-mar', name: 'Alice', detail: '4 anos' },
  { theme: 'espaco', name: 'Miguel', detail: '7 anos' },
  { theme: 'dinossauros', name: 'Bento', detail: '3 anos' },
]
const SPINS = heroLabels.length - 1

// Marcos do scroll da abertura (0 a 1 ao longo da seção)
export const STORY = {
  untie: [0.1, 0.25],
  bloom: [0.27, 0.45],
  dissolve: [0.35, 0.5],
  explodeIn: [0.53, 0.63],
  explodeOut: [0.72, 0.79],
  spin: [0.8, 0.97],
} as const

const seg = (v: number, a: number, b: number) => THREE.MathUtils.clamp((v - a) / (b - a), 0, 1)
const smooth = (t: number) => t * t * (3 - 2 * t)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

type DirectorProps = {
  progress: MotionValue<number>
  active?: boolean
  play: boolean
  reduced: boolean
  mobile: boolean
  onReady?: () => void
}

function Director({ progress, play, reduced, mobile, onReady }: DirectorProps) {
  const state = useRef<LollipopState>({ ...builtState(), form: 0, stick: 0, label: 0, wrap: 0, ribbon: 0, dropY: 4.5 })
  const group = useRef<THREE.Group>(null)
  const spinner = useRef<THREE.Group>(null)
  const labelMaterial = useRef<THREE.MeshPhysicalMaterial | null>(null)
  const textures = useLabelTextures(heroLabels)
  const start = useRef<number | null>(null)
  const smoothed = useRef(progress.get())
  const mouse = useRef({ x: 0, y: 0 })
  const shownLabel = useRef(-1)
  const frames = useRef(0)
  const burst = useRef(0)
  const { viewport } = useThree()

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = state.current
    const clock = frame.clock.elapsedTime

    if (frames.current < 3 && ++frames.current === 3) onReady?.()

    // ---------- Construção (abertura automática) ----------
    if (play && start.current === null) start.current = clock
    const t = reduced ? 10 : start.current === null ? -1 : clock - start.current
    const fall = seg(t, 0, 0.6)
    const tau = Math.max(t - 0.6, 0)
    const introStick = easeOut(seg(t, 1.0, 1.6))
    const introLabel = seg(t, 1.35, 2.05)
    const introWrap = seg(t, 2.0, 2.9)
    const introRibbon = easeOut(seg(t, 2.6, 3.5))

    // ---------- Desembrulhar (scroll) ----------
    smoothed.current = THREE.MathUtils.damp(smoothed.current, progress.get(), reduced ? 30 : 5, dt)
    const p = smoothed.current
    const untie = inOut(seg(p, ...STORY.untie))
    const bloom = inOut(seg(p, ...STORY.bloom))
    const dissolve = seg(p, ...STORY.dissolve)
    const explode = inOut(seg(p, ...STORY.explodeIn)) * (1 - inOut(seg(p, ...STORY.explodeOut)))
    const spinT = seg(p, ...STORY.spin) * SPINS

    s.dropY = t < 0 ? 4.5 : (1 - fall * fall) * 4.5
    s.form = smooth(seg(t, 0.55, 1.25))
    s.stretch = t < 0.6 ? 0.45 * fall : 0.45 * Math.exp(-tau * 4.5) * Math.cos(tau * 15)
    s.stick = introStick
    s.label = introLabel
    s.wrap = introWrap
    s.ribbon = Math.min(introRibbon, 1 - untie)
    s.loose = seg(p, 0.18, 0.3)
    s.bloom = bloom
    s.dissolve = dissolve
    s.burst = seg(p, 0.32, 0.56)
    s.explode = explode
    burst.current = s.burst > 0 && s.burst < 1 ? Math.sin(s.burst * Math.PI) : 0

    // ---------- Troca de rótulo a cada giro ----------
    const labelIndex = Math.min(Math.floor(spinT + 0.5), SPINS)
    if (labelMaterial.current && textures.length && labelIndex !== shownLabel.current) {
      labelMaterial.current.map = textures[labelIndex]
      labelMaterial.current.needsUpdate = true
      shownLabel.current = labelIndex
    }

    // ---------- Posição, giro e flutuação ----------
    const g = group.current
    const sp = spinner.current
    if (!g || !sp) return
    const wide = !mobile && viewport.aspect > 1.15
    // No celular o pirulito fica menor e no alto, e o texto embaixo
    const baseX = wide ? THREE.MathUtils.lerp(1.55, 1.05, explode) : -0.32 * explode
    const baseY = wide ? 0.3 : 1.02
    const float = reduced ? 0 : Math.sin(clock * 0.8) * 0.06
    g.position.x = THREE.MathUtils.damp(g.position.x, baseX, 4, dt)
    g.position.y = THREE.MathUtils.damp(g.position.y, baseY + float, 4, dt)
    g.scale.setScalar(wide ? 0.95 : Math.min(0.6, viewport.width / 3.5))

    const sway = reduced ? 0 : Math.sin(clock * 0.5) * 0.22 * (1 - explode)
    const spin = Math.PI * 2 * (Math.floor(spinT) + inOut(spinT % 1))
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, sway + mouse.current.x * 0.3 - explode * 0.65, 3, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, mouse.current.y * 0.12 + explode * 0.12, 3, dt)
    sp.rotation.y = spinT >= SPINS ? 0 : spin
  })

  return (
    <>
    <group ref={group} position={[mobile ? 0 : 1.55, 0.3, 0]}>
      <group ref={spinner}>
        <Lollipop
          state={state}
          chocolate={chocolates[0]}
          ribbonColor={ribbons[0].color}
          labelMaterial={labelMaterial}
          labelMap={textures[0] ?? null}
          detail={mobile ? 0.6 : 1}
          annotations
          compactNotes={mobile}
        />
      </group>
    </group>
    <Sprinkles count={mobile ? 50 : 100} burst={burst} />
    </>
  )
}

export default function HeroStage({ active = true, ...props }: DirectorProps) {
  const { mobile } = props
  const dpr = useMemo<[number, number]>(() => [1, mobile ? 1.5 : 1.75], [mobile])

  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0, 8.2], fov: 32 }}
      dpr={dpr}
      gl={{ antialias: !mobile, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      aria-hidden
    >
      <color attach="background" args={['#140b07']} />
      <Glow color="#ff7a3d" opacity={0.32} scale={11} />
      <Studio />
      <Director {...props} />
      {!mobile && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.82} luminanceSmoothing={0.2} radius={0.7} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
