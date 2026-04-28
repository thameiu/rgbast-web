import { ref, computed } from 'vue'
import { palettesApi } from '@/api/palettes'
import type { PaletteColorSave } from '@/api/types'
import type { PaletteContext } from './usePaletteContext'

export interface SaveActions {
  loadHistory: () => Promise<void>
  clearHistory: () => void
}

// Handle palette save, merge, delete, and revert flows for PaletteView.
export function usePaletteSave(ctx: PaletteContext, actions: SaveActions) {
  const saveComment = ref('')
  const saveError = ref('')
  const createNewBranch = ref(false)
  const newBranchName = ref('')
  const isSaving = ref(false)

  const mergeTargetId = ref<number | null>(null)
  const mergeTargetName = ref('')
  const isMerging = ref(false)
  const mergeError = ref('')

  const showDeletePaletteModal = ref(false)
  const isDeletingPalette = ref(false)
  const deletePaletteError = ref('')

  const deleteBranchTargetId = ref<number | null>(null)
  const deleteBranchTargetName = ref('')
  const isDeletingBranch = ref(false)
  const deleteBranchError = ref('')

  const showRevertModal = ref(false)
  const isReverting = ref(false)
  const revertError = ref('')

  const revertableSnapshotCount = computed(() => {
    if (!ctx.selectedSnapshotId.value) return 0
    const c = ctx.selectedSnapshotCtx.value
    if (c?.isMerged) return 0

    if (c?.isMain) {
      const idx = (ctx.history.value?.main ?? []).findIndex(s => s.id === ctx.selectedSnapshotId.value)
      return Math.max(0, idx)
    }

    if (c && !c.isMain) {
      const branch = ctx.history.value?.branches.find(b => b.id === c.branchId)
      if (!branch) return 0
      const idx = branch.snapshots.findIndex(s => s.id === ctx.selectedSnapshotId.value)
      return Math.max(0, idx)
    }

    return 0
  })

  const revertTargetLabel = computed(() => {
    const c = ctx.selectedSnapshotCtx.value
    if (!c) return ''
    if (c.isMain) return 'main'
    return `branch "${c.branchTitle}"`
  })

  // Open the save modal or auth modal depending on login state.
  function requestSave(): void {
    if (ctx.currentBranchId.value !== null) createNewBranch.value = false
    if (!localStorage.getItem('access_token')) {
      ctx.showAuthModal.value = true
    } else {
      ctx.showSaveModal.value = true
    }
  }

  // Continue into the save modal after successful authentication.
  function onAuthenticated(): void {
    ctx.showAuthModal.value = false
    ctx.showSaveModal.value = true
  }

  // Save the current palette snapshot or create a new palette.
  async function doSave(): Promise<void> {
    if (ctx.isNewPalette.value ? !ctx.pendingTitle.value.trim() : !saveComment.value.trim()) return
    isSaving.value = true
    saveError.value = ''
    try {
      const paletteColors: PaletteColorSave[] = ctx.colors.value.map(c => ({ hex: c.hex, label: c.label ?? null }))

      if (ctx.isNewPalette.value) {
        const created = await palettesApi.create({
          title: ctx.pendingTitle.value.trim() || 'New palette',
          description: '',
          palette_colors: paletteColors,
        })
        palettesApi.cachePalette({
          id: created.id,
          title: created.title,
          created_at: created.created_at,
          palette_colors: paletteColors,
        })
        ctx.showSaveModal.value = false
        await ctx.router.replace({ name: 'palette', params: { id: created.id } })
        await actions.loadHistory()
        return
      }

      let payload: Parameters<typeof palettesApi.saveSnapshot>[1]

      if (ctx.selectedSnapshotCtx.value?.isMain && !ctx.isSelectedLatestMainSnapshot.value) {
        payload = {
          comment: saveComment.value.trim(),
          palette_colors: paletteColors,
          create_branch: true,
          branch_title: newBranchName.value.trim() || undefined,
          parent_snapshot_id: ctx.selectedSnapshotId.value,
        }
      } else if (ctx.selectedSnapshotCtx.value && !ctx.selectedSnapshotCtx.value.isMain) {
        if (ctx.selectedSnapshotCtx.value.isMerged) {
          payload = {
            comment: saveComment.value.trim(),
            palette_colors: paletteColors,
            create_branch: true,
            branch_title: newBranchName.value.trim() || undefined,
            parent_snapshot_id: ctx.selectedSnapshotId.value,
          }
        } else {
          payload = {
            comment: saveComment.value.trim(),
            palette_colors: paletteColors,
            branch_id: ctx.selectedSnapshotCtx.value.branchId,
          }
        }
      } else {
        payload = {
          comment: saveComment.value.trim(),
          palette_colors: paletteColors,
          ...(createNewBranch.value
            ? { create_branch: true, branch_title: newBranchName.value.trim() || undefined }
            : { branch_id: ctx.currentBranchId.value ?? undefined }),
        }
      }

      const resp = await palettesApi.saveSnapshot(ctx.paletteId.value, payload)

      if (
        ((ctx.selectedSnapshotCtx.value?.isMain && !ctx.isSelectedLatestMainSnapshot.value) ||
          ctx.selectedSnapshotCtx.value?.isMerged ||
          createNewBranch.value) &&
        resp.branch_id !== null
      ) {
        ctx.currentBranchId.value = resp.branch_id
      }

      ctx.selectedSnapshotId.value = null
      await actions.loadHistory()
      ctx.showSaveModal.value = false
      saveComment.value = ''
      createNewBranch.value = false
      newBranchName.value = ''
      actions.clearHistory()
    } catch (e: any) {
      saveError.value = e.message ?? 'Save failed'
    } finally {
      isSaving.value = false
    }
  }

  // Prepare merge confirmation modal for the given branch id.
  function confirmMerge(branchId: number): void {
    const branch = ctx.history.value?.branches.find(b => b.id === branchId)
    if (!branch) return
    mergeTargetId.value = branchId
    mergeTargetName.value = branch.title
    mergeError.value = ''
  }

  // Merge the selected branch into main for PaletteView.
  async function doMerge(): Promise<void> {
    if (mergeTargetId.value === null) return
    isMerging.value = true
    mergeError.value = ''
    try {
      await palettesApi.mergeBranch(ctx.paletteId.value, mergeTargetId.value)
      mergeTargetId.value = null
      ctx.currentBranchId.value = null
      await actions.loadHistory()
    } catch (e: any) {
      mergeError.value = e.message ?? 'Merge failed'
    } finally {
      isMerging.value = false
    }
  }

  // Delete the active palette and navigate back to the dashboard.
  async function doDeletePalette(): Promise<void> {
    isDeletingPalette.value = true
    deletePaletteError.value = ''
    try {
      await palettesApi.deletePalette(ctx.paletteId.value)
      showDeletePaletteModal.value = false
      ctx.router.push('/dashboard')
    } catch (e: any) {
      deletePaletteError.value = e.message ?? 'Delete failed'
    } finally {
      isDeletingPalette.value = false
    }
  }

  // Open the delete-branch modal for the selected branch.
  function onDeleteBranchRequest(branchId: number): void {
    const branch = ctx.history.value?.branches.find(b => b.id === branchId)
    if (!branch) return
    deleteBranchTargetId.value = branchId
    deleteBranchTargetName.value = branch.title
    deleteBranchError.value = ''
  }

  // Delete a branch and refresh PaletteView history.
  async function doDeleteBranch(): Promise<void> {
    if (deleteBranchTargetId.value === null) return
    isDeletingBranch.value = true
    deleteBranchError.value = ''
    try {
      await palettesApi.deleteBranch(ctx.paletteId.value, deleteBranchTargetId.value)
      if (ctx.currentBranchId.value === deleteBranchTargetId.value) ctx.currentBranchId.value = null
      deleteBranchTargetId.value = null
      await actions.loadHistory()
    } catch (e: any) {
      deleteBranchError.value = e.message ?? 'Delete failed'
    } finally {
      isDeletingBranch.value = false
    }
  }

  // Revert the selected branch or main to the currently selected snapshot.
  async function doRevert(): Promise<void> {
    const c = ctx.selectedSnapshotCtx.value
    if (!ctx.selectedSnapshotId.value) return
    isReverting.value = true
    revertError.value = ''
    try {
      if (c?.isMain) {
        await palettesApi.revertMainToSnapshot(ctx.paletteId.value, ctx.selectedSnapshotId.value)
        ctx.currentBranchId.value = null
      } else if (c && !c.isMain && c.branchId) {
        await palettesApi.revertBranchToSnapshot(ctx.paletteId.value, c.branchId, ctx.selectedSnapshotId.value)
        ctx.currentBranchId.value = c.branchId
      }
      showRevertModal.value = false
      ctx.selectedSnapshotId.value = null
      await actions.loadHistory()
    } catch (e: any) {
      revertError.value = e.message ?? 'Revert failed'
    } finally {
      isReverting.value = false
    }
  }

  return {
    saveComment,
    saveError,
    createNewBranch,
    newBranchName,
    isSaving,
    mergeTargetId,
    mergeTargetName,
    isMerging,
    mergeError,
    showDeletePaletteModal,
    isDeletingPalette,
    deletePaletteError,
    deleteBranchTargetId,
    deleteBranchTargetName,
    isDeletingBranch,
    deleteBranchError,
    showRevertModal,
    isReverting,
    revertError,
    revertableSnapshotCount,
    revertTargetLabel,
    requestSave,
    onAuthenticated,
    doSave,
    confirmMerge,
    doMerge,
    doDeletePalette,
    onDeleteBranchRequest,
    doDeleteBranch,
    doRevert,
  }
}
