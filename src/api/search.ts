import { ApiClient } from './client'
import type { PaletteSearchResponse, UserSearchResponse } from './types'

export const RECENT_SEARCHES_KEY = 'rgbast_recent_searches'

export interface RecentSearchEntry {
  scope: 'users' | 'palettes'
  query: string
  colors: string[]
  colorMode: 'exact' | 'similar'
  createdAt: string
}

export const searchApi = {
  searchUsers: (query: string): Promise<UserSearchResponse> => {
    return ApiClient.request<UserSearchResponse>(`/search/users?q=${encodeURIComponent(query)}`, 'GET')
  },

  searchPalettes: (payload: {
    query?: string
    colors?: string[]
    colorMode?: 'exact' | 'similar'
  }): Promise<PaletteSearchResponse> => {
    const params = new URLSearchParams()
    if (payload.query?.trim()) params.set('query', payload.query.trim())
    if (payload.colors?.length) params.set('colors', payload.colors.join(','))
    params.set('color_mode', payload.colorMode ?? 'exact')
    return ApiClient.request<PaletteSearchResponse>(`/search/palettes?${params.toString()}`, 'GET')
  },

  getRecentSearches(): RecentSearchEntry[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },

  saveRecentSearch(entry: Omit<RecentSearchEntry, 'createdAt'>): void {
    const current = searchApi.getRecentSearches()
    const nextEntry: RecentSearchEntry = { ...entry, createdAt: new Date().toISOString() }
    const deduped = current.filter((item) =>
      !(
        item.scope === nextEntry.scope
        && item.query === nextEntry.query
        && item.colorMode === nextEntry.colorMode
        && item.colors.join(',') === nextEntry.colors.join(',')
      ),
    )
    deduped.unshift(nextEntry)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(deduped.slice(0, 12)))
  },

  clearRecentSearches(): void {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  },
}
