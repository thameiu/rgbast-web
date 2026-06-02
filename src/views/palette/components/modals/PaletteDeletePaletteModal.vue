<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <button class="modal-close-btn" type="button" aria-label="Close delete palette modal" @click="$emit('close')">
          <AppIcon name="x" :size="16" />
        </button>
        <h3 class="modal-title font-display">Delete Palette</h3>
        <p class="modal-sub">
          Delete <strong>{{ paletteTitle }}</strong>? All snapshots and branches will be permanently lost.
        </p>
        <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="$emit('close')">Cancel</button>
          <button class="modal-btn danger" :disabled="isDeleting" @click="$emit('confirm')">
            {{ isDeleting ? 'Deleting...' : 'Delete permanently' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue'

// PaletteDeletePaletteModal component: confirms palette deletion in PaletteView.
defineProps<{
  open: boolean
  paletteTitle: string
  deleteError: string
  isDeleting: boolean
}>()

// Emits: close and confirm actions for palette deletion.
defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<style scoped src="./PaletteDeletePaletteModal.css"></style>
