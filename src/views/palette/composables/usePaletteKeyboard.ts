import { onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export interface KeyboardContext {
  generateOpen: Ref<boolean>
}

export interface KeyboardActions {
  doUndo: () => void
  doRedo: () => void
  requestSave: () => void
  doGenerate: () => void
  openImagePalette: () => void
  openEditPalette: () => void
  deleteLastColor: () => void
  deleteFirstColor: () => void
  openDeletePaletteModal: () => void
  historyLeft: () => void
  historyRight: () => void
  copyPalette: () => void
  pasteAddFromClipboard: () => Promise<void>
  pasteReplaceFromClipboard: () => Promise<void>
  openCheatSheet: () => void
  openShare: () => void
  openAccessibilityAudit: () => void
  toggleDisplaySettings: () => void
}

// Wire global keyboard shortcuts for PaletteView and ensure cleanup.
export function usePaletteKeyboard(ctx: KeyboardContext, actions: KeyboardActions) {
  let altHeld = false

  function keyOf(e: KeyboardEvent): string {
    return e.key.toLowerCase()
  }

  // Handle keydown events for PaletteView shortcuts.
  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Alt') {
      altHeld = true
      return
    }

    const key = keyOf(e)

    if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (!e.repeat) actions.doUndo()
      return
    }
    if ((e.ctrlKey || e.metaKey) && (key === 'y' || (key === 'z' && e.shiftKey))) {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (!e.repeat) actions.doRedo()
      return
    }
    if ((e.ctrlKey || e.metaKey) && key === 's' && e.shiftKey) {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (!e.repeat) actions.openEditPalette()
      return
    }
    if ((e.ctrlKey || e.metaKey) && key === 's') {
      e.preventDefault()
      e.stopImmediatePropagation()
      actions.requestSave()
      return
    }
    if ((e.ctrlKey || e.metaKey) && key === 'i' && !e.shiftKey && !e.altKey) {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (!e.repeat) actions.openImagePalette()
      return
    }

    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
    const isEditable = ['input', 'textarea', 'select'].includes(tag) || (e.target as HTMLElement)?.isContentEditable

    if ((e.ctrlKey || e.metaKey) && key === 'c' && !e.shiftKey && !e.altKey) {
      if (isEditable) return
      e.preventDefault()
      e.stopImmediatePropagation()
      if (!e.repeat) actions.copyPalette()
      return
    }

    if ((e.ctrlKey || e.metaKey) && key === 'v' && !e.altKey) {
      if (isEditable) return
      e.preventDefault()
      e.stopImmediatePropagation()
      if (e.shiftKey) {
        if (!e.repeat) void actions.pasteReplaceFromClipboard()
      } else {
        if (!e.repeat) void actions.pasteAddFromClipboard()
      }
      return
    }

    if (isEditable) return

    if (key === 'delete' && !e.metaKey) {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (e.ctrlKey) {
        if (!e.repeat) actions.openDeletePaletteModal()
      } else if (e.shiftKey) {
        if (!e.repeat) actions.deleteFirstColor()
      } else if (!e.altKey) {
        if (!e.repeat) actions.deleteLastColor()
      }
      return
    }

    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (!e.repeat) actions.historyLeft()
        return
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (!e.repeat) actions.historyRight()
        return
      }
    }

    if (e.code === 'KeyH' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (!e.repeat) actions.openCheatSheet()
      return
    }

    if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (!e.repeat) actions.openShare()
      return
    }

    if (e.code === 'KeyA' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (!e.repeat) actions.openAccessibilityAudit()
      return
    }

    if (e.code === 'KeyD' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (!e.repeat) actions.toggleDisplaySettings()
      return
    }

    if (e.code !== 'Space') return
    e.preventDefault()
    e.stopImmediatePropagation()
    if (!e.altKey && !e.shiftKey && !altHeld && !e.ctrlKey && !e.metaKey && !ctx.generateOpen.value) {
      actions.doGenerate()
    }
  }

  // Handle keyup events for PaletteView shortcuts.
  function onKeyup(e: KeyboardEvent): void {
    if (e.key === 'Alt') {
      altHeld = false
      return
    }

    if (e.code !== 'Space') return
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
    if (['input', 'textarea', 'select'].includes(tag) || (e.target as HTMLElement)?.isContentEditable) return
    if (e.altKey || e.shiftKey || altHeld) {
      e.preventDefault()
      e.stopImmediatePropagation()
      ctx.generateOpen.value = true
      altHeld = false
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', onKeydown, { capture: true })
    document.addEventListener('keyup', onKeyup, { capture: true })
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', onKeydown, { capture: true })
    document.removeEventListener('keyup', onKeyup, { capture: true })
  })
}
