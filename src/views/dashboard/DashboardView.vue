<template>
  <main class="dash">
    <span class="regmark regmark-tl" aria-hidden="true"></span>
    <span class="regmark regmark-tr" aria-hidden="true"></span>
    <span class="regmark regmark-bl" aria-hidden="true"></span>
    <span class="regmark regmark-br" aria-hidden="true"></span>

    <SiteHeader :user="user" brand-meta="atelier" />

    <div class="shell">
      <aside class="sidebar">
        <AppLoader v-if="loading" message="Loading palettes..." />

        <template v-else-if="user">
          <div class="avatar">{{ user.username?.charAt(0)?.toUpperCase() }}</div>
          <p class="sidebar-name font-display">{{ user.username }}</p>
          <p v-if="user.firstname || user.lastname" class="sidebar-fullname">
            {{ [user.firstname, user.lastname].filter(Boolean).join(' ') }}
          </p>
          <p class="sidebar-email">{{ user.email || 'No email on file' }}</p>

          <dl class="sidebar-stats">
            <div>
              <dt class="font-mono">palettes</dt>
              <dd>{{ palettes.length }}</dd>
            </div>
            <div>
              <dt class="font-mono">colleagues</dt>
              <dd>
                <button v-if="user" class="stat-link" @click="showColleaguesModal = true">
                  {{ colleaguesCount }}
                </button>
                <span v-else>0</span>
              </dd>
            </div>
          </dl>

          <div class="folder-panel">
            <p class="folder-panel-label font-mono">Folders</p>
            <div class="folder-panel-tree">
              <FolderTree
                :folders="folders"
                v-model="activeFolderKey"
                theme="light"
                mode="navigation"
                :paletteCounts="folderCounts"
                :totalCount="palettes.length"
                :rootCount="rootPaletteCount"
                :draggingId="draggingId"
                :palettes="palettes"
                @createFolder="onCreateFolder"
                @renameFolder="onRenameFolder"
                @deleteFolder="openDeleteFolder"
                @movePalette="onMovePalette"
                @selectPalette="openPalette"
              />
            </div>
          </div>
        </template>

        <template v-else>
          <div class="guest-info">
            <p class="guest-info-text">You are not logged in. Showing local drafts stored in this browser.</p>
            <button class="guest-login-btn" @click="router.push('/login')">Log in</button>
          </div>
        </template>
      </aside>

      <section class="content">
        <header class="content-head">
          <p class="eyebrow font-mono">
            <RgbastLogo size="13px" :mono="true" class="eyebrow-logo" />
            Atelier · active workspace
          </p>
          <h1 class="content-title font-display">
            Your <em>palettes</em>, committed.
          </h1>
          <p v-if="!user" class="guest-note font-mono">Guest mode · local drafts only</p>
        </header>

        <div class="palettes-section">
          <div class="section-bar">
            <h2 class="section-title font-display">Palettes</h2>

            <!-- Breadcrumb path -->
            <nav v-if="activeFolderKey !== 'all'" class="breadcrumb font-mono">
              <template v-for="(seg, i) in breadcrumbSegments" :key="String(seg.key)">
                <span
                  class="bc-seg"
                  :class="{ 'bc-seg--last': i === breadcrumbSegments.length - 1 }"
                  @click="i < breadcrumbSegments.length - 1 && (activeFolderKey = seg.key)"
                  @dragover.prevent="onBreadcrumbDragenter(seg.key)"
                  @dragleave="onBreadcrumbDragleave()"
                >{{ seg.label }}</span>
                <span class="bc-sep">/</span>
              </template>
            </nav>
            <p v-else class="breadcrumb-all font-mono">All palettes</p>

            <button class="new-palette-btn" @click="newPalette">
              New palette
              <span aria-hidden="true">+</span>
            </button>
          </div>

          <div class="sort-bar font-mono">
            <span class="sort-label">Sort</span>
            <button
              class="sort-btn"
              :class="{ 'sort-btn--active': sortField === 'name' }"
              @click="sortField === 'name' ? sortDir = sortDir === 'asc' ? 'desc' : 'asc' : (sortField = 'name', sortDir = 'asc')"
            >
              Name
              <svg v-if="sortField === 'name'" class="sort-arrow" :class="{ 'sort-arrow--down': sortDir === 'desc' }" width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M4.5 1.5v6M1.5 4.5l3-3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              class="sort-btn"
              :class="{ 'sort-btn--active': sortField === 'date' }"
              @click="sortField === 'date' ? sortDir = sortDir === 'asc' ? 'desc' : 'asc' : (sortField = 'date', sortDir = 'desc')"
            >
              Last edit
              <svg v-if="sortField === 'date'" class="sort-arrow" :class="{ 'sort-arrow--down': sortDir === 'desc' }" width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M4.5 1.5v6M1.5 4.5l3-3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <div v-if="filteredPalettes.length === 0" class="empty-state">
            <div class="empty-icon">◐</div>
            <p>{{ activeFolderKey === 'all' ? 'No palettes yet.' : 'No palettes in this folder.' }}</p>
            <button class="empty-cta" @click="newPalette">{{ emptyCta }}</button>
          </div>

          <div v-else class="palettes-grid">
            <PaletteCard
              v-for="p in filteredPalettes"
              :key="p.isLocalDraftOnly ? p.draftLink ?? `draft-${p.id}` : p.id"
              :palette="p"
              :show-actions="!p.isLocalDraftOnly"
              :is-dragging="draggingId === p.id"
              :draggable-enabled="!p.isLocalDraftOnly"
              @open="openPalette(p)"
              @edit="openEditPalette(p)"
              @delete="confirmDeletePalette(p)"
              @dragstart="onCardDragStart(p.id, $event)"
              @dragend="draggingId = null"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- Delete palette modal -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal">
          <h3 class="modal-title font-display">Delete Palette</h3>
          <p class="modal-sub">
            Delete <strong>{{ deleteTarget.title }}</strong>? All snapshots and branches will be permanently lost.
          </p>
          <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="deleteTarget = null">Cancel</button>
            <button class="modal-btn danger" :disabled="isDeleting" @click="doDeletePalette">
              {{ isDeleting ? 'Deleting...' : 'Delete permanently' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit palette modal -->
    <Teleport to="body">
      <div v-if="editTarget" class="modal-overlay" @click.self="editTarget = null">
        <div class="modal">
          <h3 class="modal-title font-display">Edit Palette</h3>
          <div class="edit-field">
            <label class="edit-label">Name</label>
            <input class="edit-input" v-model="editDraftTitle" @keydown.enter="saveEditPalette" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Description</label>
            <textarea class="edit-input edit-textarea" v-model="editDraftDesc" rows="2" placeholder="Optional description…" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Folder</label>
            <FolderPicker
              :folders="folders"
              v-model="editDraftFolderId"
              theme="light"
              @createFolder="onCreateFolder"
            />
          </div>
          <p v-if="editError" class="modal-error">{{ editError }}</p>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="editTarget = null">Cancel</button>
            <button class="modal-btn primary" :disabled="isSavingEdit || !editDraftTitle.trim()" @click="saveEditPalette">
              {{ isSavingEdit ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete folder modal -->
    <Teleport to="body">
      <div v-if="deleteFolderTarget" class="modal-overlay" @click.self="deleteFolderTarget = null">
        <div class="modal">
          <h3 class="modal-title font-display">Delete Folder</h3>
          <p class="modal-sub">
            Delete <strong>{{ deleteFolderTarget.name }}</strong>? Subfolders will also be deleted. Palettes inside will be moved to root.
          </p>
          <p v-if="deleteFolderError" class="modal-error">{{ deleteFolderError }}</p>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="deleteFolderTarget = null">Cancel</button>
            <button class="modal-btn danger" :disabled="isDeletingFolder" @click="doDeleteFolder">
              {{ isDeletingFolder ? 'Deleting...' : 'Delete folder' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <ColleaguesModal
      :open="showColleaguesModal"
      removeConfirmMode="inline"
      @close="showColleaguesModal = false"
      @updated="void loadColleaguesSummary()"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { foldersApi } from '@/api/folders'
import { palettesApi } from '@/api/palettes'
import { colleaguesApi } from '@/api/colleagues'
import { paletteDraftsApi } from '@/api/paletteDrafts'
import type { PaletteDraftEntry } from '@/api/paletteDrafts'
import type { FolderResponse, PaletteCache } from '@/api/types'
import RgbastLogo from '@/components/ui/RgbastLogo.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import FolderTree from '@/components/folder/FolderTree.vue'
import FolderPicker from '@/components/folder/FolderPicker.vue'
import PaletteCard from '@/components/palette/PaletteCard.vue'
import ColleaguesModal from '@/components/colleagues/ColleaguesModal.vue'

const router = useRouter()
const loading = ref(true)
const user = ref<any>(null)
const palettes = ref<PaletteCache[]>([])
interface DashboardPaletteCard extends PaletteCache {
  isLocalDraftOnly?: boolean
  hasUnsavedDraft?: boolean
  draftLink?: string
}
const localDraftCards = ref<DashboardPaletteCard[]>([])
const unsavedDraftPaletteIds = ref<number[]>([])
const unsavedDraftByPaletteId = ref<Record<number, PaletteDraftEntry>>({})
const folders = ref<FolderResponse[]>([])
const activeFolderKey = ref<'all' | 'root' | number>('all')
const sortField = ref<'name' | 'date'>('date')
const sortDir = ref<'asc' | 'desc'>('desc')
const draggingId = ref<number | null>(null)
const deleteTarget = ref<PaletteCache | null>(null)
const isDeleting = ref(false)
const deleteError = ref('')
const deleteFolderTarget = ref<FolderResponse | null>(null)
const deleteFolderError = ref('')
const isDeletingFolder = ref(false)
const bcrumbTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const editTarget = ref<PaletteCache | null>(null)
const editDraftTitle = ref('')
const editDraftDesc = ref('')
const editDraftFolderId = ref<number | null>(null)
const isSavingEdit = ref(false)
const editError = ref('')
const colleaguesCount = ref(0)
const showColleaguesModal = ref(false)

function applyDraftsToState(drafts: PaletteDraftEntry[], serverIds: Set<number>) {
  unsavedDraftByPaletteId.value = drafts.reduce<Record<number, PaletteDraftEntry>>((acc, d) => {
    if (d.mode === 'existing' && d.paletteId !== null) acc[d.paletteId] = d
    return acc
  }, {})
  unsavedDraftPaletteIds.value = Array.from(
    new Set(
      drafts
        .filter(d => d.mode === 'existing' && d.paletteId !== null)
        .map(d => d.paletteId as number),
    ),
  )
  localDraftCards.value = drafts
    .filter(d => d.mode === 'new' || d.paletteId === null || !serverIds.has(d.paletteId))
    .map((d, idx) => ({
      id: -(idx + 1),
      title: d.paletteTitle || 'Untitled draft',
      description: d.description || '',
      folder_id: d.pendingFolderId,
      folder_path: d.folderPath ?? [],
      created_at: d.updatedAt,
      last_snapshot_at: d.updatedAt,
      palette_colors: d.colors,
      isLocalDraftOnly: true,
      hasUnsavedDraft: true,
      draftLink: d.linkPath,
    }))
}

const folderCounts = computed(() => {
  const counts: Record<number, number> = {}
  for (const p of palettes.value) {
    if (p.folder_id == null) continue
    counts[p.folder_id] = (counts[p.folder_id] ?? 0) + 1
  }
  return counts
})

const rootPaletteCount = computed(() => palettes.value.filter(p => p.folder_id == null).length)

const displayPalettes = computed<DashboardPaletteCard[]>(() => {
  const mergedServer = palettes.value.map(p => ({
    ...p,
    palette_colors: unsavedDraftByPaletteId.value[p.id]?.colors ?? p.palette_colors,
    hasUnsavedDraft: unsavedDraftPaletteIds.value.includes(p.id),
    isLocalDraftOnly: false,
  }))
  return [...localDraftCards.value, ...mergedServer]
})

const filteredPalettes = computed(() => {
  let list: DashboardPaletteCard[]
  if (activeFolderKey.value === 'all') list = [...displayPalettes.value]
  else if (activeFolderKey.value === 'root') list = displayPalettes.value.filter(p => p.folder_id == null)
  else list = displayPalettes.value.filter(p => p.folder_id === activeFolderKey.value)

  const dir = sortDir.value === 'asc' ? 1 : -1
  list.sort((a, b) => {
    if (sortField.value === 'name') return dir * a.title.localeCompare(b.title)
    const da = new Date(a.last_snapshot_at ?? a.created_at).getTime()
    const db = new Date(b.last_snapshot_at ?? b.created_at).getTime()
    return dir * (da - db)
  })
  return list
})

const emptyCta = computed(() => {
  if (activeFolderKey.value !== 'all' && palettes.value.length > 0) return 'Create a new palette here'
  return 'Create your first palette'
})

const breadcrumbSegments = computed((): Array<{ key: 'root' | number; label: string }> => {
  const segs: Array<{ key: 'root' | number; label: string }> = [
    { key: 'root', label: user.value?.username ?? '~' },
  ]
  if (typeof activeFolderKey.value === 'number') {
    const ancestors = getFolderAncestors(activeFolderKey.value)
    for (const id of ancestors) {
      const f = folders.value.find(x => x.id === id)
      if (f) segs.push({ key: id, label: f.name })
    }
  }
  return segs
})

function getFolderAncestors(folderId: number): number[] {
  const path: number[] = []
  let id: number | null = folderId
  while (id != null) {
    path.unshift(id)
    const folder = folders.value.find(f => f.id === id)
    id = folder?.parent_folder_id ?? null
  }
  return path
}

function onBreadcrumbDragenter(key: 'root' | number) {
  if (bcrumbTimer.value) return
  bcrumbTimer.value = setTimeout(() => {
    activeFolderKey.value = key
    bcrumbTimer.value = null
  }, 500)
}

function onBreadcrumbDragleave() {
  if (bcrumbTimer.value) { clearTimeout(bcrumbTimer.value); bcrumbTimer.value = null }
}

async function loadDashboard() {
  loading.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      user.value = null
      palettes.value = []
      folders.value = []
      colleaguesCount.value = 0
      applyDraftsToState(paletteDraftsApi.listAllDrafts(), new Set<number>())
      return
    }

    user.value = await authApi.checkAuth()
    const resp = await palettesApi.getByUsername(user.value.username)
    palettes.value = resp.palettes.map(p => {
      const cached: PaletteCache = {
        id: p.id,
        title: p.title,
        description: p.description,
        folder_id: p.folder_id ?? null,
        folder_path: p.folder_path ?? [],
        created_at: p.created_at,
        last_snapshot_at: p.latest_main_snapshot?.created_at,
        palette_colors: p.latest_main_snapshot?.palette_colors ?? [],
      }
      palettesApi.cachePalette(cached)
      return cached
    })
    const serverIds = new Set(palettes.value.map(p => p.id))
    applyDraftsToState(paletteDraftsApi.listByOwner(user.value.username), serverIds)
    await loadColleaguesSummary()
    await loadFolders()
  } catch {
    localStorage.removeItem('access_token')
    user.value = null
    palettes.value = []
    folders.value = []
    colleaguesCount.value = 0
    applyDraftsToState(paletteDraftsApi.listAllDrafts(), new Set<number>())
  } finally {
    loading.value = false
  }
}

async function loadColleaguesSummary() {
  if (!user.value) {
    colleaguesCount.value = 0
    return
  }
  try {
    const payload = await colleaguesApi.listMine()
    colleaguesCount.value = payload.colleagues.length
  } catch {
    colleaguesCount.value = Number(user.value.colleagues_count ?? 0)
  }
}

async function loadFolders() {
  if (!user.value?.username) return
  try {
    folders.value = await foldersApi.getByUsername(user.value.username)
  } catch {
    folders.value = []
  }
}

onMounted(() => {
  document.title = 'Dashboard - RGBAST'
  window.addEventListener('rgbast:colleagues-updated', onColleaguesUpdatedEvent)
  void loadDashboard()
})

onBeforeUnmount(() => {
  window.removeEventListener('rgbast:colleagues-updated', onColleaguesUpdatedEvent)
})

function onColleaguesUpdatedEvent(): void {
  void loadColleaguesSummary()
}

function openPalette(p: DashboardPaletteCard) {
  if (p.draftLink) {
    router.push(p.draftLink)
    return
  }
  if (!user.value?.username) return
  const segments = [...(p.folder_path ?? []), p.title].filter(Boolean)
  router.push({ name: 'palette', params: { username: user.value.username, pathMatch: segments.join('/') } })
}

function newPalette() {
  if (!user.value?.username) {
    router.push({ name: 'palette', params: { username: 'local', pathMatch: 'new' } })
    return
  }
  const folderId = typeof activeFolderKey.value === 'number' ? activeFolderKey.value : null
  router.push({
    name: 'palette',
    params: { username: user.value.username, pathMatch: 'new' },
    state: { folderId },
  })
}

function confirmDeletePalette(p: PaletteCache) {
  deleteTarget.value = p
  deleteError.value = ''
}

async function doDeletePalette() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  deleteError.value = ''
  try {
    await palettesApi.deletePalette(deleteTarget.value.id)
    paletteDraftsApi.removeByPaletteId(deleteTarget.value.id)
    await loadDashboard()
    deleteTarget.value = null
  } catch (e: any) {
    deleteError.value = e.message ?? 'Delete failed'
  } finally {
    isDeleting.value = false
  }
}

function openEditPalette(p: DashboardPaletteCard) {
  if (p.isLocalDraftOnly) return
  editTarget.value = p
  editDraftTitle.value = p.title
  editDraftDesc.value = p.description ?? ''
  editDraftFolderId.value = p.folder_id ?? null
  editError.value = ''
}

async function saveEditPalette() {
  if (!editTarget.value) return
  const title = editDraftTitle.value.trim()
  if (!title) return
  isSavingEdit.value = true
  editError.value = ''
  try {
    await palettesApi.updatePalette(editTarget.value.id, {
      title,
      description: editDraftDesc.value.trim() || null,
      folder_id: editDraftFolderId.value,
    })
    const p = palettes.value.find(x => x.id === editTarget.value!.id)
    if (p) {
      p.title = title
      p.description = editDraftDesc.value.trim() || undefined
      p.folder_id = editDraftFolderId.value
      if (editDraftFolderId.value === null) {
        p.folder_path = []
      } else {
        const ancestors = getFolderAncestors(editDraftFolderId.value)
        p.folder_path = ancestors.map(id => folders.value.find(f => f.id === id)?.name ?? '')
      }
    }
    editTarget.value = null
  } catch (e: any) {
    editError.value = e.message ?? 'Save failed'
  } finally {
    isSavingEdit.value = false
  }
}

async function onCreateFolder(payload: { name: string; parentId: number | null }) {
  try {
    await foldersApi.create({ name: payload.name, parent_folder_id: payload.parentId })
    await loadFolders()
  } catch { /* ignore — tree already closed the input */ }
}

async function onRenameFolder(payload: { id: number; name: string }) {
  try {
    await foldersApi.update(payload.id, { name: payload.name })
    await loadFolders()
  } catch {}
}

function openDeleteFolder(folder: FolderResponse) {
  deleteFolderTarget.value = folder
  deleteFolderError.value = ''
}

async function doDeleteFolder() {
  if (!deleteFolderTarget.value) return
  isDeletingFolder.value = true
  deleteFolderError.value = ''
  try {
    await foldersApi.delete(deleteFolderTarget.value.id)
    deleteFolderTarget.value = null
    if (typeof activeFolderKey.value === 'number') activeFolderKey.value = 'all'
    await loadFolders()
    await loadDashboard()
  } catch (e: any) {
    deleteFolderError.value = e.message ?? 'Delete failed'
  } finally {
    isDeletingFolder.value = false
  }
}

async function onMovePalette(payload: { paletteId: number; targetFolderId: number | null }) {
  try {
    await palettesApi.updatePalette(payload.paletteId, { folder_id: payload.targetFolderId })
    const palette = palettes.value.find(p => p.id === payload.paletteId)
    if (palette) {
      palette.folder_id = payload.targetFolderId
      if (payload.targetFolderId === null) {
        palette.folder_path = []
      } else {
        const ancestors = getFolderAncestors(payload.targetFolderId)
        palette.folder_path = ancestors.map(id => folders.value.find(f => f.id === id)?.name ?? '')
      }
    }
  } catch {}
}

function onCardDragStart(id: number, event: DragEvent) {
  draggingId.value = id
  event.dataTransfer?.setData('palette-id', String(id))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}
</script>

<style src="./DashboardView.css" scoped></style>
