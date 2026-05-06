<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal gen-modal">
        <button class="modal-close-btn" @click="$emit('close')">x</button>
        <h3 class="modal-title font-display">Generate</h3>

        <label class="field-label">Colors - {{ genCount }}</label>
        <input
          type="range"
          :value="genCount"
          min="2"
          max="8"
          step="1"
          class="gen-range"
          @input="$emit('update:genCount', Number(($event.target as HTMLInputElement).value))"
        />

        <label class="field-label">Contrast - {{ genContrast }}</label>
        <input
          type="range"
          :value="genContrast"
          min="1"
          max="10"
          step="1"
          class="gen-range"
          @input="$emit('update:genContrast', Number(($event.target as HTMLInputElement).value))"
        />

        <label class="field-label">Harmony</label>
        <div class="gen-harmony-wrap">
          <button ref="harmonyTriggerEl" class="gen-harmony-trigger" @click="toggleHarmonyDropdown()">
            <span>{{ harmonyLabel }}</span>
            <svg class="gen-dd-chevron" :class="{ rotated: harmonyOpen }" width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <label class="field-label">Base colors (up to 3) - included in output</label>
        <div class="gen-base-colors">
          <div v-for="(_, i) in genBaseColors" :key="i" class="gen-base-row">
            <div
              class="gen-base-swatch gen-base-swatch--click"
              :style="{ background: isValidHex(genBaseColors[i] ?? '') ? '#' + genBaseColors[i] : 'rgba(255,255,255,0.06)' }"
              title="Pick color"
              @click="openGenPicker(i, $event)"
            ></div>
            <input
              :value="genBaseColors[i]"
              class="modal-input gen-hex-input"
              placeholder="e.g. FF6B35"
              maxlength="7"
              spellcheck="false"
              @input="onBaseColorInput(i, $event)"
            />
            <div class="gen-palette-dd-wrap">
              <button
                class="gen-palette-dd-btn"
                :class="{ open: genPaletteDropIdx === i }"
                title="Select from palette"
                @click.stop="toggleGenPaletteDrop(i, $event)"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <button class="gen-base-remove" @click="removeBaseColor(i)">x</button>
          </div>
          <button v-if="genBaseColors.length < 3" class="gen-add-base" @click="addBaseColor()">
            + Add base color
          </button>
        </div>

        <p v-if="generateError" class="modal-error">{{ generateError }}</p>

        <div class="modal-actions">
          <button class="modal-btn cancel" @click="$emit('close')">Cancel</button>
          <button class="modal-btn confirm" :disabled="generateLoading" @click="doGenerate()">
            {{ generateLoading ? 'Generating...' : 'Generate' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="genPaletteDropIdx !== null" class="gen-palette-overlay" @click="setGenPaletteDropIdx(null)"></div>
    <div v-if="genPaletteDropIdx !== null" class="gen-palette-dropdown" :style="genPaletteDropStyle">
      <div class="gen-palette-heading">Palette colors</div>
      <button
        v-for="col in colors"
        :key="col._key"
        class="gen-palette-opt"
        @click="setBaseColor(genPaletteDropIdx!, col.hex); setGenPaletteDropIdx(null)"
      >
        <span class="gen-palette-dot" :style="{ background: '#' + col.hex }"></span>
        <span class="gen-palette-hex">#{{ col.hex.toUpperCase() }}</span>
        <span v-if="col.label" class="gen-palette-lbl">{{ col.label }}</span>
      </button>
      <div v-if="colors.length === 0" class="gen-palette-empty">No colors yet</div>
    </div>

    <ColorPicker
      v-if="genPickerOpenIdx !== null"
      :modelValue="isValidHex(genBaseColors[genPickerOpenIdx!] ?? '') ? (genBaseColors[genPickerOpenIdx!] ?? 'FF6B35') : 'FF6B35'"
      :anchorRect="genPickerAnchorRect ?? undefined"
      @update:modelValue="hex => setBaseColor(genPickerOpenIdx!, hex)"
      @close="setGenPickerOpenIdx(null); setGenPickerAnchorRect(null)"
    />

    <div v-if="harmonyOpen" class="gen-harmony-overlay" @click="harmonyOpen = false"></div>
    <Transition name="gen-dd-anim">
      <div v-if="harmonyOpen" class="gen-harmony-menu" :style="harmonyDropStyle">
        <button
          v-for="opt in harmonyOptions"
          :key="opt.value"
          class="gen-harmony-opt"
          :class="{ active: genHarmony === opt.value }"
          @click="$emit('update:genHarmony', opt.value); harmonyOpen = false"
        >
          <span class="gen-harmony-label">{{ opt.label }}</span>
          <span class="gen-harmony-desc">{{ opt.desc }}</span>
          <span v-if="genHarmony === opt.value" class="gen-harmony-check">check</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CSSProperties } from 'vue'
import ColorPicker from '@/components/palette/ColorPicker.vue'
import type { WorkingColor } from '../../composables/usePaletteContext'

// PaletteGenerateModal component: generates palettes and configures generator settings in PaletteView.
const props = defineProps<{
  open: boolean
  generateLoading: boolean
  generateError: string
  genCount: number
  genContrast: number
  genHarmony: string
  genBaseColors: string[]
  genPaletteDropIdx: number | null
  genPaletteDropStyle: CSSProperties
  genPickerOpenIdx: number | null
  genPickerAnchorRect: DOMRect | null
  colors: WorkingColor[]
  isValidHex: (hex: string) => boolean
  openGenPicker: (i: number, e: MouseEvent) => void
  toggleGenPaletteDrop: (i: number, e: MouseEvent) => void
  onBaseColorInput: (i: number, e: Event) => void
  setBaseColor: (i: number, value: string) => void
  removeBaseColor: (i: number) => void
  addBaseColor: () => void
  doGenerate: () => void
  setGenPaletteDropIdx: (value: number | null) => void
  setGenPickerOpenIdx: (value: number | null) => void
  setGenPickerAnchorRect: (value: DOMRect | null) => void
}>()

// Emits: close and generator field updates for PaletteView.
defineEmits<{
  (e: 'close'): void
  (e: 'update:genCount', value: number): void
  (e: 'update:genContrast', value: number): void
  (e: 'update:genHarmony', value: string): void
}>()

const harmonyOptions = [
  { value: 'random', label: 'Random', desc: 'Evenly spread hues' },
  { value: 'analogous', label: 'Analogous', desc: 'Adjacent hues' },
  { value: 'complementary', label: 'Complementary', desc: 'Opposite hues' },
  { value: 'triadic', label: 'Triadic', desc: '3 equidistant hues' },
  { value: 'split_complementary', label: 'Split compl.', desc: 'Near-opposite pair' },
  { value: 'tetradic', label: 'Tetradic', desc: '4 equidistant hues' },
  { value: 'shades', label: 'Shades', desc: 'Tone families' },
]

const harmonyLabel = computed(() =>
  harmonyOptions.find(o => o.value === props.genHarmony)?.label ?? 'Random'
)

const harmonyOpen = ref(false)
const harmonyTriggerEl = ref<HTMLButtonElement | null>(null)
const harmonyDropStyle = ref<CSSProperties>({})

// Reset harmony dropdown when the modal closes.
watch(() => props.open, open => {
  if (!open) harmonyOpen.value = false
})

// Open the harmony dropdown positioned under the trigger button.
function openHarmonyDropdown(): void {
  if (!harmonyTriggerEl.value) return
  const rect = harmonyTriggerEl.value.getBoundingClientRect()
  harmonyDropStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 5}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: '9999',
  }
  harmonyOpen.value = true
}

// Toggle the harmony dropdown menu.
function toggleHarmonyDropdown(): void {
  if (harmonyOpen.value) {
    harmonyOpen.value = false
  } else {
    openHarmonyDropdown()
  }
}
</script>

<style scoped src="./PaletteGenerateModal.css"></style>
