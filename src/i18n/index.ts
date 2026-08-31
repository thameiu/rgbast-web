import { computed, ref } from 'vue'
import en from './en.json'
import fr from './fr.json'

export type Locale = 'en' | 'fr'

const STORAGE_KEY = 'rgbast_locale'
const dictionaries = { en, fr } as const

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'fr') return stored
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export const locale = ref<Locale>(detectLocale())

function applyLocale(next: Locale): void {
  document.documentElement.lang = next
}

applyLocale(locale.value)

export function setLocale(next: Locale): void {
  locale.value = next
  localStorage.setItem(STORAGE_KEY, next)
  applyLocale(next)
}

function readPath(source: unknown, key: string): string | null {
  return key.split('.').reduce<unknown>((value, part) => {
    if (!value || typeof value !== 'object') return undefined
    return (value as Record<string, unknown>)[part]
  }, source) as string | null
}

export function translate(key: string, params?: Record<string, string | number>): string {
  const value = readPath(dictionaries[locale.value], key) ?? readPath(dictionaries.en, key) ?? key
  if (typeof value !== 'string') return key
  if (!params) return value
  return Object.entries(params).reduce(
    (text, [param, replacement]) => text.replaceAll(`{${param}}`, String(replacement)),
    value,
  )
}

export function useI18n() {
  return {
    locale,
    localeLabel: computed(() => (locale.value === 'fr' ? 'FR' : 'EN')),
    setLocale,
    t: translate,
  }
}
