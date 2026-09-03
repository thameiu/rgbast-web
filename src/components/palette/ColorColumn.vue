<template>
  <div
    class="col"
    :class="{ 'is-dragging': isDragging, 'swap-selected': swapSelected }"
    :data-col-key="colKey"
    :style="colStyle"
  >
    <!-- Drag handle -->
    <div class="drag-handle" aria-hidden="true"
      @pointerdown.stop="onHandlePointerDown"
      @click.stop="onHandleClick"
    >
      <span></span><span></span><span></span>
      <span></span><span></span><span></span>
    </div>

    <div class="column-actions" aria-label="Color actions">
      <button class="column-action-btn remove-btn" @click.stop="$emit('remove')" :title="t('palette.removeColor')">
        <AppIcon name="x" :size="12" />
      </button>
      <button class="column-action-btn" @click.stop="$emit('openAccessibility')" :title="t('palette.colorAccessibility')">
        <AppIcon name="info-circle" :size="13" />
      </button>
    </div>

    <button
      class="column-action-btn lock-btn"
      :class="{ active: isGenerationBaseColor }"
      :disabled="!isGenerationBaseColor && !canAddGenerationBaseColor"
      @click.stop="$emit('toggleGenerationBaseColor')"
      :title="isGenerationBaseColor ? t('palette.removeBaseColorFromGeneration') : t('palette.addBaseColorToGeneration')"
    >
      <AppIcon :name="isGenerationBaseColor ? 'lock' : 'lock-open'" :size="13" />
    </button>

    <!-- Clickable color body (opens picker) -->
    <div class="col-body" @click="openPicker"></div>

    <!-- Footer -->
    <div class="col-footer">
      <input
        class="label-input"
        :value="modelValue.label ?? ''"
        placeholder="label"
        maxlength="50"
        @input="e => $emit('update:label', (e.target as HTMLInputElement).value || null)"
        @click.stop
      />

      <div
        v-for="row in formatRows"
        :key="row.key"
        class="format-row"
      >
        <span class="format-key">{{ row.key.toUpperCase() }}</span>
        <span class="format-text" :title="row.copyValue">{{ row.displayValue }}</span>
        <button
          class="copy-btn"
          :title="copiedRowKey === row.key ? 'Copied!' : `Copy ${row.key}`"
          @click.stop="copyValue(row.copyValue, row.key)"
        >
          <AppIcon :name="copiedRowKey === row.key ? 'check' : 'copy'" :size="24" />
        </button>
      </div>

      <div
        v-if="displaySettings.hex"
        class="hex-row"
      >
        <span ref="hexTextEl" class="hex-text" @click.stop="openPicker">
          #{{ modelValue.hex.toUpperCase() }}
        </span>
        <button
          class="copy-btn"
          :title="copiedRowKey === 'hex' ? 'Copied!' : 'Copy hex'"
          @click.stop="copyValue('#' + modelValue.hex.toUpperCase(), 'hex')"
        >
          <AppIcon :name="copiedRowKey === 'hex' ? 'check' : 'copy'" :size="24" />
        </button>
      </div>
    </div>

    <!-- Color picker popover -->
    <ColorPicker
      v-if="pickerOpen"
      :modelValue="modelValue.hex"
      :anchorRect="anchorRect ?? undefined"
      @update:modelValue="hex => $emit('update:hex', hex)"
      @close="pickerOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ColorColumn - Full-height (desktop) or full-width (mobile) color column
 * in the palette editor.
 * Clicking the body or hex text opens the inline ColorPicker popover.
 * The 6-dot drag handle emits dragStart on pointerdown for pointer-based
 * horizontal reordering on desktop; on mobile it starts drag after a 300ms hold.
 */
import { ref, computed, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import ColorPicker from './ColorPicker.vue'
import type { PaletteDisplaySettings } from '@/utils/paletteColorFormats'
import { formatHexByMode } from '@/utils/paletteColorFormats'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{
  /** Current hex and label for this column. */
  modelValue: { hex: string; label: string | null }
  /** Unique key used by TransitionGroup and drag logic. */
  colKey?: string
  /** True while this column is being dragged. */
  isDragging?: boolean
  /** Inline style applied by the drag layer (e.g. transform). */
  dragStyle?: Record<string, string>
  /** True while a drag is hovering over this column. */
  isDragOver?: boolean
  /** True when this column is the first-selected target in mobile swap mode. */
  swapSelected?: boolean
  /** Enabled color formats to display under each label. */
  displaySettings: PaletteDisplaySettings
  /** Whether this color is currently used as a generation base color. */
  isGenerationBaseColor?: boolean
  /** Whether this color can be added as a generation base color. */
  canAddGenerationBaseColor?: boolean
}>()

const emit = defineEmits<{
  'update:hex': [hex: string]
  'update:label': [label: string | null]
  'remove': []
  'openAccessibility': []
  'toggleGenerationBaseColor': []
  'dragStart': [e: PointerEvent]
  'swapTap': []
}>()

/** Row key that was copied most recently (shows ✓ briefly). */
const copiedRowKey = ref<string | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

/** Whether the ColorPicker popover is currently open. */
const pickerOpen  = ref(false)

/** Ref to the hex text element used to compute picker anchor position. */
const hexTextEl   = ref<HTMLElement | null>(null)

/** Bounding rect used to position the ColorPicker popover. */
const anchorRect  = ref<DOMRect | null>(null)

const suppressNextMobileTap = ref(false)

const formatRows = computed(() => {
  const rows: Array<{ key: 'rgb' | 'hsl' | 'cmyk'; displayValue: string; copyValue: string }> = []
  for (const key of ['rgb', 'hsl', 'cmyk'] as const) {
    if (!props.displaySettings[key]) continue
    const copyValue = formatHexByMode(props.modelValue.hex, key)
    rows.push({
      key,
      copyValue,
      displayValue: copyValue.replace(/^[a-z]+\((.*)\)$/i, '$1'),
    })
  }
  return rows
})

/**
 * Computed foreground text color (black/white) based on the background luminance.
 */
const textColor = computed(() => {
  const hex = props.modelValue.hex
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)'
})

/** Merged CSS custom properties and optional drag transform styles. */
const colStyle = computed(() => ([
  {
    '--bg': '#' + props.modelValue.hex,
    '--fg': textColor.value,
    backgroundColor: '#' + props.modelValue.hex,
  },
  props.dragStyle ?? {},
]))

/**
 * Opens the ColorPicker anchored below the hex text element.
 */
function openPicker() {
  if (suppressNextMobileTap.value) {
    suppressNextMobileTap.value = false
    return
  }
  anchorRect.value = hexTextEl.value?.getBoundingClientRect() ?? null
  pickerOpen.value = true
}

/**
 * Copies the hex value to the clipboard and shows a brief ✓ confirmation.
 */
async function copyValue(value: string, key: string) {
  try {
    await navigator.clipboard.writeText(value)
    copiedRowKey.value = key
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copiedRowKey.value = null
      copiedTimer = null
    }, 1500)
  } catch {}
}

/**
 * On desktop: emits dragStart immediately.
 * On mobile: starts drag only after 300ms hold on the handle.
 * @param e - The originating PointerEvent.
 */
function onHandlePointerDown(e: PointerEvent) {
  suppressNextMobileTap.value = window.matchMedia('(max-width: 768px)').matches
  emit('dragStart', e)
}

/**
 * On mobile: keeps tap-to-swap for quick swaps, except after long-press drag start.
 */
function onHandleClick() {
  if (suppressNextMobileTap.value) {
    suppressNextMobileTap.value = false
    return
  }
}

onBeforeUnmount(() => {
  if (copiedTimer) clearTimeout(copiedTimer)
})
</script>

<style src="./ColorColumn.css" scoped></style>
