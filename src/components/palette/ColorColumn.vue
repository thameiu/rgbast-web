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
        class="hex-row"
        @mouseenter="hovering = true"
        @mouseleave="hovering = false"
      >
        <span ref="hexTextEl" class="hex-text" @click.stop="openPicker">
          #{{ modelValue.hex.toUpperCase() }}
        </span>
        <button
          v-if="hovering && !pickerOpen"
          class="copy-btn"
          :title="copied ? 'Copied!' : 'Copy hex'"
          @click.stop="copyHex"
        >
          <span v-if="copied" class="copy-ok">✓</span>
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
 * horizontal reordering on desktop; on mobile it emits swapTap instead.
 */
import { ref, computed } from 'vue'
import ColorPicker from './ColorPicker.vue'

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
}>()

const emit = defineEmits<{
  'update:hex': [hex: string]
  'update:label': [label: string | null]
  'remove': []
  'dragStart': [e: PointerEvent]
  'swapTap': []
}>()

/** Whether the hex footer row is being hovered (shows copy button). */
const hovering    = ref(false)

/** Whether the hex was just copied (shows ✓ briefly). */
const copied      = ref(false)

/** Whether the ColorPicker popover is currently open. */
const pickerOpen  = ref(false)

/** Ref to the hex text element used to compute picker anchor position. */
const hexTextEl   = ref<HTMLElement | null>(null)

/** Bounding rect used to position the ColorPicker popover. */
const anchorRect  = ref<DOMRect | null>(null)

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
async function copyHex() {
  try {
    await navigator.clipboard.writeText('#' + props.modelValue.hex.toUpperCase())
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {}
}

/**
 * On desktop: emits dragStart to let the parent start the drag operation.
 * @param e - The originating PointerEvent.
 */
function onHandlePointerDown(e: PointerEvent) {
  if (window.matchMedia('(max-width: 768px)').matches) return
  emit('dragStart', e)
}

/**
 * On mobile: emits swapTap to trigger the tap-to-swap selection flow.
 */
function onHandleClick() {
  if (!window.matchMedia('(max-width: 768px)').matches) return
  emit('swapTap')
}
</script>

<style src="./ColorColumn.css" scoped></style>
