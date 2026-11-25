function animateColumnSize(el: Element, done: () => void, entering: boolean): void {
  const element = el as HTMLElement
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { done(); return }
  const mobile = window.matchMedia('(max-width: 768px)').matches
  const property = mobile ? 'height' : 'flex-basis'
  const rect = element.getBoundingClientRect()
  const size = mobile ? rect.height : rect.width
  element.style.setProperty(property, `${entering ? 0 : size}px`)
  element.style.flexGrow = '0'
  element.style.flexShrink = '0'
  element.style.minWidth = '0'
  element.style.overflow = 'hidden'
  element.style.transition = 'none'
  element.offsetWidth
  element.style.transition = `${property} ${entering ? '.3s cubic-bezier(.2,.9,.2,1)' : '.18s cubic-bezier(.4,0,1,1)'}`
  element.style.setProperty(property, `${entering ? size : 0}px`)
  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    clearTimeout(timeout)
    element.removeEventListener('transitionend', onTransitionEnd)
    for (const name of [property, 'flex-grow', 'flex-shrink', 'min-width', 'overflow', 'transition']) element.style.removeProperty(name)
    done()
  }
  const onTransitionEnd = (event: TransitionEvent) => {
    if (event.target === element && event.propertyName === property) finish()
  }
  const timeout = setTimeout(finish, entering ? 360 : 240)
  element.addEventListener('transitionend', onTransitionEnd)
}

export function enterPaletteColumn(el: Element, done: () => void): void { animateColumnSize(el, done, true) }
export function leavePaletteColumn(el: Element, done: () => void): void { animateColumnSize(el, done, false) }
