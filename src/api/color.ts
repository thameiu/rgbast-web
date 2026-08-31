import { ApiClient } from './client'
import type {
  ColorContrastCheckResponse,
  ColorInfoResponse,
  ColorLabelsResponse,
  PaletteAccessibilityAuditRequest,
  PaletteAccessibilityAuditResponse,
  PaletteGenerateRequest,
  PaletteGenerateResponse,
} from './types'

export const colorApi = {
  async getColorInfo(hex: string): Promise<ColorInfoResponse> {
    return ApiClient.get<ColorInfoResponse>(`/color/${hex.replace('#', '')}`)
  },

  async getContrastCheck(hex1: string, hex2: string): Promise<ColorContrastCheckResponse> {
    return ApiClient.get<ColorContrastCheckResponse>(
      `/color/${hex1.replace('#', '')}/contrast/${hex2.replace('#', '')}`
    )
  },

  async getPaletteAccessibilityAudit(
    data: PaletteAccessibilityAuditRequest,
  ): Promise<PaletteAccessibilityAuditResponse> {
    return ApiClient.post<PaletteAccessibilityAuditResponse>('/color/palette/accessibility', data)
  },

  async generatePalette(request: PaletteGenerateRequest): Promise<PaletteGenerateResponse> {
    return ApiClient.post<PaletteGenerateResponse>('/palette/generate', request)
  },

  async getColorLabels(hexes: string[]): Promise<ColorLabelsResponse> {
    const params = new URLSearchParams()
    hexes.forEach((hex) => params.append('hex', hex.replace('#', '')))
    return ApiClient.get<ColorLabelsResponse>(`/color/labels?${params.toString()}`)
  },
}
