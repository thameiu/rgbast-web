<template>
  <div
    class="col"
    :class="{ 'is-dragging': isDragging }"
    :style="{ '--bg': '#' + modelValue.hex, '--fg': textColor }"
  >
    <!-- Drag handle -->
    <div class="drag-handle" aria-hidden="true" @pointerdown.stop="$emit('dragStart')">
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
/** A full-height color column in the palette editor.
 *  Clicking the body or hex text opens the ColorPicker popover.
 *  The drag handle (6-dot grid) emits dragStart on pointerdown for
 *  the parent to handle pointer-based horizontal reordering. */
import { ref, computed } from 'vue'
import ColorPicker from './ColorPicker.vue'

const props = defineProps<{
  modelValue: { hex: string; label: string | null }
  isDragging?: boolean
  isDragOver?: boolean
}>()

const emit = defineEmits<{
  'update:hex': [hex: string]
  'update:label': [label: string | null]
  'remove': []
  'dragStart': []
}>()

const hovering    = ref(false)
const copied      = ref(false)
const pickerOpen  = ref(false)
const hexTextEl   = ref<HTMLElement | null>(null)
const anchorRect  = ref<DOMRect | null>(null)

const textColor = computed(() => {
  const hex = props.modelValue.hex
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)'
})

function openPicker() {
  anchorRect.value = hexTextEl.value?.getBoundingClientRect() ?? null
  pickerOpen.value = true
}

async function copyHex() {
  try {
    await navigator.clipboard.writeText('#' + props.modelValue.hex.toUpperCase())
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {}
}
</script>

<style scoped>
.col {
  position: relative;
  flex: 1 1 0;
  min-width: 80px;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  cursor: default;
  user-select: none;
  /* used by TransitionGroup move */
  will-change: transform;
}

.col.is-dragging { cursor: grabbing; }

/* Drag handle */
.drag-handle {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  opacity: 0;
  transition: opacity 0.15s;
  cursor: grab;
  pointer-events: none;
}
.col:hover .drag-handle { opacity: 0.45; pointer-events: all; }
.drag-handle span {
  width: 3px; height: 3px;
  border-radius: 50%;
  background: var(--fg);
}

/* Remove button */
.remove-btn {
  position: absolute;
  top: 10px; right: 10px;
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 1px solid var(--fg);
  background: transparent;
  color: var(--fg);
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.col:hover .remove-btn { opacity: 0.6; }
.remove-btn:hover { opacity: 1 !important; background: rgba(0,0,0,0.2); }

/* Body */
.col-body { flex: 1; cursor: pointer; }

/* Footer */
.col-footer {
  padding: 10px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label-input {
  background: transparent; border: none; outline: none;
  color: var(--fg);
  font-family: 'Sora', sans-serif;
  font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase;
  width: 100%; opacity: 0.65; transition: opacity 0.15s;
}
.label-input::placeholder { opacity: 0.4; }
.label-input:focus { opacity: 1; }

.hex-row {
  display: flex; align-items: center; gap: 6px; min-height: 22px;
}

.hex-text {
  font-family: 'Sora', monospace;
  font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
  color: var(--fg);
  cursor: pointer;
  transition: opacity 0.15s;
}
.hex-text:hover { opacity: 0.72; }

.copy-btn {
  background: transparent; border: none;
  color: var(--fg); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 2px; opacity: 0.7; transition: opacity 0.15s; font-size: 11px;
}
.copy-btn:hover { opacity: 1; }
.copy-ok { font-size: 12px; }

/* ─── Mobile: horizontal rows ──────── */
@media (max-width: 768px) {
  .col {
    flex: none !important;
    height: 100px;
    min-width: unset !important;
    flex-direction: row;
  }
  .col-body { flex: 1; }
  .drag-handle { display: none; }
  .remove-btn { top: 8px; right: 8px; opacity: 0.55; }
  .col:hover .remove-btn { opacity: 1; }
  .col-footer {
    width: 150px;
    flex-shrink: 0;
    flex-direction: column;
    justify-content: flex-end;
    padding: 8px 14px 10px;
  }
}
</style>
