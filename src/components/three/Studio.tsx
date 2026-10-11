import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

type Panel = { form: 'rect' | 'ring'; intensity: number; color: string; position: [number, number, number]; scale: [number, number, number] }

// Painéis de luz que o chocolate e o fitilho refletem: softbox quente, contraluz rosado, aro branco
const panels: Panel[] = [
  { form: 'rect', intensity: 3.2, color: '#fff1e0', position: [-3, 3, 4], scale: [4, 2.5, 1] },
  { form: 'rect', intensity: 1.6, color: '#ffd0e0', position: [4, 0.5, 3], scale: [2, 4, 1] },
  { form: 'ring', intensity: 2.2, color: '#ffffff', position: [0, 4, -2], scale: [2.5, 2.5, 1] },
  { form: 'rect', intensity: 1.1, color: '#ff9a4d', position: [0, -4, 2], scale: [7, 1, 1] },
  { form: 'rect', intensity: 0.6, color: '#7bd8b5', position: [-5, 0, -1], scale: [1, 5, 1] },
]

// Mapa de reflexos gerado uma vez só (PMREM) a partir dos painéis acima: sem baixar HDR
// e sem câmera cúbica rodando a cada quadro
function StudioEnvironment({ size }: { size: number }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useLayoutEffect(() => {
    const envScene = new THREE.Scene()
    const rect = new THREE.PlaneGeometry()
    const ring = new THREE.RingGeometry(0.5, 1, 48)
    const materials = panels.map((panel) => {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(panel.color).multiplyScalar(panel.intensity),
        side: THREE.DoubleSide,
        toneMapped: false,
      })
      const mesh = new THREE.Mesh(panel.form === 'ring' ? ring : rect, material)
      mesh.position.set(...panel.position)
      mesh.scale.set(...panel.scale)
      mesh.lookAt(0, 0, 0)
      envScene.add(mesh)
      return material
    })
    const pmrem = new THREE.PMREMGenerator(gl)
    const target = pmrem.fromScene(envScene, 0, 0.1, 100, { size })
    scene.environment = target.texture
    pmrem.dispose()
    rect.dispose()
    ring.dispose()
    materials.forEach((m) => m.dispose())
    return () => {
      if (scene.environment === target.texture) scene.environment = null
      target.dispose()
    }
  }, [gl, scene, size])

  return null
}

// Iluminação de estúdio de confeitaria
export function Studio({ envSize = 256 }: { envSize?: number }) {
  return (
    <>
      <ambientLight intensity={0.35} color="#ffe9d6" />
      <directionalLight position={[-3, 4, 5]} intensity={2.2} color="#fff1df" />
      <directionalLight position={[4, -1, 3]} intensity={0.9} color="#ff9fbd" />
      <pointLight position={[0, 2.5, -3]} intensity={18} distance={9} color="#ffc27a" />
      <StudioEnvironment size={envSize} />
    </>
  )
}

const sprinkleColors = ['#ff5c8a', '#ffd43b', '#ffffff', '#74c0fc', '#7bd8b5', '#ff922b', '#b197fc']

// Granulado colorido flutuando em volta: o "feliz" da ChocoFeliz
export function Sprinkles({ count = 140, spread = 1, burst }: { count?: number; spread?: number; burst?: { current: number } }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const data = useMemo(() => {
    let seed = 3
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    return Array.from({ length: count }, () => {
      // anel em volta do centro; do lado do texto (esquerda) ficam mais ao fundo e menores
      const angle = rand() * Math.PI * 2
      const radius = (2.6 + rand() * 4.5) * spread
      const x = Math.cos(angle) * radius * 1.4
      const behindText = x < -0.5 && spread >= 1
      return {
        base: new THREE.Vector3(x, Math.sin(angle) * radius * 0.75, behindText ? -5 - rand() * 5 : -1 - rand() * 6),
        rot: new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI),
        spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(1.2),
        bob: rand() * Math.PI * 2,
        scale: (0.7 + rand() * 0.7) * (behindText ? 0.75 : 1),
        color: new THREE.Color(sprinkleColors[Math.floor(rand() * sprinkleColors.length)]),
      }
    })
  }, [count, spread])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  // As cores entram antes da primeira compilação: assim o shader já nasce com cor por instância
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    data.forEach((d, i) => m.setColorAt(i, d.color))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [data])

  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    const t = state.clock.elapsedTime
    const push = 1 + (burst?.current ?? 0) * 0.35
    data.forEach((d, i) => {
      dummy.position.set(d.base.x * push, d.base.y * push + Math.sin(t * 0.6 + d.bob) * 0.18, d.base.z)
      dummy.rotation.set(d.rot.x + t * d.spin.x, d.rot.y + t * d.spin.y, d.rot.z + t * d.spin.z)
      dummy.scale.setScalar(d.scale)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <capsuleGeometry args={[0.035, 0.16, 4, 8]} />
      <meshStandardMaterial roughness={0.35} metalness={0} />
    </instancedMesh>
  )
}

// Brilho quente atrás do pirulito (plano com gradiente radial)
export function Glow({ color = '#ff8a4d', opacity = 0.35, scale = 9 }: { color?: string; opacity?: number; scale?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            float a = pow(max(1.0 - d, 0.0), 1.9) * uOpacity;
            gl_FragColor = vec4(uColor, a);
            #include <colorspace_fragment>
          }
        `,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [color, opacity],
  )
  return (
    <mesh position={[0, 0, -3]} scale={scale} material={material}>
      <planeGeometry />
    </mesh>
  )
}
