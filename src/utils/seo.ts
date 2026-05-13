function upsertMetaTag(selector: string, attrs: Record<string, string>, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(selector)
  if (!tag) {
    tag = document.createElement('meta')
    Object.entries(attrs).forEach(([key, value]) => tag!.setAttribute(key, value))
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export function setPageTitle(title: string): void {
  document.title = title
  upsertMetaTag('meta[property="og:title"]', { property: 'og:title' }, title)
  upsertMetaTag('meta[name="twitter:title"]', { name: 'twitter:title' }, title)
}
