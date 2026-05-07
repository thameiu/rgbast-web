export type PaletteColorFormat = 'hex' | 'rgb' | 'hsl' | 'cmyk'

export interface PaletteDisplaySettings {
  hex: boolean
  rgb: boolean
  hsl: boolean
  cmyk: boolean
}

export const DEFAULT_PALETTE_DISPLAY_SETTINGS: PaletteDisplaySettings = {
  hex: true,
  rgb: false,
  hsl: false,
  cmyk: false,
}

export const DEFAULT_PALETTE_COPY_FORMAT: PaletteColorFormat = 'hex'

export interface RGB {
  r: number
  g: number
  b: number
}

interface HSL {
  h: number
  s: number
  l: number
}

interface CMYK {
  c: number
  m: number
  y: number
  k: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function toByte(value: number): number {
  return clamp(Math.round(value), 0, 255)
}

function normalizeHexToken(hex: string): string | null {
  const raw = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null
  if (raw.length === 3) return raw.split('').map(ch => ch + ch).join('').toUpperCase()
  return raw.toUpperCase()
}

export function hexToRgb(hex: string): RGB {
  const normalized = normalizeHexToken(hex)
  if (!normalized) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const rr = toByte(r).toString(16).padStart(2, '0')
  const gg = toByte(g).toString(16).padStart(2, '0')
  const bb = toByte(b).toString(16).padStart(2, '0')
  return `${rr}${gg}${bb}`.toUpperCase()
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  const rn = clamp(r, 0, 255) / 255
  const gn = clamp(g, 0, 255) / 255
  const bn = clamp(b, 0, 255) / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  let h = 0
  if (delta > 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const hn = ((h % 360) + 360) % 360
  const sn = clamp(s, 0, 100) / 100
  const ln = clamp(l, 0, 100) / 100

  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs((hn / 60) % 2 - 1))
  const m = ln - c / 2

  let r1 = 0
  let g1 = 0
  let b1 = 0

  if (hn < 60) [r1, g1, b1] = [c, x, 0]
  else if (hn < 120) [r1, g1, b1] = [x, c, 0]
  else if (hn < 180) [r1, g1, b1] = [0, c, x]
  else if (hn < 240) [r1, g1, b1] = [0, x, c]
  else if (hn < 300) [r1, g1, b1] = [x, 0, c]
  else [r1, g1, b1] = [c, 0, x]

  return {
    r: toByte((r1 + m) * 255),
    g: toByte((g1 + m) * 255),
    b: toByte((b1 + m) * 255),
  }
}

function rgbToCmyk(r: number, g: number, b: number): CMYK {
  const rn = clamp(r, 0, 255) / 255
  const gn = clamp(g, 0, 255) / 255
  const bn = clamp(b, 0, 255) / 255
  const k = 1 - Math.max(rn, gn, bn)
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 }

  const c = (1 - rn - k) / (1 - k)
  const m = (1 - gn - k) / (1 - k)
  const y = (1 - bn - k) / (1 - k)

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  }
}

function cmykToRgb(c: number, m: number, y: number, k: number): RGB {
  const cn = clamp(c, 0, 100) / 100
  const mn = clamp(m, 0, 100) / 100
  const yn = clamp(y, 0, 100) / 100
  const kn = clamp(k, 0, 100) / 100

  return {
    r: toByte(255 * (1 - cn) * (1 - kn)),
    g: toByte(255 * (1 - mn) * (1 - kn)),
    b: toByte(255 * (1 - yn) * (1 - kn)),
  }
}

export function formatHexForDisplay(hex: string): string {
  const normalized = normalizeHexToken(hex) ?? '000000'
  return `#${normalized}`
}

export function formatHexByMode(hex: string, mode: PaletteColorFormat): string {
  const normalized = normalizeHexToken(hex) ?? '000000'
  if (mode === 'hex') return `#${normalized}`

  const { r, g, b } = hexToRgb(normalized)
  if (mode === 'rgb') return `rgb(${r},${g},${b})`

  if (mode === 'hsl') {
    const hsl = rgbToHsl(r, g, b)
    return `hsl(${hsl.h},${hsl.s},${hsl.l})`
  }

  const cmyk = rgbToCmyk(r, g, b)
  return `cmyk(${cmyk.c},${cmyk.m},${cmyk.y},${cmyk.k})`
}

function parseFnValues(raw: string): number[] | null {
  const parts = raw.split(',')
  if (parts.length < 3 || parts.length > 4) return null
  const values = parts.map((part) => Number(part.trim()))
  return values.every(value => Number.isFinite(value)) ? values : null
}

function parseHexStrict(token: string): string | null {
  if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(token)) return null
  return normalizeHexToken(token)
}

function parseRgbStrict(token: string): string | null {
  const match = token.match(/^rgb\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)$/i)
  if (!match) return null
  const values = parseFnValues(match[0].slice(match[0].indexOf('(') + 1, -1))
  if (!values || values.length !== 3) return null
  const [r, g, b] = values as [number, number, number]
  if (r < 0 || g < 0 || b < 0 || r > 255 || g > 255 || b > 255) return null
  return rgbToHex(r, g, b)
}

function parseHslStrict(token: string): string | null {
  const match = token.match(/^hsl\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)$/i)
  if (!match) return null
  const values = parseFnValues(match[0].slice(match[0].indexOf('(') + 1, -1))
  if (!values || values.length !== 3) return null
  const [h, s, l] = values as [number, number, number]
  if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) return null
  const rgb = hslToRgb(h, s, l)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

function parseCmykStrict(token: string): string | null {
  const match = token.match(/^cmyk\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)$/i)
  if (!match) return null
  const values = parseFnValues(match[0].slice(match[0].indexOf('(') + 1, -1))
  if (!values || values.length !== 4) return null
  const [c, m, y, k] = values as [number, number, number, number]
  if (c < 0 || m < 0 || y < 0 || k < 0 || c > 100 || m > 100 || y > 100 || k > 100) return null
  const rgb = cmykToRgb(c, m, y, k)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

export function parseColorsFromText(text: string): string[] {
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  if (!tokens.length) return []

  if (tokens.every(token => parseHexStrict(token) !== null)) {
    return tokens.map(token => parseHexStrict(token) as string)
  }
  if (tokens.every(token => parseRgbStrict(token) !== null)) {
    return tokens.map(token => parseRgbStrict(token) as string)
  }
  if (tokens.every(token => parseHslStrict(token) !== null)) {
    return tokens.map(token => parseHslStrict(token) as string)
  }
  if (tokens.every(token => parseCmykStrict(token) !== null)) {
    return tokens.map(token => parseCmykStrict(token) as string)
  }

  return []
}
