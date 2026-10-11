import { CUSTOM_ART, themeById } from '../data/themes'

// Desenha o rótulo comestível (o disco impresso que vai no centro do pirulito) num canvas quadrado.
// Tudo é vetor/emoji desenhado na hora: nome e idade mudam sem precisar de imagem nova.

type Ctx = CanvasRenderingContext2D

const ROUND = '"Baloo 2 Variable", "Arial Rounded MT Bold", system-ui, sans-serif'
const SERIF = '"Fraunces Variable", Georgia, serif'
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif'

// Garante as fontes antes de desenhar (canvas não espera fonte carregar)
let fontsPromise: Promise<unknown> | null = null
export function labelFontsReady() {
  fontsPromise ??= Promise.all([
    document.fonts.load(`800 100px ${ROUND}`, 'Aa ÁÉÍÓÚÃÕÇáéíóúãõç?!'),
    document.fonts.load(`700 100px ${SERIF}`, 'ChocoFeliz'),
    document.fonts.load(`italic 700 100px ${SERIF}`, 'Feliz'),
  ]).catch(() => undefined)
  return fontsPromise
}

function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function vertical(ctx: Ctx, s: number, stops: string[], from = 0, to = s) {
  const g = ctx.createLinearGradient(0, from, 0, to)
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c))
  ctx.fillStyle = g
  ctx.fillRect(0, from, s, to - from)
}

function emoji(ctx: Ctx, char: string, x: number, y: number, size: number, rotate = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotate)
  ctx.font = `${size}px ${EMOJI}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.22)'
  ctx.shadowBlur = size * 0.08
  ctx.shadowOffsetY = size * 0.04
  ctx.fillText(char, 0, 0)
  ctx.restore()
}

function disc(ctx: Ctx, x: number, y: number, r: number, fill: string | CanvasGradient) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

function cloud(ctx: Ctx, x: number, y: number, r: number, color = '#ffffff') {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x - r * 0.9, y + r * 0.15, r * 0.65, 0, Math.PI * 2)
  ctx.arc(x, y - r * 0.2, r, 0, Math.PI * 2)
  ctx.arc(x + r * 0.95, y + r * 0.1, r * 0.7, 0, Math.PI * 2)
  ctx.arc(x + r * 0.2, y + r * 0.45, r * 0.7, 0, Math.PI * 2)
  ctx.fill()
}

function hill(ctx: Ctx, s: number, y: number, amp: number, color: string, phase = 0) {
  ctx.beginPath()
  ctx.moveTo(0, s)
  ctx.lineTo(0, y)
  for (let x = 0; x <= s; x += s / 40) {
    ctx.lineTo(x, y - Math.sin((x / s) * Math.PI * 1.6 + phase) * amp)
  }
  ctx.lineTo(s, s)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function sparkle(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.quadraticCurveTo(x, y, x, y + r)
  ctx.quadraticCurveTo(x, y, x - r, y)
  ctx.quadraticCurveTo(x, y, x, y - r)
  ctx.fillStyle = color
  ctx.fill()
}

function rays(ctx: Ctx, cx: number, cy: number, count: number, length: number, color: string, offset = 0) {
  ctx.fillStyle = color
  for (let i = 0; i < count; i++) {
    const a = offset + (i / count) * Math.PI * 2
    const w = Math.PI / count
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(a - w / 2) * length, cy + Math.sin(a - w / 2) * length)
    ctx.lineTo(cx + Math.cos(a + w / 2) * length, cy + Math.sin(a + w / 2) * length)
    ctx.closePath()
    ctx.fill()
  }
}

function confetti(ctx: Ctx, s: number, count: number, colors: string[], seed: number, area = { y0: 0, y1: 1 }) {
  const rand = rng(seed)
  for (let i = 0; i < count; i++) {
    const x = rand() * s
    const y = (area.y0 + rand() * (area.y1 - area.y0)) * s
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rand() * Math.PI)
    ctx.fillStyle = colors[i % colors.length]
    if (rand() > 0.4) {
      const w = s * (0.012 + rand() * 0.01)
      ctx.beginPath()
      ctx.roundRect(-w * 1.8, -w / 2, w * 3.6, w, w / 2)
      ctx.fill()
    } else {
      disc(ctx, 0, 0, s * (0.006 + rand() * 0.008), colors[i % colors.length])
    }
    ctx.restore()
  }
}

function star(ctx: Ctx, x: number, y: number, outer: number, inner: number, points: number, fill: string, rotate = -Math.PI / 2) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer
    const a = rotate + (i * Math.PI) / points
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
  }
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function snowflake(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1, r * 0.14)
  ctx.lineCap = 'round'
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -r)
    ctx.moveTo(0, -r * 0.55)
    ctx.lineTo(-r * 0.25, -r * 0.8)
    ctx.moveTo(0, -r * 0.55)
    ctx.lineTo(r * 0.25, -r * 0.8)
    ctx.stroke()
  }
  ctx.restore()
}

function dots(ctx: Ctx, s: number, step: number, r: number, color: string) {
  ctx.fillStyle = color
  for (let row = 0; row * step < s + step; row++) {
    for (let x = (row % 2) * step * 0.5; x < s + step; x += step) {
      ctx.beginPath()
      ctx.arc(x, row * step, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function crown(ctx: Ctx, cx: number, cy: number, w: number, h: number) {
  const left = cx - w / 2
  const right = cx + w / 2
  const top = cy - h / 2
  const bottom = cy + h / 2
  const g = ctx.createLinearGradient(left, top, right, bottom)
  g.addColorStop(0, '#fff3bf')
  g.addColorStop(0.45, '#f2c94c')
  g.addColorStop(1, '#a8741a')
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(left, bottom)
  ctx.lineTo(left, top + h * 0.35)
  ctx.lineTo(left + w * 0.24, top + h * 0.62)
  ctx.lineTo(cx, top)
  ctx.lineTo(right - w * 0.24, top + h * 0.62)
  ctx.lineTo(right, top + h * 0.35)
  ctx.lineTo(right, bottom)
  ctx.closePath()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = w * 0.05
  ctx.shadowOffsetY = w * 0.02
  ctx.fillStyle = g
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = '#b8860b'
  ctx.fillRect(left, bottom - h * 0.2, w, h * 0.2)
  disc(ctx, cx, bottom - h * 0.1, h * 0.075, '#e03131')
  disc(ctx, left + w * 0.24, bottom - h * 0.1, h * 0.055, '#4dabf7')
  disc(ctx, right - w * 0.24, bottom - h * 0.1, h * 0.055, '#4dabf7')
  disc(ctx, left, top + h * 0.35, h * 0.065, '#fff3bf')
  disc(ctx, cx, top, h * 0.075, '#fff3bf')
  disc(ctx, right, top + h * 0.35, h * 0.065, '#fff3bf')
}

function leaf(ctx: Ctx, x: number, y: number, len: number, angle: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(len * 0.5, -len * 0.26, len, 0)
  ctx.quadraticCurveTo(len * 0.5, len * 0.26, 0, 0)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = len * 0.02
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(len * 0.95, 0)
  ctx.stroke()
  ctx.restore()
}

// Monstrinho fofo de um olho só (desenhado, sem personagem de ninguém)
function monster(ctx: Ctx, x: number, y: number, r: number) {
  ctx.fillStyle = '#fff3bf'
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(x + side * r * 0.3, y - r * 0.85)
    ctx.lineTo(x + side * r * 0.6, y - r * 1.25)
    ctx.lineTo(x + side * r * 0.72, y - r * 0.62)
    ctx.closePath()
    ctx.fill()
  }
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r)
  g.addColorStop(0, '#8ce99a')
  g.addColorStop(1, '#2f9e44')
  ctx.beginPath()
  ctx.ellipse(x, y, r, r * 0.95, 0, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
  disc(ctx, x, y - r * 0.15, r * 0.42, '#ffffff')
  disc(ctx, x + r * 0.06, y - r * 0.1, r * 0.22, '#1c7ed6')
  disc(ctx, x + r * 0.08, y - r * 0.1, r * 0.11, '#111111')
  disc(ctx, x - r * 0.02, y - r * 0.2, r * 0.06, '#ffffff')
  ctx.beginPath()
  ctx.arc(x, y + r * 0.35, r * 0.3, 0.15 * Math.PI, 0.85 * Math.PI)
  ctx.lineWidth = r * 0.08
  ctx.strokeStyle = '#1b4332'
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x - r * 0.06, y + r * 0.6, r * 0.12, r * 0.12)
}

// ---------- Cenários de cada tema ----------

const scenes: Record<string, (ctx: Ctx, s: number) => void> = {
  futebol(ctx, s) {
    vertical(ctx, s, ['#081d4d', '#1450b8', '#2a6fe0'], 0, s * 0.52)
    // refletores
    for (const x of [0.2, 0.8]) {
      const g = ctx.createRadialGradient(s * x, s * 0.12, 0, s * x, s * 0.12, s * 0.22)
      g.addColorStop(0, 'rgba(255,255,255,0.95)')
      g.addColorStop(0.15, 'rgba(255,255,240,0.5)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, s, s * 0.5)
    }
    // arquibancada com torcida
    ctx.fillStyle = '#0a1a3d'
    ctx.fillRect(0, s * 0.36, s, s * 0.16)
    const rand = rng(7)
    const crowd = ['#ffd43b', '#2f9e44', '#ffffff', '#4dabf7', '#ffd43b']
    for (let i = 0; i < 420; i++) {
      disc(ctx, rand() * s, s * (0.37 + rand() * 0.14), s * 0.006, crowd[i % crowd.length])
    }
    // gramado listrado
    const stripes = ['#2f9e44', '#37b24d']
    let y = s * 0.52
    for (let i = 0; y < s; i++) {
      const h = s * (0.05 + i * 0.018)
      ctx.fillStyle = stripes[i % 2]
      ctx.fillRect(0, y, s, h)
      y += h
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'
    ctx.lineWidth = s * 0.008
    ctx.beginPath()
    ctx.moveTo(0, s * 0.6)
    ctx.lineTo(s, s * 0.6)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(s * 0.5, s * 0.6, s * 0.22, s * 0.06, 0, 0, Math.PI * 2)
    ctx.stroke()
    for (const [x, yy, r] of [[0.12, 0.25, 0.025], [0.88, 0.27, 0.02], [0.3, 0.08, 0.018]] as const) sparkle(ctx, s * x, s * yy, s * r, '#fff3bf')
    emoji(ctx, '⚽', s * 0.5, s * 0.43, s * 0.26, -0.2)
    emoji(ctx, '🏆', s * 0.79, s * 0.42, s * 0.11, 0.15)
  },

  'fundo-do-mar'(ctx, s) {
    vertical(ctx, s, ['#7fe0ff', '#1d8fe0', '#0a4fa3'])
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.fillStyle = '#ffffff'
    for (const x of [0.15, 0.4, 0.62, 0.85]) {
      ctx.beginPath()
      ctx.moveTo(s * (x - 0.04), 0)
      ctx.lineTo(s * (x + 0.04), 0)
      ctx.lineTo(s * (x + 0.16), s * 0.85)
      ctx.lineTo(s * (x + 0.02), s * 0.85)
      ctx.fill()
    }
    ctx.restore()
    // algas
    ctx.lineCap = 'round'
    for (const [x, h, c] of [[0.1, 0.32, '#2b8a3e'], [0.16, 0.24, '#40c057'], [0.86, 0.3, '#2b8a3e'], [0.92, 0.22, '#69db7c']] as const) {
      ctx.strokeStyle = c
      ctx.lineWidth = s * 0.022
      ctx.beginPath()
      ctx.moveTo(s * x, s)
      for (let t = 0; t <= 1; t += 0.1) ctx.lineTo(s * (x + Math.sin(t * 9) * 0.02), s * (1 - t * h - 0.08))
      ctx.stroke()
    }
    hill(ctx, s, s * 0.9, s * 0.02, '#f3d58f', 1.2)
    const rand = rng(3)
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = s * 0.005
    for (let i = 0; i < 22; i++) {
      ctx.beginPath()
      ctx.arc(rand() * s, rand() * s * 0.8, s * (0.006 + rand() * 0.018), 0, Math.PI * 2)
      ctx.stroke()
    }
    emoji(ctx, '🐙', s * 0.6, s * 0.42, s * 0.22, 0.1)
    emoji(ctx, '🐠', s * 0.3, s * 0.4, s * 0.15, 0)
    emoji(ctx, '🐢', s * 0.77, s * 0.22, s * 0.1, -0.3)
    emoji(ctx, '🐡', s * 0.24, s * 0.2, s * 0.08, 0.2)
  },

  unicornio(ctx, s) {
    vertical(ctx, s, ['#ffe3f1', '#f3d9ff', '#d9ccff'])
    const colors = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa']
    ctx.lineWidth = s * 0.036
    colors.forEach((c, i) => {
      ctx.strokeStyle = c
      ctx.beginPath()
      ctx.arc(s * 0.5, s * 0.64, s * (0.4 - i * 0.034), Math.PI, Math.PI * 2)
      ctx.stroke()
    })
    cloud(ctx, s * 0.16, s * 0.62, s * 0.08)
    cloud(ctx, s * 0.84, s * 0.62, s * 0.08)
    const rand = rng(11)
    for (let i = 0; i < 14; i++) sparkle(ctx, rand() * s, rand() * s * 0.9, s * (0.01 + rand() * 0.018), i % 2 ? '#ffffff' : '#ffd43b')
    emoji(ctx, '🦄', s * 0.5, s * 0.43, s * 0.25, 0)
  },

  espaco(ctx, s) {
    const g = ctx.createRadialGradient(s * 0.4, s * 0.35, s * 0.05, s * 0.5, s * 0.5, s * 0.75)
    g.addColorStop(0, '#3b2a8f')
    g.addColorStop(0.5, '#1a1550')
    g.addColorStop(1, '#070b1f')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
    const rand = rng(21)
    for (let i = 0; i < 160; i++) disc(ctx, rand() * s, rand() * s, s * (0.0015 + rand() * 0.004), `rgba(255,255,255,${0.4 + rand() * 0.6})`)
    for (let i = 0; i < 6; i++) sparkle(ctx, rand() * s, rand() * s * 0.6, s * 0.018, '#fff3bf')
    // planeta com anel
    const pg = ctx.createLinearGradient(s * 0.68, s * 0.2, s * 0.86, s * 0.38)
    pg.addColorStop(0, '#ffc078')
    pg.addColorStop(1, '#e8590c')
    disc(ctx, s * 0.77, s * 0.29, s * 0.085, pg)
    ctx.strokeStyle = '#ffe8cc'
    ctx.lineWidth = s * 0.014
    ctx.beginPath()
    ctx.ellipse(s * 0.77, s * 0.29, s * 0.15, s * 0.035, -0.35, 0, Math.PI * 2)
    ctx.stroke()
    disc(ctx, s * 0.2, s * 0.24, s * 0.05, '#e9ecef')
    disc(ctx, s * 0.185, s * 0.23, s * 0.012, '#ced4da')
    disc(ctx, s * 0.215, s * 0.255, s * 0.008, '#ced4da')
    emoji(ctx, '🚀', s * 0.46, s * 0.43, s * 0.24, 0)
  },

  dinossauros(ctx, s) {
    vertical(ctx, s, ['#9fe3ff', '#e3f8ff'], 0, s * 0.7)
    disc(ctx, s * 0.8, s * 0.17, s * 0.07, '#ffd43b')
    // vulcão
    ctx.fillStyle = '#7a4b2a'
    ctx.beginPath()
    ctx.moveTo(s * 0.55, s * 0.62)
    ctx.lineTo(s * 0.7, s * 0.22)
    ctx.lineTo(s * 0.78, s * 0.22)
    ctx.lineTo(s * 0.95, s * 0.62)
    ctx.fill()
    ctx.fillStyle = '#f03e3e'
    ctx.beginPath()
    ctx.moveTo(s * 0.7, s * 0.22)
    ctx.lineTo(s * 0.78, s * 0.22)
    ctx.lineTo(s * 0.8, s * 0.32)
    ctx.lineTo(s * 0.76, s * 0.28)
    ctx.lineTo(s * 0.73, s * 0.34)
    ctx.lineTo(s * 0.7, s * 0.27)
    ctx.lineTo(s * 0.68, s * 0.3)
    ctx.fill()
    cloud(ctx, s * 0.73, s * 0.13, s * 0.045, 'rgba(120,120,130,0.75)')
    hill(ctx, s, s * 0.6, s * 0.03, '#8ce99a', 0.5)
    hill(ctx, s, s * 0.68, s * 0.035, '#51cf66', 2)
    hill(ctx, s, s * 0.8, s * 0.02, '#2f9e44', 4)
    emoji(ctx, '🌴', s * 0.14, s * 0.46, s * 0.14)
    emoji(ctx, '🦕', s * 0.38, s * 0.45, s * 0.22)
    emoji(ctx, '🦖', s * 0.66, s * 0.5, s * 0.16)
  },

  princesa(ctx, s) {
    vertical(ctx, s, ['#ffe6f0', '#fbb6ce', '#f783ac'])
    rays(ctx, s * 0.5, s * 0.36, 20, s * 0.8, 'rgba(255,255,255,0.18)')
    // castelo
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    const base = s * 0.66
    ctx.fillRect(s * 0.3, base - s * 0.12, s * 0.4, s * 0.4)
    for (const [x, w, h] of [[0.22, 0.1, 0.24], [0.68, 0.1, 0.24], [0.45, 0.1, 0.3]] as const) {
      ctx.fillRect(s * x, base - s * h, s * w, s * h + s * 0.4)
      ctx.beginPath()
      ctx.moveTo(s * (x - 0.015), base - s * h)
      ctx.lineTo(s * (x + w / 2), base - s * (h + 0.1))
      ctx.lineTo(s * (x + w + 0.015), base - s * h)
      ctx.fill()
    }
    const rand = rng(5)
    for (let i = 0; i < 16; i++) sparkle(ctx, rand() * s, rand() * s * 0.85, s * (0.01 + rand() * 0.02), i % 3 ? '#ffffff' : '#fcc419')
    emoji(ctx, '👑', s * 0.5, s * 0.3, s * 0.22, 0)
  },

  safari(ctx, s) {
    vertical(ctx, s, ['#ffe8a3', '#ffb054', '#f76707'], 0, s * 0.66)
    disc(ctx, s * 0.5, s * 0.5, s * 0.18, '#fff3bf')
    ctx.fillStyle = '#d9a45b'
    ctx.fillRect(0, s * 0.62, s, s * 0.4)
    hill(ctx, s, s * 0.64, s * 0.012, '#c98b40', 1)
    // acácia
    ctx.fillStyle = '#5c3d1e'
    ctx.fillRect(s * 0.15, s * 0.36, s * 0.025, s * 0.28)
    ctx.beginPath()
    ctx.ellipse(s * 0.16, s * 0.35, s * 0.15, s * 0.04, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#8f5d26'
    ctx.lineWidth = s * 0.008
    const rand = rng(9)
    for (let i = 0; i < 30; i++) {
      const x = rand() * s
      const y = s * (0.7 + rand() * 0.28)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - s * 0.01, y - s * 0.03)
      ctx.moveTo(x, y)
      ctx.lineTo(x + s * 0.01, y - s * 0.03)
      ctx.stroke()
    }
    emoji(ctx, '🦒', s * 0.74, s * 0.42, s * 0.22)
    emoji(ctx, '🦁', s * 0.46, s * 0.5, s * 0.18)
    emoji(ctx, '🐘', s * 0.22, s * 0.56, s * 0.11)
  },

  festa(ctx, s) {
    const g = ctx.createLinearGradient(0, 0, s, s)
    g.addColorStop(0, '#845ef7')
    g.addColorStop(1, '#f06595')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
    confetti(ctx, s, 90, ['#ffd43b', '#ffffff', '#63e6be', '#ffa8a8', '#74c0fc'], 4)
    // bandeirinhas
    const flags = ['#ffd43b', '#63e6be', '#ff8787', '#74c0fc', '#ffffff']
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = s * 0.005
    ctx.beginPath()
    ctx.moveTo(0, s * 0.12)
    ctx.quadraticCurveTo(s * 0.5, s * 0.26, s, s * 0.12)
    ctx.stroke()
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9
      const x = t * s
      const y = s * (0.12 + 0.14 * 4 * t * (1 - t) * 0.5)
      ctx.fillStyle = flags[i % flags.length]
      ctx.beginPath()
      ctx.moveTo(x - s * 0.035, y)
      ctx.lineTo(x + s * 0.035, y)
      ctx.lineTo(x, y + s * 0.08)
      ctx.fill()
    }
    emoji(ctx, '🎈', s * 0.3, s * 0.44, s * 0.2, -0.15)
    emoji(ctx, '🎉', s * 0.68, s * 0.44, s * 0.2, 0.1)
  },

  fazendinha(ctx, s) {
    vertical(ctx, s, ['#a5d8ff', '#e7f5ff'], 0, s * 0.65)
    disc(ctx, s * 0.18, s * 0.17, s * 0.06, '#ffd43b')
    cloud(ctx, s * 0.72, s * 0.15, s * 0.05)
    hill(ctx, s, s * 0.58, s * 0.03, '#8ce99a', 1)
    hill(ctx, s, s * 0.68, s * 0.02, '#51cf66', 3)
    // celeiro
    const bx = s * 0.38
    const bw = s * 0.24
    const by = s * 0.36
    ctx.fillStyle = '#e03131'
    ctx.fillRect(bx, by, bw, s * 0.24)
    ctx.fillStyle = '#a61e1e'
    ctx.beginPath()
    ctx.moveTo(bx - s * 0.03, by + s * 0.01)
    ctx.lineTo(bx + bw / 2, by - s * 0.1)
    ctx.lineTo(bx + bw + s * 0.03, by + s * 0.01)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(bx + bw * 0.3, by + s * 0.1, bw * 0.4, s * 0.14)
    ctx.strokeStyle = '#e03131'
    ctx.lineWidth = s * 0.01
    ctx.beginPath()
    ctx.moveTo(bx + bw * 0.3, by + s * 0.1)
    ctx.lineTo(bx + bw * 0.7, by + s * 0.24)
    ctx.moveTo(bx + bw * 0.7, by + s * 0.1)
    ctx.lineTo(bx + bw * 0.3, by + s * 0.24)
    ctx.stroke()
    // cerca
    ctx.fillStyle = '#fff9db'
    for (let x = 0; x < s; x += s * 0.07) ctx.fillRect(x, s * 0.6, s * 0.018, s * 0.08)
    ctx.fillRect(0, s * 0.62, s, s * 0.012)
    ctx.fillRect(0, s * 0.65, s, s * 0.012)
    emoji(ctx, '🐄', s * 0.2, s * 0.53, s * 0.15)
    emoji(ctx, '🐷', s * 0.8, s * 0.55, s * 0.13)
    emoji(ctx, '🐔', s * 0.64, s * 0.6, s * 0.08)
  },

  'cha-revelacao'(ctx, s) {
    ctx.fillStyle = '#ffc2d6'
    ctx.fillRect(0, 0, s, s)
    ctx.fillStyle = '#a5d8ff'
    ctx.beginPath()
    ctx.moveTo(s * 0.62, 0)
    ctx.lineTo(s, 0)
    ctx.lineTo(s, s)
    ctx.lineTo(s * 0.38, s)
    ctx.fill()
    const rand = rng(13)
    for (let i = 0; i < 70; i++) disc(ctx, rand() * s, rand() * s, s * 0.008, 'rgba(255,255,255,0.7)')
    ctx.font = `800 ${s * 0.42}px ${ROUND}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineJoin = 'round'
    ctx.lineWidth = s * 0.03
    ctx.strokeStyle = '#845ef7'
    ctx.strokeText('?', s * 0.5, s * 0.4)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('?', s * 0.5, s * 0.4)
    emoji(ctx, '🎀', s * 0.24, s * 0.32, s * 0.13, -0.2)
    emoji(ctx, '🍼', s * 0.77, s * 0.32, s * 0.12, 0.25)
  },

  batizado(ctx, s) {
    const g = ctx.createRadialGradient(s * 0.5, s * 0.35, s * 0.02, s * 0.5, s * 0.5, s * 0.7)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.6, '#e7f5ff')
    g.addColorStop(1, '#a5d8ff')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
    rays(ctx, s * 0.5, s * 0.36, 28, s * 0.8, 'rgba(252,196,25,0.12)')
    cloud(ctx, s * 0.2, s * 0.6, s * 0.06)
    cloud(ctx, s * 0.82, s * 0.58, s * 0.05)
    const rand = rng(17)
    for (let i = 0; i < 10; i++) sparkle(ctx, rand() * s, rand() * s * 0.7, s * (0.01 + rand() * 0.015), '#fcc419')
    emoji(ctx, '🕊️', s * 0.5, s * 0.38, s * 0.24)
  },

  pascoa(ctx, s) {
    vertical(ctx, s, ['#fff9db', '#e6fcf5', '#d3f9d8'])
    hill(ctx, s, s * 0.66, s * 0.02, '#8ce99a', 2)
    const eggs = [
      [0.2, 0.56, '#ffc9c9', '#ff8787'],
      [0.8, 0.55, '#d0bfff', '#9775fa'],
      [0.33, 0.64, '#a5d8ff', '#4dabf7'],
      [0.68, 0.64, '#ffec99', '#fab005'],
    ] as const
    for (const [x, y, fill, stripe] of eggs) {
      ctx.save()
      ctx.translate(s * x, s * y)
      ctx.beginPath()
      ctx.ellipse(0, 0, s * 0.055, s * 0.072, 0, 0, Math.PI * 2)
      ctx.fillStyle = fill
      ctx.fill()
      ctx.clip()
      ctx.strokeStyle = stripe
      ctx.lineWidth = s * 0.012
      ctx.beginPath()
      for (let i = -4; i <= 4; i++) ctx.lineTo(i * s * 0.015, (i % 2 ? -1 : 1) * s * 0.012)
      ctx.stroke()
      ctx.restore()
    }
    const rand = rng(23)
    for (let i = 0; i < 40; i++) {
      const x = rand() * s
      ctx.strokeStyle = '#51cf66'
      ctx.lineWidth = s * 0.006
      ctx.beginPath()
      ctx.moveTo(x, s * 0.72)
      ctx.lineTo(x + s * 0.01, s * 0.68)
      ctx.stroke()
    }
    emoji(ctx, '🐰', s * 0.5, s * 0.42, s * 0.26)
  },

  natal(ctx, s) {
    const g = ctx.createRadialGradient(s * 0.5, s * 0.4, s * 0.05, s * 0.5, s * 0.5, s * 0.72)
    g.addColorStop(0, '#f03e3e')
    g.addColorStop(1, '#7a0e0e')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
    const rand = rng(41)
    for (let i = 0; i < 70; i++) disc(ctx, rand() * s, rand() * s * 0.85, s * (0.003 + rand() * 0.007), 'rgba(255,255,255,0.8)')
    hill(ctx, s, s * 0.64, s * 0.025, '#f8f9fa', 1.3)
    hill(ctx, s, s * 0.73, s * 0.02, '#e9ecef', 3.4)
    for (const [x, y, r] of [[0.16, 0.18, 0.03], [0.84, 0.22, 0.025], [0.5, 0.09, 0.02]] as const) star(ctx, s * x, s * y, s * r, s * r * 0.45, 5, '#ffd43b')
    emoji(ctx, '🎄', s * 0.2, s * 0.47, s * 0.17)
    emoji(ctx, '🎁', s * 0.81, s * 0.5, s * 0.11, 0.15)
    emoji(ctx, '🎅', s * 0.52, s * 0.4, s * 0.27)
  },

  bailarina(ctx, s) {
    vertical(ctx, s, ['#fff0f6', '#ffdeeb', '#fcc2d7'])
    dots(ctx, s, s * 0.09, s * 0.012, 'rgba(255,255,255,0.6)')
    const rand = rng(53)
    for (let i = 0; i < 12; i++) sparkle(ctx, rand() * s, rand() * s * 0.6, s * (0.01 + rand() * 0.016), i % 2 ? '#ffffff' : '#f783ac')
    emoji(ctx, '🎀', s * 0.2, s * 0.25, s * 0.1, -0.3)
    emoji(ctx, '🌸', s * 0.8, s * 0.27, s * 0.08, 0.2)
    emoji(ctx, '🩰', s * 0.5, s * 0.42, s * 0.27, -0.1)
  },

  realeza(ctx, s) {
    const g = ctx.createRadialGradient(s * 0.5, s * 0.38, s * 0.05, s * 0.5, s * 0.5, s * 0.72)
    g.addColorStop(0, '#2f56d0')
    g.addColorStop(1, '#0a1a4f')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
    ctx.strokeStyle = 'rgba(247,215,116,0.16)'
    ctx.lineWidth = s * 0.004
    const step = s * 0.1
    for (let y = -step; y < s + step; y += step) {
      for (let x = -step; x < s + step; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, y - step * 0.35)
        ctx.lineTo(x + step * 0.25, y)
        ctx.lineTo(x, y + step * 0.35)
        ctx.lineTo(x - step * 0.25, y)
        ctx.closePath()
        ctx.stroke()
      }
    }
    ctx.strokeStyle = 'rgba(247,215,116,0.55)'
    ctx.lineWidth = s * 0.008
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, s * 0.41, 0, Math.PI * 2)
    ctx.stroke()
    const rand = rng(61)
    for (let i = 0; i < 10; i++) sparkle(ctx, rand() * s, rand() * s * 0.6, s * (0.008 + rand() * 0.014), '#f7d774')
    crown(ctx, s * 0.5, s * 0.38, s * 0.4, s * 0.25)
  },

  'super-heroi'(ctx, s) {
    ctx.fillStyle = '#1c7ed6'
    ctx.fillRect(0, 0, s, s)
    rays(ctx, s * 0.5, s * 0.42, 22, s * 0.9, 'rgba(255,212,59,0.35)')
    dots(ctx, s, s * 0.035, s * 0.007, 'rgba(255,255,255,0.12)')
    star(ctx, s * 0.5, s * 0.42, s * 0.3, s * 0.2, 14, '#ffffff', 0)
    star(ctx, s * 0.5, s * 0.42, s * 0.27, s * 0.18, 14, '#e03131', 0)
    emoji(ctx, '⚡', s * 0.82, s * 0.22, s * 0.1, 0.2)
    emoji(ctx, '🦸', s * 0.5, s * 0.42, s * 0.32)
  },

  games(ctx, s) {
    vertical(ctx, s, ['#2b1a6b', '#4b2bb5', '#6741d9'])
    const rand = rng(71)
    const px = s * 0.035
    const colors = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#f783ac']
    for (let i = 0; i < 46; i++) {
      ctx.fillStyle = colors[i % colors.length]
      ctx.globalAlpha = 0.35 + rand() * 0.4
      ctx.fillRect(Math.floor(rand() * 28) * px, Math.floor(rand() * 18) * px, px * 0.8, px * 0.8)
    }
    ctx.globalAlpha = 1
    const by = s * 0.68
    const bw = s * 0.1
    const bh = s * 0.05
    for (let row = 0; row < 7; row++) {
      for (let x = -bw; x < s + bw; x += bw) {
        const ox = row % 2 ? bw / 2 : 0
        ctx.fillStyle = '#c4672f'
        ctx.fillRect(x + ox, by + row * bh, bw - s * 0.006, bh - s * 0.006)
        ctx.fillStyle = 'rgba(0,0,0,0.18)'
        ctx.fillRect(x + ox, by + row * bh + bh - s * 0.014, bw - s * 0.006, s * 0.008)
      }
    }
    for (const [x, y] of [[0.2, 0.28], [0.8, 0.3], [0.68, 0.16]] as const) {
      disc(ctx, s * x, s * y, s * 0.035, '#fab005')
      disc(ctx, s * x, s * y, s * 0.022, '#ffd43b')
      ctx.fillStyle = '#e67700'
      ctx.fillRect(s * x - s * 0.004, s * y - s * 0.016, s * 0.008, s * 0.032)
    }
    emoji(ctx, '🍄', s * 0.24, s * 0.6, s * 0.1)
    emoji(ctx, '⭐', s * 0.78, s * 0.58, s * 0.09, 0.2)
    emoji(ctx, '🎮', s * 0.5, s * 0.44, s * 0.25, -0.1)
  },

  magia(ctx, s) {
    const g = ctx.createRadialGradient(s * 0.5, s * 0.3, s * 0.05, s * 0.5, s * 0.5, s * 0.75)
    g.addColorStop(0, '#5a33a0')
    g.addColorStop(0.6, '#2a1660')
    g.addColorStop(1, '#120a2b')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
    const rand = rng(83)
    for (let i = 0; i < 110; i++) disc(ctx, rand() * s, rand() * s * 0.7, s * (0.0015 + rand() * 0.004), `rgba(255,255,255,${0.4 + rand() * 0.6})`)
    // castelo encantado
    ctx.fillStyle = '#0e0722'
    const base = s * 0.66
    ctx.fillRect(s * 0.18, base - s * 0.07, s * 0.64, s * 0.4)
    for (const [x, w, h] of [[0.16, 0.1, 0.2], [0.74, 0.1, 0.2], [0.44, 0.12, 0.3]] as const) {
      ctx.fillRect(s * x, base - s * h, s * w, s * h + s * 0.4)
      ctx.beginPath()
      ctx.moveTo(s * (x - 0.015), base - s * h)
      ctx.lineTo(s * (x + w / 2), base - s * (h + 0.12))
      ctx.lineTo(s * (x + w + 0.015), base - s * h)
      ctx.fill()
    }
    ctx.fillStyle = '#ffd43b'
    for (const [x, y] of [[0.205, 0.52], [0.785, 0.52], [0.493, 0.42], [0.493, 0.52]] as const) ctx.fillRect(s * x, s * y, s * 0.015, s * 0.025)
    for (let i = 0; i < 8; i++) sparkle(ctx, rand() * s, rand() * s * 0.5, s * (0.01 + rand() * 0.014), '#fcc419')
    emoji(ctx, '🌙', s * 0.8, s * 0.18, s * 0.11, -0.3)
    emoji(ctx, '🦉', s * 0.2, s * 0.26, s * 0.1)
    emoji(ctx, '🪄', s * 0.64, s * 0.2, s * 0.11, 0.3)
  },

  'reino-do-gelo'(ctx, s) {
    vertical(ctx, s, ['#e7f5ff', '#a5d8ff', '#4dabf7'])
    rays(ctx, s * 0.5, s * 0.3, 24, s * 0.9, 'rgba(255,255,255,0.12)')
    const rand = rng(97)
    for (let i = 0; i < 16; i++) snowflake(ctx, rand() * s, rand() * s * 0.8, s * (0.015 + rand() * 0.03), 'rgba(255,255,255,0.9)')
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    for (const [x, w, h] of [[0.04, 0.22, 0.28], [0.24, 0.18, 0.2], [0.6, 0.2, 0.24], [0.78, 0.22, 0.3]] as const) {
      ctx.beginPath()
      ctx.moveTo(s * x, s * 0.66)
      ctx.lineTo(s * (x + w / 2), s * (0.66 - h))
      ctx.lineTo(s * (x + w), s * 0.66)
      ctx.fill()
    }
    hill(ctx, s, s * 0.66, s * 0.015, '#ffffff', 2)
    emoji(ctx, '⛄', s * 0.5, s * 0.43, s * 0.25)
  },

  ursinho(ctx, s) {
    vertical(ctx, s, ['#fff9db', '#e6fcf5', '#c3fae8'])
    for (const [x, r] of [[0.12, 0.13], [0.88, 0.12], [0.28, 0.09]] as const) {
      ctx.fillStyle = '#8f5d26'
      ctx.fillRect(s * x - s * 0.012, s * 0.45, s * 0.024, s * 0.2)
      disc(ctx, s * x, s * 0.42, s * r, '#69db7c')
      disc(ctx, s * x - s * r * 0.4, s * 0.46, s * r * 0.7, '#51cf66')
      disc(ctx, s * x + s * r * 0.45, s * 0.47, s * r * 0.65, '#40c057')
    }
    hill(ctx, s, s * 0.62, s * 0.025, '#8ce99a', 1)
    hill(ctx, s, s * 0.7, s * 0.02, '#69db7c', 3)
    const rand = rng(103)
    for (let i = 0; i < 12; i++) emoji(ctx, '🌸', rand() * s, s * (0.64 + rand() * 0.3), s * 0.045)
    emoji(ctx, '🦋', s * 0.74, s * 0.22, s * 0.08, 0.2)
    emoji(ctx, '🐻', s * 0.52, s * 0.44, s * 0.25)
  },

  tropical(ctx, s) {
    vertical(ctx, s, ['#ffe3ec', '#ffc9c9', '#ff8fa3'])
    disc(ctx, s * 0.5, s * 0.36, s * 0.22, 'rgba(255,243,191,0.7)')
    const greens = ['#2b8a3e', '#37b24d', '#40c057']
    let k = 0
    for (const [x, y, base] of [[0, 0, 0.55], [s, 0, Math.PI - 0.55], [0, s * 0.2, 0.15], [s, s * 0.18, Math.PI - 0.15]] as const) {
      for (let i = -2; i <= 2; i++) leaf(ctx, x, y, s * 0.3, base + i * 0.26, greens[k++ % greens.length])
    }
    emoji(ctx, '🌴', s * 0.38, s * 0.44, s * 0.2)
    emoji(ctx, '🍍', s * 0.66, s * 0.45, s * 0.16, 0.1)
    emoji(ctx, '🌺', s * 0.22, s * 0.36, s * 0.11, -0.2)
    emoji(ctx, '🌺', s * 0.82, s * 0.42, s * 0.09, 0.3)
  },

  monstrinhos(ctx, s) {
    vertical(ctx, s, ['#f3f0ff', '#d0bfff', '#b197fc'])
    dots(ctx, s, s * 0.1, s * 0.016, 'rgba(255,255,255,0.35)')
    const rand = rng(109)
    for (let i = 0; i < 8; i++) sparkle(ctx, rand() * s, rand() * s * 0.6, s * (0.01 + rand() * 0.014), '#ffffff')
    emoji(ctx, '👾', s * 0.2, s * 0.28, s * 0.1, -0.2)
    emoji(ctx, '👾', s * 0.8, s * 0.3, s * 0.09, 0.2)
    monster(ctx, s * 0.5, s * 0.45, s * 0.16)
  },

  musical(ctx, s) {
    const stripes = ['#ffc9c9', '#ffd8a8', '#ffec99', '#d3f9d8', '#c5f6fa', '#d0ebff', '#e5dbff']
    const w = s / stripes.length
    stripes.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.fillRect(i * w, 0, w + 1, s)
    })
    const rand = rng(113)
    const notes = ['🎵', '🎶']
    for (let i = 0; i < 9; i++) emoji(ctx, notes[i % 2], rand() * s, s * (0.08 + rand() * 0.5), s * (0.05 + rand() * 0.04), (rand() - 0.5) * 0.6)
    emoji(ctx, '🎸', s * 0.34, s * 0.44, s * 0.2, -0.3)
    emoji(ctx, '🥁', s * 0.68, s * 0.48, s * 0.16)
  },

  carros(ctx, s) {
    vertical(ctx, s, ['#a5d8ff', '#d0ebff'], 0, s * 0.3)
    cloud(ctx, s * 0.27, s * 0.13, s * 0.045)
    cloud(ctx, s * 0.74, s * 0.17, s * 0.035)
    const sq = s * 0.04
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 26; c++) {
        ctx.fillStyle = (r + c) % 2 ? '#212529' : '#ffffff'
        ctx.fillRect(c * sq, s * 0.22 + r * sq, sq, sq)
      }
    }
    ctx.fillStyle = '#51cf66'
    ctx.fillRect(0, s * 0.3, s, s * 0.7)
    ctx.fillStyle = '#495057'
    ctx.fillRect(0, s * 0.37, s, s * 0.23)
    for (let i = 0; i * s * 0.06 < s; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#e03131'
      ctx.fillRect(i * s * 0.06, s * 0.36, s * 0.06, s * 0.016)
      ctx.fillRect(i * s * 0.06, s * 0.6, s * 0.06, s * 0.016)
    }
    ctx.fillStyle = '#ffffff'
    for (let x = 0; x < s; x += s * 0.12) ctx.fillRect(x, s * 0.479, s * 0.07, s * 0.012)
    emoji(ctx, '🏁', s * 0.16, s * 0.14, s * 0.1, -0.2)
    emoji(ctx, '🏆', s * 0.85, s * 0.3, s * 0.08)
    emoji(ctx, '🏎️', s * 0.5, s * 0.46, s * 0.3)
  },

  logo(ctx, s) {
    ctx.fillStyle = '#fffaf2'
    ctx.fillRect(0, 0, s, s)
    const rand = rng(29)
    for (let i = 0; i < 50; i++) disc(ctx, rand() * s, rand() * s, s * 0.004, 'rgba(194,65,12,0.12)')
    ctx.setLineDash([s * 0.025, s * 0.02])
    ctx.strokeStyle = '#c2410c'
    ctx.lineWidth = s * 0.008
    ctx.beginPath()
    ctx.arc(s * 0.5, s * 0.38, s * 0.19, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#c2410c'
    ctx.font = `800 ${s * 0.06}px ${ROUND}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SUA LOGO', s * 0.5, s * 0.36)
    ctx.font = `600 ${s * 0.04}px ${ROUND}`
    ctx.fillText('aqui', s * 0.5, s * 0.42)
  },
}

// Tema "Sua arte": a imagem enviada pelo cliente cobre o rótulo inteiro
function customArt(ctx: Ctx, s: number, image?: ImageBitmap | null) {
  if (image) {
    const scale = Math.max(s / image.width, s / image.height)
    const w = image.width * scale
    const h = image.height * scale
    ctx.drawImage(image, (s - w) / 2, (s - h) / 2, w, h)
    // escurece a parte de baixo para o nome aparecer
    const g = ctx.createLinearGradient(0, s * 0.5, 0, s)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.45)')
    ctx.fillStyle = g
    ctx.fillRect(0, s * 0.5, s, s * 0.5)
    return
  }
  vertical(ctx, s, ['#fff4e6', '#ffe8cc'])
  ctx.setLineDash([s * 0.025, s * 0.02])
  ctx.strokeStyle = '#c2410c'
  ctx.lineWidth = s * 0.008
  ctx.beginPath()
  ctx.arc(s * 0.5, s * 0.36, s * 0.2, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  emoji(ctx, '🖼️', s * 0.5, s * 0.32, s * 0.14)
  ctx.fillStyle = '#c2410c'
  ctx.font = `800 ${s * 0.05}px ${ROUND}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('SUA ARTE AQUI', s * 0.5, s * 0.46)
}

// Rótulo da própria marca (usado na abertura 3D)
function brandLabel(ctx: Ctx, s: number) {
  const g = ctx.createRadialGradient(s * 0.5, s * 0.45, s * 0.05, s * 0.5, s * 0.5, s * 0.6)
  g.addColorStop(0, '#fff6ea')
  g.addColorStop(1, '#f8d9bd')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  rays(ctx, s * 0.5, s * 0.5, 22, s * 0.8, 'rgba(255,92,138,0.10)', 0.1)
  confetti(ctx, s, 46, ['#ff5c8a', '#eaa24c', '#7bd8b5', '#74c0fc', '#ffd43b'], 31, { y0: 0.05, y1: 0.95 })

  // calda de chocolate escorrendo no topo
  ctx.fillStyle = '#5c3320'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(s, 0)
  ctx.lineTo(s, s * 0.2)
  const drips = [0.92, 0.8, 0.68, 0.55, 0.43, 0.3, 0.18, 0.06]
  drips.forEach((x, i) => {
    const len = [0.1, 0.05, 0.14, 0.06, 0.11, 0.04, 0.13, 0.06][i]
    ctx.lineTo(s * (x + 0.04), s * 0.2)
    ctx.quadraticCurveTo(s * (x + 0.03), s * (0.2 + len), s * x, s * (0.2 + len + 0.01))
    ctx.quadraticCurveTo(s * (x - 0.03), s * (0.2 + len), s * (x - 0.04), s * 0.2)
  })
  ctx.lineTo(0, s * 0.2)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fillRect(0, s * 0.1, s, s * 0.02)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `700 ${s * 0.17}px ${SERIF}`
  ctx.fillStyle = '#4a2616'
  ctx.fillText('Choco', s * 0.5, s * 0.53)
  ctx.font = `italic 800 ${s * 0.2}px ${SERIF}`
  ctx.lineJoin = 'round'
  ctx.lineWidth = s * 0.025
  ctx.strokeStyle = '#ffffff'
  ctx.strokeText('Feliz', s * 0.52, s * 0.71)
  ctx.fillStyle = '#ff5c8a'
  ctx.fillText('Feliz', s * 0.52, s * 0.71)

  // sorriso
  ctx.strokeStyle = '#4a2616'
  ctx.lineWidth = s * 0.018
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(s * 0.5, s * 0.72, s * 0.13, Math.PI * 0.2, Math.PI * 0.8)
  ctx.stroke()
  ctx.font = `700 ${s * 0.045}px ${ROUND}`
  ctx.fillStyle = '#a0522d'
  ctx.textBaseline = 'middle'
  ctx.fillText('PIRULITOS DE CHOCOLATE', s * 0.5, s * 0.9)
}

function fitText(ctx: Ctx, text: string, weight: number, size: number, maxWidth: number) {
  let current = size
  ctx.font = `${weight} ${current}px ${ROUND}`
  while (ctx.measureText(text).width > maxWidth && current > size * 0.35) {
    current -= size * 0.04
    ctx.font = `${weight} ${current}px ${ROUND}`
  }
  return current
}

function outlinedText(ctx: Ctx, text: string, x: number, y: number, size: number, fill: string, stroke: string) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.shadowColor = 'rgba(0,0,0,0.28)'
  ctx.shadowBlur = size * 0.12
  ctx.shadowOffsetY = size * 0.06
  ctx.lineWidth = size * 0.22
  ctx.strokeStyle = stroke
  ctx.strokeText(text, x, y)
  ctx.restore()
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = fill
  ctx.fillText(text, x, y)
  ctx.restore()
}

export type LabelInput = { theme: string; name: string; detail: string }

export const BRAND_LABEL = 'chocofeliz'

// `image` só é usado no tema "Sua arte" (a imagem que a pessoa escolheu no configurador)
export function drawLabel(canvas: HTMLCanvasElement, { theme, name, detail }: LabelInput, image?: ImageBitmap | null) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const s = canvas.width
  ctx.save()
  ctx.clearRect(0, 0, s, s)
  ctx.beginPath()
  ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2)
  ctx.clip()

  if (theme === BRAND_LABEL) {
    brandLabel(ctx, s)
  } else {
    const t = themeById(theme)
    if (t.id === CUSTOM_ART) customArt(ctx, s, image)
    else (scenes[t.id] ?? scenes.festa)(ctx, s)
    const title = name.trim()
    const sub = detail.trim()
    if (title) {
      const size = fitText(ctx, title, 800, s * 0.15, s * 0.74)
      outlinedText(ctx, title, s * 0.5, s * (sub ? 0.7 : 0.74), size, t.nameColor, t.stroke)
    }
    if (sub) {
      const size = fitText(ctx, sub, 700, s * 0.085, s * 0.52)
      outlinedText(ctx, sub, s * 0.5, s * 0.84, size, t.detailColor, t.stroke)
    }
  }

  // borda impressa do rótulo
  ctx.lineWidth = s * 0.03
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.arc(s / 2, s / 2, s / 2 - s * 0.012, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = s * 0.008
  ctx.strokeStyle = 'rgba(60,30,15,0.35)'
  ctx.beginPath()
  ctx.arc(s / 2, s / 2, s / 2 - s * 0.03, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

export function createLabelCanvas(size: number, input: LabelInput) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  drawLabel(canvas, input)
  return canvas
}
