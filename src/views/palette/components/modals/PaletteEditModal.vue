<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay">
      <div class="modal">
        <button class="modal-close-btn" type="button" aria-label="Close edit modal" @click="$emit('close')">
          <AppIcon name="x" :size="16" />
        </button>
        <h3 class="modal-title font-display">Edit Palette</h3>
        <p class="modal-sub">Update name, description, or folder placement.</p>

        <label class="field-label">Palette title</label>
        <input
          :value="title"
          class="modal-input"
          placeholder="e.g. brand-colors"
          maxlength="50"
          @input="$emit('update:title', ($event.target as HTMLInputElement).value)"
        />
        <p v-if="titleErrorMessage" class="modal-error">{{ titleErrorMessage }}</p>

        <label class="field-label">Description</label>
        <textarea
          :value="description"
          class="modal-input modal-textarea"
          placeholder="Short note or usage context"
          maxlength="500"
          rows="3"
          @input="$emit('update:description', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>

        <label class="field-label">Folder</label>
        <FolderPicker
          :folders="folders"
          :modelValue="folderId"
          @update:modelValue="$emit('update:folderId', $event)"
          @createFolder="$emit('createFolder', $event)"
        />

        <p v-if="error" class="modal-error">{{ error }}</p>

        <div class="modal-actions">
          <button class="modal-btn cancel" @click="$emit('close')">Cancel</button>
          <button class="modal-btn confirm" :disabled="isSaving || !!titleErrorMessage" @click="$emit('save')">
            {{ isSaving ? 'Updating...' : 'Update palette' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue'
import type { FolderResponse } from '@/api/types'
import FolderPicker from '@/components/folder/FolderPicker.vue'

defineProps<{
  open: boolean
  title: string
  description: string
  folderId: number | null
  folders: FolderResponse[]
  isSaving: boolean
  error: string
  titleErrorMessage?: string | null
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'save'): void
  (e: 'update:title', value: string): void
  (e: 'update:description', value: string): void
  (e: 'update:folderId', value: number | null): void
  (e: 'createFolder', payload: { name: string; parentId: number | null }): void
}>()
</script>

<style scoped src="./PaletteEditModal.css"></style>
