<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <button class="modal-close-btn" @click="$emit('close')">x</button>
        <h3 class="modal-title font-display">Revert</h3>
        <p class="modal-sub">
          Revert <strong>{{ revertTargetLabel }}</strong> to this snapshot?
          <strong>{{ revertableSnapshotCount }} newer snapshot{{ revertableSnapshotCount === 1 ? '' : 's' }}</strong>
          will be permanently deleted.
        </p>
        <p v-if="revertError" class="modal-error">{{ revertError }}</p>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="$emit('close')">Cancel</button>
          <button class="modal-btn danger" :disabled="isReverting" @click="$emit('confirm')">
            {{ isReverting ? 'Reverting...' : 'Revert' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// PaletteRevertModal component: confirms revert actions for PaletteView.
defineProps<{
  open: boolean
  revertTargetLabel: string
  revertableSnapshotCount: number
  revertError: string
  isReverting: boolean
}>()

// Emits: close and confirm actions for revert flow.
defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<style scoped src="./PaletteRevertModal.css"></style>
