import { onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export interface KeyboardContext {
  historyOpen: Ref<boolean>
  generateOpen: Ref<boolean>
}

export interface KeyboardActions {
  doUndo: () => void
  doRedo: () => void
  requestSave: () => void
  doGenerate: () => void
}

// Wire global keyboard shortcuts for PaletteView and ensure cleanup.
export function usePaletteKeyboard(ctx: KeyboardContext, actions: KeyboardActions) {
  let altHeld = false
  let undoPending = false
  let redoPending = false

  // Handle keydown events for PaletteView shortcuts.
  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Alt') {
      altHeld = true
      return
    }

    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
      e.preventDefault()
      e.stopImmediatePropagation()
      undoPending = true
      return
    }
    if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey))) {
      e.preventDefault()
      e.stopImmediatePropagation()
      redoPending = true
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
      e.preventDefault()
      e.stopImmediatePropagation()
      actions.requestSave()
      return
    }

    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
    if (['input', 'textarea', 'select'].includes(tag) || (e.target as HTMLElement)?.isContentEditable) return

    if (e.code === 'KeyH' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      ctx.historyOpen.value = !ctx.historyOpen.value
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

    if (e.code === 'KeyZ' && undoPending) {
      undoPending = false
      actions.doUndo()
      return
    }
    if ((e.code === 'KeyZ' || e.code === 'KeyY') && redoPending) {
      redoPending = false
      actions.doRedo()
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
