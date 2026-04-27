import { ApiClient } from './client'
import type { ColorContrastCheckResponse, ColorInfoResponse, PaletteGenerateRequest, PaletteGenerateResponse } from './types'

export const colorApi = {
  async getColorInfo(hex: string): Promise<ColorInfoResponse> {
    return ApiClient.get<ColorInfoResponse>(`/color/${hex.replace('#', '')}`)
  },

  async getContrastCheck(hex1: string, hex2: string): Promise<ColorContrastCheckResponse> {
    return ApiClient.get<ColorContrastCheckResponse>(
      `/color/${hex1.replace('#', '')}/contrast/${hex2.replace('#', '')}`
    )
  },

  async generatePalette(request: PaletteGenerateRequest): Promise<PaletteGenerateResponse> {
    return ApiClient.post<PaletteGenerateResponse>('/palette/generate', request)
  },
}
