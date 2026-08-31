<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal gen-modal">
        <button class="modal-close-btn" type="button" aria-label="Close generation modal" @click="$emit('close')">
          <AppIcon name="x" :size="16" />
        </button>
        <h3 class="modal-title font-display">{{ t('palette.generate') }}</h3>

        <label class="field-label">{{ t('palette.colors') }} - {{ genCount }}</label>
        <input
          type="range"
          :value="genCount"
          min="2"
          max="8"
          step="1"
          class="gen-range"
          @input="$emit('update:genCount', Number(($event.target as HTMLInputElement).value))"
        />

        <label class="field-label">{{ t('palette.harmony') }}</label>
        <div class="gen-harmony-wrap">
          <button ref="harmonyTriggerEl" class="gen-harmony-trigger" @click="toggleHarmonyDropdown()">
            <span>{{ harmonyLabel }}</span>
            <AppIcon class="gen-dd-chevron" name="chevron-down" :size="10" :class="{ rotated: harmonyOpen }" />
          </button>
        </div>

        <label class="field-label">{{ t('palette.baseColors') }}</label>
        <div class="gen-base-colors">
          <div v-for="(_, i) in genBaseColors" :key="i" class="gen-base-row">
            <div
              class="gen-base-swatch gen-base-swatch--click"
              :style="{ background: isValidHex(genBaseColors[i] ?? '') ? '#' + genBaseColors[i] : 'rgba(255,255,255,0.06)' }"
              :title="t('palette.pickColor')"
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
                <AppIcon name="chevron-down" :size="10" />
              </button>
            </div>
            <button class="gen-base-remove" @click="removeBaseColor(i)">x</button>
          </div>
          <button v-if="genBaseColors.length < 3" class="gen-add-base" @click="addBaseColor()">
            + {{ t('palette.addBaseColor') }}
          </button>
        </div>

        <p v-if="generateError" class="modal-error">{{ generateError }}</p>

        <div class="modal-actions">
          <button class="modal-btn cancel" @click="$emit('close')">{{ t('common.cancel') }}</button>
          <button class="modal-btn confirm" :disabled="generateLoading" @click="doGenerate()">
            {{ generateLoading ? t('palette.generating') : t('palette.generate') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="genPaletteDropIdx !== null" class="gen-palette-overlay" @click="setGenPaletteDropIdx(null)"></div>
    <div v-if="genPaletteDropIdx !== null" class="gen-palette-dropdown" :style="genPaletteDropStyle">
      <div class="gen-palette-heading">{{ t('palette.colors') }}</div>
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
          <span class="gen-harmony-label">{{ t(opt.labelKey) }}</span>
          <span class="gen-harmony-desc">{{ t(opt.descKey) }}</span>
          <span v-if="genHarmony === opt.value" class="gen-harmony-check" aria-hidden="true">
            <AppIcon name="check" :size="11" />
          </span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CSSProperties } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import ColorPicker from '@/components/palette/ColorPicker.vue'
import type { WorkingColor } from '../../composables/usePaletteContext'
import { useI18n } from '@/i18n'

// PaletteGenerateModal component: generates palettes and configures generator settings in PaletteView.
const props = defineProps<{
  open: boolean
  generateLoading: boolean
  generateError: string
  genCount: number
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

const { t } = useI18n()

// Emits: close and generator field updates for PaletteView.
defineEmits<{
  (e: 'close'): void
  (e: 'update:genCount', value: number): void
  (e: 'update:genHarmony', value: string): void
}>()

const harmonyOptions = [
  { value: 'analogous', labelKey: 'palette.harmonies.analogous', descKey: 'palette.harmonyDescriptions.analogous' },
  { value: 'complementary', labelKey: 'palette.harmonies.complementary', descKey: 'palette.harmonyDescriptions.complementary' },
  { value: 'triadic', labelKey: 'palette.harmonies.triadic', descKey: 'palette.harmonyDescriptions.triadic' },
  { value: 'split_complementary', labelKey: 'palette.harmonies.split', descKey: 'palette.harmonyDescriptions.split' },
  { value: 'tetradic', labelKey: 'palette.harmonies.tetradic', descKey: 'palette.harmonyDescriptions.tetradic' },
  { value: 'shades', labelKey: 'palette.harmonies.shades', descKey: 'palette.harmonyDescriptions.shades' },
]

const harmonyLabel = computed(() =>
  t(harmonyOptions.find(o => o.value === props.genHarmony)?.labelKey ?? 'palette.harmonies.analogous')
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
