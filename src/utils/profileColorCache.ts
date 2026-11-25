import { shallowRef } from 'vue'

const STORAGE_KEY = 'rgbast_profile_color_v1'
type CachedProfileColor = { username: string; color: string }

function readCachedColor(): CachedProfileColor | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (typeof value?.username === 'string' && /^[0-9a-f]{6}$/i.test(value?.color ?? '')) {
      return { username: value.username, color: value.color.toUpperCase() }
    }
  } catch {}
  return null
}

const cachedColor = shallowRef<CachedProfileColor | null>(readCachedColor())

export function getCachedProfileColor(username: string): string | null {
  return cachedColor.value?.username === username ? cachedColor.value.color : null
}

export function cacheProfileColor(user: { username: string; profile_color?: string }): void {
  if (!user.username || !/^[0-9a-f]{6}$/i.test(user.profile_color ?? '')) return
  const color = user.profile_color!.toUpperCase()
  if (getCachedProfileColor(user.username) === color) return
  cachedColor.value = { username: user.username, color }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedColor.value))
  } catch {}
}
