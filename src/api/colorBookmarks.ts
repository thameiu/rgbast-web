import { ApiClient } from './client'
import type {
  ColorBookmarkByUsernameResponse,
  ColorBookmarkDeleteResponse,
  ColorBookmarkListResponse,
  ColorBookmarkResponse,
  ColorBookmarkUpsert,
} from './types'

export const colorBookmarksApi = {
  async listMine(hex?: string, projectId?: number | null): Promise<ColorBookmarkListResponse> {
    const query = new URLSearchParams()
    if (hex) query.set('hex', hex.replace('#', ''))
    if (projectId != null) query.set('project_id', String(projectId))
    return ApiClient.get<ColorBookmarkListResponse>(`/color-bookmarks?${query}`)
  },

  async create(hex: string, payload: ColorBookmarkUpsert, projectId?: number | null): Promise<ColorBookmarkResponse> {
    return ApiClient.post<ColorBookmarkResponse>('/color-bookmarks', { ...payload, hex, project_id: projectId ?? null })
  },

  async update(id: number, payload: ColorBookmarkUpsert): Promise<ColorBookmarkResponse> {
    return ApiClient.request<ColorBookmarkResponse>(`/color-bookmarks/by-id/${id}`, 'PATCH', payload)
  },

  async delete(id: number): Promise<ColorBookmarkDeleteResponse> {
    return ApiClient.delete<ColorBookmarkDeleteResponse>(`/color-bookmarks/by-id/${id}`)
  },

  async getByUsername(username: string): Promise<ColorBookmarkByUsernameResponse> {
    return ApiClient.get<ColorBookmarkByUsernameResponse>(`/users/${encodeURIComponent(username)}/color-bookmarks`)
  },
}
