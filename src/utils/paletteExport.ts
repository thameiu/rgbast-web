import { hexToRgb } from './paletteColorFormats'

export type ExportVisualFormat = 'pdf' | 'png' | 'svg'
export type ExportOrientation = 'portrait' | 'landscape'
export type ExportCodeFormat = 'css-hex' | 'css-hsl' | 'css-rgba' | 'scss-hex' | 'scss-hsl' | 'scss-rgba'

export interface ExportColorCard {
  hex: string
  customLabel: string | null
  colorName: string | null
}

export interface ExportFontOption {
  key: string
  label: string
  cssFamily: string
  googleFamily?: string
}

export const EXPORT_FONT_OPTIONS: ExportFontOption[] = [
  { key: 'satoshi', label: 'Satoshi (default)', cssFamily: 'Satoshi' },
  { key: 'inter', label: 'Inter', cssFamily: 'Inter', googleFamily: 'Inter' },
  { key: 'poppins', label: 'Poppins', cssFamily: 'Poppins', googleFamily: 'Poppins' },
  { key: 'space-grotesk', label: 'Space Grotesk', cssFamily: 'Space Grotesk', googleFamily: 'Space+Grotesk' },
  { key: 'ibm-plex-sans', label: 'IBM Plex Sans', cssFamily: 'IBM Plex Sans', googleFamily: 'IBM+Plex+Sans' },
]

interface RenderPaletteOptions {
  title: string
  colors: ExportColorCard[]
  fontFamily: string
  columns: number
  width: number
  height: number
  showLabels: boolean
}

interface LayoutCard {
  x: number
  y: number
  w: number
  h: number
}

interface RenderLayout {
  titleY: number
  cards: LayoutCard[]
  cardLabelOffset: number
}

function normalizeHex(hex: string): string {
  return hex.trim().replace(/^#/, '').toUpperCase().padStart(6, '0').slice(0, 6)
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, Math.max(1, max - 1))}...`
}

function luminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

function textOnColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  return luminance(r, g, b) > 0.58 ? 'rgba(20,20,24,0.88)' : 'rgba(255,255,255,0.92)'
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
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function sanitizeVarToken(input: string): string {
  const cleaned = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || 'color'
}

function computeLayout(
  width: number,
  height: number,
  colorCount: number,
  columns: number,
  showLabels: boolean,
): RenderLayout {
  const pagePadX = Math.round(width * 0.06)
  const pagePadTop = Math.round(height * 0.06)
  const pagePadBottom = Math.round(height * 0.05)
  const titleY = pagePadTop
  const gridTop = pagePadTop + Math.round(height * 0.07)

  const rows = Math.max(1, Math.ceil(colorCount / columns))
  const gapX = Math.max(12, Math.round(width * 0.012))
  const gapY = Math.max(20, Math.round(height * 0.02))

  const baseCardW = (width - (pagePadX * 2) - (gapX * (columns - 1))) / columns
  const baseCardH = baseCardW * 1.34
  const labelOffset = showLabels ? 28 : 8

  const availableHeight = height - gridTop - pagePadBottom
  const totalForRows = (rows * (baseCardH + labelOffset)) + ((rows - 1) * gapY)
  const scale = totalForRows > availableHeight ? availableHeight / totalForRows : 1

  const cardW = baseCardW * scale
  const cardH = baseCardH * scale
  const rowBlock = cardH + labelOffset
  const gridHeight = (rowBlock * rows) + (gapY * (rows - 1))
  const startY = gridTop + Math.max(0, (availableHeight - gridHeight) / 2)

  const rowWidth = (cardW * columns) + (gapX * (columns - 1))
  const startX = (width - rowWidth) / 2

  const cards: LayoutCard[] = []
  for (let i = 0; i < colorCount; i += 1) {
    const col = i % columns
    const row = Math.floor(i / columns)
    cards.push({
      x: startX + (col * (cardW + gapX)),
      y: startY + (row * (rowBlock + gapY)),
      w: cardW,
      h: cardH,
    })
  }

  return {
    titleY,
    cards,
    cardLabelOffset: labelOffset,
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function renderToCanvas(options: RenderPaletteOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = options.width
  canvas.height = options.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create a drawing context for export.')

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, options.width, options.height)

  const layout = computeLayout(
    options.width,
    options.height,
    options.colors.length,
    options.columns,
    options.showLabels,
  )

  ctx.fillStyle = '#111118'
  ctx.font = `700 ${Math.round(options.height * 0.038)}px "${options.fontFamily}", sans-serif`
  ctx.textBaseline = 'top'
  ctx.fillText(truncate(options.title || 'Untitled palette', 52), Math.round(options.width * 0.06), layout.titleY)

  options.colors.forEach((color, index) => {
    const frame = layout.cards[index]
    if (!frame) return
    const hex = normalizeHex(color.hex)
    const rgb = hexToRgb(hex)
    const onColor = textOnColor(hex)

    const name = truncate((color.colorName || `Color ${index + 1}`).trim(), 24)
    const customLabel = truncate((color.customLabel?.trim() || ''), 36)

    drawRoundedRect(ctx, frame.x, frame.y, frame.w, frame.h, Math.max(12, frame.w * 0.08))
    ctx.fillStyle = `#${hex}`
    ctx.fill()

    ctx.fillStyle = onColor
    ctx.font = `600 ${Math.round(frame.h * 0.072)}px "${options.fontFamily}", sans-serif`
    ctx.textAlign = 'right'
    const rgbX = frame.x + frame.w - Math.max(12, frame.w * 0.08)
    const rgbY = frame.y + Math.max(12, frame.h * 0.08)
    const rgbStep = Math.max(16, frame.h * 0.1)
    ctx.fillText(`R ${rgb.r}`, rgbX, rgbY)
    ctx.fillText(`G ${rgb.g}`, rgbX, rgbY + rgbStep)
    ctx.fillText(`B ${rgb.b}`, rgbX, rgbY + (rgbStep * 2))

    const leftX = frame.x + Math.max(12, frame.w * 0.08)
    const hexY = frame.y + frame.h - Math.max(18, frame.h * 0.16)
    const nameY = hexY - Math.max(16, frame.h * 0.105)

    ctx.textAlign = 'left'
    ctx.font = `600 ${Math.round(frame.h * 0.068)}px "${options.fontFamily}", sans-serif`
    ctx.fillText(name, leftX, nameY)

    ctx.font = `700 ${Math.round(frame.h * 0.13)}px "${options.fontFamily}", sans-serif`
    ctx.fillText(`#${hex}`, leftX, hexY)

    if (options.showLabels && customLabel) {
      ctx.fillStyle = '#2D2D37'
      ctx.font = `500 ${Math.round(frame.h * 0.074)}px "${options.fontFamily}", sans-serif`
      const labelY = frame.y + frame.h + Math.max(14, layout.cardLabelOffset * 0.55)
      ctx.fillText(customLabel, frame.x, labelY)
    }
  })

  return canvas
}

function renderToSvg(options: RenderPaletteOptions): string {
  const layout = computeLayout(
    options.width,
    options.height,
    options.colors.length,
    options.columns,
    options.showLabels,
  )
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}">`,
    `<rect width="${options.width}" height="${options.height}" fill="#FFFFFF" />`,
    `<text x="${Math.round(options.width * 0.06)}" y="${layout.titleY}" font-family="${escapeXml(options.fontFamily)}" font-size="${Math.round(options.height * 0.038)}" font-weight="700" fill="#111118">${escapeXml(truncate(options.title || 'Untitled palette', 52))}</text>`,
  ]

  options.colors.forEach((color, index) => {
    const frame = layout.cards[index]
    if (!frame) return
    const hex = normalizeHex(color.hex)
    const rgb = hexToRgb(hex)
    const onColor = textOnColor(hex)
    const name = truncate((color.colorName || `Color ${index + 1}`).trim(), 24)
    const customLabel = truncate((color.customLabel?.trim() || ''), 36)
    const radius = Math.max(12, frame.w * 0.08)

    lines.push(`<rect x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}" rx="${radius}" ry="${radius}" fill="#${hex}" />`)

    const rgbX = frame.x + frame.w - Math.max(12, frame.w * 0.08)
    const rgbY = frame.y + Math.max(12, frame.h * 0.08)
    const rgbStep = Math.max(16, frame.h * 0.1)
    const rgbSize = Math.round(frame.h * 0.072)

    lines.push(`<text x="${rgbX}" y="${rgbY}" text-anchor="end" font-family="${escapeXml(options.fontFamily)}" font-size="${rgbSize}" font-weight="600" fill="${onColor}">R ${rgb.r}</text>`)
    lines.push(`<text x="${rgbX}" y="${rgbY + rgbStep}" text-anchor="end" font-family="${escapeXml(options.fontFamily)}" font-size="${rgbSize}" font-weight="600" fill="${onColor}">G ${rgb.g}</text>`)
    lines.push(`<text x="${rgbX}" y="${rgbY + (rgbStep * 2)}" text-anchor="end" font-family="${escapeXml(options.fontFamily)}" font-size="${rgbSize}" font-weight="600" fill="${onColor}">B ${rgb.b}</text>`)

    const leftX = frame.x + Math.max(12, frame.w * 0.08)
    const hexY = frame.y + frame.h - Math.max(18, frame.h * 0.16)
    const nameY = hexY - Math.max(16, frame.h * 0.105)
    const labelY = frame.y + frame.h + Math.max(14, layout.cardLabelOffset * 0.55)

    lines.push(`<text x="${leftX}" y="${nameY}" font-family="${escapeXml(options.fontFamily)}" font-size="${Math.round(frame.h * 0.068)}" font-weight="600" fill="${onColor}">${escapeXml(name)}</text>`)
    lines.push(`<text x="${leftX}" y="${hexY}" font-family="${escapeXml(options.fontFamily)}" font-size="${Math.round(frame.h * 0.13)}" font-weight="700" fill="${onColor}">#${hex}</text>`)
    if (options.showLabels && customLabel) {
      lines.push(`<text x="${frame.x}" y="${labelY}" font-family="${escapeXml(options.fontFamily)}" font-size="${Math.round(frame.h * 0.074)}" font-weight="500" fill="#2D2D37">${escapeXml(customLabel)}</text>`)
    }
  })

  lines.push('</svg>')
  return lines.join('')
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || ''
  const raw = atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}

function buildSingleImagePdf(jpegData: Uint8Array, width: number, height: number): Uint8Array {
  const encoder = new TextEncoder()
  const content = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`
  const chunks: Uint8Array[] = []
  const offsets: number[] = [0]
  let cursor = 0

  function pushText(text: string): void {
    const bytes = encoder.encode(text)
    chunks.push(bytes)
    cursor += bytes.length
  }

  function pushBytes(bytes: Uint8Array): void {
    chunks.push(bytes)
    cursor += bytes.length
  }

  pushText('%PDF-1.4\n')

  offsets.push(cursor)
  pushText('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')

  offsets.push(cursor)
  pushText('2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n')

  offsets.push(cursor)
  pushText(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`)

  offsets.push(cursor)
  pushText(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegData.length} >>\nstream\n`)
  pushBytes(jpegData)
  pushText('\nendstream\nendobj\n')

  offsets.push(cursor)
  pushText(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`)

  const xrefStart = cursor
  pushText('xref\n0 6\n0000000000 65535 f \n')
  for (let i = 1; i <= 5; i += 1) {
    pushText(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`)
  }
  pushText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`)

  const out = new Uint8Array(cursor)
  let at = 0
  chunks.forEach((chunk) => {
    out.set(chunk, at)
    at += chunk.length
  })
  return out
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function ensureExportFontLoaded(fontKey: string): Promise<string> {
  const choice = EXPORT_FONT_OPTIONS.find(option => option.key === fontKey) ?? EXPORT_FONT_OPTIONS[0]!

  if (choice.googleFamily) {
    const id = `rgbast-export-font-${choice.key}`
    let link = document.getElementById(id) as HTMLLinkElement | null

    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${choice.googleFamily}:wght@400;500;600;700&display=swap`
      document.head.appendChild(link)
    }

    if ((link as any).dataset.loaded !== '1') {
      await new Promise<void>((resolve) => {
        const done = () => {
          ;(link as any).dataset.loaded = '1'
          resolve()
        }
        link.addEventListener('load', done, { once: true })
        link.addEventListener('error', done, { once: true })
        setTimeout(done, 1500)
      })
    }
  }

  try {
    await document.fonts.load(`700 18px "${choice.cssFamily}"`)
    await document.fonts.ready
  } catch {
    // Keep fallback stack.
  }

  return choice.cssFamily
}

export function getColumnsForExport(orientation: ExportOrientation): number {
  return orientation === 'portrait' ? 4 : 5
}

export function getCanvasSizeForExport(orientation: ExportOrientation): { width: number; height: number } {
  // A4 at 150 DPI
  return orientation === 'portrait'
    ? { width: 1240, height: 1754 }
    : { width: 1754, height: 1240 }
}

export async function exportVisualPalette(options: {
  format: ExportVisualFormat
  orientation: ExportOrientation
  title: string
  colors: ExportColorCard[]
  fontFamily: string
  fileBaseName: string
  showLabels: boolean
}): Promise<void> {
  const columns = getColumnsForExport(options.orientation)
  const size = getCanvasSizeForExport(options.orientation)

  if (options.format === 'svg') {
    const svg = renderToSvg({
      title: options.title,
      colors: options.colors,
      fontFamily: options.fontFamily,
      columns,
      width: size.width,
      height: size.height,
      showLabels: options.showLabels,
    })
    triggerDownload(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${options.fileBaseName}.svg`)
    return
  }

  const canvas = renderToCanvas({
    title: options.title,
    colors: options.colors,
    fontFamily: options.fontFamily,
    columns,
    width: size.width,
    height: size.height,
    showLabels: options.showLabels,
  })

  if (options.format === 'png') {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Could not generate PNG export.')
    triggerDownload(blob, `${options.fileBaseName}.png`)
    return
  }

  const jpegData = dataUrlToUint8Array(canvas.toDataURL('image/jpeg', 0.93))
  const pdfBytes = buildSingleImagePdf(jpegData, size.width, size.height)
  triggerDownload(new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }), `${options.fileBaseName}.pdf`)
}

export function buildExportCode(
  colors: ExportColorCard[],
  mode: ExportCodeFormat,
): string {
  const isScss = mode.startsWith('scss-')
  const channel = mode.split('-')[1] as 'hex' | 'hsl' | 'rgba'

  const lines = colors.map((color, idx) => {
    const hex = normalizeHex(color.hex)
    const rgb = hexToRgb(hex)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const baseName = sanitizeVarToken(color.customLabel || color.colorName || `color-${idx + 1}`)
    const varName = isScss ? `$${baseName}-${idx + 1}` : `--${baseName}-${idx + 1}`

    let value = `#${hex}`
    if (channel === 'hsl') value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
    if (channel === 'rgba') value = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`

    return isScss ? `${varName}: ${value};` : `  ${varName}: ${value};`
  })

  if (isScss) return lines.join('\n')
  return [':root {', ...lines, '}'].join('\n')
}
