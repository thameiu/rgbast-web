import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { WorkingColor } from './usePaletteContext'

export interface HistorySnapshot {
  colors: WorkingColor[]
  selectedSnapshotId: number | null
  currentBranchId: number | null
  savedColorsSig: string
}

export interface UndoContext {
  colors: Ref<WorkingColor[]>
  selectedSnapshotId: Ref<number | null>
  currentBranchId: Ref<number | null>
  savedColorsSig: Ref<string>
}

// Build undo/redo state for PaletteView edits and returns actions.
export function usePaletteUndo(ctx: UndoContext) {
  const undoPast = ref<HistorySnapshot[]>([])
  const undoFuture = ref<HistorySnapshot[]>([])

  const canUndo = computed(() => undoPast.value.length > 0)
  const canRedo = computed(() => undoFuture.value.length > 0)

  // Capture the current editor state for undo in PaletteView.
  function captureForUndo(): void {
    undoPast.value.push({
      colors: ctx.colors.value.map(c => ({ ...c })),
      selectedSnapshotId: ctx.selectedSnapshotId.value,
      currentBranchId: ctx.currentBranchId.value,
      savedColorsSig: ctx.savedColorsSig.value,
    })
    undoFuture.value = []
    if (undoPast.value.length > 60) undoPast.value.shift()
  }

  // Restore a previously captured editor snapshot for PaletteView undo/redo.
  function restoreHistorySnapshot(snap: HistorySnapshot): void {
    ctx.colors.value = snap.colors.map(c => ({ ...c }))
    ctx.selectedSnapshotId.value = snap.selectedSnapshotId
    ctx.currentBranchId.value = snap.currentBranchId
    ctx.savedColorsSig.value = snap.savedColorsSig
  }

  // Undo the last PaletteView edit and move it to the redo stack.
  function doUndo(): void {
    if (!canUndo.value) return
    undoFuture.value.push({
      colors: ctx.colors.value.map(c => ({ ...c })),
      selectedSnapshotId: ctx.selectedSnapshotId.value,
      currentBranchId: ctx.currentBranchId.value,
      savedColorsSig: ctx.savedColorsSig.value,
    })
    restoreHistorySnapshot(undoPast.value.pop()!)
  }

  // Redo the last undone PaletteView edit.
  function doRedo(): void {
    if (!canRedo.value) return
    undoPast.value.push({
      colors: ctx.colors.value.map(c => ({ ...c })),
      selectedSnapshotId: ctx.selectedSnapshotId.value,
      currentBranchId: ctx.currentBranchId.value,
      savedColorsSig: ctx.savedColorsSig.value,
    })
    restoreHistorySnapshot(undoFuture.value.pop()!)
  }

  // Clear undo and redo stacks after PaletteView reloads.
  function clearHistory(): void {
    undoPast.value = []
    undoFuture.value = []
  }

  return {
    undoPast,
    undoFuture,
    canUndo,
    canRedo,
    captureForUndo,
    doUndo,
    doRedo,
    clearHistory,
  }
}
