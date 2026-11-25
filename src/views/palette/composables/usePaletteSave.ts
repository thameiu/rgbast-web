import { ref, computed, watch } from 'vue'
import { ApiError } from '@/api/client'
import { projectUrl, projectsApi, type Project } from '@/api/projects'
import { foldersApi } from '@/api/folders'
import { useI18n } from '@/i18n'
import type { ProjectContentOption } from '@/components/project/ProjectContentSelect.vue'
import type { PaletteConflict } from '@/components/palette/PaletteConflictModal.vue'
import { palettesApi } from '@/api/palettes'
import { paletteDraftsApi } from '@/api/paletteDrafts'
import type { PaletteColorSave, PaletteUpdate, FolderResponse } from '@/api/types'
import type { PaletteContext } from './usePaletteContext'
import { getPaletteTitleError, MAX_PALETTE_COLORS } from '@/utils/paletteConstraints'

export interface SaveActions {
  loadHistory: () => Promise<void>
  clearHistory: () => void
}

function getTokenUsername(): string | null {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
    const payload = JSON.parse(atob(normalized + pad))
    return payload?.sub ?? null
  } catch {
    return null
  }
}

// Handle palette save, merge, delete, and revert flows for PaletteView.
export function usePaletteSave(ctx: PaletteContext, actions: SaveActions) {
  const { t } = useI18n()
  const destinationProject = ref<Project | null>(ctx.project.value)
  const destinationFolderId = ref<number | null>(ctx.pendingFolderId.value)
  const destinationFolders = ref<FolderResponse[]>([]), writableProjects = ref<Project[]>([])
  const destinationLoading = ref(false), destinationError = ref('')
  const destinationProjectId = computed(() => destinationProject.value?.id ?? null)
  const destinationOptions = computed<ProjectContentOption[]>(() => [
    { id: null, title: t('bookmarksPage.personal') },
    ...writableProjects.value.map(project => ({ id: project.id, title: project.title, subtitle: project.creator_username })),
  ])
  const canCreateDestinationFolder = computed(() => !destinationProject.value || destinationProject.value.permissions.includes('manage_folders'))
  let destinationRequest = 0
  watch(ctx.showSaveModal, async open => {
    const request = ++destinationRequest
    if (!open || !ctx.isNewPalette.value) { destinationLoading.value = false; return }
    destinationProject.value = ctx.project.value
    destinationFolderId.value = ctx.pendingFolderId.value
    destinationFolders.value = ctx.folders.value
    destinationError.value = ''; destinationLoading.value = true
    try {
      const projects = await projectsApi.mine()
      if (request !== destinationRequest) return
      writableProjects.value = projects.filter(project => project.permissions.includes('add_palettes'))
      const current = destinationProject.value
      if (current && !writableProjects.value.some(project => project.id === current.id)) writableProjects.value.push(current)
    } catch (e) { if (request === destinationRequest) destinationError.value = e instanceof Error ? e.message : String(e) }
    finally { if (request === destinationRequest) destinationLoading.value = false }
  })
  async function selectDestination(id: number | null) {
    if (isSaving.value || destinationLoading.value) return
    const project = id === null ? null : writableProjects.value.find(item => item.id === id)
    if (project === undefined) return
    const request = ++destinationRequest
    destinationProject.value = project; destinationFolderId.value = null; destinationFolders.value = []
    destinationLoading.value = true; destinationError.value = ''
    try {
      const folders = project ? await projectsApi.folders(project.id) : await foldersApi.getByUsername(getTokenUsername() ?? ctx.username.value)
      if (request === destinationRequest) destinationFolders.value = folders
    } catch (e) { if (request === destinationRequest) destinationError.value = e instanceof Error ? e.message : String(e) }
    finally { if (request === destinationRequest) destinationLoading.value = false }
  }
  async function createDestinationFolder(payload: { name: string; parentId: number | null }) {
    if (isSaving.value || destinationLoading.value || !canCreateDestinationFolder.value) return
    const request = ++destinationRequest, project = destinationProject.value
    destinationLoading.value = true; destinationError.value = ''
    try {
      const data = { name: payload.name, parent_folder_id: payload.parentId }
      const folder = project ? await projectsApi.createFolder(project.id, data) : await foldersApi.create(data)
      if (request === destinationRequest) { destinationFolders.value = [...destinationFolders.value, folder]; destinationFolderId.value = folder.id }
    } catch (e) { if (request === destinationRequest) destinationError.value = e instanceof Error ? e.message : String(e) }
    finally { if (request === destinationRequest) destinationLoading.value = false }
  }
  const saveComment = ref('')
  const saveError = ref('')
  const createNewBranch = ref(false)
  const newBranchName = ref('')
  const isSaving = ref(false)
  const conflict = ref<PaletteConflict | null>(null)
  const conflictBase = ref<number | null>(null)
  const conflictBranch = ref<number | null>(null)
  const forceBranch = ref(false)

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

  const showEditModal = ref(false)
  const isEditing = ref(false)
  const editError = ref('')
  const editTitle = ref('')
  const editDescription = ref('')
  const editFolderId = ref<number | null>(null)

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
    if (!ctx.isOwned.value) return
    if (!ctx.hasUnsavedChanges.value) return
    if (ctx.currentBranchId.value !== null) createNewBranch.value = false
    if (!localStorage.getItem('access_token')) {
      ctx.showAuthModal.value = true
    } else {
      ctx.showSaveModal.value = true
    }
  }

  // Continue into the save modal after successful authentication.
  async function onAuthenticated(): Promise<void> {
    const authUsername = getTokenUsername()
    await ctx.loadFolders(authUsername)
    ctx.showAuthModal.value = false
    ctx.showSaveModal.value = true
  }

  // Save the current palette snapshot or create a new palette.
  async function doSave(): Promise<void> {
    if (isSaving.value || (ctx.isNewPalette.value && (destinationLoading.value || destinationError.value))) return
    if (ctx.isNewPalette.value && !ctx.pendingTitle.value.trim()) return
    if (ctx.colors.value.length > MAX_PALETTE_COLORS) {
      saveError.value = `Palette cannot contain more than ${MAX_PALETTE_COLORS} colors.`
      return
    }
    if (ctx.isNewPalette.value) {
      const titleError = getPaletteTitleError(ctx.pendingTitle.value)
      if (titleError) {
        saveError.value = titleError
        return
      }
    }
    isSaving.value = true
    saveError.value = ''
    try {
      const paletteColors: PaletteColorSave[] = ctx.colors.value.map(c => ({ hex: c.hex, label: c.label ?? null }))

      if (ctx.isNewPalette.value) {
        const project = destinationProject.value
        if (project && !project.permissions.includes('add_palettes')) {
          throw new Error('You do not have permission to add palettes to this project.')
        }
        const oldDraftKey = ctx.draftKey.value
        const created = await palettesApi.create({
          ...(project ? { project_id: project.id } : {}),
          title: ctx.pendingTitle.value.trim() || 'New palette',
          description: ctx.pendingDescription.value.trim(),
          folder_id: destinationFolderId.value ?? null,
          palette_colors: paletteColors,
        })
        if (!project) palettesApi.cachePalette({
          id: created.id,
          title: created.title,
          description: created.description,
          folder_id: created.folder_id,
          folder_path: created.folder_path,
          created_at: created.created_at,
          palette_colors: paletteColors,
        })
        ctx.showSaveModal.value = false
        ctx.pendingDescription.value = ''
        ctx.pendingFolderId.value = null
        paletteDraftsApi.removeDraft(oldDraftKey)
        const pathMatch = [...created.folder_path, created.title].join('/')
        const ownerUsername = getTokenUsername() ?? ctx.username.value
        ctx.preserveNextRouteLoad.value = true
        await ctx.router.replace(project
          ? { name: 'project-palette', params: { username: project.creator_username, projectSlug: project.slug, pathMatch: pathMatch.split('/') } }
          : { name: 'palette', params: { username: ownerUsername, pathMatch: pathMatch.split('/') } })

        await actions.loadHistory()
        return
      }

      if (ctx.paletteId.value === null) {
        throw new Error('Palette is not ready yet')
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

      payload.parent_snapshot_id = conflictBase.value ?? ctx.selectedSnapshotId.value ?? ctx.latestSnapshotId.value
      if (conflictBase.value !== null) {
        payload.create_branch = forceBranch.value
        payload.branch_id = forceBranch.value ? undefined : conflictBranch.value ?? undefined
      }
      const resp = await palettesApi.saveSnapshot(ctx.paletteId.value, payload)
      if (forceBranch.value && resp.branch_id !== null) ctx.currentBranchId.value = resp.branch_id
      conflict.value = null
      conflictBase.value = null
      forceBranch.value = false

      if (
        ((ctx.selectedSnapshotCtx.value?.isMain && !ctx.isSelectedLatestMainSnapshot.value) ||
          ctx.selectedSnapshotCtx.value?.isMerged ||
          createNewBranch.value) &&
        resp.branch_id !== null
      ) {
        ctx.currentBranchId.value = resp.branch_id
      }

      ctx.selectedSnapshotId.value = null
      paletteDraftsApi.removeByPaletteId(ctx.paletteId.value)
      paletteDraftsApi.removeDraft(ctx.draftKey.value)

      await actions.loadHistory()
      ctx.showSaveModal.value = false
      saveComment.value = ''
      createNewBranch.value = false
      newBranchName.value = ''
      actions.clearHistory()
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409 && (e.detail as PaletteConflict)?.code === 'palette_conflict') {
        saveError.value = ''
        conflict.value = e.detail as PaletteConflict
        ctx.showSaveModal.value = false
      } else {
        saveError.value = e.message ?? 'Save failed'
      }
    } finally {
      ctx.preserveNextRouteLoad.value = false
      isSaving.value = false
    }
  }

  async function resolveConflict(colors: PaletteColorSave[], branch: boolean): Promise<void> {
    const state = conflict.value
    if (!state || colors.length > MAX_PALETTE_COLORS) return
    conflictBase.value = branch ? state.base?.id ?? state.latest?.id ?? null : state.latest?.id ?? null
    conflictBranch.value = state.latest?.branch_id ?? null
    forceBranch.value = branch
    ctx.colors.value = colors.map(c => ({ ...c, label: c.label ?? null, _key: ctx.mkKey() }))
    await doSave()
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
      if (ctx.paletteId.value === null) throw new Error('Palette is not ready yet')
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
      if (ctx.paletteId.value === null) throw new Error('Palette is not ready yet')
      await palettesApi.deletePalette(ctx.paletteId.value)
      paletteDraftsApi.removeByPaletteId(ctx.paletteId.value)
      paletteDraftsApi.removeDraft(ctx.draftKey.value)
      showDeletePaletteModal.value = false
      ctx.router.push(ctx.history.value?.project ? projectUrl(ctx.history.value.project) : '/dashboard')
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
      if (ctx.paletteId.value === null) throw new Error('Palette is not ready yet')
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
        if (ctx.paletteId.value === null) throw new Error('Palette is not ready yet')
        await palettesApi.revertMainToSnapshot(ctx.paletteId.value, ctx.selectedSnapshotId.value)
        ctx.currentBranchId.value = null
      } else if (c && !c.isMain && c.branchId) {
        if (ctx.paletteId.value === null) throw new Error('Palette is not ready yet')
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

  function openEditPalette(): void {
    if (!ctx.history.value) return
    editTitle.value = ctx.history.value.title
    editDescription.value = ctx.history.value.description ?? ''
    editFolderId.value = ctx.historyFolderId.value
    editError.value = ''
    showEditModal.value = true
  }

  async function doEditPalette(): Promise<void> {
    if (ctx.paletteId.value === null) return
    const titleError = editTitle.value.trim() ? getPaletteTitleError(editTitle.value) : null
    if (titleError) {
      editError.value = titleError
      return
    }
    isEditing.value = true
    editError.value = ''
    try {
      const payload: PaletteUpdate = {
        title: editTitle.value.trim() || undefined,
        description: editDescription.value.trim(),
        folder_id: editFolderId.value ?? null,
      }
      const updated = await palettesApi.updatePalette(ctx.paletteId.value, payload)

      if (!ctx.history.value?.project) palettesApi.cachePalette({
        id: updated.id,
        title: updated.title,
        description: updated.description,
        folder_id: updated.folder_id,
        folder_path: updated.folder_path,
        created_at: updated.created_at,
        palette_colors: ctx.colors.value.map(c => ({ hex: c.hex, label: c.label ?? null })),
      })

      const pathMatch = [...updated.folder_path, updated.title].join('/')
      const ownerUsername = ctx.history.value?.owner_username ?? getTokenUsername() ?? ctx.username.value
      ctx.preserveNextRouteLoad.value = true
      if (ctx.history.value?.project) await ctx.router.replace(`${projectUrl(ctx.history.value.project)}/${[...updated.folder_path, updated.title].map(encodeURIComponent).join('/')}`)
      else await ctx.router.replace({ name: 'palette', params: { username: ownerUsername, pathMatch: typeof pathMatch === 'string' ? pathMatch.split('/') : pathMatch } })
      showEditModal.value = false

      await actions.loadHistory()
    } catch (e: any) {
      editError.value = e.message ?? 'Update failed'
    } finally {
      ctx.preserveNextRouteLoad.value = false
      isEditing.value = false
    }
  }

  return {
    destinationProjectId,
    destinationFolderId,
    destinationFolders,
    destinationOptions,
    destinationLoading,
    destinationError,
    canCreateDestinationFolder,
    selectDestination,
    createDestinationFolder,
    conflict,
    resolveConflict,
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
    showEditModal,
    isEditing,
    editError,
    editTitle,
    editDescription,
    editFolderId,
    openEditPalette,
    doEditPalette,
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
