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

    <!-- Center: branch selector -->
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

    <!-- Right: actions -->
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
  </header>
</template>

<script setup lang="ts">
/** Top header bar for the palette editor.
 *  Left: back button + palette title. Center: branch selector dropdown (Teleported).
 *  Right: unsaved-changes dot, history toggle, save snapshot button. */
import { ref, computed } from 'vue'
import { getBranchColor } from '@/utils/branchColors'

const props = defineProps<{
  paletteTitle: string
  currentBranch: string
  currentBranchId: number | null
  branches: Array<{ id: number; title: string; is_merged: boolean }>
  hasUnsavedChanges: boolean
  isSaving: boolean
  historyOpen: boolean
  snapshotHint?: string | null
  isOwned?: boolean
  canDelete?: boolean
  tutorialFocus?: 'header' | 'branches' | 'save' | 'history' | null
}>()

const emit = defineEmits<{
  back: []
  save: []
  clone: []
  branchChange: [id: number | null]
  toggleHistory: []
  merge: [branchId: number]
  deletePalette: []
  openTutorial: []
}>()

const branchOpen = ref(false)

const activeBranches = computed(() => props.branches.filter(b => !b.is_merged))

function branchColor(id: number) {
  const idx = props.branches.findIndex(b => b.id === id)
  return getBranchColor(idx >= 0 ? idx : 0)
}

function selectBranch(id: number | null, _name: string) {
  emit('branchChange', id)
  branchOpen.value = false
}

const dropdownStyle = ref({
  position: 'fixed' as const,
  top: '58px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: '9999',
})
</script>

<style scoped>
.pal-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 56px;
  background: #0e0e14;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  gap: 16px;
}

.left-group,
.right-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.right-group { justify-content: flex-end; }

.focus-header {
  z-index: 340;
  box-shadow: 0 0 0 2px rgba(14, 198, 212, 0.55), 0 0 42px rgba(14, 198, 212, 0.2);
}

.focus-ring {
  position: relative;
  z-index: 341;
  box-shadow: 0 0 0 2px rgba(246, 195, 67, 0.78), 0 0 28px rgba(246, 195, 67, 0.22);
}

.help-btn {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.85);
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.help-btn:hover {
  background: rgba(14,198,212,0.18);
  border-color: rgba(14,198,212,0.45);
  color: #ffffff;
}

.snapshot-hint {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.center-group {
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}
.back-btn:hover { color: #fff; background: rgba(255,255,255,0.06); }

.divider {
  width: 1px;
  height: 20px;
  background: rgba(255,255,255,0.1);
}

.palette-name {
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 900;
  font-size: 17px;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: #fff;
}

/* Branch selector */
.branch-selector {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 999px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  user-select: none;
}
.branch-selector:hover,
.branch-selector.open {
  border-color: rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.04);
}

.branch-icon { color: rgba(255,255,255,0.5); }

.branch-name {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #e0e0ee;
}

.chevron {
  color: rgba(255,255,255,0.4);
  transition: transform 0.2s;
}
.chevron.rotated { transform: rotate(180deg); }

/* Dropdown */
.branch-dropdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
}

.branch-dropdown {
  background: #18181f;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 6px;
  min-width: 180px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.6);
}

.branch-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.75);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 7px;
  text-align: left;
  transition: background 0.12s, color 0.12s;
}
.branch-opt:hover { background: rgba(255,255,255,0.06); color: #fff; }
.branch-opt.active { color: #fff; }

.branch-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.main-dot { background: rgba(255,255,255,0.7); }

.active-check {
  margin-left: auto;
  font-size: 11px;
  color: #b410cc;
}

.merge-inline-btn {
  display: block;
  width: 100%;
  padding: 6px 10px 6px 26px;
  border: none;
  background: transparent;
  color: #0EC6D4;
  font-size: 11px;
  cursor: pointer;
  border-radius: 6px;
  text-align: left;
  transition: background 0.12s;
}
.merge-inline-btn:hover { background: rgba(14, 198, 212, 0.1); }

/* Unsaved dot */
.unsaved-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f6c343;
  box-shadow: 0 0 0 3px rgba(246, 195, 67, 0.2);
}

/* Action buttons */
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, opacity 0.15s;
  white-space: nowrap;
}

.action-btn.secondary {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
}
.action-btn.secondary:hover,
.action-btn.secondary.active {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border-color: rgba(255,255,255,0.2);
}

.action-btn.primary {
  background: #b410cc;
  border: 1px solid transparent;
  color: #fff;
}
.action-btn.primary:hover:not(:disabled) { background: #9a0db0; }
.action-btn.primary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.action-btn.clone {
  background: rgba(14, 198, 212, 0.12);
  border: 1px solid rgba(14, 198, 212, 0.3);
  color: #0ec6d4;
}
.action-btn.clone:hover { background: rgba(14, 198, 212, 0.22); border-color: #0ec6d4; }

.action-btn.danger-icon {
  background: transparent;
  border: 1px solid rgba(255,80,80,0.18);
  color: rgba(255,100,100,0.5);
  padding: 7px 10px;
}
.action-btn.danger-icon:hover {
  background: rgba(255,80,80,0.1);
  border-color: rgba(255,80,80,0.4);
  color: rgba(255,120,120,0.9);
}
</style>
