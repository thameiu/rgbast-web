<template>
  <article class="bookmark-card" @click="openColor">
    <div class="bookmark-card-clip">
      <div class="bookmark-card-surface" :style="{ background: '#' + bookmark.hex }">
        <div class="bookmark-card-actions">
          <button
            class="bookmark-card-action"
            :class="{ 'bookmark-card-action--copied': copied }"
            :title="copied ? 'Copied!' : 'Copy hex'"
            @click.stop="copyHex"
          >
            <AppIcon :name="copied ? 'check' : 'copy'" :size="14" />
          </button>
          <button
            class="bookmark-card-action"
            title="Open color page"
            @click.stop="openColor"
          >
            <AppIcon name="external-link" :size="14" />
          </button>
          <button
            v-if="editable"
            class="bookmark-card-action"
            title="Edit bookmark"
            @click.stop="$emit('edit', bookmark)"
          >
            <AppIcon name="edit" :size="14" />
          </button>
          <button
            v-if="editable"
            class="bookmark-card-action bookmark-card-action--danger"
            title="Delete bookmark"
            @click.stop="$emit('delete', bookmark)"
          >
            <AppIcon name="trash" :size="14" />
          </button>
        </div>

        <div class="bookmark-card-body" :style="{ color: swatchTextColor }">
          <p class="bookmark-card-hex font-mono">#{{ bookmark.hex.toUpperCase() }}</p>
          <h3 class="bookmark-card-title">{{ bookmark.label }}</h3>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppIcon from '@/components/icons/AppIcon.vue'
import type { ColorBookmarkResponse } from '@/api/types'

const props = defineProps<{
  bookmark: ColorBookmarkResponse
  editable?: boolean
}>()

defineEmits<{
  (e: 'edit', bookmark: ColorBookmarkResponse): void
  (e: 'delete', bookmark: ColorBookmarkResponse): void
}>()

const router = useRouter()
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

const swatchTextColor = computed(() => {
  const hex = props.bookmark.hex
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.92)'
})

function openColor(): void {
  void router.push(`/color/${props.bookmark.hex}`)
}

async function copyHex(): Promise<void> {
  try {
    await navigator.clipboard.writeText(`#${props.bookmark.hex.toUpperCase()}`)
    copied.value = true
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
      copiedTimer = null
    }, 1400)
  } catch {}
}
</script>

<style scoped src="./ColorBookmarkCard.css"></style>
