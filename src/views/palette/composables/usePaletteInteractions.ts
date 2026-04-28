import { ref, nextTick } from 'vue'
import type { Ref } from 'vue'
import type { WorkingColor } from './usePaletteContext'

export interface InteractionContext {
  colors: Ref<WorkingColor[]>
  mkKey: () => string
}

export interface InteractionActions {
  captureForUndo: () => void
}

// Provide palette column editing and drag/drop interactions for PaletteView.
export function usePaletteInteractions(ctx: InteractionContext, actions: InteractionActions) {
  const showAddBtn = ref(false)
  const swapSourceIdx = ref<number | null>(null)
  const draggedIdx = ref<number | null>(null)
  const colsAreaEl = ref<HTMLElement | null>(null)
  const dragPointerStartX = ref<number | null>(null)
  const dragPointerStartY = ref<number | null>(null)
  const ghostEl = ref<HTMLDivElement | null>(null)
  const ghostOffsetX = ref(0)
  const ghostOffsetY = ref(0)

  let hexLabelEditing = false
  let hexLabelEditTimer: ReturnType<typeof setTimeout> | null = null

  // Toggle the add button visibility based on pointer position in the columns area.
  function onColsMouseMove(e: MouseEvent): void {
    if (!colsAreaEl.value) return
    const rect = colsAreaEl.value.getBoundingClientRect()
    showAddBtn.value = e.clientX > rect.right - 72
  }

  // Hide the add button when the pointer leaves the columns area.
  function hideAddButton(): void {
    showAddBtn.value = false
  }

  // Start a debounced edit session so typing only stores one undo entry.
  function startHexLabelEdit(): void {
    if (!hexLabelEditing) {
      hexLabelEditing = true
      actions.captureForUndo()
    }
    if (hexLabelEditTimer) clearTimeout(hexLabelEditTimer)
    hexLabelEditTimer = setTimeout(() => {
      hexLabelEditing = false
      hexLabelEditTimer = null
    }, 1500)
  }

  // Update a color hex value in PaletteView and register it for undo.
  function updateHex(i: number, hex: string): void {
    startHexLabelEdit()
    const c = ctx.colors.value[i]
    if (c) ctx.colors.value[i] = { ...c, hex }
  }

  // Update a color label in PaletteView and register it for undo.
  function updateLabel(i: number, label: string | null): void {
    startHexLabelEdit()
    const c = ctx.colors.value[i]
    if (c) ctx.colors.value[i] = { ...c, label }
  }

  // Remove a color column from the palette editor.
  function removeColor(i: number): void {
    if (ctx.colors.value.length <= 1) return
    actions.captureForUndo()
    ctx.colors.value.splice(i, 1)
  }

  // Add a new random color to the palette editor.
  function addColor(): void {
    actions.captureForUndo()
    ctx.colors.value.push({ hex: randomHex(), label: null, _key: ctx.mkKey() })
  }

  // Determine if PaletteView is currently in the mobile layout.
  function isMobileLayout(): boolean {
    return window.matchMedia('(max-width: 768px)').matches
  }

  // Calculate the column size used to translate drag distance into index changes.
  function getDragUnit(): number {
    if (!colsAreaEl.value || ctx.colors.value.length === 0) return 1
    const firstCol = colsAreaEl.value.querySelector<HTMLElement>('.col')
    if (firstCol) {
      const rect = firstCol.getBoundingClientRect()
      return Math.max(1, isMobileLayout() ? rect.height : rect.width)
    }
    const rect = colsAreaEl.value.getBoundingClientRect()
    return Math.max(1, isMobileLayout() ? rect.height / ctx.colors.value.length : rect.width / ctx.colors.value.length)
  }

  // Provide inline style overrides during drag for PaletteView columns.
  function getColStyle(i: number): Record<string, string> {
    if (draggedIdx.value === i) return { opacity: '0' }
    return {}
  }

  // Handle tap-to-swap logic for PaletteView mobile interactions.
  function onSwapTap(i: number): void {
    if (swapSourceIdx.value === null) {
      swapSourceIdx.value = i
    } else if (swapSourceIdx.value === i) {
      swapSourceIdx.value = null
    } else {
      actions.captureForUndo()
      const arr = [...ctx.colors.value]
      const tmp = arr[swapSourceIdx.value]!
      arr[swapSourceIdx.value] = arr[i]!
      arr[i] = tmp
      ctx.colors.value = arr
      swapSourceIdx.value = null
    }
  }

  // Begin drag and drop for a palette column and create a ghost element.
  function onDragStart(i: number, e: PointerEvent): void {
    actions.captureForUndo()
    const key = ctx.colors.value[i]?._key
    if (key && colsAreaEl.value) {
      const colEl = colsAreaEl.value.querySelector<HTMLElement>(`.col[data-col-key="${key}"]`)
      if (colEl) {
        const rect = colEl.getBoundingClientRect()
        ghostOffsetX.value = e.clientX - rect.left
        ghostOffsetY.value = e.clientY - rect.top

        const ghost = colEl.cloneNode(true) as HTMLDivElement
        ghost.style.position = 'fixed'
        ghost.style.left = rect.left + 'px'
        ghost.style.top = rect.top + 'px'
        ghost.style.width = rect.width + 'px'
        ghost.style.height = rect.height + 'px'
        ghost.style.zIndex = '9999'
        ghost.style.pointerEvents = 'none'
        ghost.style.cursor = 'grabbing'
        ghost.style.margin = '0'
        ghost.style.flexGrow = '0'
        ghost.style.flexShrink = '0'
        ghost.style.boxShadow = 'none'
        ghost.style.transition = 'none'
        document.body.appendChild(ghost)
        ghostEl.value = ghost
      }
    }

    draggedIdx.value = i
    dragPointerStartX.value = e.clientX
    dragPointerStartY.value = e.clientY
    ;(e.target as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
    e.preventDefault()

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointercancel', onPointerUp, { once: true })
    document.addEventListener('pointerup', onPointerUp, { once: true })
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'
  }

  // Update the drag ghost position and reorder columns in flight.
  function onPointerMove(e: PointerEvent): void {
    if (draggedIdx.value === null) return
    e.preventDefault()

    const mobile = isMobileLayout()

    if (ghostEl.value) {
      if (mobile) {
        ghostEl.value.style.top = `${e.clientY - ghostOffsetY.value}px`
      } else {
        ghostEl.value.style.left = `${e.clientX - ghostOffsetX.value}px`
      }
    }

    const unit = getDragUnit()
    const pointer = mobile ? e.clientY : e.clientX
    let idx = draggedIdx.value
    let start = mobile ? (dragPointerStartY.value ?? pointer) : (dragPointerStartX.value ?? pointer)
    let delta = pointer - start

    while (delta > unit / 2 && idx < ctx.colors.value.length - 1) {
      const arr = [...ctx.colors.value]
      const moved = arr.splice(idx, 1)[0]
      if (!moved) break
      arr.splice(idx + 1, 0, moved)
      ctx.colors.value = arr
      idx += 1
      start += unit
      delta -= unit
    }

    while (delta < -unit / 2 && idx > 0) {
      const arr = [...ctx.colors.value]
      const moved = arr.splice(idx, 1)[0]
      if (!moved) break
      arr.splice(idx - 1, 0, moved)
      ctx.colors.value = arr
      idx -= 1
      start -= unit
      delta += unit
    }

    draggedIdx.value = idx
    if (mobile) {
      dragPointerStartY.value = start
    } else {
      dragPointerStartX.value = start
    }
  }

  // Complete the drag interaction and animate the ghost into place.
  async function onPointerUp(): Promise<void> {
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointercancel', onPointerUp)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    dragPointerStartX.value = null
    dragPointerStartY.value = null

    const ghost = ghostEl.value
    const idx = draggedIdx.value

    if (!ghost || idx === null) {
      if (ghost?.parentNode) document.body.removeChild(ghost)
      ghostEl.value = null
      draggedIdx.value = null
      return
    }

    await nextTick()

    const key = ctx.colors.value[idx]?._key
    const colEl = key ? colsAreaEl.value?.querySelector<HTMLElement>(`.col[data-col-key="${key}"]`) : null

    if (!colEl) {
      if (ghost.parentNode) document.body.removeChild(ghost)
      ghostEl.value = null
      draggedIdx.value = null
      return
    }

    const finalRect = colEl.getBoundingClientRect()
    const mobile = isMobileLayout()
    const animProp = mobile ? 'top' : 'left'

    let cleanedUp = false
    const cleanup = () => {
      if (cleanedUp) return
      cleanedUp = true
      if (ghost.parentNode) document.body.removeChild(ghost)
      ghostEl.value = null
      draggedIdx.value = null
    }

    ghost.addEventListener('transitionend', (evt: TransitionEvent) => {
      if (evt.propertyName === animProp || evt.propertyName === 'opacity') cleanup()
    })
    setTimeout(cleanup, 300)

    ghost.style.transition = `${animProp} 0.18s cubic-bezier(0.2,0.9,0.2,1)`
    if (mobile) {
      ghost.style.top = `${finalRect.top}px`
    } else {
      ghost.style.left = `${finalRect.left}px`
    }
  }

  // Create a random uppercase hex string for new palette colors.
  function randomHex(): string {
    return Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase()
  }

  return {
    showAddBtn,
    swapSourceIdx,
    draggedIdx,
    colsAreaEl,
    onColsMouseMove,
    hideAddButton,
    updateHex,
    updateLabel,
    removeColor,
    addColor,
    getColStyle,
    onSwapTap,
    onDragStart,
  }
}
