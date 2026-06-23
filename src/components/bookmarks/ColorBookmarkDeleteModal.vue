<template>
  <Teleport to="body">
    <div v-if="open" class="bookmark-modal-overlay" @click.self="$emit('close')">
      <div class="bookmark-delete-modal">
        <button class="bookmark-modal-close" type="button" aria-label="Close delete bookmark modal" @click="$emit('close')">
          <AppIcon name="x" :size="16" />
        </button>
        <h3 class="bookmark-modal-title font-display">Delete Bookmark</h3>
        <p class="bookmark-modal-sub">
          Delete <strong>{{ label }}</strong> for <strong>#{{ hex.toUpperCase() }}</strong>?
        </p>
        <p v-if="error" class="bookmark-error">{{ error }}</p>
        <div class="bookmark-actions">
          <button class="bookmark-btn bookmark-btn--ghost" @click="$emit('close')">Cancel</button>
          <button class="bookmark-btn bookmark-btn--danger" :disabled="isDeleting" @click="$emit('confirm')">
            {{ isDeleting ? 'Deleting…' : 'Delete permanently' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue'

defineProps<{
  open: boolean
  hex: string
  label: string
  error: string
  isDeleting: boolean
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<style scoped src="./ColorBookmarkDeleteModal.css"></style>
