<template>
  <div class="palette-view">
    <!-- Header -->
    <PaletteAppHeader
      :paletteTitle="paletteTitle"
      :currentBranch="currentBranchName"
      :currentBranchId="currentBranchId"
      :branches="allBranches"
      :hasUnsavedChanges="hasUnsavedChanges"
      :isSaving="isSaving"
      :historyOpen="historyOpen"
      :snapshotHint="snapshotCommitHint"
      :isOwned="isOwned"
      :canDelete="isOwned && !isNewPalette"
      @back="router.push('/dashboard')"
      @save="requestSave"
      @clone="clonePalette"
      @branchChange="switchBranch"
      @toggleHistory="historyOpen = !historyOpen"
      @merge="confirmMerge"
      @deletePalette="showDeletePaletteModal = true"
    />

    <!-- Loading state -->
    <div v-if="loading" class="loading-screen">
      <AppLoader message="Loading palette…" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-screen">
      <p>{{ error }}</p>
      <button @click="router.push('/dashboard')">← Back to dashboard</button>
    </div>

    <!-- Editor -->
    <div v-else class="editor-shell" :class="{ 'history-open': historyOpen, 'has-banner': !!selectedSnapshotId && !isNewPalette }">

      <!-- Snapshot selection banner -->
      <Transition name="banner-slide">
        <div v-if="selectedSnapshotId && !isNewPalette" class="snapshot-banner">
          <span class="banner-text">
            <template v-if="!isOwned">
              Viewing a past snapshot.
            </template>
            <template v-else-if="selectedSnapshotCtx?.isMain">
              Viewing a past snapshot — saving will create a <strong>new branch</strong> from this point.
            </template>
            <template v-else-if="selectedSnapshotCtx?.isMerged">
              Viewing a past snapshot from a merged branch — saving will create a <strong>new branch</strong> from this point.
            </template>
            <template v-else>
              Viewing a past snapshot — saving will create a new commit on branch <strong>{{ selectedSnapshotCtx?.branchTitle }}</strong>.
            </template>
          </span>
          <div class="banner-actions">
            <button
              v-if="isOwned && revertableSnapshotCount > 0"
              class="banner-revert"
              @click="showRevertModal = true"
            >
              Revert branch here
            </button>
            <button class="banner-dismiss" @click="clearSnapshotSelection">Deselect ×</button>
          </div>
        </div>
      </Transition>

      <!-- Color columns -->
      <div ref="colsAreaEl" class="columns-area" @mousemove="onColsMouseMove" @mouseleave="showAddBtn = false">
        <TransitionGroup
          tag="div"
          class="cols-tg"
          name="col"
          move-class="col-move"
          @before-enter="onBeforeEnter"
          @enter="onEnter"
          @leave="onLeave"
        >
          <ColorColumn
            v-for="(col, i) in colors"
            :key="col._key"
            :modelValue="col"
            :colKey="col._key"
            :isDragging="draggedIdx === i"
            :dragStyle="getColStyle(i)"
            @update:hex="hex => updateHex(i, hex)"
            @update:label="lbl => updateLabel(i, lbl)"
            @remove="removeColor(i)"
            @dragStart="e => onDragStart(i, e)"
          />
        </TransitionGroup>

        <!-- Add color button — only visible when near right edge -->
        <button class="add-col-btn" :class="{ visible: showAddBtn }" @click="addColor" title="Add color">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- History panel -->
      <Transition name="history-slide">
        <aside v-if="historyOpen" class="history-panel">
          <div class="history-header">
            <h2 class="history-title font-display">History</h2>
            <button class="close-btn" @click="historyOpen = false">×</button>
          </div>
          <HistoryGraph
            v-if="history"
            :history="history"
            :selectedId="selectedSnapshotId"
            @selectSnapshot="onSelectSnapshot"
            @selectBranch="id => switchBranch(id)"
            @deleteBranch="onDeleteBranchRequest"
          />
          <div v-else class="history-empty">No history yet.</div>
        </aside>
      </Transition>
    </div>

    <!-- Save snapshot modal -->
    <Teleport to="body">
      <div v-if="showSaveModal" class="modal-overlay" @click.self="showSaveModal = false">
        <div class="modal">
          <h3 class="modal-title font-display">{{ isNewPalette ? 'Create Palette' : 'Save Snapshot' }}</h3>
          <p v-if="!isNewPalette" class="modal-sub">Saving to: <strong>{{ currentBranchName }}</strong></p>

          <template v-if="isNewPalette">
            <label class="field-label">Palette title <span class="required">*</span></label>
            <input
              v-model="pendingTitle"
              class="modal-input"
              placeholder="e.g. brand-colors"
              maxlength="50"
              autofocus
              @keydown.enter="doSave()"
            />
          </template>

          <!-- Case A: historical main snapshot selected → must create new branch -->
          <template v-else-if="selectedSnapshotCtx?.isMain">
            <p class="modal-info">Forking from an older main snapshot. You must save to a new branch.</p>
            <label class="field-label">Commit message</label>
            <input
              v-model="saveComment"
              class="modal-input"
              placeholder="What changed?"
              maxlength="500"
              autofocus
            />
            <label class="field-label">New branch name <span class="required">*</span></label>
            <input
              v-model="newBranchName"
              class="modal-input"
              placeholder="e.g. dark-variant"
              maxlength="100"
              @keydown.enter="doSave()"
            />
          </template>

          <!-- Case B: branch snapshot selected → commit to that branch -->
          <template v-else-if="selectedSnapshotCtx && !selectedSnapshotCtx.isMain">
            <p class="modal-info">
              <template v-if="selectedSnapshotCtx.isMerged">
                This snapshot belongs to merged branch <strong>{{ selectedSnapshotCtx.branchTitle }}</strong>.
                You must save to a <strong>new branch</strong> from this point.
              </template>
              <template v-else>
                This snapshot belongs to branch <strong>{{ selectedSnapshotCtx.branchTitle }}</strong>.
                Saving will create a new latest commit in this branch.
              </template>
            </p>
            <label class="field-label">Commit message</label>
            <input
              v-model="saveComment"
              class="modal-input"
              placeholder="What changed?"
              maxlength="500"
              autofocus
              @keydown.enter="selectedSnapshotCtx?.isMerged ? undefined : doSave()"
            />
            <template v-if="selectedSnapshotCtx.isMerged">
              <label class="field-label">New branch name <span class="required">*</span></label>
              <input
                v-model="newBranchName"
                class="modal-input"
                placeholder="e.g. merged-fix"
                maxlength="100"
                @keydown.enter="doSave()"
              />
            </template>
          </template>

          <!-- Normal save -->
          <template v-else>
            <label class="field-label">Commit message</label>
            <input
              v-model="saveComment"
              class="modal-input"
              placeholder="What changed?"
              maxlength="500"
              autofocus
              @keydown.enter="!createNewBranch && doSave()"
            />

            <label class="check-row">
              <input type="checkbox" v-model="createNewBranch" />
              <span>Save as a new branch</span>
            </label>

            <div v-if="createNewBranch" class="field-group">
              <label class="field-label">Branch name</label>
              <input
                v-model="newBranchName"
                class="modal-input"
                placeholder="e.g. dark-variant"
                maxlength="100"
              />
            </div>
          </template>

          <p v-if="saveError" class="modal-error">{{ saveError }}</p>

          <div class="modal-actions">
            <button class="modal-btn cancel" @click="showSaveModal = false">Cancel</button>
            <button
              class="modal-btn confirm"
              :disabled="isSaving || (isNewPalette ? !pendingTitle.trim() : !saveComment.trim()) || ((selectedSnapshotCtx?.isMain || selectedSnapshotCtx?.isMerged) && !newBranchName.trim())"
              @click="doSave"
            >
              {{ isSaving ? (isNewPalette ? 'Creating…' : 'Saving…') : (isNewPalette ? 'Create' : 'Save') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Auth gate modal (shown when saving without a token) -->
    <AuthModal
      v-if="showAuthModal"
      @authenticated="onAuthenticated"
      @cancel="showAuthModal = false"
    />

    <!-- Merge confirm modal -->
    <Teleport to="body">
      <div v-if="mergeTargetId !== null" class="modal-overlay" @click.self="mergeTargetId = null">
        <div class="modal">
          <h3 class="modal-title font-display">Merge Branch</h3>
          <p class="modal-sub">
            Merge <strong>{{ mergeTargetName }}</strong> into <strong>main</strong>?
            This creates a new snapshot on main with the branch's colors.
          </p>
          <p v-if="mergeError" class="modal-error">{{ mergeError }}</p>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="mergeTargetId = null">Cancel</button>
            <button class="modal-btn confirm" :disabled="isMerging" @click="doMerge">
              {{ isMerging ? 'Merging…' : 'Merge' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete palette modal -->
    <Teleport to="body">
      <div v-if="showDeletePaletteModal" class="modal-overlay" @click.self="showDeletePaletteModal = false">
        <div class="modal">
          <h3 class="modal-title font-display">Delete Palette</h3>
          <p class="modal-sub">
            Delete <strong>{{ paletteTitle }}</strong>? All snapshots and branches will be permanently lost.
          </p>
          <p v-if="deletePaletteError" class="modal-error">{{ deletePaletteError }}</p>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="showDeletePaletteModal = false">Cancel</button>
            <button class="modal-btn danger" :disabled="isDeletingPalette" @click="doDeletePalette">
              {{ isDeletingPalette ? 'Deleting…' : 'Delete permanently' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete branch modal -->
    <Teleport to="body">
      <div v-if="deleteBranchTargetId !== null" class="modal-overlay" @click.self="deleteBranchTargetId = null">
        <div class="modal">
          <h3 class="modal-title font-display">Delete Branch</h3>
          <p class="modal-sub">
            Delete branch <strong>{{ deleteBranchTargetName }}</strong>? All snapshots in this branch will be permanently lost.
          </p>
          <p v-if="deleteBranchError" class="modal-error">{{ deleteBranchError }}</p>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="deleteBranchTargetId = null">Cancel</button>
            <button class="modal-btn danger" :disabled="isDeletingBranch" @click="doDeleteBranch">
              {{ isDeletingBranch ? 'Deleting…' : 'Delete branch' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Revert branch modal -->
    <Teleport to="body">
      <div v-if="showRevertModal" class="modal-overlay" @click.self="showRevertModal = false">
        <div class="modal">
          <h3 class="modal-title font-display">Revert</h3>
          <p class="modal-sub">
            Revert <strong>{{ revertTargetLabel }}</strong> to this snapshot?
            <strong>{{ revertableSnapshotCount }} newer snapshot{{ revertableSnapshotCount === 1 ? '' : 's' }}</strong>
            will be permanently deleted.
          </p>
          <p v-if="revertError" class="modal-error">{{ revertError }}</p>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="showRevertModal = false">Cancel</button>
            <button class="modal-btn danger" :disabled="isReverting" @click="doRevert">
              {{ isReverting ? 'Reverting…' : 'Revert' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { palettesApi } from '@/api/palettes'
import type { PaletteHistoryGraphResponse, PaletteColorSave } from '@/api/types'
import PaletteAppHeader from '@/components/PaletteAppHeader.vue'
import ColorColumn from '@/components/ColorColumn.vue'
import HistoryGraph from '@/components/HistoryGraph.vue'
import AppLoader from '@/components/AppLoader.vue'
import AuthModal from '@/components/AuthModal.vue'

const route = useRoute()
const router = useRouter()

const isNewPalette = computed(() => route.params.id === 'new')
const paletteId = computed(() => isNewPalette.value ? 0 : Number(route.params.id))

function getTokenUsername(): string | null {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const payload = JSON.parse(atob(payloadPart))
    return payload.sub ?? null
  } catch { return null }
}

const isOwned = computed(() => {
  if (isNewPalette.value) return true
  if (!history.value) return false
  const me = getTokenUsername()
  return me !== null && me === history.value.owner_username
})

// For unsaved new palettes, pendingTitle holds the name until the palette is created
const pendingTitle = ref('')

// Data
const history = ref<PaletteHistoryGraphResponse | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const paletteTitle = computed(() => {
  if (isNewPalette.value) return pendingTitle.value || 'Untitled palette'
  return palettesApi.getCachedPalette(paletteId.value)?.title ?? history.value?.title ?? `Palette #${paletteId.value}`
})

// Working colors (mutable)
interface WorkingColor {
  _key: string
  hex: string
  label: string | null
}

let _keyCounter = 0
function mkKey() { return String(++_keyCounter) }
function wrapColors(cols: PaletteColorSave[]): WorkingColor[] {
  return cols.map(c => ({ hex: c.hex, label: c.label ?? null, _key: mkKey() }))
}

const colors = ref<WorkingColor[]>([])

// Snapshot tracking
const latestSnapshotId = ref<number | null>(null)

// Historical snapshot selection
const selectedSnapshotId = ref<number | null>(null)

const selectedSnapshotCtx = computed(() => {
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

// Branch state
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
  if (ctx.isMain) return 'Selected old main snapshot: saving will create a new branch.'
  if (ctx.isMerged) return `Selected snapshot from merged branch "${ctx.branchTitle}": saving will create a new branch.`
  return `Selected snapshot from branch "${ctx.branchTitle}": saving will commit to that branch.`
})

// Unsaved changes detection
const savedColorsSig = ref('')
const currentColorsSig = computed(() =>
  colors.value.map(c => `${c.hex}:${c.label ?? ''}`).join('|')
)
const hasUnsavedChanges = computed(() => currentColorsSig.value !== savedColorsSig.value)

// UI state
const historyOpen = ref(false)
const showSaveModal = ref(false)
const showAuthModal = ref(false)

function requestSave() {
  if (!localStorage.getItem('access_token')) {
    showAuthModal.value = true
  } else {
    showSaveModal.value = true
  }
}

function onAuthenticated() {
  showAuthModal.value = false
  showSaveModal.value = true
}
const saveComment = ref('')
const saveError = ref('')
const createNewBranch = ref(false)
const newBranchName = ref('')
const isSaving = ref(false)

const mergeTargetId = ref<number | null>(null)
const mergeTargetName = ref('')
const isMerging = ref(false)
const mergeError = ref('')

// Add button — only visible near right edge
const showAddBtn = ref(false)
function onColsMouseMove(e: MouseEvent) {
  if (!colsAreaEl.value) return
  const rect = colsAreaEl.value.getBoundingClientRect()
  showAddBtn.value = e.clientX > rect.right - 72
}

// Drag and drop (pointer-based, horizontal-only)
const draggedIdx = ref<number | null>(null)
const colsAreaEl = ref<HTMLElement | null>(null)
const dragPointerStartX = ref<number | null>(null)
const dragPointerStartY = ref<number | null>(null)

// Ghost element that follows the cursor during drag
const ghostEl = ref<HTMLDivElement | null>(null)
const ghostOffsetX = ref(0)
const ghostOffsetY = ref(0)

function isMobileLayout() {
  return window.matchMedia('(max-width: 768px)').matches
}

function getDragUnit(): number {
  if (!colsAreaEl.value || colors.value.length === 0) return 1
  const firstCol = colsAreaEl.value.querySelector<HTMLElement>('.col')
  if (firstCol) {
    const rect = firstCol.getBoundingClientRect()
    return Math.max(1, isMobileLayout() ? rect.height : rect.width)
  }
  const rect = colsAreaEl.value.getBoundingClientRect()
  return Math.max(1, isMobileLayout() ? rect.height / colors.value.length : rect.width / colors.value.length)
}

function getColStyle(i: number): Record<string, string> {
  if (draggedIdx.value === i) return { opacity: '0' }
  return {}
}

function onDragStart(i: number, e: PointerEvent) {
  draggedIdx.value = i
  dragPointerStartX.value = e.clientX
  dragPointerStartY.value = e.clientY
  ;(e.target as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
  e.preventDefault()

  // Create a ghost div that follows the cursor; the real column becomes invisible
  const key = colors.value[i]?._key
  if (key && colsAreaEl.value) {
    const colEl = colsAreaEl.value.querySelector<HTMLElement>(`.col[data-col-key="${key}"]`)
    if (colEl) {
      const rect = colEl.getBoundingClientRect()
      ghostOffsetX.value = e.clientX - rect.left
      ghostOffsetY.value = e.clientY - rect.top
      const ghost = document.createElement('div')
      ghost.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;background:#${colors.value[i]!.hex};z-index:9999;pointer-events:none;opacity:0.92;box-shadow:0 16px 48px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.07);`
      document.body.appendChild(ghost)
      ghostEl.value = ghost
    }
  }

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointercancel', onPointerUp, { once: true })
  document.addEventListener('pointerup', onPointerUp, { once: true })
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'grabbing'
}

function onPointerMove(e: PointerEvent) {
  if (draggedIdx.value === null) return

  // Ghost follows the cursor exactly
  if (ghostEl.value) {
    ghostEl.value.style.left = `${e.clientX - ghostOffsetX.value}px`
    ghostEl.value.style.top = `${e.clientY - ghostOffsetY.value}px`
  }

  const mobile = isMobileLayout()
  const unit = getDragUnit()
  const pointer = mobile ? e.clientY : e.clientX
  let idx = draggedIdx.value
  let start = mobile ? (dragPointerStartY.value ?? pointer) : (dragPointerStartX.value ?? pointer)
  let delta = pointer - start

  // Reorder in-flight when cursor crosses half a column/row
  while (delta > unit / 2 && idx < colors.value.length - 1) {
    const arr = [...colors.value]
    const moved = arr.splice(idx, 1)[0]
    if (!moved) break
    arr.splice(idx + 1, 0, moved)
    colors.value = arr
    idx += 1
    start += unit
    delta -= unit
  }

  while (delta < -unit / 2 && idx > 0) {
    const arr = [...colors.value]
    const moved = arr.splice(idx, 1)[0]
    if (!moved) break
    arr.splice(idx - 1, 0, moved)
    colors.value = arr
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

function onPointerUp() {
  if (ghostEl.value) {
    document.body.removeChild(ghostEl.value)
    ghostEl.value = null
  }
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointercancel', onPointerUp)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  draggedIdx.value = null
  dragPointerStartX.value = null
  dragPointerStartY.value = null
}

// Color operations
function updateHex(i: number, hex: string) {
  const c = colors.value[i]
  if (c) colors.value[i] = { ...c, hex }
}
function updateLabel(i: number, label: string | null) {
  const c = colors.value[i]
  if (c) colors.value[i] = { ...c, label }
}
function removeColor(i: number) {
  if (colors.value.length <= 1) return
  colors.value.splice(i, 1)
}
function addColor() {
  colors.value.push({ hex: randomHex(), label: null, _key: mkKey() })
}
function randomHex() {
  return Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase()
}

// Load history and init working state
async function loadHistory() {
  loading.value = true
  error.value = null
  try {
    history.value = await palettesApi.getHistory(paletteId.value)
    applyBranchState()
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load palette'
  } finally {
    loading.value = false
  }
}

function applyBranchState() {
  if (!history.value) return
  let sourceColors: PaletteColorSave[] = []
  let snapshotId: number | null = null

  if (currentBranchId.value === null) {
    // Main branch
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
  palettesApi.updateCacheColors(paletteId.value, sourceColors)
}

async function switchBranch(id: number | null) {
  currentBranchId.value = id
  applyBranchState()
}

// Save snapshot (also handles initial palette creation when isNewPalette)
async function doSave() {
  if (isNewPalette.value ? !pendingTitle.value.trim() : !saveComment.value.trim()) return
  isSaving.value = true
  saveError.value = ''
  try {
    const paletteColors = colors.value.map(c => ({ hex: c.hex, label: c.label ?? null }))

    if (isNewPalette.value) {
      // Create the palette — backend creates the initial snapshot automatically
      const created = await palettesApi.create({
        title: pendingTitle.value.trim() || 'New palette',
        description: '',
        palette_colors: paletteColors,
      })
      palettesApi.cachePalette({
        id: created.id,
        title: created.title,
        created_at: created.created_at,
        palette_colors: paletteColors,
      })
      showSaveModal.value = false
      await router.replace({ name: 'palette', params: { id: created.id } })
      await loadHistory()
      return
    }

    let payload: Parameters<typeof palettesApi.saveSnapshot>[1]

    if (selectedSnapshotCtx.value?.isMain) {
      // Fork from historical main snapshot → force new branch
      payload = {
        comment: saveComment.value.trim(),
        palette_colors: paletteColors,
        create_branch: true,
        branch_title: newBranchName.value.trim() || undefined,
        parent_snapshot_id: selectedSnapshotId.value,
      }
    } else if (selectedSnapshotCtx.value && !selectedSnapshotCtx.value.isMain) {
      if (selectedSnapshotCtx.value.isMerged) {
        // Snapshot belongs to a merged branch; force a new branch from that point.
        payload = {
          comment: saveComment.value.trim(),
          palette_colors: paletteColors,
          create_branch: true,
          branch_title: newBranchName.value.trim() || undefined,
          parent_snapshot_id: selectedSnapshotId.value,
        }
      } else {
        // Cannot create branch from branch snapshots: commit to latest in that branch.
        payload = {
          comment: saveComment.value.trim(),
          palette_colors: paletteColors,
          branch_id: selectedSnapshotCtx.value.branchId,
        }
      }
    } else {
      // Normal save
      payload = {
        comment: saveComment.value.trim(),
        palette_colors: paletteColors,
        ...(createNewBranch.value
          ? { create_branch: true, branch_title: newBranchName.value.trim() || undefined }
          : { branch_id: currentBranchId.value ?? undefined }),
      }
    }

    const resp = await palettesApi.saveSnapshot(paletteId.value, payload)

    if ((selectedSnapshotCtx.value?.isMain || selectedSnapshotCtx.value?.isMerged || createNewBranch.value) && resp.branch_id !== null) {
      currentBranchId.value = resp.branch_id
    }

    selectedSnapshotId.value = null
    await loadHistory()
    showSaveModal.value = false
    saveComment.value = ''
    createNewBranch.value = false
    newBranchName.value = ''
  } catch (e: any) {
    saveError.value = e.message ?? 'Save failed'
  } finally {
    isSaving.value = false
  }
}

function confirmMerge(branchId: number) {
  const branch = history.value?.branches.find(b => b.id === branchId)
  if (!branch) return
  mergeTargetId.value = branchId
  mergeTargetName.value = branch.title
  mergeError.value = ''
}

async function doMerge() {
  if (mergeTargetId.value === null) return
  isMerging.value = true
  mergeError.value = ''
  try {
    await palettesApi.mergeBranch(paletteId.value, mergeTargetId.value)
    mergeTargetId.value = null
    currentBranchId.value = null
    await loadHistory()
  } catch (e: any) {
    mergeError.value = e.message ?? 'Merge failed'
  } finally {
    isMerging.value = false
  }
}

// ── Delete palette ────────────────────────────────────────────────────────────
const showDeletePaletteModal = ref(false)
const isDeletingPalette = ref(false)
const deletePaletteError = ref('')

async function doDeletePalette() {
  isDeletingPalette.value = true
  deletePaletteError.value = ''
  try {
    await palettesApi.deletePalette(paletteId.value)
    showDeletePaletteModal.value = false
    router.push('/dashboard')
  } catch (e: any) {
    deletePaletteError.value = e.message ?? 'Delete failed'
  } finally {
    isDeletingPalette.value = false
  }
}

// ── Delete branch ─────────────────────────────────────────────────────────────
const deleteBranchTargetId = ref<number | null>(null)
const deleteBranchTargetName = ref('')
const isDeletingBranch = ref(false)
const deleteBranchError = ref('')

function onDeleteBranchRequest(branchId: number) {
  const branch = history.value?.branches.find(b => b.id === branchId)
  if (!branch) return
  deleteBranchTargetId.value = branchId
  deleteBranchTargetName.value = branch.title
  deleteBranchError.value = ''
}

async function doDeleteBranch() {
  if (deleteBranchTargetId.value === null) return
  isDeletingBranch.value = true
  deleteBranchError.value = ''
  try {
    await palettesApi.deleteBranch(paletteId.value, deleteBranchTargetId.value)
    if (currentBranchId.value === deleteBranchTargetId.value) currentBranchId.value = null
    deleteBranchTargetId.value = null
    await loadHistory()
  } catch (e: any) {
    deleteBranchError.value = e.message ?? 'Delete failed'
  } finally {
    isDeletingBranch.value = false
  }
}

// ── Revert (branch or main) ───────────────────────────────────────────────────
const showRevertModal = ref(false)
const isReverting = ref(false)
const revertError = ref('')

const revertableSnapshotCount = computed(() => {
  if (!selectedSnapshotId.value) return 0
  const ctx = selectedSnapshotCtx.value
  if (ctx?.isMerged) return 0

  if (ctx?.isMain) {
    // main: count newer main snapshots (index of selected in newest-first list)
    const idx = (history.value?.main ?? []).findIndex(s => s.id === selectedSnapshotId.value)
    return Math.max(0, idx)
  }

  if (ctx && !ctx.isMain) {
    // branch: count newer branch snapshots
    const branch = history.value?.branches.find(b => b.id === ctx.branchId)
    if (!branch) return 0
    const idx = branch.snapshots.findIndex(s => s.id === selectedSnapshotId.value)
    return Math.max(0, idx)
  }

  return 0
})

const revertTargetLabel = computed(() => {
  const ctx = selectedSnapshotCtx.value
  if (!ctx) return ''
  if (ctx.isMain) return 'main'
  return `branch "${ctx.branchTitle}"`
})

async function doRevert() {
  const ctx = selectedSnapshotCtx.value
  if (!selectedSnapshotId.value) return
  isReverting.value = true
  revertError.value = ''
  try {
    if (ctx?.isMain) {
      await palettesApi.revertMainToSnapshot(paletteId.value, selectedSnapshotId.value)
      currentBranchId.value = null
    } else if (ctx && !ctx.isMain && ctx.branchId) {
      await palettesApi.revertBranchToSnapshot(paletteId.value, ctx.branchId, selectedSnapshotId.value)
      currentBranchId.value = ctx.branchId
    }
    showRevertModal.value = false
    selectedSnapshotId.value = null
    await loadHistory()
  } catch (e: any) {
    revertError.value = e.message ?? 'Revert failed'
  } finally {
    isReverting.value = false
  }
}

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

function onSelectSnapshot(id: number) {
  if (selectedSnapshotId.value === id) {
    clearSnapshotSelection()
    return
  }

  // Clicking the latest main commit → just ensure we're on main, no banner
  if (history.value?.main[0]?.id === id) {
    selectedSnapshotId.value = null
    if (currentBranchId.value !== null) switchBranch(null)
    return
  }

  // Clicking the latest commit of any branch → silently switch to that branch, no banner
  for (const branch of (history.value?.branches ?? [])) {
    if (branch.snapshots[0]?.id === id) {
      if (branch.is_merged) break
      selectedSnapshotId.value = null
      switchBranch(branch.id)
      return
    }
  }

  // Historical snapshot — show banner and load its colors
  selectedSnapshotId.value = id
  const snap = findSnapshot(id)
  if (snap) {
    colors.value = wrapColors(snap.palette_colors)
    savedColorsSig.value = currentColorsSig.value
  }
}

function clearSnapshotSelection() {
  selectedSnapshotId.value = null
  applyBranchState()
}

function clonePalette() {
  const clonedColors = colors.value.map(c => ({ hex: c.hex, label: c.label ?? null }))
  router.push({ name: 'palette', params: { id: 'new' }, state: { clonedColors } })
}

function onBeforeEnter(el: Element) {
  const e = el as HTMLElement
  e.style.flexBasis = '0px'
  e.style.flexGrow = '0'
  e.style.flexShrink = '0'
  e.style.minWidth = '0'
  e.style.opacity = '0'
  e.style.overflow = 'hidden'
}

function onEnter(el: Element, done: () => void) {
  const e = el as HTMLElement
  const container = e.parentElement!
  const targetBasis = container.getBoundingClientRect().width / container.children.length
  e.offsetWidth // force layout
  e.style.transition = 'flex-basis 0.2s cubic-bezier(0.2,0,0,1), opacity 0.16s ease'
  e.style.flexBasis = targetBasis + 'px'
  e.style.opacity = '1'
  e.addEventListener('transitionend', () => {
    e.style.flexBasis = ''
    e.style.flexGrow = ''
    e.style.flexShrink = ''
    e.style.minWidth = ''
    e.style.overflow = ''
    e.style.transition = ''
    e.style.opacity = ''
    done()
  }, { once: true })
}

function onLeave(el: Element, done: () => void) {
  const e = el as HTMLElement
  const w = e.getBoundingClientRect().width
  e.style.flexBasis = w + 'px'
  e.style.flexGrow = '0'
  e.style.flexShrink = '0'
  e.style.minWidth = '0'
  e.style.overflow = 'hidden'
  e.offsetWidth // force layout
  e.style.transition = 'flex-basis 0.18s cubic-bezier(0.4,0,1,1), opacity 0.14s ease'
  e.style.flexBasis = '0px'
  e.style.opacity = '0'
  e.addEventListener('transitionend', done, { once: true })
}

function initNewPaletteDraft() {
  // Reset any state from a previously opened palette view.
  history.value = null
  latestSnapshotId.value = null
  selectedSnapshotId.value = null
  currentBranchId.value = null
  historyOpen.value = false
  error.value = null

  const clonedColors = (window.history.state?.clonedColors ?? []) as PaletteColorSave[]
  if (Array.isArray(clonedColors) && clonedColors.length > 0) {
    colors.value = wrapColors(clonedColors)
  } else {
    // Start with 5 random colors; no API call until the user saves.
    colors.value = Array.from({ length: 5 }, () => ({ hex: randomHex(), label: null, _key: mkKey() }))
  }

  // Force unsaved state for drafts/clones so save is immediately enabled.
  savedColorsSig.value = '__draft__'
  loading.value = false
}

watch(
  () => route.params.id,
  () => {
    if (isNewPalette.value) {
      initNewPaletteDraft()
    } else {
      loadHistory()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.palette-view {
  position: fixed;
  inset: 0;
  background: #09090d;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Loading */
.loading-screen,
.error-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: rgba(255,255,255,0.5);
  font-size: 14px;
  margin-top: 56px;
}

.error-screen button {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.7);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: border-color 0.15s, color 0.15s;
}
.error-screen button:hover {
  border-color: rgba(255,255,255,0.4);
  color: #fff;
}

/* Editor shell */
.editor-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  margin-top: 56px;
}

/* Snapshot selection banner */
.snapshot-banner {
  flex-shrink: 0;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: rgba(246, 195, 67, 0.08);
  border-bottom: 1px solid rgba(246, 195, 67, 0.2);
  gap: 12px;
  z-index: 10;
}
.banner-text {
  font-size: 12px;
  color: rgba(246, 195, 67, 0.75);
}
.banner-text strong { color: rgba(246, 195, 67, 1); }
.banner-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.banner-revert {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,100,100,0.75);
  background: transparent;
  border: 1px solid rgba(255,80,80,0.25);
  border-radius: 6px;
  padding: 3px 8px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.banner-revert:hover { color: rgba(255,120,120,1); border-color: rgba(255,80,80,0.55); }
.banner-dismiss {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: rgba(246, 195, 67, 0.6);
  background: transparent;
  border: 1px solid rgba(246, 195, 67, 0.25);
  border-radius: 6px;
  padding: 3px 8px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.banner-dismiss:hover { color: rgba(246, 195, 67, 1); border-color: rgba(246, 195, 67, 0.6); }

.banner-slide-enter-active, .banner-slide-leave-active { transition: height 0.2s ease, opacity 0.2s ease; }
.banner-slide-enter-from, .banner-slide-leave-to { height: 0; opacity: 0; }

/* Columns area */
.columns-area {
  position: relative;
  flex: 1;
  overflow: hidden;
}
.cols-tg {
  display: flex;
  gap: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.col-move {
  transition: transform 0.16s cubic-bezier(0.2, 0.9, 0.2, 1);
}

/* Add color button — floating bubble on hover */
.add-col-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(20, 20, 28, 0.75);
  border: 1px solid rgba(255,255,255,0.18);
  color: rgba(255,255,255,0.85);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.18s, background 0.15s;
  z-index: 20;
  backdrop-filter: blur(6px);
}
.add-col-btn.visible,
.add-col-btn:hover {
  opacity: 1;
}
.add-col-btn:hover {
  background: rgba(40, 40, 56, 0.9);
}

/* History panel */
.history-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 380px;
  height: 100%;
  background: #0e0e14;
  border-left: 1px solid rgba(255,255,255,0.07);
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.history-slide-enter-active,
.history-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.2, 1);
}
.history-slide-enter-from,
.history-slide-leave-to {
  transform: translateX(100%);
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
}

.history-title {
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 900;
  font-size: 18px;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: #fff;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 20px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}
.close-btn:hover { color: #fff; background: rgba(255,255,255,0.06); }

.history-empty {
  padding: 32px 20px;
  color: rgba(255,255,255,0.3);
  font-size: 13px;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
}

.modal {
  background: #13131a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 28px;
  width: 400px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 24px 80px rgba(0,0,0,0.8);
  animation: modalPop 0.2s cubic-bezier(0.2, 0.9, 0.2, 1);
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-title {
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 900;
  font-size: 22px;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  color: #fff;
  margin-bottom: 6px;
}

.modal-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  margin-bottom: 20px;
}
.modal-sub strong { color: rgba(255,255,255,0.7); }

.field-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  margin-bottom: 8px;
}

.modal-input {
  width: 100%;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 10px 14px;
  color: #fff;
  font-size: 14px;
  font-family: 'Sora', sans-serif;
  outline: none;
  transition: border-color 0.15s;
  margin-bottom: 16px;
}
.modal-input::placeholder { color: rgba(255,255,255,0.25); }
.modal-input:focus { border-color: rgba(180, 16, 204, 0.6); }

.check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  cursor: pointer;
  margin-bottom: 16px;
}
.check-row input[type="checkbox"] {
  accent-color: #b410cc;
  width: 15px;
  height: 15px;
}

.field-group { margin-bottom: 4px; }

.modal-error {
  font-size: 13px;
  color: #ff6b6b;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: rgba(255,107,107,0.1);
  border-radius: 6px;
  border: 1px solid rgba(255,107,107,0.2);
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 8px;
}

.modal-btn {
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.modal-btn.cancel {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
}
.modal-btn.cancel:hover {
  background: rgba(255,255,255,0.1);
}
.modal-btn.confirm {
  background: #b410cc;
  border: 1px solid transparent;
  color: #fff;
}
.modal-btn.confirm:hover:not(:disabled) { background: #9a0db0; }
.modal-btn.confirm:disabled { opacity: 0.35; cursor: not-allowed; }
.modal-btn.danger {
  background: #b41414;
  border: 1px solid transparent;
  color: #fff;
}
.modal-btn.danger:hover:not(:disabled) { background: #991010; }
.modal-btn.danger:disabled { opacity: 0.35; cursor: not-allowed; }

.modal-info {
  font-size: 13px;
  color: rgba(255,255,255,0.55);
  margin-bottom: 20px;
  padding: 10px 12px;
  background: rgba(246,195,67,0.07);
  border-radius: 8px;
  border: 1px solid rgba(246,195,67,0.18);
  line-height: 1.45;
}
.modal-info strong { color: rgba(255,255,255,0.85); }

.required { color: #b410cc; }

/* ─── Mobile: vertical color rows ─── */
@media (max-width: 768px) {
  .columns-area {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    height: auto;
    flex: 1;
  }
  .cols-tg {
    flex-direction: column !important;
    height: auto;
    overflow: visible;
  }
  .add-col-btn {
    position: static;
    transform: none;
    opacity: 1;
    width: 100%;
    height: 52px;
    border-radius: 0;
    background: rgba(255,255,255,0.03);
    border: none;
    border-top: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
    backdrop-filter: none;
  }
  .history-panel {
    width: 100%;
    height: 60vh;
    top: auto;
    bottom: 0;
    border-left: none;
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  .history-slide-enter-from,
  .history-slide-leave-to {
    transform: translateY(100%);
  }
}
</style>
