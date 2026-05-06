<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal image-modal">
        <button class="modal-close-btn" @click="$emit('close')">x</button>
        <h3 class="modal-title font-display">Palette From Image</h3>

        <p class="image-help">
          Upload an image and extract dominant colors.
        </p>

        <label
          class="dropzone"
          :class="{ 'dropzone--active': dragActive, 'dropzone--has-image': !!previewUrl }"
          @dragenter.prevent="dragActive = true"
          @dragover.prevent="dragActive = true"
          @dragleave.prevent="dragActive = false"
          @drop.prevent="onDropFile"
        >
          <input
            ref="fileInputEl"
            class="upload-input"
            type="file"
            accept="image/*"
            @change="onFileInputChange"
          />

          <template v-if="previewUrl">
            <div class="dropzone-preview-wrap">
              <img class="dropzone-preview" :src="previewUrl" :alt="`Preview of ${fileName || 'image'}`" />
              <button
                class="remove-image-btn"
                type="button"
                title="Remove image"
                @click.prevent.stop="removeFile"
              >
                ×
              </button>
            </div>
            <p class="dropzone-caption">{{ fileName }}</p>
          </template>

          <template v-else>
            <div class="dropzone-placeholder">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M13 17V7M8.5 11.5L13 7l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="4" y="17.5" width="18" height="4.5" rx="2.2" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <p class="dropzone-title">Drag &amp; drop an image here</p>
              <p class="dropzone-sub">or click to browse</p>
            </div>
          </template>
        </label>

        <p class="upload-meta">Max size: 10 MB</p>

        <label class="field-label">Colors - {{ count }}</label>
        <input
          type="range"
          :value="count"
          min="1"
          max="8"
          step="1"
          class="image-range"
          @input="$emit('update:count', Number(($event.target as HTMLInputElement).value))"
        />

        <p v-if="error" class="modal-error">{{ error }}</p>

        <div class="modal-actions">
          <button class="modal-btn cancel" @click="$emit('close')">Cancel</button>
          <button
            class="modal-btn confirm"
            :disabled="isLoading || !fileName"
            @click="$emit('submit')"
          >
            {{ isLoading ? 'Extracting...' : 'Extract palette' }}
          </button>
        </div>

        <Transition name="image-modal-loader-fade">
          <div v-if="isLoading" class="image-modal-loader-overlay">
            <AppLoader message="Extracting palette from image..." />
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppLoader from '@/components/ui/AppLoader.vue'

const props = defineProps<{
  open: boolean
  isLoading: boolean
  error: string
  count: number
  file: File | null
  fileName: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:count', value: number): void
  (e: 'fileChange', file: File | null): void
  (e: 'submit'): void
}>()

const fileInputEl = ref<HTMLInputElement | null>(null)
const dragActive = ref(false)
const localPreviewUrl = ref<string | null>(null)
const previewUrl = computed(() => localPreviewUrl.value)

watch(
  () => props.file,
  (file) => {
    if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
    localPreviewUrl.value = file ? URL.createObjectURL(file) : null
  },
  { immediate: true },
)

watch(
  () => props.open,
  (open) => {
    if (!open) dragActive.value = false
  },
)

function onFileInputChange(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  emit('fileChange', file)
}

function onDropFile(event: DragEvent): void {
  dragActive.value = false
  const file = event.dataTransfer?.files?.[0] ?? null
  emit('fileChange', file)
}

function removeFile(): void {
  emit('fileChange', null)
  if (fileInputEl.value) fileInputEl.value.value = ''
}

onBeforeUnmount(() => {
  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
})
</script>

<style scoped src="./PaletteImageModal.css"></style>
