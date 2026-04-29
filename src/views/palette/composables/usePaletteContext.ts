import { ref, computed, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { palettesApi } from '@/api/palettes'
import { foldersApi } from '@/api/folders'
import type { FolderResponse, PaletteHistoryGraphResponse, PaletteColorSave } from '@/api/types'
import { getBranchColor } from '@/utils/branchColors'

export interface WorkingColor {
  _key: string
  hex: string
  label: string | null
}

export interface SnapshotContext {
  isMain: boolean
  branchId: number | null
  branchTitle: string | null
  isMerged: boolean
}

export interface PaletteContext {
  route: ReturnType<typeof useRoute>
  router: ReturnType<typeof useRouter>
  isNewPalette: ComputedRef<boolean>
  paletteId: Ref<number | null>
  username: ComputedRef<string>
  paletteName: ComputedRef<string>
  folderPath: ComputedRef<string[]>
  palettePath: ComputedRef<string>
  isOwned: ComputedRef<boolean>
  pendingTitle: Ref<string>
  pendingDescription: Ref<string>
  pendingFolderId: Ref<number | null>
  history: Ref<PaletteHistoryGraphResponse | null>
  folders: Ref<FolderResponse[]>
  folderOptions: ComputedRef<Array<{ id: number; label: string }>>
  historyFolderId: ComputedRef<number | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  paletteTitle: ComputedRef<string>
  colors: Ref<WorkingColor[]>
  latestSnapshotId: Ref<number | null>
  selectedSnapshotId: Ref<number | null>
  selectedSnapshotCtx: ComputedRef<SnapshotContext | null>
  isSelectedLatestMainSnapshot: ComputedRef<boolean>
  showSnapshotBanner: ComputedRef<boolean>
  currentBranchId: Ref<number | null>
  currentBranchName: ComputedRef<string>
  allBranches: ComputedRef<Array<{ id: number; title: string; is_merged: boolean }>>
  snapshotCommitHint: ComputedRef<string | null>
  savedColorsSig: Ref<string>
  currentColorsSig: ComputedRef<string>
  hasUnsavedChanges: ComputedRef<boolean>
  historyOpen: Ref<boolean>
  mobileSidebarOpen: Ref<boolean>
  showSaveModal: Ref<boolean>
  showAuthModal: Ref<boolean>
  branchBeforeSelection: Ref<number | null | undefined>
  mobileSidebarActiveBranches: ComputedRef<Array<{ id: number; title: string; is_merged: boolean }>>
  mkKey: () => string
  wrapColors: (cols: PaletteColorSave[]) => WorkingColor[]
  mobileBranchColor: (idx: number) => string
  loadHistory: () => Promise<void>
  loadFolders: () => Promise<void>
  applyBranchState: () => void
  switchBranch: (id: number | null) => Promise<void>
  findSnapshot: (id: number) => PaletteHistoryGraphResponse['main'][number] | PaletteHistoryGraphResponse['branches'][number]['snapshots'][number] | null
  onSelectSnapshot: (id: number) => void
  clearSnapshotSelection: () => void
  initNewPaletteDraft: () => void
  clonePalette: () => void
  startRouteWatch: (onBeforeLoad?: () => void) => void
}

// Read the JWT payload and extract the username for ownership checks in PaletteView.
function getTokenUsername(): string | null {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const payload = JSON.parse(atob(payloadPart))
    return payload.sub ?? null
  } catch {
    return null
  }
}

let keyCounter = 0

// Generate a unique key for palette columns in PaletteView lists.
function mkKey(): string {
  keyCounter += 1
  return String(keyCounter)
}

// Wrap API palette colors in local working color objects for PaletteView.
function wrapColors(cols: PaletteColorSave[]): WorkingColor[] {
  return cols.map(c => ({ hex: c.hex, label: c.label ?? null, _key: mkKey() }))
}

// Build the shared palette view state and helpers for PaletteView and its subcomponents.
export function usePaletteContext(): PaletteContext {
  const route = useRoute()
  const router = useRouter()

  const username = computed(() => String(route.params.username ?? ''))
  const routeSegments = computed(() => {
    const raw = route.params.pathMatch
    if (!raw) return []
    const list = Array.isArray(raw) ? raw : String(raw).split('/')
    return list.filter(Boolean)
  })
  const queryPalette = computed(() => (typeof route.query.palette === 'string' ? route.query.palette : null))
  const paletteName = computed(() => {
    if (queryPalette.value) return queryPalette.value
    return routeSegments.value[routeSegments.value.length - 1] ?? ''
  })
  const folderPath = computed(() => {
    if (queryPalette.value) return routeSegments.value
    return routeSegments.value.slice(0, -1)
  })
  const palettePath = computed(() => {
    const segments = [...folderPath.value, paletteName.value].filter(Boolean)
    return segments.join('/')
  })

  const isNewPalette = computed(() => paletteName.value === 'new')
  const paletteId = ref<number | null>(null)

  const history = ref<PaletteHistoryGraphResponse | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const pendingTitle = ref('')
  const pendingDescription = ref('')
  const pendingFolderId = ref<number | null>(null)
  const folders = ref<FolderResponse[]>([])

  const folderMap = computed(() => {
    const map = new Map<number, FolderResponse>()
    for (const folder of folders.value) map.set(folder.id, folder)
    return map
  })

  const folderPathById = computed(() => {
    const map = new Map<number, string[]>()
    for (const folder of folders.value) {
      const names: string[] = []
      let current: FolderResponse | undefined = folder
      const seen = new Set<number>()
      while (current) {
        if (seen.has(current.id)) break
        seen.add(current.id)
        names.push(current.name)
        if (current.parent_folder_id === null) break
        current = folderMap.value.get(current.parent_folder_id)
      }
      map.set(folder.id, names.reverse())
    }
    return map
  })

  const folderOptions = computed(() => {
    return Array.from(folderPathById.value.entries())
      .map(([id, path]) => ({ id, label: path.join(' / ') }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const historyFolderId = computed(() => {
    const pathKey = history.value?.folder_path?.join('/') ?? ''
    if (!pathKey) return null
    for (const [id, path] of folderPathById.value.entries()) {
      if (path.join('/') === pathKey) return id
    }
    return null
  })

  const isOwned = computed(() => {
    if (isNewPalette.value) return true
    if (!history.value) return false
    const me = getTokenUsername()
    return me !== null && me === history.value.owner_username
  })

  const paletteTitle = computed(() => {
    if (isNewPalette.value) return pendingTitle.value || 'Untitled palette'
    if (paletteId.value !== null) {
      return (
        palettesApi.getCachedPalette(paletteId.value)?.title ??
        history.value?.title ??
        (paletteName.value || `Palette #${paletteId.value}`)
      )
    }
    return history.value?.title ?? (paletteName.value || 'Palette')
  })

  const colors = ref<WorkingColor[]>([])
  const latestSnapshotId = ref<number | null>(null)
  const selectedSnapshotId = ref<number | null>(null)

  const selectedSnapshotCtx = computed<SnapshotContext | null>(() => {
    if (!selectedSnapshotId.value || !history.value) return null
    if (history.value.main.some(s => s.id === selectedSnapshotId.value)) {
      return { isMain: true, branchId: null, branchTitle: null, isMerged: false }
    }
    for (const branch of history.value.branches) {
      if (branch.snapshots.some(s => s.id === selectedSnapshotId.value)) {
        return {
          isMain: false,
          branchId: branch.id,
          branchTitle: branch.title,
          isMerged: branch.is_merged,
        }
      }
    }
    return null
  })

  const isSelectedLatestMainSnapshot = computed(() => {
    if (!selectedSnapshotId.value || !history.value) return false
    return history.value.main[0]?.id === selectedSnapshotId.value
  })

  const showSnapshotBanner = computed(() => {
    if (!selectedSnapshotId.value || isNewPalette.value) return false
    const ctx = selectedSnapshotCtx.value
    if (!ctx) return false
    if (ctx.isMain) return !isSelectedLatestMainSnapshot.value
    if (ctx.isMerged) return true

    const branch = history.value?.branches.find(b => b.id === ctx.branchId)
    const isLatestUnmergedBranchTip = branch?.is_merged === false && branch.snapshots[0]?.id === selectedSnapshotId.value
    return !isLatestUnmergedBranchTip
  })

  const currentBranchId = ref<number | null>(null)
  const currentBranchName = computed(() => {
    if (currentBranchId.value === null) return 'main'
    return history.value?.branches.find(b => b.id === currentBranchId.value)?.title ?? 'main'
  })

  const allBranches = computed(() =>
    (history.value?.branches ?? []).map(b => ({ id: b.id, title: b.title, is_merged: b.is_merged }))
  )

  const snapshotCommitHint = computed(() => {
    const ctx = selectedSnapshotCtx.value
    if (!ctx) return null
    if (ctx.isMain && isSelectedLatestMainSnapshot.value) return null
    if (ctx.isMain) return 'Selected old main snapshot: saving will create a new branch.'
    if (ctx.isMerged) return `Selected snapshot from merged branch "${ctx.branchTitle}": saving will create a new branch.`
    return `Selected snapshot from branch "${ctx.branchTitle}": saving will commit to that branch.`
  })

  const savedColorsSig = ref('')
  const currentColorsSig = computed(() => colors.value.map(c => `${c.hex}:${c.label ?? ''}`).join('|'))
  const hasUnsavedChanges = computed(() => currentColorsSig.value !== savedColorsSig.value)

  const historyOpen = ref(false)
  const mobileSidebarOpen = ref(false)
  const showSaveModal = ref(false)
  const showAuthModal = ref(false)

  const branchBeforeSelection = ref<number | null | undefined>(undefined)
  const mobileSidebarActiveBranches = computed(() => allBranches.value.filter(b => !b.is_merged))

  // Color helper for branch dots in the PaletteView mobile sidebar.
  function mobileBranchColor(idx: number): string {
    return getBranchColor(idx)
  }

  // Load palette history and reset the editor state in PaletteView.
  async function loadHistory(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await loadFolders()
      if (!username.value || !palettePath.value) {
        throw new Error('Palette path is invalid')
      }
      history.value = await palettesApi.getHistoryByPath(username.value, palettePath.value)
      paletteId.value = history.value.palette_id
      applyBranchState()
    } catch (e: any) {
      error.value = e.message ?? 'Failed to load palette'
    } finally {
      loading.value = false
    }
  }

  async function loadFolders(): Promise<void> {
    if (!username.value) return
    try {
      folders.value = await foldersApi.getByUsername(username.value)
    } catch {
      folders.value = []
    }
  }

  // Apply the latest snapshot from the current branch into the working colors.
  function applyBranchState(): void {
    if (!history.value) return
    let sourceColors: PaletteColorSave[] = []
    let snapshotId: number | null = null

    if (currentBranchId.value === null) {
      const latest = history.value.main[0]
      if (latest) {
        sourceColors = latest.palette_colors
        snapshotId = latest.id
      }
    } else {
      const branch = history.value.branches.find(b => b.id === currentBranchId.value)
      const snap = branch?.snapshots[0]
      if (snap) {
        sourceColors = snap.palette_colors
        snapshotId = snap.id
      }
    }

    colors.value = wrapColors(sourceColors)
    latestSnapshotId.value = snapshotId
    savedColorsSig.value = currentColorsSig.value
    if (paletteId.value !== null) {
      palettesApi.updateCacheColors(paletteId.value, sourceColors)
    }
  }

  // Switch the current branch context in PaletteView and refresh working colors.
  async function switchBranch(id: number | null): Promise<void> {
    selectedSnapshotId.value = null
    branchBeforeSelection.value = undefined
    currentBranchId.value = id
    applyBranchState()
  }

  // Find a snapshot by id in either main or branch history for PaletteView.
  function findSnapshot(id: number) {
    if (!history.value) return null
    const mainSnap = history.value.main.find(s => s.id === id)
    if (mainSnap) return mainSnap
    for (const branch of history.value.branches) {
      const snap = branch.snapshots.find(s => s.id === id)
      if (snap) return snap
    }
    return null
  }

  // Select a snapshot for viewing/editing in PaletteView based on history clicks.
  function onSelectSnapshot(id: number): void {
    if (selectedSnapshotId.value === id) {
      clearSnapshotSelection()
      return
    }

    if (branchBeforeSelection.value === undefined) {
      branchBeforeSelection.value = currentBranchId.value
    }

    let nextBranchId: number | null = null
    if (history.value?.main.some(s => s.id === id)) {
      nextBranchId = null
    } else {
      const branch = history.value?.branches.find(b => b.snapshots.some(s => s.id === id))
      if (branch) nextBranchId = branch.is_merged ? null : branch.id
    }
    currentBranchId.value = nextBranchId

    selectedSnapshotId.value = id
    const snap = findSnapshot(id)
    if (snap) {
      colors.value = wrapColors(snap.palette_colors)
      savedColorsSig.value = currentColorsSig.value
    }
  }

  // Clear snapshot selection and restore branch state in PaletteView.
  function clearSnapshotSelection(): void {
    selectedSnapshotId.value = null
    if (branchBeforeSelection.value !== undefined) {
      currentBranchId.value = branchBeforeSelection.value
      branchBeforeSelection.value = undefined
    }
    applyBranchState()
  }

  // Initialize a draft palette in PaletteView when the route id is "new".
  function initNewPaletteDraft(): void {
    history.value = null
    paletteId.value = null
    latestSnapshotId.value = null
    selectedSnapshotId.value = null
    currentBranchId.value = null
    historyOpen.value = false
    error.value = null
    void loadFolders()
    pendingDescription.value = ''
    pendingFolderId.value =
      typeof window !== 'undefined' ? (window.history.state?.folderId ?? null) : null

    const clonedColors = (window.history.state?.clonedColors ?? []) as PaletteColorSave[]
    if (Array.isArray(clonedColors) && clonedColors.length > 0) {
      colors.value = wrapColors(clonedColors)
    } else {
      colors.value = Array.from({ length: 5 }, () => ({ hex: randomHex(), label: null, _key: mkKey() }))
    }

    savedColorsSig.value = '__draft__'
    loading.value = false
  }

  // Clone the current palette colors into a new draft palette route.
  function clonePalette(): void {
    const clonedColors = colors.value.map(c => ({ hex: c.hex, label: c.label ?? null }))
    const pathMatch = [...folderPath.value, 'new'].join('/')
    router.push({ name: 'palette', params: { username: username.value, pathMatch }, state: { clonedColors } })
  }

  // Watch the palette route param and reload state for PaletteView.
  function startRouteWatch(onBeforeLoad?: () => void): void {
    watch(
      () => [route.params.username, route.params.pathMatch, route.query.palette],
      () => {
        if (onBeforeLoad) onBeforeLoad()
        if (isNewPalette.value) {
          initNewPaletteDraft()
        } else {
          void loadHistory()
        }
      },
      { immediate: true },
    )
  }

  // Generate a random uppercase hex string for draft palettes in PaletteView.
  function randomHex(): string {
    return Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase()
  }

  return {
    route,
    router,
    isNewPalette,
    paletteId,
    username,
    paletteName,
    folderPath,
    palettePath,
    isOwned,
    pendingTitle,
    pendingDescription,
    pendingFolderId,
    history,
    folders,
    folderOptions,
    historyFolderId,
    loading,
    error,
    paletteTitle,
    colors,
    latestSnapshotId,
    selectedSnapshotId,
    selectedSnapshotCtx,
    isSelectedLatestMainSnapshot,
    showSnapshotBanner,
    currentBranchId,
    currentBranchName,
    allBranches,
    snapshotCommitHint,
    savedColorsSig,
    currentColorsSig,
    hasUnsavedChanges,
    historyOpen,
    mobileSidebarOpen,
    showSaveModal,
    showAuthModal,
    branchBeforeSelection,
    mobileSidebarActiveBranches,
    mkKey,
    wrapColors,
    mobileBranchColor,
    loadHistory,
    loadFolders,
    applyBranchState,
    switchBranch,
    findSnapshot,
    onSelectSnapshot,
    clearSnapshotSelection,
    initNewPaletteDraft,
    clonePalette,
    startRouteWatch,
  }
}
