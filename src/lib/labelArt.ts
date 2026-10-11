import { themeById } from '../data/themes'

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

export function drawLabel(canvas: HTMLCanvasElement, { theme, name, detail }: LabelInput) {
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
    ;(scenes[t.id] ?? scenes.festa)(ctx, s)
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
