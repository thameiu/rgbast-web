import { ApiClient } from './client'
import type {
  ColleagueActionResponse,
  ColleagueCountResponse,
  ColleagueListResponse,
  ColleaguePublicListResponse,
  ColleagueStatusResponse,
} from './types'

export const colleaguesApi = {
  listMine: (): Promise<ColleagueListResponse> => {
    return ApiClient.request<ColleagueListResponse>('/colleagues/me', 'GET')
  },

  addOrAccept: (username: string): Promise<ColleagueActionResponse> => {
    return ApiClient.request<ColleagueActionResponse>(`/colleagues/${encodeURIComponent(username)}`, 'POST')
  },

  accept: (username: string): Promise<ColleagueActionResponse> => {
    return ApiClient.request<ColleagueActionResponse>(`/colleagues/${encodeURIComponent(username)}/accept`, 'POST')
  },

  remove: (username: string): Promise<ColleagueActionResponse> => {
    return ApiClient.request<ColleagueActionResponse>(`/colleagues/${encodeURIComponent(username)}`, 'DELETE')
  },

  getStatus: (username: string): Promise<ColleagueStatusResponse> => {
    return ApiClient.request<ColleagueStatusResponse>(`/colleagues/${encodeURIComponent(username)}/status`, 'GET')
  },

  getCountByUsername: (username: string): Promise<ColleagueCountResponse> => {
    return ApiClient.request<ColleagueCountResponse>(`/users/${encodeURIComponent(username)}/colleagues/count`, 'GET')
  },

  listByUsername: (username: string): Promise<ColleaguePublicListResponse> => {
    return ApiClient.request<ColleaguePublicListResponse>(`/users/${encodeURIComponent(username)}/colleagues`, 'GET')
  },
}
