export const MAX_PALETTE_COLORS = 15
export const PALETTE_TITLE_PATTERN = /^[a-zA-Z0-9._-]+$/

export function getPaletteTitleError(title: string): string | null {
  const normalized = title.trim()
  if (!normalized) return 'Title is required.'
  if (!PALETTE_TITLE_PATTERN.test(normalized)) {
    return 'Title can only contain letters, numbers, dot, underscore, or hyphen.'
  }
  return null
}

export function isPaletteTitleValid(title: string): boolean {
  return getPaletteTitleError(title) === null
}
