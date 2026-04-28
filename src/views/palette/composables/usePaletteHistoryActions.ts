import type { Ref } from 'vue'
import type { PaletteContext } from './usePaletteContext'

export interface HistoryActionsContext {
  ctx: PaletteContext
  showDemoHistory: Readonly<{ value: boolean }>
  captureForUndo: () => void
  switchBranch: (id: number | null) => void | Promise<void>
  onDeleteBranchRequest: (id: number) => void
  revertableSnapshotCount: Readonly<{ value: number }>
  showRevertModal: Ref<boolean>
}

// Provide history panel actions for PaletteView history and demo states.
export function usePaletteHistoryActions(opts: HistoryActionsContext) {
  // Handle snapshot selection in the history panel.
  function onHistorySelectSnapshot(id: number): void {
    if (opts.showDemoHistory.value) return
    opts.captureForUndo()
    opts.ctx.onSelectSnapshot(id)
  }

  // Handle branch selection in the history panel.
  function onHistorySelectBranch(id: number): void {
    if (opts.showDemoHistory.value) return
    void opts.switchBranch(id === 0 ? null : id)
  }

  // Handle branch delete request from the history panel.
  function onHistoryDeleteBranch(id: number): void {
    if (opts.showDemoHistory.value) return
    opts.onDeleteBranchRequest(id)
  }

  // Handle revert requests from the history panel.
  function onHistoryRevertSnapshot(id: number): void {
    if (opts.showDemoHistory.value) return
    if (opts.ctx.selectedSnapshotId.value !== id) {
      opts.ctx.selectedSnapshotId.value = id
    }
    if (!opts.ctx.isOwned.value || opts.revertableSnapshotCount.value <= 0) return
    opts.showRevertModal.value = true
  }

  return {
    onHistorySelectSnapshot,
    onHistorySelectBranch,
    onHistoryDeleteBranch,
    onHistoryRevertSnapshot,
  }
}
