<template>
  <Teleport to="body">
    <div class="cp-backdrop" @mousedown.self="$emit('close')"></div>
    <div class="cp-panel" :style="panelStyle" @mousedown.stop>
      <!-- 2-D gradient picker -->
      <div
        class="cp-area"
        ref="areaEl"
        :style="{ background: `hsl(${hsv[0]}, 100%, 50%)` }"
        @mousedown="startAreaDrag"
        @touchstart.prevent="startAreaDrag"
      >
        <div class="cp-sat-overlay"></div>
        <div class="cp-val-overlay"></div>
        <div
          class="cp-cursor"
          :style="{
            left: (hsv[1] * 100) + '%',
            top:  ((1 - hsv[2]) * 100) + '%',
            background: '#' + hex,
          }"
        ></div>
      </div>

      <!-- Hue slider -->
      <div
        class="cp-hue-track"
        ref="hueEl"
        @mousedown="startHueDrag"
        @touchstart.prevent="startHueDrag"
      >
        <div class="cp-hue-thumb" :style="{ left: (hsv[0] / 360 * 100) + '%' }"></div>
      </div>

      <!-- Text inputs -->
      <div class="cp-inputs">
        <div class="cp-field cp-field--hex">
          <label>Hex</label>
          <div class="cp-hex-row">
            <span class="cp-hash">#</span>
            <input
              class="cp-input"
              :value="hex"
              maxlength="6"
              spellcheck="false"
              @input="onHexInput"
              @blur="onHexBlur"
            />
          </div>
        </div>
        <div class="cp-field">
          <label>R</label>
          <input class="cp-input" type="number" min="0" max="255" :value="rgb[0]" @input="e => onRgbInput(0, e)" />
        </div>
        <div class="cp-field">
          <label>G</label>
          <input class="cp-input" type="number" min="0" max="255" :value="rgb[1]" @input="e => onRgbInput(1, e)" />
        </div>
        <div class="cp-field">
          <label>B</label>
          <input class="cp-input" type="number" min="0" max="255" :value="rgb[2]" @input="e => onRgbInput(2, e)" />
        </div>
      </div>

      <button class="cp-expand-btn" :class="{ open: adjustmentsOpen }" type="button" @click="toggleAdjustments">
        <span>{{ t('palette.adjustments') }}</span>
        <AppIcon name="sliders" :size="13" />
      </button>

      <div v-if="adjustmentsOpen" class="cp-adjustments">
        <label class="cp-slider-row">
          <span class="cp-slider-label">{{ t('palette.hue') }}</span>
          <input
            class="cp-slider cp-slider--hue"
            type="range"
            min="-180"
            max="180"
            step="1"
            :value="adjustments.hue"
            @input="onAdjustmentInput('hue', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="cp-slider-value">{{ adjustments.hue }}</span>
        </label>
        <label class="cp-slider-row">
          <span class="cp-slider-label">{{ t('palette.saturation') }}</span>
          <input
            class="cp-slider cp-slider--saturation"
            type="range"
            min="-100"
            max="100"
            step="1"
            :value="adjustments.saturation"
            @input="onAdjustmentInput('saturation', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="cp-slider-value">{{ adjustments.saturation }}</span>
        </label>
        <label class="cp-slider-row">
          <span class="cp-slider-label">{{ t('palette.temperature') }}</span>
          <input
            class="cp-slider cp-slider--temperature"
            type="range"
            min="-100"
            max="100"
            step="1"
            :value="adjustments.temperature"
            @input="onAdjustmentInput('temperature', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="cp-slider-value">{{ adjustments.temperature }}</span>
        </label>
        <label class="cp-slider-row">
          <span class="cp-slider-label">{{ t('palette.luminosity') }}</span>
          <input
            class="cp-slider cp-slider--luminosity"
            type="range"
            min="-100"
            max="100"
            step="1"
            :value="adjustments.luminosity"
            @input="onAdjustmentInput('luminosity', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="cp-slider-value">{{ adjustments.luminosity }}</span>
        </label>
        <div class="cp-vision-block">
          <span class="cp-slider-label">{{ t('palette.daltonism') }}</span>
          <div class="cp-vision-grid">
            <button class="cp-chip" :class="{ active: adjustments.daltonism === 'protanopia' }" @click="toggleDaltonism('protanopia')">Protanopia</button>
            <button class="cp-chip" :class="{ active: adjustments.daltonism === 'deuteranopia' }" @click="toggleDaltonism('deuteranopia')">Deuteranopia</button>
            <button class="cp-chip" :class="{ active: adjustments.daltonism === 'tritanopia' }" @click="toggleDaltonism('tritanopia')">Tritanopia</button>
            <button class="cp-chip" :class="{ active: adjustments.daltonism === 'achromatopsia' }" @click="toggleDaltonism('achromatopsia')">{{ t('colorPage.colorBlindnessTypes.achromatopsia') }}</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * ColorPicker - HSV color picker popover rendered via Teleport to body.
 * Features a 2D saturation/value canvas, a hue rainbow slider, and hex/RGB inputs.
 * Positioned relative to anchorRect with viewport edge-clamping.
 * Props: modelValue (6-char hex without #), anchorRect (optional DOMRect for positioning).
 * Emits: update:modelValue, close.
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { applyAdjustmentsToHex, type GlobalColorAdjustments } from '@/utils/paletteColorAdjustments'
import type { DaltonismMode } from '@/utils/colorAccessibility'
import { useI18n } from '@/i18n'

type AdjustmentSliderKey = 'hue' | 'saturation' | 'temperature' | 'luminosity'
const COLOR_PICKER_ADJUSTMENTS_OPEN_KEY = 'rgbast_color_picker_adjustments_open_v1'
const neutralAdjustments = (): GlobalColorAdjustments => ({
  hue: 0,
  saturation: 0,
  temperature: 0,
  luminosity: 0,
  daltonism: 'none',
})

const { t } = useI18n()

const props = defineProps<{
  /** Current color as a 6-character hex string without the leading #. */
  modelValue: string
  /** Optional bounding rect of the element the picker should anchor to. */
  anchorRect?: DOMRect
}>()

const emit = defineEmits<{
  'update:modelValue': [hex: string]
  'close': []
}>()

// ── Color state ──────────────────────────────────────────────────────────────

/** Hue-Saturation-Value tuple: [0–360, 0–1, 0–1]. */
type HSV = [number, number, number]

/** Red-Green-Blue tuple: [0–255, 0–255, 0–255]. */
type RGB = [number, number, number]

/**
 * Converts a 6-character hex string to an RGB tuple.
 * @param h - Hex string without #.
 */
function hexToRgb(h: string): RGB {
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b]
}

/**
 * Converts RGB channels to a 6-character uppercase hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  return [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/**
 * Converts RGB to HSV.
 */
function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  const h = d === 0 ? 0
    : max === r ? 60 * (((g - b) / d + 6) % 6)
    : max === g ? 60 * ((b - r) / d + 2)
    :             60 * ((r - g) / d + 4)
  const s = max === 0 ? 0 : d / max
  return [h, s, max]
}

/**
 * Converts HSV to RGB.
 */
function hsvToRgb(h: number, s: number, v: number): RGB {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)]
}

/** Internal HSV state derived from the incoming hex prop. */
const hsv = ref<HSV>(rgbToHsv(...hexToRgb(props.modelValue)))
const adjustmentsOpen = ref(readAdjustmentsOpenPreference())
const adjustments = ref<GlobalColorAdjustments>(neutralAdjustments())
const adjustmentBaseHex = ref<string | null>(null)

/** Current hex string derived from HSV state. */
const hex  = computed(() => rgbToHex(...hsvToRgb(...hsv.value)))

/** Current RGB tuple derived from HSV state. */
const rgb  = computed<RGB>(() => hsvToRgb(...hsv.value))

/** Sync internal state when the parent changes modelValue externally. */
watch(() => props.modelValue, val => {
  const incoming = rgbToHex(...hexToRgb(val))
  if (incoming !== hex.value) {
    hsv.value = rgbToHsv(...hexToRgb(val))
  }
})

/** Emit updated hex whenever the internal state changes. */
watch(hex, val => emit('update:modelValue', val))

function readAdjustmentsOpenPreference(): boolean {
  try {
    return localStorage.getItem(COLOR_PICKER_ADJUSTMENTS_OPEN_KEY) === '1'
  } catch {
    return false
  }
}

function persistAdjustmentsOpenPreference(): void {
  try {
    localStorage.setItem(COLOR_PICKER_ADJUSTMENTS_OPEN_KEY, adjustmentsOpen.value ? '1' : '0')
  } catch {}
}

function toggleAdjustments(): void {
  adjustmentsOpen.value = !adjustmentsOpen.value
  persistAdjustmentsOpenPreference()
}

function resetAdjustmentSession(): void {
  adjustmentBaseHex.value = null
  adjustments.value = neutralAdjustments()
}

function ensureAdjustmentBase(): string {
  if (!adjustmentBaseHex.value) adjustmentBaseHex.value = props.modelValue
  return adjustmentBaseHex.value
}

function emitAdjustedColor(): void {
  const base = ensureAdjustmentBase()
  emit('update:modelValue', applyAdjustmentsToHex(base, adjustments.value))
}

function onAdjustmentInput(key: AdjustmentSliderKey, value: number): void {
  adjustments.value = { ...adjustments.value, [key]: value }
  emitAdjustedColor()
}

function toggleDaltonism(mode: DaltonismMode): void {
  adjustments.value = {
    ...adjustments.value,
    daltonism: adjustments.value.daltonism === mode ? 'none' : mode,
  }
  emitAdjustedColor()
}

function setHsvFromUserInput(next: HSV): void {
  resetAdjustmentSession()
  hsv.value = next
}

// ── Hex / RGB text inputs ─────────────────────────────────────────────────────

/**
 * Handles live typing in the hex input; updates HSV once 6 chars are entered.
 */
function onHexInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/[^0-9a-fA-F]/g, '')
  if (raw.length === 6) {
    setHsvFromUserInput(rgbToHsv(...hexToRgb(raw)))
  }
}

/**
 * Handles blur on the hex input; pads or truncates to 6 chars then updates.
 */
function onHexBlur(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/[^0-9a-fA-F]/g, '').padEnd(6, '0').slice(0, 6)
  setHsvFromUserInput(rgbToHsv(...hexToRgb(raw)))
}

/**
 * Handles input on one of the R/G/B number fields.
 * @param channel - 0 for R, 1 for G, 2 for B.
 */
function onRgbInput(channel: 0 | 1 | 2, e: Event) {
  const val = Math.max(0, Math.min(255, parseInt((e.target as HTMLInputElement).value) || 0))
  const r = [...rgb.value] as RGB
  r[channel] = val
  setHsvFromUserInput(rgbToHsv(...r))
}

// ── 2-D area drag ─────────────────────────────────────────────────────────────

/** Ref to the 2D SV area element. */
const areaEl = ref<HTMLElement | null>(null)

/** Whether a drag on the 2D area is active. */
let draggingArea = false

/** Starts a drag on the 2D color area. */
function startAreaDrag(e: MouseEvent | TouchEvent) {
  resetAdjustmentSession()
  draggingArea = true
  updateArea(e)
}

/**
 * Updates saturation and value from the pointer position over the area.
 */
function updateArea(e: MouseEvent | TouchEvent) {
  if (!areaEl.value) return
  const rect = areaEl.value.getBoundingClientRect()
  const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0]!.clientX
  const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0]!.clientY
  const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height))
  hsv.value = [hsv.value[0], s, v]
}

// ── Hue slider drag ──────────────────────────────────────────────────────────

/** Ref to the hue track element. */
const hueEl = ref<HTMLElement | null>(null)

/** Whether a drag on the hue slider is active. */
let draggingHue = false

/** Starts a drag on the hue slider. */
function startHueDrag(e: MouseEvent | TouchEvent) {
  resetAdjustmentSession()
  draggingHue = true
  updateHue(e)
}

/**
 * Updates the hue from the pointer position over the hue track.
 */
function updateHue(e: MouseEvent | TouchEvent) {
  if (!hueEl.value) return
  const rect = hueEl.value.getBoundingClientRect()
  const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0]!.clientX
  const h = Math.max(0, Math.min(360, ((clientX - rect.left) / rect.width) * 360))
  hsv.value = [h, hsv.value[1], hsv.value[2]]
}

// ── Global mouse/touch tracking ──────────────────────────────────────────────

/** Dispatches pointer move to whichever drag mode is active. */
function onGlobalMove(e: MouseEvent | TouchEvent) {
  if (draggingArea) { updateArea(e); return }
  if (draggingHue)  { updateHue(e);  return }
}

/** Clears all drag states on pointer up / touch end. */
function onGlobalUp() {
  draggingArea = false
  draggingHue  = false
}

onMounted(() => {
  window.addEventListener('mousemove', onGlobalMove)
  window.addEventListener('mouseup',   onGlobalUp)
  window.addEventListener('touchmove', onGlobalMove, { passive: false })
  window.addEventListener('touchend',  onGlobalUp)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', onGlobalMove)
  window.removeEventListener('mouseup',   onGlobalUp)
  window.removeEventListener('touchmove', onGlobalMove)
  window.removeEventListener('touchend',  onGlobalUp)
})

// ── Panel positioning ────────────────────────────────────────────────────────

/** Width of the picker panel in pixels. */
const PANEL_W = 246

/** Height of the picker panel in pixels. */
const PANEL_H = computed(() => adjustmentsOpen.value ? 560 : 310)

/**
 * Computes the fixed-position style for the picker panel,
 * anchoring it to anchorRect and clamping to viewport edges.
 */
const panelStyle = computed(() => {
  const rect = props.anchorRect
  if (!rect) return { position: 'fixed' as const, bottom: '100px', left: '50%', transform: 'translateX(-50%)' }

  const effectivePanelH = Math.min(PANEL_H.value, window.innerHeight - 16)
  let x = rect.left + rect.width / 2 - PANEL_W / 2
  let y = rect.top - effectivePanelH - 10

  x = Math.max(8, Math.min(x, window.innerWidth  - PANEL_W - 8))
  if (y < 8) y = rect.bottom + 10
  if (y + effectivePanelH > window.innerHeight - 8) y = Math.max(8, window.innerHeight - effectivePanelH - 8)

  return { position: 'fixed' as const, left: x + 'px', top: y + 'px', width: PANEL_W + 'px' }
})
</script>

<style src="./ColorPicker.css" scoped></style>
