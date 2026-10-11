import { PresentationControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { chocolates, ribbons } from '../../data/options'
import type { LabelInput } from '../../lib/labelArt'
import { builtState, Lollipop, type LollipopState } from './Lollipop'
import { Glow, Sprinkles, Studio } from './Studio'
import { useLiveLabelTexture } from './useLabelTextures'
import { Warmup } from './Warmup'

type Props = {
  label: LabelInput
  chocolate: string
  ribbon: string
  wrapped: boolean
  active: boolean
  mobile: boolean
  reduced: boolean
  onReady?: () => void
}

function Scene({ label, chocolate, ribbon, wrapped, mobile, reduced, onReady }: Omit<Props, 'active'>) {
  const state = useRef<LollipopState>(builtState())
  const labelMaterial = useRef<THREE.MeshStandardMaterial | null>(null)
  const { texture, ready } = useLiveLabelTexture(label, mobile ? 512 : 768)
  const warmTextures = useMemo(() => [texture], [texture])
  const spinner = useRef<THREE.Group>(null)
  const spinTarget = useRef(0)
  const spin = useRef(0)
  const choc = chocolates.find((c) => c.id === chocolate) ?? chocolates[0]
  const ribbonColor = (ribbons.find((r) => r.id === ribbon) ?? ribbons[0]).color

  // Gira como moeda quando o tema muda: o rótulo novo "aparece" no giro
  useEffect(() => {
    spinTarget.current += Math.PI * 2
  }, [label.theme])

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = state.current
    const target = wrapped ? 1 : 0
    s.wrap = THREE.MathUtils.damp(s.wrap, target, 3.2, dt)
    s.ribbon = THREE.MathUtils.damp(s.ribbon, target, 2.6, dt)
    spin.current = THREE.MathUtils.damp(spin.current, spinTarget.current, 3.5, dt)
    if (spinner.current) {
      spinner.current.rotation.y = spin.current + (reduced ? 0 : Math.sin(frame.clock.elapsedTime * 0.6) * 0.25)
      spinner.current.position.y = 0.62 + (reduced ? 0 : Math.sin(frame.clock.elapsedTime * 0.9) * 0.05)
    }
  })

  return (
    <>
      <PresentationControls global={false} cursor={false} snap polar={[-0.35, 0.35]} azimuth={[-Math.PI, Math.PI]} speed={1.4}>
        <group ref={spinner} position={[0, 0.62, 0]} scale={0.84}>
          <Lollipop
            state={state}
            chocolate={choc}
            ribbonColor={ribbonColor}
            labelMaterial={labelMaterial}
            labelMap={texture}
            detail={mobile ? 0.6 : 1}
          />
          {/* alvo invisível e simples para o arrastar (em vez de testar o pirulito inteiro) */}
          <mesh visible={false} position={[0, -0.6, 0]}>
            <cylinderGeometry args={[1.25, 1.25, 4.2, 12]} />
          </mesh>
        </group>
      </PresentationControls>
      <Sprinkles count={mobile ? 30 : 60} spread={0.75} />
      {onReady && <Warmup onReady={onReady} textures={warmTextures} texturesReady={ready} />}
    </>
  )
}

export default function BuilderStage({ active, onReady, ...props }: Props) {
  const [warm, setWarm] = useState(false)
  const [dpr] = useState(() => Math.min(window.devicePixelRatio || 1, 1.5))
  const handleReady = useCallback(() => {
    setWarm(true)
    onReady?.()
  }, [onReady])

  return (
    <Canvas
      frameloop={warm && active ? 'always' : 'never'}
      camera={{ position: [0, 0, 7.4], fov: 34 }}
      dpr={dpr}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
      aria-hidden
    >
      <color attach="background" args={['#1c100a']} />
      <Glow color="#c3172f" opacity={0.3} scale={10} />
      <Studio envSize={props.mobile ? 128 : 256} />
      <Scene {...props} onReady={handleReady} />
    </Canvas>
  )
}
