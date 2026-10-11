import * as THREE from 'three'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'

// Geometrias procedurais do pirulito. Unidade: raio do disco de chocolate = 1.
// O disco fica de frente para a câmera (eixo Z), com o palito descendo em -Y.

export const DISK = {
  front: 0.1, // altura da "cama" onde o rótulo assenta
  labelRadius: 0.72,
  back: -0.15,
}
export const NECK_Y = -1.45 // onde o celofane é franzido e amarrado
export const STICK = { radius: 0.045, top: -0.35, bottom: -2.85 }

const noise = new SimplexNoise({ random: mulberry(42) })

function mulberry(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------- Disco de chocolate ----------
// Perfil (raio, altura) do fundo até a frente: base reta, borda gordinha arredondada
// e a "cama" rebaixada onde vai o rótulo — igual ao molde dos pirulitos das fotos.
function diskProfile() {
  const pts: THREE.Vector2[] = []
  const { back, front } = DISK
  // fundo
  for (const r of [0, 0.3, 0.6, 0.8]) pts.push(new THREE.Vector2(r, back))
  // borda: meia-volta de -90° a 150°
  const cx = 0.86
  const cz = 0.025
  for (let i = 0; i <= 24; i++) {
    const a = THREE.MathUtils.lerp(-Math.PI / 2, (Math.PI * 5) / 6, i / 24)
    pts.push(new THREE.Vector2(cx + 0.14 * Math.cos(a), cz + 0.175 * Math.sin(a)))
  }
  // desce até a cama do rótulo
  pts.push(new THREE.Vector2(0.735, front + 0.004))
  pts.push(new THREE.Vector2(0.725, front))
  for (const r of [0.6, 0.4, 0.2, 0]) pts.push(new THREE.Vector2(r, front))
  return pts
}

function arcLengths(pts: THREE.Vector2[]) {
  const out = [0]
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + pts[i].distanceTo(pts[i - 1]))
  const total = out[out.length - 1]
  return out.map((d) => d / total)
}

// Disco + morph para uma "gota" de chocolate derretido (usada na construção do pirulito)
export function createDiskGeometry(segments = 96) {
  const profile = diskProfile()
  const lens = arcLengths(profile)
  const drop = profile.map((_, i) => {
    const a = -Math.PI / 2 + Math.PI * lens[i]
    return new THREE.Vector2(Math.max(0.62 * Math.cos(a), 0), 0.62 * Math.sin(a))
  })

  const geo = new THREE.LatheGeometry(profile, segments)
  const dropGeo = new THREE.LatheGeometry(drop, segments)
  // Lathe gira em torno de Y; deitamos para o disco olhar para +Z
  geo.rotateX(Math.PI / 2)
  dropGeo.rotateX(Math.PI / 2)

  // Pequenas ondulações artesanais na superfície do chocolate
  const pos = geo.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const r = Math.hypot(v.x, v.y)
    if (r > 0.74) {
      const n = noise.noise3d(v.x * 2.2, v.y * 2.2, v.z * 2.2) * 0.012
      v.x += (v.x / r) * n
      v.y += (v.y / r) * n
      v.z += n * 0.6
      pos.setXYZ(i, v.x, v.y, v.z)
    }
  }
  geo.computeVertexNormals()
  dropGeo.computeVertexNormals()

  geo.morphAttributes.position = [dropGeo.attributes.position as THREE.BufferAttribute]
  geo.morphAttributes.normal = [dropGeo.attributes.normal as THREE.BufferAttribute]
  dropGeo.dispose()
  return geo
}

// ---------- Celofane ----------
// O saquinho é uma superfície de revolução (achatada em Z) que vai do franzido no palito
// até o topo. Ele é dividido em "pétalas" que, ao desembrulhar, se abrem como uma flor.
export const WRAP_SQUASH = 0.44
export const PETALS = 6

const bagCurve = new THREE.CatmullRomCurve3(
  [
    [0.075, NECK_Y],
    [0.16, -1.37],
    [0.42, -1.23],
    [0.76, -1.03],
    [1.02, -0.66],
    [1.14, -0.2],
    [1.15, 0.08],
    [1.09, 0.5],
    [0.88, 0.92],
    [0.52, 1.2],
    [0.0, 1.31],
  ].map(([r, y]) => new THREE.Vector3(r, y, 0)),
  false,
  'centripetal',
)

const skirtCurve = new THREE.CatmullRomCurve3(
  [
    [0.075, NECK_Y],
    [0.1, -1.53],
    [0.22, -1.72],
    [0.4, -1.98],
    [0.52, -2.2],
    [0.58, -2.38],
  ].map(([r, y]) => new THREE.Vector3(r, y, 0)),
  false,
  'centripetal',
)

type WrapOptions = { segU: number; segV: number }

// Pregas do plástico: muitas dobras perto do franzido, poucas e suaves no corpo
function pleat(phi: number, t: number, r: number, skirt: boolean) {
  const gather = skirt ? 1 - t * 0.5 : Math.pow(1 - Math.min(t / 0.3, 1), 2)
  const folds = Math.sin(phi * 14 + Math.sin(phi * 3) * 2) * (0.5 + 0.5 * noise.noise3d(Math.cos(phi) * 1.3, Math.sin(phi) * 1.3, t * 4))
  const soft = noise.noise3d(Math.cos(phi) * 1.6, Math.sin(phi) * 1.6, t * 5) * 0.035
  return r * folds * (0.05 + gather * (skirt ? 0.3 : 0.45)) + soft * (skirt ? 0.4 : 1)
}

function buildSurface(
  curve: THREE.CatmullRomCurve3,
  { segU, segV }: WrapOptions,
  petals: number,
  skirt: boolean,
) {
  const positions: number[] = []
  const normals: number[] = []
  const angles: number[] = []
  const vs: number[] = []
  const seeds: number[] = []
  const indices: number[] = []
  const rand = mulberry(skirt ? 7 : 3)
  const p = new THREE.Vector3()
  let offset = 0

  for (let k = 0; k < petals; k++) {
    // pétala da frente fica centrada em +Z (ângulo 90°)
    const span = (Math.PI * 2) / petals
    const a0 = Math.PI / 2 - span / 2 + k * span
    const center = a0 + span / 2
    const seed = rand()
    const geo = new THREE.BufferGeometry()
    const local: number[] = []

    for (let j = 0; j <= segV; j++) {
      const t = j / segV
      curve.getPoint(t, p)
      for (let i = 0; i <= segU; i++) {
        const phi = a0 + (i / segU) * span
        let r = p.x + pleat(phi, t, p.x, skirt)
        let y = p.y
        if (skirt) {
          // barra irregular, como plástico cortado
          y -= t * t * (0.08 * Math.sin(phi * 5 + 1) + 0.06 * noise.noise3d(Math.cos(phi) * 2, Math.sin(phi) * 2, 9))
          r *= 1 + t * 0.12 * Math.sin(phi * 3)
        }
        r = Math.max(r, 0)
        local.push(Math.cos(phi) * r, y, Math.sin(phi) * r * (skirt ? 0.8 : WRAP_SQUASH))
        angles.push(center)
        vs.push(t)
        seeds.push(seed)
      }
    }

    const idx: number[] = []
    for (let j = 0; j < segV; j++) {
      for (let i = 0; i < segU; i++) {
        const a = j * (segU + 1) + i
        const b = a + segU + 1
        idx.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(local, 3))
    geo.setIndex(idx)
    geo.computeVertexNormals()
    const n = geo.attributes.normal.array
    positions.push(...local)
    normals.push(...n)
    for (const i of idx) indices.push(i + offset)
    offset += (segU + 1) * (segV + 1)
    geo.dispose()
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('aAngle', new THREE.Float32BufferAttribute(angles, 1))
  geo.setAttribute('aV', new THREE.Float32BufferAttribute(vs, 1))
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
  geo.setIndex(indices)
  geo.computeBoundingSphere()
  return geo
}

export function createWrapGeometry(detail = 1) {
  return buildSurface(bagCurve, { segU: Math.round(16 * detail), segV: Math.round(56 * detail) }, PETALS, false)
}

export function createSkirtGeometry(detail = 1) {
  return buildSurface(skirtCurve, { segU: Math.round(20 * detail), segV: Math.round(16 * detail) }, 4, true)
}

// Pontos espalhados na superfície do saquinho fechado (de onde saem as faíscas ao abrir)
export function sampleWrapPoints(count: number) {
  const rand = mulberry(99)
  const p = new THREE.Vector3()
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const t = 0.08 + rand() * 0.9
    const phi = rand() * Math.PI * 2
    bagCurve.getPoint(t, p)
    out.set([Math.cos(phi) * p.x, p.y, Math.sin(phi) * p.x * WRAP_SQUASH], i * 3)
  }
  return out
}

// ---------- Fitilho ----------
// Fita chata ao longo de uma curva. "widthAxis" diz para onde a largura da fita aponta.
export function ribbonStrip(curve: THREE.Curve<THREE.Vector3>, width: number, widthAxis: THREE.Vector3, samples = 120) {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const p = new THREE.Vector3()
  const tan = new THREE.Vector3()
  const side = new THREE.Vector3()
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    curve.getPointAt(t, p)
    curve.getTangentAt(t, tan)
    side.copy(widthAxis).addScaledVector(tan, -widthAxis.dot(tan))
    if (side.lengthSq() < 1e-6) side.set(0, 1, 0)
    side.normalize().multiplyScalar(width / 2)
    pos.push(p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z)
    uv.push(t, 0, t, 1)
    if (i < samples) {
      const a = i * 2
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

// Cachinho de fitilho: hélice que desce a partir do nó, afinando no fim
export class CurlCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private start: THREE.Vector3,
    private dir: THREE.Vector3,
    private length: number,
    private radius: number,
    private turns: number,
    private phase: number,
  ) {
    super()
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    const d = this.dir.clone().normalize()
    const helper = Math.abs(d.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
    const u = new THREE.Vector3().crossVectors(d, helper).normalize()
    const w = new THREE.Vector3().crossVectors(d, u).normalize()
    // entra reto e vai abrindo o cacho
    const lead = 0.12
    const grow = THREE.MathUtils.smoothstep(t, 0, lead)
    const r = this.radius * grow * (1 - t * 0.35)
    const a = this.phase + t * this.turns * Math.PI * 2
    target
      .copy(this.start)
      .addScaledVector(d, t * this.length)
      .addScaledVector(u, Math.cos(a) * r)
      .addScaledVector(w, Math.sin(a) * r)
    return target
  }
}

// Laçada (orelha do laço): gota num plano inclinado para frente, para a fita aparecer de face
export class LoopCurve extends THREE.Curve<THREE.Vector3> {
  private out: THREE.Vector3
  private up: THREE.Vector3

  constructor(
    private knot: THREE.Vector3,
    side: number,
    private size: number,
  ) {
    super()
    this.out = new THREE.Vector3(side, 0.15, 0.25).normalize()
    this.up = new THREE.Vector3(0, 0.75, 0.66).normalize()
  }

  // eixo da laçada: a largura da fita fica nessa direção
  get axis() {
    return new THREE.Vector3().crossVectors(this.out, this.up).normalize()
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2
    const x = Math.sin(a / 2) ** 1.2 * this.size
    const y = Math.sin(a) * this.size * 0.45
    return target.copy(this.knot).addScaledVector(this.out, x).addScaledVector(this.up, y)
  }
}

export class BandCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private y: number,
    private radius: number,
  ) {
    super()
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * Math.PI * 4 + Math.PI / 2
    return target.set(Math.cos(a) * this.radius, this.y - t * 0.035, Math.sin(a) * this.radius * 0.9)
  }
}
