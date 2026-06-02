<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <button class="modal-close-btn" type="button" aria-label="Close merge modal" @click="$emit('close')">
          <AppIcon name="x" :size="16" />
        </button>
        <h3 class="modal-title font-display">Merge Branch</h3>
        <p class="modal-sub">
          Merge <strong>{{ mergeTargetName }}</strong> into <strong>main</strong>?
          This creates a new snapshot on main with the branch's colors.
        </p>
        <p v-if="mergeError" class="modal-error">{{ mergeError }}</p>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="$emit('close')">Cancel</button>
          <button class="modal-btn confirm" :disabled="isMerging" @click="$emit('confirm')">
            {{ isMerging ? 'Merging...' : 'Merge' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue'

// PaletteMergeModal component: confirms branch merges for PaletteView.
defineProps<{
  open: boolean
  mergeTargetName: string
  mergeError: string
  isMerging: boolean
}>()

// Emits: close and confirm actions for the merge flow.
defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<style scoped src="./PaletteMergeModal.css"></style>
