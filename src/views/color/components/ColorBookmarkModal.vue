<template>
  <Teleport to="body">
    <div v-if="open" class="bookmark-modal-overlay" @click.self="$emit('close')">
      <form class="bookmark-modal" @submit.prevent="$emit('save')">
        <button class="bookmark-modal-close" type="button" :aria-label="t('colorPage.closeSaveColorModal')" @click="$emit('close')">
          <AppIcon name="x" :size="16" />
        </button>

        <h3 class="bookmark-modal-title font-display">{{ existing ? t('colorPage.updateBookmark') : t('colorPage.saveBookmark') }}</h3>
        <p class="bookmark-modal-sub">{{ t('colorPage.bookmarkSub') }}</p>

        <div class="bookmark-preview" :style="{ background: '#' + hex }">
          <span class="bookmark-preview-hex" :style="{ color: textColor }">#{{ hex.toUpperCase() }}</span>
        </div>

        <label class="bookmark-field-label">{{ t('colorPage.customLabel') }}</label>
        <input
          :value="label"
          class="bookmark-input"
          maxlength="100"
          :placeholder="t('colorPage.favoriteViolet')"
          autofocus
          @input="$emit('update:label', ($event.target as HTMLInputElement).value)"
        />

        <div v-if="existing && (createdAt || updatedAt)" class="bookmark-meta">
          <p v-if="createdAt" class="bookmark-meta-line">
            <span class="bookmark-meta-key">{{ t('colorPage.created') }}</span>
            <span>{{ formatDate(createdAt) }}</span>
          </p>
          <p v-if="updatedAt" class="bookmark-meta-line">
            <span class="bookmark-meta-key">{{ t('colorPage.updated') }}</span>
            <span>{{ formatDate(updatedAt) }}</span>
          </p>
        </div>

        <p v-if="error" class="bookmark-error">{{ error }}</p>

        <div class="bookmark-actions">
          <button class="bookmark-btn bookmark-btn--ghost" type="button" @click="$emit('close')">{{ t('common.cancel') }}</button>
          <button class="bookmark-btn" type="submit" :disabled="isSaving || !label.trim()">
            {{ isSaving ? t('colorPage.saving') : (existing ? t('colorPage.updateBookmark') : t('colorPage.saveBookmark')) }}
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@/components/icons/AppIcon.vue'
import { useI18n } from '@/i18n'

const props = defineProps<{
  open: boolean
  hex: string
  label: string
  existing: boolean
  isSaving: boolean
  error: string
  createdAt?: string | null
  updatedAt?: string | null
}>()

const { locale, t } = useI18n()

defineEmits<{
  (e: 'close'): void
  (e: 'save'): void
  (e: 'update:label', value: string): void
}>()

const textColor = computed(() => {
  const hex = props.hex
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.92)'
})

function formatDate(value: string): string {
  return new Date(value).toLocaleString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped src="./ColorBookmarkModal.css"></style>
