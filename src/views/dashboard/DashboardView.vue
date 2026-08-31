<template>
  <main class="dash">
    <span class="regmark regmark-tl" aria-hidden="true"></span>
    <span class="regmark regmark-tr" aria-hidden="true"></span>
    <span class="regmark regmark-bl" aria-hidden="true"></span>
    <span class="regmark regmark-br" aria-hidden="true"></span>

    <SiteHeader :user="user" :brand-meta="t('dashboard.atelier')" />

    <div class="shell">
      <aside class="sidebar">
        <AppLoader v-if="loading" :message="t('common.loadingPalettes')" />

        <template v-else-if="user">
          <div class="avatar">{{ user.username?.charAt(0)?.toUpperCase() }}</div>
          <p class="sidebar-name font-display">{{ user.username }}</p>
          <p v-if="user.firstname || user.lastname" class="sidebar-fullname">
            {{ [user.firstname, user.lastname].filter(Boolean).join(' ') }}
          </p>
          <p class="sidebar-email">{{ user.email || t('dashboard.noEmail') }}</p>

          <dl class="sidebar-stats">
            <div>
              <dt class="font-mono">{{ t('dashboard.palettes') }}</dt>
              <dd>{{ palettes.length }}</dd>
            </div>
            <div
              class="stat-row stat-row--clickable"
              role="button"
              tabindex="0"
              @click="showColleaguesModal = true"
              @keydown.enter.prevent="showColleaguesModal = true"
              @keydown.space.prevent="showColleaguesModal = true"
            >
              <dt class="font-mono">{{ t('dashboard.colleagues') }}</dt>
              <dd>
                <span class="stat-link">{{ colleaguesCount }}</span>
              </dd>
            </div>
          </dl>

          <div class="folder-panel">
            <p class="folder-panel-label font-mono">{{ t('dashboard.folders') }}</p>
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
            <p class="guest-info-text">{{ t('dashboard.guestInfo') }}</p>
            <button class="guest-login-btn" @click="router.push('/login')">{{ t('common.login') }}</button>
          </div>
        </template>
      </aside>

      <section class="content">
        <header class="content-head">
          <p class="eyebrow font-mono">
            <RgbastLogo size="13px" :mono="true" class="eyebrow-logo" />
            {{ t('dashboard.workspace') }}
          </p>
          <h1 class="content-title font-display">
            {{ t('dashboard.titleBefore') }} <em>{{ t('dashboard.titleFocus') }}</em>, {{ t('dashboard.titleAfter') }}
          </h1>
          <p v-if="!user" class="guest-note font-mono">{{ t('dashboard.guestMode') }}</p>
        </header>

        <div class="palettes-section">
          <div class="section-bar">
            <h2 class="section-title font-display">{{ t('dashboard.palettes') }}</h2>

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
            <p v-else class="breadcrumb-all font-mono">{{ t('dashboard.allPalettes') }}</p>

            <button class="new-palette-btn" @click="newPalette">
              {{ t('dashboard.newPalette') }}
              <span aria-hidden="true">+</span>
            </button>
            <button v-if="activeFolderKey !== 'all'" class="new-folder-btn" @click="createFolderHere">
              {{ t('folderTree.newFolder') }}
              <span aria-hidden="true">+</span>
            </button>
          </div>

          <div class="sort-bar font-mono">
            <span class="sort-label">{{ t('dashboard.sort') }}</span>
            <button
              class="sort-btn"
              :class="{ 'sort-btn--active': sortField === 'name' }"
              @click="sortField === 'name' ? sortDir = sortDir === 'asc' ? 'desc' : 'asc' : (sortField = 'name', sortDir = 'asc')"
            >
              {{ t('dashboard.name') }}
              <svg v-if="sortField === 'name'" class="sort-arrow" :class="{ 'sort-arrow--down': sortDir === 'desc' }" width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M4.5 1.5v6M1.5 4.5l3-3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              class="sort-btn"
              :class="{ 'sort-btn--active': sortField === 'date' }"
              @click="sortField === 'date' ? sortDir = sortDir === 'asc' ? 'desc' : 'asc' : (sortField = 'date', sortDir = 'desc')"
            >
              {{ t('dashboard.lastEdit') }}
              <svg v-if="sortField === 'date'" class="sort-arrow" :class="{ 'sort-arrow--down': sortDir === 'desc' }" width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M4.5 1.5v6M1.5 4.5l3-3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <div v-if="!isCreatingFolderCard && visibleFolderCards.length === 0 && filteredPalettes.length === 0" class="empty-state">
            <div class="empty-icon">◐</div>
            <p>{{ activeFolderKey === 'all' ? t('dashboard.noPalettes') : t('dashboard.noFolderPalettes') }}</p>
            <button class="empty-cta" @click="newPalette">{{ emptyCta }}</button>
          </div>

          <div v-else class="palettes-grid">
            <article
              v-if="isCreatingFolderCard"
              class="dashboard-folder-card dashboard-folder-card--editing dashboard-folder-card--new"
            >
              <div class="dashboard-folder-icon" aria-hidden="true">
                <svg width="42" height="36" viewBox="0 0 42 36" fill="none">
                  <path d="M3 10.5C3 7.74 5.24 5.5 8 5.5h8.9l4.2 4.1H34c2.76 0 5 2.24 5 5V28c0 2.76-2.24 5-5 5H8c-2.76 0-5-2.24-5-5V10.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  <path d="M3 14h36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="dashboard-folder-body">
                <input
                  v-model="folderCreateDraftName"
                  class="dashboard-folder-input font-display"
                  :class="{ 'dashboard-folder-input--error': !!folderCreateError }"
                  :placeholder="t('folderTree.folderNamePlaceholder')"
                  data-dashboard-folder-create-input
                  @click.stop
                  @keydown.enter="!folderCreateError && saveFolderCreate()"
                  @keydown.escape="cancelFolderCreate()"
                />
                <p v-if="folderCreateError" class="dashboard-folder-inline-error">{{ folderCreateError }}</p>
                <div class="dashboard-folder-inline-actions">
                  <button class="dashboard-folder-inline-btn dashboard-folder-inline-btn--cancel" @click.stop="cancelFolderCreate">{{ t('common.cancel') }}</button>
                  <button class="dashboard-folder-inline-btn" :disabled="isSavingFolderCreate || !folderCreateDraftName.trim() || !!folderCreateError" @click.stop="saveFolderCreate">
                    {{ isSavingFolderCreate ? t('dashboard.creatingFolder') : t('common.save') }}
                  </button>
                </div>
              </div>
            </article>

            <article
              v-for="folder in visibleFolderCards"
              :key="`folder-${folder.id}`"
              class="dashboard-folder-card"
              :class="{ 'dashboard-folder-card--drag': gridDragTargetFolderId === folder.id, 'dashboard-folder-card--editing': folderEditTarget?.id === folder.id }"
              @click="onFolderCardClick(folder)"
              @dragenter.prevent="onFolderCardDragEnter(folder.id)"
              @dragover.prevent="onFolderCardDragEnter(folder.id)"
              @dragleave="onFolderCardDragLeave(folder.id)"
              @drop.prevent="onFolderCardDrop(folder.id, $event)"
            >
              <div v-if="folderEditTarget?.id !== folder.id" class="dashboard-folder-actions">
                <button class="dashboard-folder-action" :title="t('dashboard.editFolder')" @click.stop="startFolderEdit(folder)">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 8.5L7.5 3l1.5 1.5L3.5 10H2V8.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                    <path d="M6.8 3.7l1.5 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                </button>
                <button class="dashboard-folder-action dashboard-folder-action--danger" :title="t('dashboard.deleteFolder')" @click.stop="openDeleteFolder(folder)">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M1.5 3h10M5 3V1.5h3V3M4 3l.5 8M6.5 3v8M9 3l-.5 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div class="dashboard-folder-icon" aria-hidden="true">
                <svg width="42" height="36" viewBox="0 0 42 36" fill="none">
                  <path d="M3 10.5C3 7.74 5.24 5.5 8 5.5h8.9l4.2 4.1H34c2.76 0 5 2.24 5 5V28c0 2.76-2.24 5-5 5H8c-2.76 0-5-2.24-5-5V10.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  <path d="M3 14h36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="dashboard-folder-body">
                <template v-if="folderEditTarget?.id === folder.id">
                  <input
                    v-model="folderEditDraftName"
                    class="dashboard-folder-input font-display"
                    :class="{ 'dashboard-folder-input--error': !!folderEditError }"
                    :data-dashboard-folder-edit-id="folder.id"
                    @click.stop
                    @keydown.enter="!folderEditError && saveFolderEdit()"
                    @keydown.escape="cancelFolderEdit()"
                  />
                  <p v-if="folderEditError" class="dashboard-folder-inline-error">{{ folderEditError }}</p>
                  <div class="dashboard-folder-inline-actions">
                    <button class="dashboard-folder-inline-btn dashboard-folder-inline-btn--cancel" @click.stop="cancelFolderEdit">{{ t('common.cancel') }}</button>
                    <button class="dashboard-folder-inline-btn" :disabled="isSavingFolderEdit || !folderEditDraftName.trim() || !!folderEditError" @click.stop="saveFolderEdit">
                      {{ t('common.save') }}
                    </button>
                  </div>
                </template>
                <template v-else>
                  <h3 class="dashboard-folder-title font-display">{{ folder.name }}</h3>
                  <p class="dashboard-folder-meta font-mono">
                    {{ folderPaletteCount(folder.id) }} {{ t('dashboard.palettes') }} · {{ childFolderCount(folder.id) }} {{ t('dashboard.folders').toLowerCase() }}
                  </p>
                </template>
              </div>
            </article>

            <PaletteCard
              v-for="p in filteredPalettes"
              :key="p.isLocalDraftOnly ? p.draftLink ?? `draft-${p.id}` : p.id"
              :palette="p"
              :show-actions="!p.isLocalDraftOnly"
              :show-delete="true"
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
          <h3 class="modal-title font-display">{{ deleteTarget.isLocalDraftOnly ? t('dashboard.deleteDraft') : t('dashboard.deletePalette') }}</h3>
          <p class="modal-sub">
            {{ t('common.delete') }} <strong>{{ deleteTarget.title }}</strong>? {{ deleteTarget.isLocalDraftOnly ? t('dashboard.deleteDraftConfirm') : t('dashboard.deletePaletteConfirm') }}
          </p>
          <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="deleteTarget = null">{{ t('common.cancel') }}</button>
            <button class="modal-btn danger" :disabled="isDeleting" @click="doDeletePalette">
              {{ isDeleting ? t('dashboard.deleting') : (deleteTarget.isLocalDraftOnly ? t('common.delete') : t('dashboard.deletePermanently')) }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit palette modal -->
    <Teleport to="body">
      <div v-if="editTarget" class="modal-overlay" @click.self="editTarget = null">
        <div class="modal">
          <h3 class="modal-title font-display">{{ t('dashboard.editPalette') }}</h3>
          <div class="edit-field">
            <label class="edit-label">{{ t('dashboard.name') }}</label>
            <input class="edit-input" v-model="editDraftTitle" @keydown.enter="!editTitleErrorMessage && saveEditPalette()" />
            <p v-if="editTitleErrorMessage" class="modal-error">{{ editTitleErrorMessage }}</p>
          </div>
          <div class="edit-field">
            <label class="edit-label">{{ t('dashboard.description') }}</label>
            <textarea class="edit-input edit-textarea" v-model="editDraftDesc" rows="2" :placeholder="t('dashboard.optionalDescription')" />
          </div>
          <div class="edit-field">
            <label class="edit-label">{{ t('dashboard.folder') }}</label>
            <FolderPicker
              :folders="folders"
              v-model="editDraftFolderId"
              theme="light"
              @createFolder="onCreateFolder"
            />
          </div>
          <p v-if="editError" class="modal-error">{{ editError }}</p>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="editTarget = null">{{ t('common.cancel') }}</button>
            <button class="modal-btn primary" :disabled="isSavingEdit || !!editTitleErrorMessage" @click="saveEditPalette">
              {{ isSavingEdit ? t('dashboard.saving') : t('dashboard.saveChanges') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete folder modal -->
    <Teleport to="body">
      <div v-if="deleteFolderTarget" class="modal-overlay" @click.self="deleteFolderTarget = null">
        <div class="modal">
          <h3 class="modal-title font-display">{{ t('dashboard.deleteFolder') }}</h3>
          <p class="modal-sub">
            {{ t('common.delete') }} <strong>{{ deleteFolderTarget.name }}</strong>? {{ t('dashboard.deleteFolderConfirm') }}
          </p>
          <div class="edit-field">
            <label class="edit-label">{{ t('dashboard.palettesInsideFolder') }}</label>
            <div class="folder-delete-options">
              <label class="check-row">
                <input
                  type="radio"
                  name="delete-folder-palette-strategy"
                  value="move_root"
                  :checked="deleteFolderPaletteStrategy === 'move_root'"
                  @change="deleteFolderPaletteStrategy = 'move_root'"
                />
                <span>{{ t('dashboard.movePalettesRoot') }}</span>
              </label>
              <label class="check-row">
                <input
                  type="radio"
                  name="delete-folder-palette-strategy"
                  value="delete"
                  :checked="deleteFolderPaletteStrategy === 'delete'"
                  @change="deleteFolderPaletteStrategy = 'delete'"
                />
                <span>{{ t('dashboard.deletePalettesToo') }}</span>
              </label>
            </div>
          </div>
          <p v-if="deleteFolderError" class="modal-error">{{ deleteFolderError }}</p>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="deleteFolderTarget = null">{{ t('common.cancel') }}</button>
            <button class="modal-btn danger" :disabled="isDeletingFolder" @click="doDeleteFolder">
              {{ isDeletingFolder ? t('dashboard.deleting') : t('dashboard.deleteFolder') }}
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
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
import { getPaletteTitleError } from '@/utils/paletteConstraints'
import { setPageSeo } from '@/utils/seo'
import { useI18n } from '@/i18n'

const router = useRouter()
const { t } = useI18n()
const loading = ref(true)
const user = ref<any>(null)
const palettes = ref<PaletteCache[]>([])
interface DashboardPaletteCard extends PaletteCache {
  isLocalDraftOnly?: boolean
  hasUnsavedDraft?: boolean
  draftLink?: string
  draftKey?: string
}
const localDraftCards = ref<DashboardPaletteCard[]>([])
const unsavedDraftPaletteIds = ref<number[]>([])
const unsavedDraftByPaletteId = ref<Record<number, PaletteDraftEntry>>({})
const folders = ref<FolderResponse[]>([])
const activeFolderKey = ref<'all' | 'root' | number>('all')
const sortField = ref<'name' | 'date'>('date')
const sortDir = ref<'asc' | 'desc'>('desc')
const draggingId = ref<number | null>(null)
const gridDragTargetFolderId = ref<number | null>(null)
const deleteTarget = ref<DashboardPaletteCard | null>(null)
const isDeleting = ref(false)
const deleteError = ref('')
const deleteFolderTarget = ref<FolderResponse | null>(null)
const deleteFolderError = ref('')
const isDeletingFolder = ref(false)
const deleteFolderPaletteStrategy = ref<'move_root' | 'delete'>('move_root')
const bcrumbTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const editTarget = ref<PaletteCache | null>(null)
const editDraftTitle = ref('')
const editDraftDesc = ref('')
const editDraftFolderId = ref<number | null>(null)
const isSavingEdit = ref(false)
const editError = ref('')
const editTitleErrorMessage = computed(() => getPaletteTitleError(editDraftTitle.value))
const colleaguesCount = ref(0)
const showColleaguesModal = ref(false)
const folderEditTarget = ref<FolderResponse | null>(null)
const folderEditDraftName = ref('')
const isSavingFolderEdit = ref(false)
const folderEditServerError = ref('')
const isCreatingFolderCard = ref(false)
const folderCreateDraftName = ref('')
const folderCreateServerError = ref('')
const isSavingFolderCreate = ref(false)

const folderEditError = computed(() => {
  const folder = folderEditTarget.value
  if (!folder) return ''
  if (folderEditServerError.value) return folderEditServerError.value
  const name = folderEditDraftName.value.trim()
  if (!name) return ''
  return isFolderNameTaken(name, folder.parent_folder_id ?? null, folder.id) ? t('dashboard.folderNameTaken') : ''
})

const currentFolderParentId = computed<number | null>(() => (
  activeFolderKey.value === 'root' || activeFolderKey.value === 'all'
    ? null
    : activeFolderKey.value
))

const folderCreateError = computed(() => {
  if (!isCreatingFolderCard.value) return ''
  if (folderCreateServerError.value) return folderCreateServerError.value
  const name = folderCreateDraftName.value.trim()
  if (!name) return ''
  return isFolderNameTaken(name, currentFolderParentId.value) ? t('dashboard.folderNameTaken') : ''
})

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
      title: d.paletteTitle || t('common.untitledDraft'),
      description: d.description || '',
      folder_id: d.pendingFolderId,
      folder_path: d.folderPath ?? [],
      created_at: d.updatedAt,
      last_snapshot_at: d.updatedAt,
      palette_colors: d.colors,
      isLocalDraftOnly: true,
      hasUnsavedDraft: true,
      draftLink: d.linkPath,
      draftKey: d.key,
    }))
}

const folderCounts = computed(() => {
  const counts: Record<number, number> = {}
  for (const p of displayPalettes.value) {
    if (p.folder_id == null) continue
    counts[p.folder_id] = (counts[p.folder_id] ?? 0) + 1
  }
  return counts
})

const rootPaletteCount = computed(() => displayPalettes.value.filter(p => p.folder_id == null).length)

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

const visibleFolderCards = computed(() => {
  if (activeFolderKey.value === 'all') return []
  const parentId = activeFolderKey.value === 'root' ? null : activeFolderKey.value
  const dir = sortField.value === 'name' && sortDir.value === 'desc' ? -1 : 1
  return folders.value
    .filter(folder => folder.parent_folder_id === parentId)
    .slice()
    .sort((a, b) => dir * a.name.localeCompare(b.name))
})

const emptyCta = computed(() => {
  if (activeFolderKey.value !== 'all' && palettes.value.length > 0) return t('dashboard.createHere')
  return t('dashboard.createFirst')
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

function refreshPaletteFolderPaths(): void {
  for (const palette of palettes.value) {
    if (palette.folder_id == null) {
      palette.folder_path = []
      continue
    }
    const ancestors = getFolderAncestors(palette.folder_id)
    palette.folder_path = ancestors
      .map(id => folders.value.find(f => f.id === id)?.name ?? '')
      .filter(Boolean)
  }
}

function getDescendantFolderIds(rootFolderId: number): Set<number> {
  const descendants = new Set<number>()
  const stack: number[] = [rootFolderId]
  while (stack.length) {
    const folderId = stack.pop()!
    descendants.add(folderId)
    for (const folder of folders.value) {
      if (folder.parent_folder_id === folderId && !descendants.has(folder.id)) {
        stack.push(folder.id)
      }
    }
  }
  return descendants
}

function isFolderNameTaken(name: string, parentId: number | null, excludeId?: number): boolean {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return false
  return folders.value.some(folder =>
    folder.id !== excludeId &&
    (folder.parent_folder_id ?? null) === parentId &&
    folder.name.trim().toLowerCase() === normalized,
  )
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
  setPageSeo({
    title: 'Dashboard - RGBAST',
    description: 'Generate and manage palettes in your RGBAST workspace, organize folders, continue local drafts, and track recent snapshots.',
    keywords: ['palette dashboard', 'palette manager', 'color folders', 'palette drafts', 'workspace'],
  })
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

function onFolderCardClick(folder: FolderResponse) {
  if (folderEditTarget.value?.id === folder.id) return
  activeFolderKey.value = folder.id
}

function createFolderHere() {
  if (activeFolderKey.value === 'all') return
  folderEditTarget.value = null
  folderEditDraftName.value = ''
  folderEditServerError.value = ''
  isCreatingFolderCard.value = true
  folderCreateDraftName.value = ''
  folderCreateServerError.value = ''
  void nextTick(() => {
    document.querySelector<HTMLInputElement>('[data-dashboard-folder-create-input]')?.focus()
  })
}

function startFolderEdit(folder: FolderResponse) {
  isCreatingFolderCard.value = false
  folderCreateDraftName.value = ''
  folderCreateServerError.value = ''
  folderEditTarget.value = folder
  folderEditDraftName.value = folder.name
  folderEditServerError.value = ''
  void nextTick(() => {
    document.querySelector<HTMLInputElement>(`[data-dashboard-folder-edit-id="${folder.id}"]`)?.focus()
  })
}

function cancelFolderEdit() {
  folderEditTarget.value = null
  folderEditDraftName.value = ''
  folderEditServerError.value = ''
}

async function saveFolderEdit() {
  const folder = folderEditTarget.value
  if (!folder) return
  const name = folderEditDraftName.value.trim()
  if (!name) return
  const nameTaken = isFolderNameTaken(name, folder.parent_folder_id ?? null, folder.id)
  if (nameTaken) return
  isSavingFolderEdit.value = true
  folderEditServerError.value = ''
  try {
    const updated = await foldersApi.update(folder.id, { name })
    const idx = folders.value.findIndex(f => f.id === folder.id)
    if (idx >= 0) {
      folders.value[idx] = updated
      folders.value.sort((a, b) => a.name.localeCompare(b.name))
      refreshPaletteFolderPaths()
    }
    cancelFolderEdit()
  } catch (e: any) {
    folderEditServerError.value = e?.message ?? t('dashboard.saveFailed')
  } finally {
    isSavingFolderEdit.value = false
  }
}

function cancelFolderCreate() {
  isCreatingFolderCard.value = false
  folderCreateDraftName.value = ''
  folderCreateServerError.value = ''
}

async function saveFolderCreate() {
  if (activeFolderKey.value === 'all') return
  const name = folderCreateDraftName.value.trim()
  if (!name) return
  if (isFolderNameTaken(name, currentFolderParentId.value)) return
  isSavingFolderCreate.value = true
  folderCreateServerError.value = ''
  try {
    const created = await foldersApi.create({ name, parent_folder_id: currentFolderParentId.value })
    folders.value.push(created)
    folders.value.sort((a, b) => a.name.localeCompare(b.name))
    refreshPaletteFolderPaths()
    cancelFolderCreate()
  } catch (e: any) {
    folderCreateServerError.value = e?.message ?? t('dashboard.saveFailed')
  } finally {
    isSavingFolderCreate.value = false
  }
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
    state: { folderId, hasFolderPreset: true },
  })
}

function confirmDeletePalette(p: DashboardPaletteCard) {
  deleteTarget.value = p
  deleteError.value = ''
}

async function doDeletePalette() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  deleteError.value = ''
  try {
    if (deleteTarget.value.isLocalDraftOnly) {
      if (deleteTarget.value.draftKey) {
        paletteDraftsApi.removeDraft(deleteTarget.value.draftKey)
      }
      const serverIds = new Set(palettes.value.map(p => p.id))
      applyDraftsToState(
        user.value?.username ? paletteDraftsApi.listByOwner(user.value.username) : paletteDraftsApi.listAllDrafts(),
        serverIds,
      )
      deleteTarget.value = null
      return
    }
    await palettesApi.deletePalette(deleteTarget.value.id)
    paletteDraftsApi.removeByPaletteId(deleteTarget.value.id)
    await loadDashboard()
    deleteTarget.value = null
  } catch (e: any) {
    deleteError.value = e.message ?? t('dashboard.deleteFailed')
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
  const titleError = getPaletteTitleError(title)
  if (titleError) {
    editError.value = titleError
    return
  }
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
    editError.value = e.message ?? t('dashboard.saveFailed')
  } finally {
    isSavingEdit.value = false
  }
}

async function onCreateFolder(payload: { name: string; parentId: number | null }) {
  try {
    const created = await foldersApi.create({ name: payload.name, parent_folder_id: payload.parentId })
    folders.value.push(created)
    folders.value.sort((a, b) => a.name.localeCompare(b.name))
    refreshPaletteFolderPaths()
  } catch { /* ignore - tree already closed the input */ }
}

async function onRenameFolder(payload: { id: number; name: string }) {
  try {
    const updated = await foldersApi.update(payload.id, { name: payload.name })
    const idx = folders.value.findIndex(f => f.id === payload.id)
    if (idx >= 0) {
      folders.value[idx] = updated
      folders.value.sort((a, b) => a.name.localeCompare(b.name))
      refreshPaletteFolderPaths()
    }
  } catch {}
}

function openDeleteFolder(folder: FolderResponse) {
  deleteFolderTarget.value = folder
  deleteFolderError.value = ''
  deleteFolderPaletteStrategy.value = 'move_root'
}

async function doDeleteFolder() {
  if (!deleteFolderTarget.value) return
  isDeletingFolder.value = true
  deleteFolderError.value = ''
  try {
    const targetId = deleteFolderTarget.value.id
    const targetIds = getDescendantFolderIds(targetId)
    const response = await foldersApi.delete(targetId, deleteFolderPaletteStrategy.value)

    folders.value = folders.value.filter(folder => !targetIds.has(folder.id))

    if (deleteFolderPaletteStrategy.value === 'delete') {
      const deletedIds = new Set(response.deleted_palette_ids)
      palettes.value = palettes.value.filter(palette => !deletedIds.has(palette.id))
      for (const paletteId of deletedIds) {
        paletteDraftsApi.removeByPaletteId(paletteId)
      }
    } else {
      const movedIds = new Set(response.moved_palette_ids)
      for (const palette of palettes.value) {
        if (movedIds.has(palette.id) || (palette.folder_id != null && targetIds.has(palette.folder_id))) {
          palette.folder_id = null
          palette.folder_path = []
        }
      }
    }

    if (typeof activeFolderKey.value === 'number' && targetIds.has(activeFolderKey.value)) {
      activeFolderKey.value = 'all'
    }

    if (user.value?.username) {
      const serverIds = new Set(palettes.value.map(p => p.id))
      applyDraftsToState(paletteDraftsApi.listByOwner(user.value.username), serverIds)
    }

    deleteFolderTarget.value = null
    refreshPaletteFolderPaths()
  } catch (e: any) {
    deleteFolderError.value = e.message ?? t('dashboard.deleteFailed')
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

function childFolderCount(folderId: number): number {
  return folders.value.filter(folder => folder.parent_folder_id === folderId).length
}

function folderPaletteCount(folderId: number): number {
  return folderCounts.value[folderId] ?? 0
}

function onFolderCardDragEnter(folderId: number): void {
  if (draggingId.value === null) return
  gridDragTargetFolderId.value = folderId
}

function onFolderCardDragLeave(folderId: number): void {
  if (gridDragTargetFolderId.value === folderId) {
    gridDragTargetFolderId.value = null
  }
}

async function onFolderCardDrop(folderId: number, event: DragEvent): Promise<void> {
  gridDragTargetFolderId.value = null
  const paletteId = Number(event.dataTransfer?.getData('palette-id'))
  if (!Number.isFinite(paletteId) || !paletteId) return
  await onMovePalette({ paletteId, targetFolderId: folderId })
  draggingId.value = null
}
</script>

<style src="./DashboardView.css" scoped></style>
