<template>
  <article
    class="palette-card"
    :class="{ 'card--dragging': isDragging }"
    :draggable="draggableEnabled"
    @click="emit('open')"
    @dragstart="onDragStart"
    @dragend="emit('dragend')"
  >
    <div v-if="palette.description" class="card-tooltip">
      <p class="card-tooltip-title">{{ palette.title }}</p>
      <p class="card-tooltip-desc">{{ palette.description }}</p>
    </div>

    <div class="card-clip">
      <div class="card-strip">
        <div
          v-for="(col, ci) in palette.palette_colors.slice(0, 15)"
          :key="ci"
          class="strip-swatch"
          :style="{ background: '#' + col.hex }"
        ></div>
        <div v-if="palette.palette_colors.length === 0" class="strip-empty">{{ t('common.noColors') }}</div>
      </div>
      <div class="card-body">
        <p class="card-path font-mono">
          {{
            palette.isLocalDraftOnly
              ? (palette.folder_path?.length ? t('common.draft') + ' · / ' + palette.folder_path.join(' / ') : t('common.draft') + ' · /')
              : (palette.folder_path?.length ? '/ ' + palette.folder_path.join(' / ') : '/')
          }}
        </p>
        <h3 class="card-title">
          {{ palette.title }}
          <span v-if="palette.hasUnsavedDraft" class="card-unsaved-dot" :title="t('palette.unsavedChanges')"></span>
        </h3>
        <p v-if="palette.ownerUsername" class="card-owner">
          by
          <button
            class="card-owner-link"
            :class="{ 'card-owner-link--disabled': !palette.ownerClickable }"
            :disabled="!palette.ownerClickable"
            @click.stop="onOwnerClick"
          >
            {{ palette.ownerUsername }}
          </button>
        </p>
        <p class="card-meta font-mono">
          {{ palette.isLocalDraftOnly ? `${t('common.draft')} · ${formattedDate}` : formattedDate }}
        </p>
      </div>

      <button v-if="showEditAction" class="card-edit-btn" title="Edit palette" @click.stop="emit('edit')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 8.5L7.5 3l1.5 1.5L3.5 10H2V8.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M6.8 3.7l1.5 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
      </button>
      <button v-if="showDeleteAction" class="card-del-btn" title="Delete palette" @click.stop="emit('delete')">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M1.5 3h10M5 3V1.5h3V3M4 3l.5 8M6.5 3v8M9 3l-.5 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { PaletteCache } from '@/api/types'
import { useI18n } from '@/i18n'

type PaletteCardData = PaletteCache & {
  isLocalDraftOnly?: boolean
  hasUnsavedDraft?: boolean
  ownerUsername?: string
  ownerClickable?: boolean
}

const props = withDefaults(defineProps<{
  palette: PaletteCardData
  showActions?: boolean
  showEdit?: boolean
  showDelete?: boolean
  draggableEnabled?: boolean
  isDragging?: boolean
}>(), {
  showActions: true,
  showEdit: undefined,
  showDelete: undefined,
  draggableEnabled: false,
  isDragging: false,
})

const router = useRouter()
const { t, locale } = useI18n()

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'dragstart', event: DragEvent): void
  (e: 'dragend'): void
}>()

const showEditAction = computed(() => props.showEdit ?? props.showActions)
const showDeleteAction = computed(() => props.showDelete ?? props.showActions)

const formattedDate = computed(() =>
  new Date(props.palette.last_snapshot_at ?? props.palette.created_at).toLocaleDateString(locale.value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }),
)

function onDragStart(event: DragEvent) {
  if (!props.draggableEnabled) return
  emit('dragstart', event)
}

function onOwnerClick(): void {
  if (!props.palette.ownerUsername || !props.palette.ownerClickable) return
  void router.push(`/users/${encodeURIComponent(props.palette.ownerUsername)}`)
}
</script>

<style scoped src="./PaletteCard.css"></style>
