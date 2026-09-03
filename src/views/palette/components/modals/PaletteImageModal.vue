<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal image-modal">
        <button class="modal-close-btn" type="button" aria-label="Close image modal" @click="$emit('close')">
          <AppIcon name="x" :size="16" />
        </button>
        <h3 class="modal-title font-display">{{ t('palette.imageTitle') }}</h3>

        <p class="image-help">
          {{ t('palette.imageHelp') }}
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
                <AppIcon name="x" :size="14" />
              </button>
            </div>
            <p class="dropzone-caption">{{ fileName }}</p>
          </template>

          <template v-else>
            <div class="dropzone-placeholder">
              <AppIcon name="upload" :size="26" />
              <p class="dropzone-title">{{ t('palette.dropImage') }}</p>
              <p class="dropzone-sub">{{ t('palette.browseImage') }}</p>
            </div>
          </template>
        </label>

        <p class="upload-meta">{{ t('palette.maxImageSize') }}</p>

        <template v-if="extractedColors.length === 0">
          <label class="field-label">{{ t('palette.colors') }} - {{ count }}</label>
          <input
            type="range"
            :value="count"
            min="1"
            max="15"
            step="1"
            class="image-range"
            @input="$emit('update:count', Number(($event.target as HTMLInputElement).value))"
          />
        </template>

        <div v-else class="extracted-palette">
          <p class="field-label">{{ t('palette.extractedPalette') }}</p>
          <div class="extracted-grid">
            <button
              v-for="color in extractedColors"
              :key="color.hex"
              type="button"
              class="extracted-color"
              :class="{ 'extracted-color--off': !color.selected }"
              :style="{ background: '#' + color.hex, color: getExtractedTextColor(color.hex) }"
              @click="$emit('toggleExtractedColor', color.hex)"
            >
              <span class="extracted-check">
                <AppIcon v-if="color.selected" name="check" :size="13" />
              </span>
              <span class="extracted-hex">#{{ color.hex }}</span>
            </button>
          </div>
        </div>

        <p v-if="error" class="modal-error">{{ error }}</p>

        <div class="modal-actions">
          <button class="modal-btn cancel" @click="$emit('close')">{{ t('common.cancel') }}</button>
          <button
            v-if="extractedColors.length === 0"
            class="modal-btn confirm"
            :disabled="isLoading || !fileName"
            @click="$emit('submit')"
          >
            {{ isLoading ? t('palette.extracting') : t('palette.extractPalette') }}
          </button>
          <template v-else>
            <button class="modal-btn confirm ghost-confirm" :disabled="selectedCount === 0" @click="$emit('addExtractedColors')">
              {{ t('common.add') }}
            </button>
            <button class="modal-btn confirm" :disabled="selectedCount === 0" @click="$emit('replaceExtractedColors')">
              {{ t('common.replace') }}
            </button>
          </template>
        </div>

        <Transition name="image-modal-loader-fade">
          <div v-if="isLoading" class="image-modal-loader-overlay">
            <AppLoader :message="t('palette.extractingLoader')" />
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import { useI18n } from '@/i18n'

const props = defineProps<{
  open: boolean
  isLoading: boolean
  error: string
  count: number
  file: File | null
  fileName: string
  extractedColors: Array<{ hex: string; count: number; selected: boolean }>
}>()

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:count', value: number): void
  (e: 'fileChange', file: File | null): void
  (e: 'submit'): void
  (e: 'toggleExtractedColor', hex: string): void
  (e: 'addExtractedColors'): void
  (e: 'replaceExtractedColors'): void
}>()

const fileInputEl = ref<HTMLInputElement | null>(null)
const dragActive = ref(false)
const localPreviewUrl = ref<string | null>(null)
const previewUrl = computed(() => localPreviewUrl.value)
const selectedCount = computed(() => props.extractedColors.filter(color => color.selected).length)

function getExtractedTextColor(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.9)'
}

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
