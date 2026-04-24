import { ApiClient } from './client'
import type { ColorInfoResponse } from './types'

export const colorApi = {
  async getColorInfo(hex: string): Promise<ColorInfoResponse> {
    return ApiClient.get<ColorInfoResponse>(`/color/${hex.replace('#', '')}`)
  },
}
