<template>
  <Teleport to="body">
    <Transition name="sidebar-overlay">
      <div v-if="open" class="msb-overlay" @click="$emit('close')"></div>
    </Transition>
    <Transition name="sidebar-panel">
      <div v-if="open" class="msb-panel">
        <div class="msb-top">
          <span class="msb-title font-display">Menu</span>
          <button class="msb-close" @click="$emit('close')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="msb-body">
          <div class="msb-section-label">Branch</div>
          <div class="msb-branches">
            <button
              class="msb-branch-opt"
              :class="{ active: currentBranchId === null }"
              @click="$emit('switchBranch', null); $emit('close')"
            >
              <span class="msb-dot msb-dot-main"></span>
              <span class="msb-branch-name">main</span>
              <span v-if="currentBranchId === null" class="msb-check">check</span>
            </button>
            <template v-for="(br, idx) in activeBranches" :key="br.id">
              <button
                class="msb-branch-opt"
                :class="{ active: currentBranchId === br.id }"
                @click="$emit('switchBranch', br.id); $emit('close')"
              >
                <span class="msb-dot" :style="{ background: branchColor(idx) }"></span>
                <span class="msb-branch-name">{{ br.title }}</span>
                <span v-if="currentBranchId === br.id" class="msb-check">check</span>
              </button>
              <button
                v-if="currentBranchId === br.id"
                class="msb-merge-btn"
                @click.stop="$emit('merge', br.id); $emit('close')"
              >
                Merge into main
              </button>
            </template>
          </div>

          <div v-if="snapshotCommitHint" class="msb-hint">{{ snapshotCommitHint }}</div>

          <div class="msb-divider"></div>

          <div class="msb-actions">
            <button class="msb-action" @click="$emit('openTutorial'); $emit('close')">
              <span class="msb-help-glyph">?</span>
              How it works
            </button>
            <button
              v-if="isOwned"
              class="msb-action msb-action-primary"
              :disabled="isSaving || !hasUnsavedChanges"
              @click="$emit('requestSave'); $emit('close')"
            >
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v7M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              {{ isSaving ? 'Saving...' : 'Save snapshot' }}
            </button>
            <button
              v-else
              class="msb-action msb-action-clone"
              @click="$emit('clonePalette'); $emit('close')"
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
              @click="$emit('deletePalette'); $emit('close')"
            >
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M5.5 4V2.5h3V4M5 4l.5 8.5M7 4v8.5M9 4l-.5 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Delete palette
            </button>
          </div>

          <div class="msb-divider"></div>

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
              @selectSnapshot="$emit('selectSnapshot', $event)"
              @selectBranch="$emit('selectBranch', $event)"
              @deleteBranch="$emit('deleteBranch', $event)"
              @revertSnapshot="$emit('revertSnapshot', $event)"
            />
            <div v-else class="msb-history-empty">No history yet.</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { PaletteHistoryGraphResponse } from '@/api/types'
import HistoryGraph from '@/components/palette/HistoryGraph.vue'

// PaletteMobileSidebar component: renders the mobile action sidebar for PaletteView.
defineProps<{
  open: boolean
  currentBranchId: number | null
  activeBranches: Array<{ id: number; title: string; is_merged: boolean }>
  branchColor: (idx: number) => string
  snapshotCommitHint: string | null
  isOwned: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
  isNewPalette: boolean
  historyForDisplay: PaletteHistoryGraphResponse | null
  selectedSnapshotId: number | null
  showDemoHistory: boolean
  revertableSnapshotCount: number
}>()

// Emits: close sidebar and action events triggered from the menu.
defineEmits<{
  (e: 'close'): void
  (e: 'switchBranch', id: number | null): void
  (e: 'merge', id: number): void
  (e: 'openTutorial'): void
  (e: 'requestSave'): void
  (e: 'clonePalette'): void
  (e: 'deletePalette'): void
  (e: 'selectSnapshot', id: number): void
  (e: 'selectBranch', id: number): void
  (e: 'deleteBranch', id: number): void
  (e: 'revertSnapshot', id: number): void
}>()
</script>

<style scoped src="./PaletteMobileSidebar.css"></style>
