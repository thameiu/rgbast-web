<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <h3 class="modal-title font-display">Delete Branch</h3>
        <p class="modal-sub">
          Delete branch <strong>{{ branchName }}</strong>? All snapshots in this branch will be permanently lost.
        </p>
        <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="$emit('close')">Cancel</button>
          <button class="modal-btn danger" :disabled="isDeleting" @click="$emit('confirm')">
            {{ isDeleting ? 'Deleting...' : 'Delete branch' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// PaletteDeleteBranchModal component: confirms branch deletion in PaletteView.
defineProps<{
  open: boolean
  branchName: string
  deleteError: string
  isDeleting: boolean
}>()

// Emits: close and confirm actions for branch deletion.
defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<style scoped src="./PaletteDeleteBranchModal.css"></style>
