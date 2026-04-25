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
      :tutorialFocus="headerTutorialFocus"
      :mobileMenuOpen="mobileSidebarOpen"
      @back="router.push('/dashboard')"
      @save="requestSave"
      @clone="clonePalette"
      @branchChange="switchBranch"
      @toggleHistory="historyOpen = !historyOpen"
      @merge="confirmMerge"
      @deletePalette="showDeletePaletteModal = true"
      @openTutorial="openTutorial"
      @hamburgerClick="mobileSidebarOpen = !mobileSidebarOpen"
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
    <div v-else class="editor-shell" :class="{ 'history-open': historyOpen, 'has-banner': showSnapshotBanner }">

      <!-- Snapshot selection banner -->
      <Transition name="banner-slide">
        <div v-if="showSnapshotBanner" class="snapshot-banner">
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
      <div
        ref="colsAreaEl"
        class="columns-area"
        :class="{ 'tutorial-focus': tutorialFocus === 'canvas' }"
        @mousemove="onColsMouseMove"
        @mouseleave="showAddBtn = false"
      >
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
            :swapSelected="swapSourceIdx === i"
            @update:hex="hex => updateHex(i, hex)"
            @update:label="lbl => updateLabel(i, lbl)"
            @remove="removeColor(i)"
            @dragStart="e => onDragStart(i, e)"
            @swapTap="onSwapTap(i)"
          />
        </TransitionGroup>

        <!-- Add color button — only visible when near right edge -->
        <button class="add-col-btn" :class="{ visible: showAddBtn }" @click="addColor" title="Add color">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- History panel mobile backdrop -->
      <div v-if="historyOpen" class="history-mobile-backdrop" @click="historyOpen = false"></div>

      <!-- History panel -->
      <Transition name="history-slide">
        <aside v-if="historyOpen" class="history-panel" :class="{ 'tutorial-focus': tutorialFocus === 'history' }">
          <div class="history-header">
            <h2 class="history-title font-display">History</h2>
            <button class="close-btn" @click="historyOpen = false">×</button>
          </div>
          <HistoryGraph
            v-if="historyForDisplay"
            :history="historyForDisplay"
            :selectedId="showDemoHistory ? null : selectedSnapshotId"
            :showRevertButton="!showDemoHistory && isOwned && revertableSnapshotCount > 0"
            @selectSnapshot="onHistorySelectSnapshot"
            @selectBranch="onHistorySelectBranch"
            @deleteBranch="onHistoryDeleteBranch"
            @revertSnapshot="onHistoryRevertSnapshot"
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
          <template v-else-if="selectedSnapshotCtx?.isMain && !isSelectedLatestMainSnapshot">
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

            <label v-if="currentBranchId === null" class="check-row">
              <input type="checkbox" v-model="createNewBranch" />
              <span>Save as a new branch</span>
            </label>

            <div v-if="createNewBranch && currentBranchId === null" class="field-group">
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
              :disabled="isSaving || (isNewPalette ? !pendingTitle.trim() : !saveComment.trim()) || ((((selectedSnapshotCtx?.isMain && !isSelectedLatestMainSnapshot) || selectedSnapshotCtx?.isMerged)) && !newBranchName.trim())"
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

    <!-- Tutorial overlay -->
    <Teleport to="body">
      <div v-if="showTutorial" class="tutorial-shell" :class="{ 'focus-history': tutorialFocus === 'history' }">
        <div class="tutorial-dim"></div>
        <div class="tutorial-card" :class="tutorialCardClass">
          <div class="tutorial-top">
            <span class="tutorial-step">Step {{ tutorialStep + 1 }} / {{ tutorialSteps.length }}</span>
            <button class="tutorial-close" @click="closeTutorial">×</button>
          </div>

          <h3 class="tutorial-title font-display">{{ currentTutorial.title }}</h3>
          <p class="tutorial-body">{{ currentTutorial.body }}</p>

          <div v-if="currentTutorial.showDemo" class="tutorial-demo">
            <div class="demo-header">
              <span>main</span>
              <span class="demo-branch">draft/warm-variant</span>
            </div>
            <div class="demo-row">
              <span class="demo-dot main"></span>
              <span>main: Approved baseline palette</span>
            </div>
            <div class="demo-row">
              <span class="demo-dot draft"></span>
              <span>branch: A draft you can merge, park, or delete</span>
            </div>
            <div class="demo-row">
              <span class="demo-dot revert"></span>
              <span>revert: Keep one snapshot and drop newer draft commits</span>
            </div>
          </div>

          <div class="tutorial-actions">
            <button class="modal-btn cancel" :disabled="tutorialStep === 0" @click="prevTutorialStep">Back</button>
            <button v-if="tutorialStep < tutorialSteps.length - 1" class="modal-btn confirm" @click="nextTutorialStep">Next</button>
            <button v-else class="modal-btn confirm" @click="closeTutorial">Got it</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Mobile sidebar -->
    <Teleport to="body">
      <Transition name="sidebar-overlay">
        <div v-if="mobileSidebarOpen" class="msb-overlay" @click="mobileSidebarOpen = false"></div>
      </Transition>
      <Transition name="sidebar-panel">
        <div v-if="mobileSidebarOpen" class="msb-panel">

          <!-- Sidebar header -->
          <div class="msb-top">
            <span class="msb-title font-display">Menu</span>
            <button class="msb-close" @click="mobileSidebarOpen = false">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="msb-body">

            <!-- Branch section -->
            <div class="msb-section-label">Branch</div>
            <div class="msb-branches">
              <button
                class="msb-branch-opt"
                :class="{ active: currentBranchId === null }"
                @click="switchBranch(null); mobileSidebarOpen = false"
              >
                <span class="msb-dot msb-dot-main"></span>
                <span class="msb-branch-name">main</span>
                <span v-if="currentBranchId === null" class="msb-check">✓</span>
              </button>
              <template v-for="(br, idx) in mobileSidebarActiveBranches" :key="br.id">
                <button
                  class="msb-branch-opt"
                  :class="{ active: currentBranchId === br.id }"
                  @click="switchBranch(br.id); mobileSidebarOpen = false"
                >
                  <span class="msb-dot" :style="{ background: mobileBranchColor(idx) }"></span>
                  <span class="msb-branch-name">{{ br.title }}</span>
                  <span v-if="currentBranchId === br.id" class="msb-check">✓</span>
                </button>
                <button
                  v-if="currentBranchId === br.id"
                  class="msb-merge-btn"
                  @click.stop="confirmMerge(br.id); mobileSidebarOpen = false"
                >
                  ↩ Merge into main
                </button>
              </template>
            </div>

            <div v-if="snapshotCommitHint" class="msb-hint">{{ snapshotCommitHint }}</div>

            <div class="msb-divider"></div>

            <!-- Actions -->
            <div class="msb-actions">
              <button class="msb-action" @click="openTutorial(); mobileSidebarOpen = false">
                <span class="msb-help-glyph">?</span>
                How it works
              </button>
              <button
                v-if="isOwned"
                class="msb-action msb-action-primary"
                :disabled="isSaving || !hasUnsavedChanges"
                @click="requestSave(); mobileSidebarOpen = false"
              >
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v7M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
                {{ isSaving ? 'Saving…' : 'Save snapshot' }}
              </button>
              <button
                v-else
                class="msb-action msb-action-clone"
                @click="clonePalette(); mobileSidebarOpen = false"
              >
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="4" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M5 1h7a1 1 0 011 1v8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
                Clone palette
              </button>
              <button
                v-if="isOwned && !isNewPalette"
                class="msb-action msb-action-danger"
                @click="showDeletePaletteModal = true; mobileSidebarOpen = false"
              >
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M5.5 4V2.5h3V4M5 4l.5 8.5M7 4v8.5M9 4l-.5 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Delete palette
              </button>
            </div>

            <div class="msb-divider"></div>

            <!-- History section -->
            <div class="msb-section-label msb-history-label">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.4"/>
                <path d="M7 4.5V7l2 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              History
            </div>
            <div class="msb-history-body">
              <HistoryGraph
                v-if="historyForDisplay"
                :history="historyForDisplay"
                :selectedId="showDemoHistory ? null : selectedSnapshotId"
                :showRevertButton="!showDemoHistory && isOwned && revertableSnapshotCount > 0"
                @selectSnapshot="onHistorySelectSnapshot"
                @selectBranch="onHistorySelectBranch"
                @deleteBranch="onHistoryDeleteBranch"
                @revertSnapshot="onHistoryRevertSnapshot"
              />
              <div v-else class="msb-history-empty">No history yet.</div>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { palettesApi } from '@/api/palettes'
import type { PaletteHistoryGraphResponse, PaletteColorSave } from '@/api/types'
import PaletteAppHeader from '@/components/PaletteAppHeader.vue'
import ColorColumn from '@/components/ColorColumn.vue'
import HistoryGraph from '@/components/HistoryGraph.vue'
import AppLoader from '@/components/AppLoader.vue'
import AuthModal from '@/components/AuthModal.vue'
import { getBranchColor } from '@/utils/branchColors'

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

const isSelectedLatestMainSnapshot = computed(() => {
  if (!selectedSnapshotId.value || !history.value) return false
  return history.value.main[0]?.id === selectedSnapshotId.value
})

const showSnapshotBanner = computed(() => {
  if (!selectedSnapshotId.value || isNewPalette.value) return false
  const ctx = selectedSnapshotCtx.value
  if (!ctx) return false
  if (ctx.isMain) {
    return !isSelectedLatestMainSnapshot.value
  }
  if (ctx.isMerged) return true

  const branch = history.value?.branches.find(b => b.id === ctx.branchId)
  const isLatestUnmergedBranchTip = branch?.is_merged === false && branch.snapshots[0]?.id === selectedSnapshotId.value
  return !isLatestUnmergedBranchTip
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
  if (ctx.isMain && isSelectedLatestMainSnapshot.value) return null
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
const mobileSidebarOpen = ref(false)
const showSaveModal = ref(false)
const showAuthModal = ref(false)

// Tracks which branch was active before snapshot selection so it can be restored on deselect.
// undefined = no snapshot currently selected (distinct from null = main branch)
const branchBeforeSelection = ref<number | null | undefined>(undefined)

const mobileSidebarActiveBranches = computed(() =>
  allBranches.value.filter(b => !b.is_merged)
)

function mobileBranchColor(idx: number): string {
  return getBranchColor(idx)
}

type TutorialFocus = 'header' | 'branches' | 'canvas' | 'history' | 'save' | null
interface TutorialStep {
  title: string
  body: string
  focus: TutorialFocus
  showHistory?: boolean
  showDemo?: boolean
  useDemoHistory?: boolean
}

const showTutorial = ref(false)
const tutorialStep = ref(0)
const previousHistoryOpen = ref(false)
const tutorialNow = Date.now()
const tutorialDemoHistory: PaletteHistoryGraphResponse = {
  owner_username: 'tutorial-user',
  title: 'brand-system',
  main: [
    {
      id: 9004,
      palette_id: 999,
      parent_snapshot_id: 9003,
      branch_id: null,
      comment: "Merge branch 'draft/warm-variant'",
      created_at: new Date(tutorialNow - 10 * 60_000).toISOString(),
      palette_colors: [
        { hex: '121826', label: 'bg-main' },
        { hex: 'F6C343', label: 'accent' },
        { hex: '16C9D8', label: 'info' },
        { hex: 'F4EFE6', label: 'surface' },
      ],
      colors_added: 1,
      colors_deleted: 0,
      colors_modified: 1,
    },
    {
      id: 9003,
      palette_id: 999,
      parent_snapshot_id: 9001,
      branch_id: null,
      comment: 'Main: baseline approved v2',
      created_at: new Date(tutorialNow - 5 * 60 * 60_000).toISOString(),
      palette_colors: [
        { hex: '121826', label: 'bg-main' },
        { hex: 'B410CC', label: 'accent' },
        { hex: '16C9D8', label: 'info' },
      ],
      colors_added: 1,
      colors_deleted: 0,
      colors_modified: 1,
    },
    {
      id: 9001,
      palette_id: 999,
      parent_snapshot_id: null,
      branch_id: null,
      comment: 'Initial palette creation',
      created_at: new Date(tutorialNow - 6 * 24 * 60 * 60_000).toISOString(),
      palette_colors: [
        { hex: '121826', label: 'bg-main' },
        { hex: '9A7BFF', label: 'accent' },
      ],
      colors_added: 0,
      colors_deleted: 0,
      colors_modified: 0,
    },
  ],
  branches: [
    {
      id: 9101,
      title: 'draft/warm-variant',
      merged_at: new Date(tutorialNow - 10 * 60_000).toISOString(),
      is_merged: true,
      snapshots: [
        {
          id: 9103,
          palette_id: 999,
          parent_snapshot_id: 9102,
          branch_id: 9101,
          comment: 'Draft commit: warmer accent candidate',
          created_at: new Date(tutorialNow - 120 * 60_000).toISOString(),
          palette_colors: [
            { hex: '121826', label: 'bg-main' },
            { hex: 'F6C343', label: 'accent' },
            { hex: '16C9D8', label: 'info' },
          ],
          colors_added: 0,
          colors_deleted: 0,
          colors_modified: 1,
        },
        {
          id: 9102,
          palette_id: 999,
          parent_snapshot_id: 9003,
          branch_id: 9101,
          comment: 'Fork from main to test warm direction',
          created_at: new Date(tutorialNow - 220 * 60_000).toISOString(),
          palette_colors: [
            { hex: '121826', label: 'bg-main' },
            { hex: 'E38B2F', label: 'accent' },
            { hex: '16C9D8', label: 'info' },
          ],
          colors_added: 0,
          colors_deleted: 0,
          colors_modified: 1,
        },
      ],
    },
    {
      id: 9102,
      title: 'draft/cta-focus',
      merged_at: null,
      is_merged: false,
      snapshots: [
        {
          id: 9203,
          palette_id: 999,
          parent_snapshot_id: 9202,
          branch_id: 9102,
          comment: 'Draft commit 3: too strong, will revert',
          created_at: new Date(tutorialNow - 80 * 60_000).toISOString(),
          palette_colors: [
            { hex: '121826', label: 'bg-main' },
            { hex: 'FF4B5C', label: 'cta' },
            { hex: '16C9D8', label: 'info' },
          ],
          colors_added: 0,
          colors_deleted: 0,
          colors_modified: 1,
        },
        {
          id: 9202,
          palette_id: 999,
          parent_snapshot_id: 9201,
          branch_id: 9102,
          comment: 'Draft commit 2: balanced CTA',
          created_at: new Date(tutorialNow - 170 * 60_000).toISOString(),
          palette_colors: [
            { hex: '121826', label: 'bg-main' },
            { hex: 'F28B52', label: 'cta' },
            { hex: '16C9D8', label: 'info' },
          ],
          colors_added: 0,
          colors_deleted: 0,
          colors_modified: 1,
        },
        {
          id: 9201,
          palette_id: 999,
          parent_snapshot_id: 9003,
          branch_id: 9102,
          comment: 'Fork from main for CTA experiment',
          created_at: new Date(tutorialNow - 260 * 60_000).toISOString(),
          palette_colors: [
            { hex: '121826', label: 'bg-main' },
            { hex: 'B410CC', label: 'accent' },
            { hex: '16C9D8', label: 'info' },
          ],
          colors_added: 0,
          colors_deleted: 0,
          colors_modified: 0,
        },
      ],
    },
  ],
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Palette Basics: Main + Snapshots',
    body: 'Your palette is a timeline of snapshots. A snapshot stores the full visible color state at save time, plus a commit message. Main is the main branch: the current true version of the palette.',
    focus: 'header',
  },
  {
    title: 'Branches = Draft Tracks',
    body: 'Treat branches as drafts. You can explore ideas without touching main, then merge when validated, keep them parked, or delete unmerged drafts.',
    focus: 'branches',
  },
  {
    title: 'Old Snapshot Rules (Important)',
    body: 'If you edit an older snapshot from the main branch (the current true version), saving creates a new branch from that point. If you edit an older snapshot inside a branch, saving updates that same branch (it does not create another branch by default).',
    focus: 'canvas',
  },
  {
    title: 'Concrete Example History',
    body: 'This panel is now showing demo history: one draft merged into main, and another draft branch with multiple commits. Watch lines, badges, and change counters.',
    focus: 'history',
    showHistory: true,
    showDemo: true,
    useDemoHistory: true,
  },
  {
    title: 'Merge and Revert, In Practice',
    body: 'Merge promotes a draft to main as a validated result. Revert on a branch deletes newer snapshots after a selected point, so you can keep a stable draft state and discard risky commits.',
    focus: 'history',
    showHistory: true,
    showDemo: true,
    useDemoHistory: true,
  },
  {
    title: 'Save Snapshot and Continue',
    body: 'When you are happy with current colors, save a snapshot. Your real history returns right after the tutorial, and you can continue working from your actual data.',
    focus: 'save',
  },
]

const currentTutorial = computed<TutorialStep>(() => {
  const idx = Math.max(0, Math.min(tutorialStep.value, tutorialSteps.length - 1))
  return tutorialSteps[idx]!
})
const tutorialFocus = computed<TutorialFocus>(() => (showTutorial.value ? currentTutorial.value.focus : null))
const headerTutorialFocus = computed(() => (tutorialFocus.value === 'canvas' ? null : tutorialFocus.value))
const showDemoHistory = computed(() => showTutorial.value && !!currentTutorial.value.useDemoHistory)
const historyForDisplay = computed(() => (showDemoHistory.value ? tutorialDemoHistory : history.value))
const tutorialCardClass = computed(() => `focus-${currentTutorial.value.focus ?? 'header'}`)

function openTutorial() {
  previousHistoryOpen.value = historyOpen.value
  tutorialStep.value = 0
  showTutorial.value = true
  if (currentTutorial.value.showHistory) historyOpen.value = true
}

function closeTutorial() {
  showTutorial.value = false
  tutorialStep.value = 0
  historyOpen.value = previousHistoryOpen.value
}

function nextTutorialStep() {
  tutorialStep.value = Math.min(tutorialStep.value + 1, tutorialSteps.length - 1)
}

function prevTutorialStep() {
  tutorialStep.value = Math.max(tutorialStep.value - 1, 0)
}

watch([showTutorial, tutorialStep], ([open]) => {
  if (!open) return
  historyOpen.value = currentTutorial.value.showHistory ? true : previousHistoryOpen.value
})

function requestSave() {
  // Can't create a new branch while already on a branch — reset stale checkbox state
  if (currentBranchId.value !== null) createNewBranch.value = false
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

// Tap-to-swap (mobile only)
const swapSourceIdx = ref<number | null>(null)

function onSwapTap(i: number) {
  if (swapSourceIdx.value === null) {
    swapSourceIdx.value = i
  } else if (swapSourceIdx.value === i) {
    swapSourceIdx.value = null
  } else {
    const arr = [...colors.value]
    const tmp = arr[swapSourceIdx.value]!
    arr[swapSourceIdx.value] = arr[i]!
    arr[i] = tmp
    colors.value = arr
    swapSourceIdx.value = null
  }
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
  // Clone the column BEFORE marking it as dragging so the clone captures the fully-visible state
  const key = colors.value[i]?._key
  if (key && colsAreaEl.value) {
    const colEl = colsAreaEl.value.querySelector<HTMLElement>(`.col[data-col-key="${key}"]`)
    if (colEl) {
      const rect = colEl.getBoundingClientRect()
      ghostOffsetX.value = e.clientX - rect.left
      ghostOffsetY.value = e.clientY - rect.top

      const ghost = colEl.cloneNode(true) as HTMLDivElement
      ghost.style.position = 'fixed'
      ghost.style.left = rect.left + 'px'
      ghost.style.top = rect.top + 'px'
      ghost.style.width = rect.width + 'px'
      ghost.style.height = rect.height + 'px'
      ghost.style.zIndex = '9999'
      ghost.style.pointerEvents = 'none'
      ghost.style.cursor = 'grabbing'
      ghost.style.margin = '0'
      ghost.style.flexGrow = '0'
      ghost.style.flexShrink = '0'
      ghost.style.boxShadow = 'none'
      ghost.style.transition = 'none'
      document.body.appendChild(ghost)
      ghostEl.value = ghost
    }
  }

  draggedIdx.value = i
  dragPointerStartX.value = e.clientX
  dragPointerStartY.value = e.clientY
  ;(e.target as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
  e.preventDefault()

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointercancel', onPointerUp, { once: true })
  document.addEventListener('pointerup', onPointerUp, { once: true })
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'grabbing'
}

function onPointerMove(e: PointerEvent) {
  if (draggedIdx.value === null) return
  e.preventDefault() // prevents browser from firing pointercancel (scroll takeover) on mobile

  const mobile = isMobileLayout()

  // Ghost tracks cursor: horizontal-only on desktop, vertical-only on mobile
  if (ghostEl.value) {
    if (mobile) {
      ghostEl.value.style.top = `${e.clientY - ghostOffsetY.value}px`
    } else {
      ghostEl.value.style.left = `${e.clientX - ghostOffsetX.value}px`
    }
  }

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

async function onPointerUp() {
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointercancel', onPointerUp)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  dragPointerStartX.value = null
  dragPointerStartY.value = null

  const ghost = ghostEl.value
  const idx = draggedIdx.value

  if (!ghost || idx === null) {
    if (ghost?.parentNode) document.body.removeChild(ghost)
    ghostEl.value = null
    draggedIdx.value = null
    return
  }

  // Wait for Vue to resolve any in-flight reorder before reading final positions
  await nextTick()

  const key = colors.value[idx]?._key
  const colEl = key ? colsAreaEl.value?.querySelector<HTMLElement>(`.col[data-col-key="${key}"]`) : null

  if (!colEl) {
    if (ghost.parentNode) document.body.removeChild(ghost)
    ghostEl.value = null
    draggedIdx.value = null
    return
  }

  const finalRect = colEl.getBoundingClientRect()
  const mobile = isMobileLayout()
  const animProp = mobile ? 'top' : 'left'

  let cleanedUp = false
  const cleanup = () => {
    if (cleanedUp) return
    cleanedUp = true
    if (ghost.parentNode) document.body.removeChild(ghost)
    ghostEl.value = null
    draggedIdx.value = null
  }

  // transitionend fires per-property; clean up on whichever finishes first
  ghost.addEventListener('transitionend', (e: TransitionEvent) => {
    if (e.propertyName === animProp || e.propertyName === 'opacity') cleanup()
  })
  setTimeout(cleanup, 300) // fallback if transition doesn't fire (zero-distance drop)

  // Slide ghost to its final slot, then swap it for the real column instantly
  ghost.style.transition = `${animProp} 0.18s cubic-bezier(0.2,0.9,0.2,1)`
  if (mobile) {
    ghost.style.top = `${finalRect.top}px`
  } else {
    ghost.style.left = `${finalRect.left}px`
  }
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
  // Clear any snapshot selection so the stale hint doesn't persist after switching branches
  selectedSnapshotId.value = null
  branchBeforeSelection.value = undefined
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

    if (selectedSnapshotCtx.value?.isMain && !isSelectedLatestMainSnapshot.value) {
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

    if ((((selectedSnapshotCtx.value?.isMain && !isSelectedLatestMainSnapshot.value) || selectedSnapshotCtx.value?.isMerged || createNewBranch.value)) && resp.branch_id !== null) {
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

  // Save the current branch the first time the user selects a snapshot so we can restore
  // it when they deselect. Without this, currentBranchId stays pointing at the snapshot's
  // branch even after deselection, causing wrong parent context on the next save.
  if (branchBeforeSelection.value === undefined) {
    branchBeforeSelection.value = currentBranchId.value
  }

  // Keep header branch selector in sync with selected snapshot context.
  // Merged-branch snapshots are treated as main for branch selection.
  let nextBranchId: number | null = null
  if (history.value?.main.some(s => s.id === id)) {
    nextBranchId = null
  } else {
    const branch = history.value?.branches.find(b => b.snapshots.some(s => s.id === id))
    if (branch) nextBranchId = branch.is_merged ? null : branch.id
  }
  currentBranchId.value = nextBranchId

  // Any snapshot (including latest) is selectable, so comments can expand consistently.
  selectedSnapshotId.value = id
  const snap = findSnapshot(id)
  if (snap) {
    colors.value = wrapColors(snap.palette_colors)
    savedColorsSig.value = currentColorsSig.value
  }
}

function onHistorySelectSnapshot(id: number) {
  if (showDemoHistory.value) return
  onSelectSnapshot(id)
}

function onHistorySelectBranch(id: number) {
  if (showDemoHistory.value) return
  void switchBranch(id === 0 ? null : id)
}

function onHistoryDeleteBranch(id: number) {
  if (showDemoHistory.value) return
  onDeleteBranchRequest(id)
}

function onHistoryRevertSnapshot(id: number) {
  if (showDemoHistory.value) return
  if (selectedSnapshotId.value !== id) {
    selectedSnapshotId.value = id
  }
  if (!isOwned.value || revertableSnapshotCount.value <= 0) return
  showRevertModal.value = true
}

function clearSnapshotSelection() {
  selectedSnapshotId.value = null
  // Restore the branch the user was on before they selected the snapshot
  if (branchBeforeSelection.value !== undefined) {
    currentBranchId.value = branchBeforeSelection.value
    branchBeforeSelection.value = undefined
  }
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

.tutorial-focus {
  position: relative;
  z-index: 330;
  box-shadow: 0 0 0 2px rgba(246, 195, 67, 0.8), 0 0 34px rgba(246, 195, 67, 0.25);
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
  transition: transform 0.29s cubic-bezier(0.2, 0.9, 0.2, 1);
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

/* Tutorial */
.tutorial-shell {
  position: fixed;
  inset: 0;
  z-index: 320;
  pointer-events: none;
}

.tutorial-dim {
  position: absolute;
  inset: 0;
  background: rgba(7, 8, 12, 0.52);
}

.tutorial-shell.focus-history .tutorial-dim {
  background: linear-gradient(
    to left,
    rgba(7, 8, 12, 0) 0,
    rgba(7, 8, 12, 0) 420px,
    rgba(7, 8, 12, 0.52) 420px,
    rgba(7, 8, 12, 0.52) 100%
  );
}

.tutorial-card {
  position: absolute;
  right: 22px;
  top: 76px;
  width: min(420px, calc(100vw - 28px));
  background: rgba(16, 17, 24, 0.96);
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 14px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.62);
  padding: 16px 16px 14px;
  pointer-events: auto;
}

.tutorial-card.focus-header {
  top: 72px;
  right: 22px;
}

.tutorial-card.focus-branches {
  top: 72px;
  left: 50%;
  right: auto;
  transform: translateX(-50%);
}

.tutorial-card.focus-canvas {
  top: 72px;
  left: 50%;
  right: auto;
  transform: translateX(-50%);
}

.tutorial-card.focus-history {
  top: 72px;
  right: 410px;
}

.tutorial-card.focus-save {
  top: 72px;
  right: 22px;
}

.tutorial-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.tutorial-step {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.55);
  font-weight: 700;
}

.tutorial-close {
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.65);
  font-size: 18px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 6px;
}
.tutorial-close:hover { background: rgba(255,255,255,0.1); color: #fff; }

.tutorial-title {
  font-size: 22px;
  margin-bottom: 8px;
  color: #ffffff;
}

.tutorial-body {
  color: rgba(255,255,255,0.72);
  line-height: 1.5;
  font-size: 13px;
}

.history-mobile-backdrop {
  display: none;
}

.tutorial-demo {
  margin-top: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255,255,255,0.65);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.demo-branch { color: #f6c343; }

.demo-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.78);
}

.demo-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  flex-shrink: 0;
}

.demo-dot.main { background: #0ec6d4; }
.demo-dot.draft { background: #f6c343; }
.demo-dot.revert { background: #ff6b6b; }

.tutorial-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

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

  /* History panel: bottom sheet on mobile */
  .history-mobile-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 49;
    background: rgba(0,0,0,0.55);
  }
  .history-panel {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 56vh;
    border-radius: 18px 18px 0 0;
    border-left: none;
    border-top: 1px solid rgba(255,255,255,0.09);
    z-index: 50;
  }
  .history-slide-enter-from,
  .history-slide-leave-to {
    transform: translateY(100%);
  }

  /* Tutorial dim: clear the bottom area where the history panel sits */
  .tutorial-shell.focus-history .tutorial-dim {
    background: linear-gradient(
      to bottom,
      rgba(7, 8, 12, 0.52) 0,
      rgba(7, 8, 12, 0.52) calc(44vh + 56px),
      rgba(7, 8, 12, 0) calc(44vh + 56px)
    );
  }

  /* Tutorial: override ALL non-history focus variants to a full-width bottom sheet.
     The desktop focus rules (.tutorial-card.focus-*) are more specific,
     so we must list them all here to win the cascade. */
  .tutorial-card,
  .tutorial-card.focus-header,
  .tutorial-card.focus-branches,
  .tutorial-card.focus-canvas,
  .tutorial-card.focus-save {
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    top: auto !important;
    width: 100% !important;
    transform: none !important;
    border-radius: 18px 18px 0 0;
    border-left: none;
    border-right: none;
    border-bottom: none;
    padding: 20px 20px 36px;
    max-height: 75vh;
    overflow-y: auto;
  }

  /* When history is shown: pin tutorial card just below the header so it
     doesn't overlap the bottom-sheet history panel */
  .tutorial-card.focus-history {
    left: 12px !important;
    right: 12px !important;
    top: 68px !important;
    bottom: auto !important;
    width: auto !important;
    transform: none !important;
    border-radius: 14px;
    padding: 16px 16px 18px;
    max-height: calc(44vh - 20px);
    overflow-y: auto;
  }
}

/* ─── Mobile sidebar (Teleport, always present in DOM) ─── */
.msb-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
}

.msb-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 201;
  width: min(88vw, 380px);
  background: #0e0e14;
  border-left: 1px solid rgba(255, 255, 255, 0.09);
  display: flex;
  flex-direction: column;
  box-shadow: -24px 0 64px rgba(0, 0, 0, 0.65);
  overflow: hidden;
}

.msb-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 56px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.msb-title {
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 900;
  font-size: 18px;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: #fff;
}

.msb-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.msb-close:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

.msb-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.msb-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.28);
  margin-bottom: 8px;
  padding: 0 4px;
}

.msb-history-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 0;
  padding: 12px 4px 10px;
  border-top: none;
}

.msb-branches {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 4px;
}

.msb-branch-opt {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.msb-branch-opt:hover { background: rgba(255, 255, 255, 0.07); color: #fff; border-color: rgba(255, 255, 255, 0.12); }
.msb-branch-opt.active { color: #fff; background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1); }

.msb-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.msb-dot-main { background: rgba(255, 255, 255, 0.7); }

.msb-branch-name { flex: 1; }

.msb-check {
  font-size: 12px;
  color: #b410cc;
  margin-left: auto;
}

.msb-merge-btn {
  display: block;
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: none;
  background: transparent;
  color: #0ec6d4;
  font-size: 12px;
  cursor: pointer;
  border-radius: 7px;
  text-align: left;
  transition: background 0.12s;
}
.msb-merge-btn:hover { background: rgba(14, 198, 212, 0.08); }

.msb-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  padding: 8px 4px 4px;
  line-height: 1.45;
}

.msb-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
  margin: 12px 0;
}

.msb-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.msb-action {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 0.14s, color 0.14s, border-color 0.14s;
}
.msb-action:hover { background: rgba(255, 255, 255, 0.07); color: #fff; border-color: rgba(255, 255, 255, 0.13); }

.msb-help-glyph {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  font-size: 10px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.65);
  flex-shrink: 0;
}

.msb-action-primary {
  background: rgba(180, 16, 204, 0.15) !important;
  border-color: rgba(180, 16, 204, 0.35) !important;
  color: #e070f5 !important;
  font-weight: 600;
}
.msb-action-primary:hover:not(:disabled) {
  background: rgba(180, 16, 204, 0.25) !important;
  border-color: rgba(180, 16, 204, 0.5) !important;
  color: #fff !important;
}
.msb-action-primary:disabled { opacity: 0.35; cursor: not-allowed; }

.msb-action-clone {
  background: rgba(14, 198, 212, 0.08) !important;
  border-color: rgba(14, 198, 212, 0.25) !important;
  color: #0ec6d4 !important;
}
.msb-action-clone:hover {
  background: rgba(14, 198, 212, 0.16) !important;
  border-color: rgba(14, 198, 212, 0.4) !important;
  color: #fff !important;
}

.msb-action-danger {
  background: transparent !important;
  border-color: rgba(255, 80, 80, 0.15) !important;
  color: rgba(255, 100, 100, 0.55) !important;
}
.msb-action-danger:hover {
  background: rgba(255, 80, 80, 0.08) !important;
  border-color: rgba(255, 80, 80, 0.35) !important;
  color: rgba(255, 130, 130, 0.9) !important;
}

.msb-history-body {
  min-height: 120px;
}

.msb-history-empty {
  padding: 24px 0;
  color: rgba(255, 255, 255, 0.3);
  font-size: 13px;
  text-align: center;
}

/* Sidebar transitions */
.sidebar-overlay-enter-active { transition: opacity 0.25s ease; }
.sidebar-overlay-leave-active { transition: opacity 0.2s ease; }
.sidebar-overlay-enter-from,
.sidebar-overlay-leave-to { opacity: 0; }

.sidebar-panel-enter-active { transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.2, 1); }
.sidebar-panel-leave-active { transition: transform 0.22s cubic-bezier(0.4, 0, 1, 1); }
.sidebar-panel-enter-from,
.sidebar-panel-leave-to { transform: translateX(100%); }
</style>
