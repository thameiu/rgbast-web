import { ApiClient } from './client'
import type {
  ColorBookmarkByUsernameResponse,
  ColorBookmarkDeleteResponse,
  ColorBookmarkListResponse,
  ColorBookmarkResponse,
  ColorBookmarkUpsert,
} from './types'

export const colorBookmarksApi = {
  async listMine(): Promise<ColorBookmarkListResponse> {
    return ApiClient.get<ColorBookmarkListResponse>('/color-bookmarks')
  },

  async getMineByHex(hex: string): Promise<ColorBookmarkResponse> {
    return ApiClient.get<ColorBookmarkResponse>(`/color-bookmarks/${hex.replace('#', '')}`)
  },

  async upsert(hex: string, payload: ColorBookmarkUpsert): Promise<ColorBookmarkResponse> {
    return ApiClient.put<ColorBookmarkResponse>(`/color-bookmarks/${hex.replace('#', '')}`, payload)
  },

  async delete(hex: string): Promise<ColorBookmarkDeleteResponse> {
    return ApiClient.delete<ColorBookmarkDeleteResponse>(`/color-bookmarks/${hex.replace('#', '')}`)
  },

  async getByUsername(username: string): Promise<ColorBookmarkByUsernameResponse> {
    return ApiClient.get<ColorBookmarkByUsernameResponse>(`/users/${encodeURIComponent(username)}/color-bookmarks`)
  },
}
