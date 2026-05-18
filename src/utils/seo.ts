const DEFAULT_DESCRIPTION =
  'RGBAST is an advanced palette generator and color versioning workspace: create palettes, branch snapshots, organize them in folders, share them, and explore the accessibility and color spaces of your favorite colors.'

const DEFAULT_KEYWORDS = [
  'RGB',
  'palette',
  'color palette',
  'palette generator',
  'color picker',
  '3D color picker',
  'design system',
  'brand colors',
  'accessibility contrast',
  'RGBAST',
]

const DEFAULT_SOCIAL_IMAGE = 'https://rgbast.com/preview.png'

export interface SeoMetaOptions {
  title: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  noindex?: boolean
}

function upsertMetaTag(selector: string, attrs: Record<string, string>, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(selector)
  if (!tag) {
    tag = document.createElement('meta')
    Object.entries(attrs).forEach(([key, value]) => tag!.setAttribute(key, value))
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function upsertLinkTag(selector: string, attrs: Record<string, string>, href: string): void {
  let tag = document.head.querySelector<HTMLLinkElement>(selector)
  if (!tag) {
    tag = document.createElement('link')
    Object.entries(attrs).forEach(([key, value]) => tag!.setAttribute(key, value))
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

function normalizeKeywords(keywords?: string[]): string {
  const merged = [...DEFAULT_KEYWORDS, ...(keywords ?? [])]
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const keyword of merged) {
    const value = keyword.trim()
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(value)
  }
  return normalized.join(', ')
}

function defaultCanonicalUrl(): string {
  const { origin, pathname, search } = window.location
  return `${origin}${pathname}${search}`
}

export function setPageSeo(options: SeoMetaOptions): void {
  const description = options.description?.trim() || DEFAULT_DESCRIPTION
  const keywords = normalizeKeywords(options.keywords)
  const image = options.image?.trim() || DEFAULT_SOCIAL_IMAGE
  const canonicalUrl = options.url?.trim() || defaultCanonicalUrl()
  const robots = options.noindex ? 'noindex, nofollow' : 'index, follow'

  document.title = options.title
  upsertMetaTag('meta[name="description"]', { name: 'description' }, description)
  upsertMetaTag('meta[name="keywords"]', { name: 'keywords' }, keywords)
  upsertMetaTag('meta[name="robots"]', { name: 'robots' }, robots)

  upsertMetaTag('meta[property="og:title"]', { property: 'og:title' }, options.title)
  upsertMetaTag('meta[property="og:description"]', { property: 'og:description' }, description)
  upsertMetaTag('meta[property="og:image"]', { property: 'og:image' }, image)
  upsertMetaTag('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl)

  upsertMetaTag('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image')
  upsertMetaTag('meta[name="twitter:title"]', { name: 'twitter:title' }, options.title)
  upsertMetaTag('meta[name="twitter:description"]', { name: 'twitter:description' }, description)
  upsertMetaTag('meta[name="twitter:image"]', { name: 'twitter:image' }, image)

  upsertLinkTag('link[rel="canonical"]', { rel: 'canonical' }, canonicalUrl)
}

export function setPageTitle(title: string): void {
  setPageSeo({ title })
}
