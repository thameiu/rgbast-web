<template>
  <div v-if="historyOpen" class="history-mobile-backdrop" @click="$emit('close')"></div>
  <Transition name="history-slide">
    <aside v-if="historyOpen" class="history-panel" :class="{ 'tutorial-focus': isTutorialFocus }">
      <div class="history-header">
        <h2 class="history-title font-display">History</h2>
        <button class="close-btn" type="button" aria-label="Close history panel" @click="$emit('close')">
          <AppIcon name="x" :size="16" />
        </button>
      </div>
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
      <div v-else class="history-empty">No history yet.</div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import type { PaletteHistoryGraphResponse } from '@/api/types'
import AppIcon from '@/components/icons/AppIcon.vue'
import HistoryGraph from '@/components/palette/HistoryGraph.vue'

// PaletteHistoryPanel component: renders the history side panel and mobile backdrop for PaletteView.
defineProps<{
  historyOpen: boolean
  isTutorialFocus: boolean
  historyForDisplay: PaletteHistoryGraphResponse | null
  selectedSnapshotId: number | null
  showDemoHistory: boolean
  isOwned: boolean
  revertableSnapshotCount: number
}>()

// Emits: close panel and history interaction events.
defineEmits<{
  (e: 'close'): void
  (e: 'selectSnapshot', id: number): void
  (e: 'selectBranch', id: number): void
  (e: 'deleteBranch', id: number): void
  (e: 'revertSnapshot', id: number): void
}>()
</script>

<style scoped src="./PaletteHistoryPanel.css"></style>
