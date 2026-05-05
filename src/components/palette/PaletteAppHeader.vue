<template>
  <header class="pal-header" :class="{ 'focus-header': tutorialFocus === 'header' }">
    <!-- Left: back + title -->
    <div class="left-group">
      <button class="back-btn" @click="$emit('back')" title="Back to dashboard">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="divider"></div>
      <span class="palette-name font-display">{{ paletteTitle }}</span>
    </div>

    <!-- Center: branch selector (desktop) -->
    <div class="center-group">
      <div
        class="branch-selector"
        :class="{ open: branchOpen, 'focus-ring': tutorialFocus === 'branches' }"
        @click="branchOpen = !branchOpen"
      >
        <svg class="branch-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="3" cy="3" r="2" stroke="currentColor" stroke-width="1.4"/>
          <circle cx="3" cy="11" r="2" stroke="currentColor" stroke-width="1.4"/>
          <circle cx="11" cy="3" r="2" stroke="currentColor" stroke-width="1.4"/>
          <path d="M3 5v4M3 5c0 0 8 0 8-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        <span class="branch-name">{{ currentBranch }}</span>
        <svg class="chevron" width="10" height="10" viewBox="0 0 10 10" fill="none" :class="{ rotated: branchOpen }">
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <Teleport to="body">
        <div v-if="branchOpen" class="branch-dropdown-overlay" @click="branchOpen = false"></div>
        <div v-if="branchOpen" class="branch-dropdown" :style="dropdownStyle">
          <button
            class="branch-opt"
            :class="{ active: currentBranchId === null }"
            @click="selectBranch(null, 'main')"
          >
            <span class="branch-dot main-dot"></span>
            main
            <span v-if="currentBranchId === null" class="active-check">✓</span>
          </button>
          <template v-for="br in activeBranches" :key="br.id">
            <button
              class="branch-opt"
              :class="{ active: currentBranchId === br.id }"
              @click="selectBranch(br.id, br.title)"
            >
              <span class="branch-dot" :style="{ background: branchColor(br.id) }"></span>
              {{ br.title }}
              <span v-if="currentBranchId === br.id" class="active-check">✓</span>
            </button>
            <button
              v-if="currentBranchId === br.id"
              class="merge-inline-btn"
              @click.stop="$emit('merge', br.id); branchOpen = false"
            >
              ↩ Merge into main
            </button>
          </template>
        </div>
      </Teleport>
    </div>

    <!-- Right: actions (desktop) -->
    <div class="right-group">
      <button
        class="help-btn"
        title="How palettes work"
        @click="$emit('openTutorial')"
      >
        ?
      </button>
      <span v-if="snapshotHint" class="snapshot-hint">{{ snapshotHint }}</span>
      <span v-if="isOwned && hasUnsavedChanges" class="unsaved-dot" title="Unsaved changes"></span>
      <!-- Undo / Redo arrows -->
      <div class="undo-redo-group">
        <button
          class="undo-redo-btn"
          :disabled="!canUndo"
          title="Undo (Ctrl+Z)"
          @click="$emit('undo')"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2.5 5H8a3 3 0 010 6H5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4.5 2.5L2 5l2.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button
          class="undo-redo-btn"
          :disabled="!canRedo"
          title="Redo (Ctrl+Y)"
          @click="$emit('redo')"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M10.5 5H5a3 3 0 000 6h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8.5 2.5L11 5l-2.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <button
        class="action-btn secondary"
        @click="$emit('toggleHistory')"
        :class="{ active: historyOpen, 'focus-ring': tutorialFocus === 'history' }"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.4"/>
          <path d="M7 4.5V7l2 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        History
      </button>
      <!-- Generate split-button -->
      <div class="gen-btn-group">
        <button class="gen-instant-btn" @click="$emit('generate')" title="Generate palette (Space)">
          <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1.5l1.2 3.3L12 6l-3.3 1.2L7.5 10.5 6.3 7.2 3 6l3.3-1.2L7.5 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            <path d="M12 10l.6 1.4L14 12l-1.4.6L12 14l-.6-1.4L10 12l1.4-.6L12 10z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>
          </svg>
          Generate
        </button>
        <button class="gen-settings-btn" @click="$emit('openGenerateSettings')" title="Generate settings (Alt+Space)">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="1.8" stroke="currentColor" stroke-width="1.2"/>
            <path d="M6 1v1.2M6 9.8V11M1 6h1.2M9.8 6H11M2.2 2.2l.85.85M8.95 8.95l.85.85M9.8 2.2l-.85.85M3.05 8.95l-.85.85" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <button
        class="image-action-btn"
        title="Extract palette from image"
        @click="$emit('openImagePalette')"
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <rect x="1.4" y="2.2" width="11.2" height="9.6" rx="1.8" stroke="currentColor" stroke-width="1.3"/>
          <circle cx="4.6" cy="5.2" r="1" fill="currentColor"/>
          <path d="M2.8 10l2.8-2.4 1.9 1.6 1.8-1.5 2 2.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <button
        v-if="isOwned && canDelete"
        class="action-btn danger-icon"
        title="Delete palette"
        @click="$emit('deletePalette')"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 4h10M5.5 4V2.5h3V4M5 4l.5 8.5M7 4v8.5M9 4l-.5 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button
        v-if="isOwned"
        class="action-btn secondary"
        title="Edit palette"
        @click="$emit('edit')"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 9.5L9.5 2.5l2 2-7 7H2.5v-2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M8.8 3.2l2 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        Edit
      </button>
      <button
        v-if="isOwned"
        class="action-btn primary"
        :disabled="isSaving || !hasUnsavedChanges"
        :class="{ 'focus-ring': tutorialFocus === 'save' }"
        @click="$emit('save')"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2v7M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        {{ isSaving ? 'Saving…' : 'Save snapshot' }}
      </button>
      <button
        v-else
        class="action-btn clone"
        @click="$emit('clone')"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="4" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
          <path d="M5 1h7a1 1 0 011 1v8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        Clone palette
      </button>
    </div>

    <!-- Mobile right: unsaved indicator + undo/redo + hamburger -->
    <div class="mobile-right">
      <span v-if="isOwned && hasUnsavedChanges" class="unsaved-dot" title="Unsaved changes"></span>
      <div class="mobile-nav-group">
        <button
          class="mobile-nav-btn"
          :disabled="!canUndo"
          title="Undo (Ctrl+Z)"
          @click="$emit('undo')"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2.5 5H8a3 3 0 010 6H5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4.5 2.5L2 5l2.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button
          class="mobile-nav-btn"
          :disabled="!canRedo"
          title="Redo (Ctrl+Y)"
          @click="$emit('redo')"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M10.5 5H5a3 3 0 000 6h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8.5 2.5L11 5l-2.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <button
        class="hamburger-btn"
        :class="{ open: mobileMenuOpen }"
        :aria-expanded="mobileMenuOpen"
        aria-label="Open menu"
        @click="$emit('hamburgerClick')"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

  </header>
</template>

<script setup lang="ts">
/**
 * PaletteAppHeader — Fixed top bar for the palette editor.
 * Shows back button, palette title, branch selector (desktop), undo/redo,
 * history toggle, generate split-button, and save/clone action.
 * On mobile the center and right groups are hidden; a compact mobile-right
 * group is shown instead (undo/redo controls and hamburger).
 */
import { ref, computed } from 'vue'
import { getBranchColor } from '@/utils/branchColors'

const props = defineProps<{
  /** Display name for the current palette. */
  paletteTitle: string
  /** Name of the currently-active branch. */
  currentBranch: string
  /** ID of the currently-active branch, or null for main. */
  currentBranchId: number | null
  /** All branches for the palette. */
  branches: Array<{ id: number; title: string; is_merged: boolean }>
  /** Whether there are unsaved local changes. */
  hasUnsavedChanges: boolean
  /** Whether a save request is in-flight. */
  isSaving: boolean
  /** Whether the history panel is currently open. */
  historyOpen: boolean
  /** Optional hint text shown next to the snapshot badge. */
  snapshotHint?: string | null
  /** Whether the current user owns the palette. */
  isOwned?: boolean
  /** Whether the delete-palette action is available. */
  canDelete?: boolean
  /** Which element the tutorial spotlight should highlight. */
  tutorialFocus?: 'header' | 'branches' | 'save' | 'history' | null
  /** Whether the mobile side-menu is open. */
  mobileMenuOpen?: boolean
  /** Whether there is a state available to undo. */
  canUndo?: boolean
  /** Whether there is a state available to redo. */
  canRedo?: boolean
}>()

const emit = defineEmits<{
  back: []
  save: []
  clone: []
  branchChange: [id: number | null]
  toggleHistory: []
  merge: [branchId: number]
  deletePalette: []
  edit: []
  openTutorial: []
  hamburgerClick: []
  generate: []
  openGenerateSettings: []
  openImagePalette: []
  undo: []
  redo: []
}>()

/** Whether the branch dropdown flyout is open. */
const branchOpen = ref(false)

/** Only non-merged branches shown in the selector. */
const activeBranches = computed(() => props.branches.filter(b => !b.is_merged))

/**
 * Returns the CSS color string for a branch dot based on its index.
 * @param id - Branch ID to look up.
 */
function branchColor(id: number) {
  const idx = props.branches.findIndex(b => b.id === id)
  return getBranchColor(idx >= 0 ? idx : 0)
}

/**
 * Emits a branchChange event and closes the dropdown.
 * @param id - Branch ID to switch to, or null for main.
 * @param _name - Branch name (unused, kept for call-site clarity).
 */
function selectBranch(id: number | null, _name: string) {
  emit('branchChange', id)
  branchOpen.value = false
}

/** Fixed-position style for the Teleported branch dropdown. */
const dropdownStyle = ref({
  position: 'fixed' as const,
  top: '58px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: '9999',
})
</script>

<style src="./PaletteAppHeader.css" scoped></style>
