import { hexToRgb, rgbToHex } from './paletteColorFormats'

export interface GlobalColorAdjustments {
  hue: number
  saturation: number
  temperature: number
  luminosity: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
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
  return { h, s: s * 100, l: l * 100 }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
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
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

function applyTemperature(rgb: { r: number; g: number; b: number }, temperature: number): { r: number; g: number; b: number } {
  const t = clamp(temperature, -100, 100) / 100

  if (t >= 0) {
    return {
      r: Math.round(rgb.r + ((255 - rgb.r) * t)),
      g: Math.round(rgb.g + ((255 - rgb.g) * t * 0.15)),
      b: Math.round(rgb.b * (1 - t)),
    }
  }

  const cool = -t
  return {
    r: Math.round(rgb.r * (1 - cool)),
    g: Math.round(rgb.g + ((255 - rgb.g) * cool * 0.1)),
    b: Math.round(rgb.b + ((255 - rgb.b) * cool)),
  }
}

export function applyAdjustmentsToHex(hex: string, adjustments: GlobalColorAdjustments): string {
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

  const nextHue = hsl.h + adjustments.hue
  const nextSat = clamp(hsl.s + adjustments.saturation, 0, 100)
  const nextLum = clamp(hsl.l + adjustments.luminosity, 0, 100)

  const hslRgb = hslToRgb(nextHue, nextSat, nextLum)
  const tempRgb = applyTemperature(hslRgb, adjustments.temperature)

  return rgbToHex(
    clamp(tempRgb.r, 0, 255),
    clamp(tempRgb.g, 0, 255),
    clamp(tempRgb.b, 0, 255),
  )
}

export function isNeutralAdjustments(adjustments: GlobalColorAdjustments): boolean {
  return adjustments.hue === 0
    && adjustments.saturation === 0
    && adjustments.temperature === 0
    && adjustments.luminosity === 0
}
