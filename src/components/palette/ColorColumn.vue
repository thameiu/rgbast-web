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

    <!-- Remove button -->
    <button class="remove-btn" @click.stop="$emit('remove')" title="Remove color">×</button>

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
        <span class="format-text" :title="row.value">{{ row.value }}</span>
        <button
          class="copy-btn"
          :title="copiedRowKey === row.key ? 'Copied!' : `Copy ${row.key}`"
          @click.stop="copyValue(row.value, row.key)"
        >
          <span v-if="copiedRowKey === row.key" class="copy-ok">✓</span>
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/>
            <path d="M2 8V2h6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
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
          <span v-if="copiedRowKey === 'hex'" class="copy-ok">✓</span>
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/>
            <path d="M2 8V2h6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
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
 * ColorColumn — Full-height (desktop) or full-width (mobile) color column
 * in the palette editor.
 * Clicking the body or hex text opens the inline ColorPicker popover.
 * The 6-dot drag handle emits dragStart on pointerdown for pointer-based
 * horizontal reordering on desktop; on mobile it starts drag after a 300ms hold.
 */
import { ref, computed, onBeforeUnmount } from 'vue'
import ColorPicker from './ColorPicker.vue'
import type { PaletteDisplaySettings } from '@/utils/paletteColorFormats'
import { formatHexByMode } from '@/utils/paletteColorFormats'

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
}>()

const emit = defineEmits<{
  'update:hex': [hex: string]
  'update:label': [label: string | null]
  'remove': []
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

const MOBILE_DRAG_HOLD_MS = 300
const MOBILE_HOLD_MOVE_CANCEL_PX = 12

const mobileHoldTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const mobileHoldPointerId = ref<number | null>(null)
const mobileHoldStartX = ref(0)
const mobileHoldStartY = ref(0)
const mobileHoldTriggered = ref(false)
const suppressNextMobileTap = ref(false)

const formatRows = computed(() => {
  const rows: Array<{ key: 'rgb' | 'hsl' | 'cmyk'; value: string }> = []
  if (props.displaySettings.rgb) rows.push({ key: 'rgb', value: formatHexByMode(props.modelValue.hex, 'rgb') })
  if (props.displaySettings.hsl) rows.push({ key: 'hsl', value: formatHexByMode(props.modelValue.hex, 'hsl') })
  if (props.displaySettings.cmyk) rows.push({ key: 'cmyk', value: formatHexByMode(props.modelValue.hex, 'cmyk') })
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
  if (!window.matchMedia('(max-width: 768px)').matches) {
    emit('dragStart', e)
    return
  }

  if (mobileHoldTimer.value) {
    clearTimeout(mobileHoldTimer.value)
    mobileHoldTimer.value = null
  }

  mobileHoldPointerId.value = e.pointerId
  mobileHoldStartX.value = e.clientX
  mobileHoldStartY.value = e.clientY
  mobileHoldTriggered.value = false

  const onMove = (moveEvt: PointerEvent) => {
    if (mobileHoldPointerId.value !== moveEvt.pointerId) return
    if (mobileHoldTriggered.value) return
    const dx = moveEvt.clientX - mobileHoldStartX.value
    const dy = moveEvt.clientY - mobileHoldStartY.value
    if (Math.hypot(dx, dy) >= MOBILE_HOLD_MOVE_CANCEL_PX) {
      cancelMobileHold()
    }
  }

  const onUpOrCancel = (upEvt: PointerEvent) => {
    if (mobileHoldPointerId.value !== upEvt.pointerId) return
    cancelMobileHold()
  }

  const cleanupListeners = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUpOrCancel)
    window.removeEventListener('pointercancel', onUpOrCancel)
  }

  mobileHoldTimer.value = setTimeout(() => {
    if (mobileHoldPointerId.value !== e.pointerId) return
    mobileHoldTriggered.value = true
    suppressNextMobileTap.value = true
    cleanupListeners()
    mobileHoldTimer.value = null
    mobileHoldPointerId.value = null
    emit('dragStart', e)
  }, MOBILE_DRAG_HOLD_MS)

  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerup', onUpOrCancel, { passive: true })
  window.addEventListener('pointercancel', onUpOrCancel, { passive: true })

  function cancelMobileHold(): void {
    cleanupListeners()
    if (mobileHoldTimer.value) {
      clearTimeout(mobileHoldTimer.value)
      mobileHoldTimer.value = null
    }
    mobileHoldPointerId.value = null
    mobileHoldTriggered.value = false
  }
}

/**
 * On mobile: keeps tap-to-swap for quick swaps, except after long-press drag start.
 */
function onHandleClick() {
  if (!window.matchMedia('(max-width: 768px)').matches) return
  if (suppressNextMobileTap.value) {
    suppressNextMobileTap.value = false
    return
  }
  emit('swapTap')
}

onBeforeUnmount(() => {
  if (mobileHoldTimer.value) clearTimeout(mobileHoldTimer.value)
  if (copiedTimer) clearTimeout(copiedTimer)
})
</script>

<style src="./ColorColumn.css" scoped></style>
