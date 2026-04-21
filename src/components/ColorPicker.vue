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
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/** HSV color picker popover. Renders via Teleport to body so it's never clipped.
 *  Features a 2D saturation/value canvas, a hue rainbow slider, and hex/RGB inputs.
 *  Positioned relative to anchorRect with viewport clamping. */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: string        // 6-char hex without #
  anchorRect?: DOMRect
}>()

const emit = defineEmits<{
  'update:modelValue': [hex: string]
  'close': []
}>()

// ── Color state ──────────────────────────────────────────────────────────────

type HSV = [number, number, number]   // [0-360, 0-1, 0-1]
type RGB = [number, number, number]   // [0-255, 0-255, 0-255]

function hexToRgb(h: string): RGB {
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b]
}

function rgbToHex(r: number, g: number, b: number): string {
  return [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase()
}

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

function hsvToRgb(h: number, s: number, v: number): RGB {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)]
}

const hsv = ref<HSV>(rgbToHsv(...hexToRgb(props.modelValue)))
const hex  = computed(() => rgbToHex(...hsvToRgb(...hsv.value)))
const rgb  = computed<RGB>(() => hsvToRgb(...hsv.value))

watch(() => props.modelValue, val => {
  const incoming = rgbToHex(...hexToRgb(val))
  if (incoming !== hex.value) {
    hsv.value = rgbToHsv(...hexToRgb(val))
  }
})

watch(hex, val => emit('update:modelValue', val))

// ── Hex / RGB text inputs ─────────────────────────────────────────────────────

function onHexInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/[^0-9a-fA-F]/g, '')
  if (raw.length === 6) {
    hsv.value = rgbToHsv(...hexToRgb(raw))
  }
}
function onHexBlur(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/[^0-9a-fA-F]/g, '').padEnd(6, '0').slice(0, 6)
  hsv.value = rgbToHsv(...hexToRgb(raw))
}

function onRgbInput(channel: 0 | 1 | 2, e: Event) {
  const val = Math.max(0, Math.min(255, parseInt((e.target as HTMLInputElement).value) || 0))
  const r = [...rgb.value] as RGB
  r[channel] = val
  hsv.value = rgbToHsv(...r)
}

// ── 2-D area drag ─────────────────────────────────────────────────────────────

const areaEl = ref<HTMLElement | null>(null)
let draggingArea = false

function startAreaDrag(e: MouseEvent | TouchEvent) {
  draggingArea = true
  updateArea(e)
}

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

const hueEl = ref<HTMLElement | null>(null)
let draggingHue = false

function startHueDrag(e: MouseEvent | TouchEvent) {
  draggingHue = true
  updateHue(e)
}

function updateHue(e: MouseEvent | TouchEvent) {
  if (!hueEl.value) return
  const rect = hueEl.value.getBoundingClientRect()
  const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0]!.clientX
  const h = Math.max(0, Math.min(360, ((clientX - rect.left) / rect.width) * 360))
  hsv.value = [h, hsv.value[1], hsv.value[2]]
}

// ── Global mouse/touch tracking ──────────────────────────────────────────────

function onGlobalMove(e: MouseEvent | TouchEvent) {
  if (draggingArea) { updateArea(e); return }
  if (draggingHue)  { updateHue(e);  return }
}
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

const PANEL_W = 246
const PANEL_H = 310

const panelStyle = computed(() => {
  const rect = props.anchorRect
  if (!rect) return { position: 'fixed' as const, bottom: '100px', left: '50%', transform: 'translateX(-50%)' }

  let x = rect.left + rect.width / 2 - PANEL_W / 2
  let y = rect.top - PANEL_H - 10

  x = Math.max(8, Math.min(x, window.innerWidth  - PANEL_W - 8))
  if (y < 8) y = rect.bottom + 10

  return { position: 'fixed' as const, left: x + 'px', top: y + 'px', width: PANEL_W + 'px' }
})
</script>

<style scoped>
.cp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9900;
}

.cp-panel {
  z-index: 9901;
  background: #16161e;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.7);
  display: flex;
  flex-direction: column;
  gap: 10px;
  user-select: none;
}

/* 2-D color area */
.cp-area {
  position: relative;
  width: 100%;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  cursor: crosshair;
}

.cp-sat-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, #fff, transparent);
}
.cp-val-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent, #000);
}

.cp-cursor {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2.5px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 1px 4px rgba(0,0,0,0.6);
}

/* Hue slider */
.cp-hue-track {
  position: relative;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(to right,
    hsl(0,100%,50%), hsl(30,100%,50%), hsl(60,100%,50%),
    hsl(90,100%,50%), hsl(120,100%,50%), hsl(150,100%,50%),
    hsl(180,100%,50%), hsl(210,100%,50%), hsl(240,100%,50%),
    hsl(270,100%,50%), hsl(300,100%,50%), hsl(330,100%,50%),
    hsl(360,100%,50%)
  );
  cursor: pointer;
}

.cp-hue-thumb {
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 4px rgba(0,0,0,0.5);
  pointer-events: none;
}

/* Inputs row */
.cp-inputs {
  display: flex;
  gap: 6px;
  align-items: flex-end;
}

.cp-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.cp-field--hex { flex: 2; }

.cp-field label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
}

.cp-hex-row {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  overflow: hidden;
  padding-left: 8px;
}
.cp-hash {
  color: rgba(255,255,255,0.3);
  font-size: 12px;
  font-family: 'Sora', monospace;
}
.cp-hex-row .cp-input {
  border: none;
  background: transparent;
  padding: 6px 6px 6px 2px;
}

.cp-input {
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 6px 8px;
  color: #fff;
  font-size: 12px;
  font-family: 'Sora', monospace;
  outline: none;
  transition: border-color 0.15s;
  text-transform: uppercase;
}
.cp-input:focus { border-color: rgba(180,16,204,0.6); }
input[type="number"].cp-input { -moz-appearance: textfield; }
input[type="number"].cp-input::-webkit-inner-spin-button,
input[type="number"].cp-input::-webkit-outer-spin-button { -webkit-appearance: none; }
</style>
