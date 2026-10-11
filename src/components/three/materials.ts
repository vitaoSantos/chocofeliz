import * as THREE from 'three'
import { NECK_Y, WRAP_SQUASH } from './geometry'

// Ruído simplex 3D (Ashima Arts / Stefan Gustavson, licença MIT)
const simplex = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
`

const wrapVertex = /* glsl */ `
  uniform float uBloom;
  uniform float uLoose;
  attribute float aAngle;
  attribute float aV;
  attribute float aSeed;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying vec3 vLocal;
  varying float vV;
  varying float vSeed;

  vec3 rotateAxis(vec3 p, vec3 k, float a) {
    float c = cos(a);
    float s = sin(a);
    return p * c + cross(k, p) * s + k * dot(k, p) * (1.0 - c);
  }

  void main() {
    vec3 p = position;
    vec3 n = normal;

    // Sem o laço, o franzido do palito afrouxa
    float neck = 1.0 - smoothstep(0.0, 0.4, aV);
    vec2 radial = vec2(p.x, p.z / ${WRAP_SQUASH.toFixed(3)});
    float rr = length(radial);
    if (rr > 1e-4) radial *= (rr + uLoose * neck * 0.22) / rr;
    p.x = radial.x;
    p.z = radial.y * ${WRAP_SQUASH.toFixed(3)};

    // Desembrulhar: cada pétala gira em torno do franzido, abrindo como uma flor
    vec3 dir = normalize(vec3(cos(aAngle), 0.0, sin(aAngle)));
    vec3 axis = normalize(cross(vec3(0.0, 1.0, 0.0), dir));
    float b = uBloom;
    float ang = b * (1.05 + 1.7 * aV) * (0.85 + 0.3 * aSeed);
    vec3 pivot = vec3(0.0, ${NECK_Y.toFixed(3)}, 0.0) + dir * 0.1;
    p = pivot + rotateAxis(p - pivot, axis, ang) + dir * b * (0.45 + aSeed * 0.5) - vec3(0.0, b * b * 0.7, 0.0);
    n = rotateAxis(n, axis, ang);

    vLocal = position;
    vV = aV;
    vSeed = aSeed;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorldPos = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * n);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const wrapFragment = /* glsl */ `
  uniform float uReveal;
  uniform float uDissolve;
  uniform float uOpacity;
  uniform vec3 uGlow;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying vec3 vLocal;
  varying float vV;
  varying float vSeed;
  ${simplex}

  void main() {
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 Ns = normalize(vNormalW);
    // Normal "facetada" pelas derivadas de tela: é o que dá o brilho amassado do celofane
    vec3 Nf = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
    if (dot(Ns, V) < 0.0) Ns = -Ns;
    if (dot(Nf, V) < 0.0) Nf = -Nf;
    vec3 N = normalize(mix(Ns, Nf, 0.45));
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 3.0);

    vec3 L1 = normalize(vec3(-0.6, 0.7, 0.8));
    vec3 L2 = normalize(vec3(0.9, 0.25, 0.6));
    vec3 L3 = normalize(vec3(0.2, -0.5, 0.9));
    float s1 = pow(max(dot(reflect(-L1, N), V), 0.0), 90.0);
    float s2 = pow(max(dot(reflect(-L2, N), V), 0.0), 50.0);
    float s3 = pow(max(dot(reflect(-L3, N), V), 0.0), 28.0);
    float spec = s1 * 1.7 + s2 * 0.9 + s3 * 0.35;

    // leve iridescência de filme fino
    vec3 irid = 0.55 + 0.45 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + ndv * 1.7 + vSeed));
    vec3 col = mix(vec3(1.0, 0.98, 0.95), irid, 0.35) * (0.22 + fres) + vec3(1.0, 0.97, 0.92) * spec;
    float alpha = 0.03 + fres * 0.4 + spec * 0.85;

    float n = snoise(vLocal * 3.2) * 0.5 + 0.5;
    const float e = 0.08;

    // aparece do franzido para cima
    float rKey = n * 0.55 + vV * 0.45;
    float rT = uReveal * (1.0 + e);
    float shown = 1.0 - smoothstep(rT - e, rT, rKey);
    float rEdge = shown * smoothstep(rT - e * 2.5, rT - e, rKey) * step(0.001, uReveal) * step(uReveal, 0.999);

    // some das pontas para dentro, com borda dourada
    float dKey = n * 0.5 + (1.0 - vV) * 0.5;
    float dT = uDissolve * (1.0 + e);
    float kept = smoothstep(dT - e, dT, dKey);
    float dEdge = kept * (1.0 - smoothstep(dT, dT + e * 1.5, dKey)) * step(0.001, uDissolve);

    float edge = max(rEdge, dEdge);
    col += uGlow * edge * 2.2;
    alpha = alpha * shown * kept + edge * 0.9;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0) * uOpacity);
  }
`

export function createWrapMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBloom: { value: 0 },
      uLoose: { value: 0 },
      uReveal: { value: 1 },
      uDissolve: { value: 0 },
      uOpacity: { value: 1 },
      uGlow: { value: new THREE.Color('#ffb85c') },
    },
    vertexShader: wrapVertex,
    fragmentShader: wrapFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

const sparkVertex = /* glsl */ `
  uniform float uBurst;
  uniform float uTime;
  uniform float uScale;
  attribute vec3 aVel;
  attribute float aSeed;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float b = clamp((uBurst - aSeed * 0.35) / 0.65, 0.0, 1.0);
    float e = 1.0 - pow(1.0 - b, 2.5);
    vec3 p = position + aVel * e * 1.9 + vec3(0.0, -1.0, 0.0) * b * b;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = 0.55 + 0.45 * sin(uTime * 9.0 + aSeed * 40.0);
    vAlpha = smoothstep(0.0, 0.06, b) * (1.0 - smoothstep(0.55, 1.0, b)) * tw;
    gl_PointSize = uScale * (0.55 + aSeed) * (1.0 - b * 0.4) * (10.0 / -mv.z);
    vColor = color;
  }
`

const sparkFragment = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    // estrelinha de quatro pontas
    float star = max(0.0, 1.0 - abs(c.x * c.y) * 180.0) * smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.2, 0.0, d);
    float a = (star * 0.8 + core) * vAlpha;
    gl_FragColor = vec4(vColor * 1.5, a);
  }
`

export function createSparkMaterial(scale: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uBurst: { value: 0 }, uTime: { value: 0 }, uScale: { value: scale } },
    vertexShader: sparkVertex,
    fragmentShader: sparkFragment,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

// Textura de ruído para quebrar o brilho do chocolate (marcas de molde, microbolhas)
let chocolateNoise: THREE.CanvasTexture | null = null
export function getChocolateNoise() {
  if (chocolateNoise) return chocolateNoise
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  let seed = 5
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  for (let i = 0; i < size * size; i++) {
    const v = 150 + rand() * 60
    img.data.set([v, v, v, 255], i * 4)
  }
  ctx.putImageData(img, 0, 0)
  // microbolhas
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + rand() * 0.2})`
    ctx.beginPath()
    ctx.arc(rand() * size, rand() * size, 0.6 + rand() * 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  chocolateNoise = new THREE.CanvasTexture(canvas)
  chocolateNoise.wrapS = chocolateNoise.wrapT = THREE.RepeatWrapping
  chocolateNoise.repeat.set(3, 3)
  return chocolateNoise
}
