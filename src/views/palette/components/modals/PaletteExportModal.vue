<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal export-modal" :class="{ 'export-modal--visual': exportStep && exportStep !== 'css' }">
        <button class="modal-close-btn" @click="$emit('close')">
          <AppIcon name="x" :size="16" />
        </button>
        <h3 class="modal-title font-display">{{ t('palette.exportPalette') }}</h3>
        <div v-if="exportStep === null" class="export-choice-grid">
          <button v-for="format in ['svg','png','pdf','ai','css'] as const" :key="format" class="modal-btn secondary" @click="exportStep=format; if(format !== 'css') selectFormat(format)"><AppIcon :name="format==='css'?'code':format==='png'?'file-png':format==='svg'?'file-svg':format==='pdf'?'file-pdf':'file-ai'" :size="24" />{{ format.toUpperCase() }}</button>
          <button v-if="isSavedPalette" class="modal-btn secondary" :class="{'share-btn--copied':shareCopied}" @click="copyShareLink"><AppIcon :name="shareCopied?'check':'copy'" :size="24" />{{ shareCopied ? t('colorPage.copied') : t('exportUi.copyLink') }}</button>
        </div>
        <template v-else>
        <button class="modal-btn secondary export-back" @click="exportStep=null"><AppIcon name="arrow-left" :size="14" />{{ t('palette.back') }}</button>



        <div v-if="exportStep !== 'css'" class="field-row">
          <div v-if="visualFormat !== 'svg'" ref="fontDropdownEl" class="field-group custom-dropdown-wrap">
            <label class="field-label">{{ t('exportUi.font') }}</label>
            <button class="custom-dd-btn" :class="{ open: fontDropdownOpen }" @click="toggleFontDropdown">
              <span>{{ selectedFontLabel }}</span>
              <AppIcon name="chevron-down" :size="10" :class="{ rotated: fontDropdownOpen }" />
            </button>
            <Transition name="header-dd">
              <div v-if="fontDropdownOpen" class="custom-dd-menu">
                <button
                  v-for="font in fontOptions"
                  :key="font.key"
                  class="custom-dd-opt"
                  :class="{ active: fontKey === font.key }"
                  @click="selectFont(font.key)"
                >
                  <span>{{ font.label }}</span>
                  <span v-if="fontKey === font.key" class="dd-check" aria-hidden="true">
                    <AppIcon name="check" :size="12" />
                  </span>
                </button>
              </div>
            </Transition>
          </div>

          <div ref="formatDropdownEl" class="field-group custom-dropdown-wrap">
            <label class="field-label">{{ t('exportUi.format') }}</label>
            <button class="custom-dd-btn" :class="{ open: formatDropdownOpen }" @click="toggleFormatDropdown">
              <span>{{ visualFormat.toUpperCase() }}</span>
              <AppIcon name="chevron-down" :size="10" :class="{ rotated: formatDropdownOpen }" />
            </button>
            <Transition name="header-dd">
              <div v-if="formatDropdownOpen" class="custom-dd-menu">
                <button class="custom-dd-opt" :class="{ active: visualFormat === 'pdf' }" @click="selectFormat('pdf')">
                  <span>PDF</span>
                  <span v-if="visualFormat === 'pdf'" class="dd-check" aria-hidden="true">
                    <AppIcon name="check" :size="12" />
                  </span>
                </button>
                <button class="custom-dd-opt" :class="{ active: visualFormat === 'png' }" @click="selectFormat('png')">
                  <span>PNG</span>
                  <span v-if="visualFormat === 'png'" class="dd-check" aria-hidden="true">
                    <AppIcon name="check" :size="12" />
                  </span>
                </button>
                <button class="custom-dd-opt" :class="{ active: visualFormat === 'svg' }" @click="selectFormat('svg')">
                  <span>SVG</span>
                  <span v-if="visualFormat === 'svg'" class="dd-check" aria-hidden="true">
                    <AppIcon name="check" :size="12" />
                  </span>
                </button>
                <button class="custom-dd-opt" :class="{active:visualFormat==='ai'}" @click="selectFormat('ai')">AI</button>
              </div>
            </Transition>
          </div>
        </div>

        <div v-if="exportStep !== 'css'" class="field-row field-row--export">
          <div ref="orientationDropdownEl" class="field-group custom-dropdown-wrap">
            <label class="field-label">{{ t('exportUi.orientation') }}</label>
            <button class="custom-dd-btn" :class="{ open: orientationDropdownOpen }" @click="toggleOrientationDropdown">
              <span>{{ orientationLabel }}</span>
              <AppIcon name="chevron-down" :size="10" :class="{ rotated: orientationDropdownOpen }" />
            </button>
            <Transition name="header-dd">
              <div v-if="orientationDropdownOpen" class="custom-dd-menu">
                <button class="custom-dd-opt" :class="{ active: orientation === 'portrait' }" @click="selectOrientation('portrait')">
                  <span>Portrait</span>
                  <span v-if="orientation === 'portrait'" class="dd-check" aria-hidden="true">
                    <AppIcon name="check" :size="12" />
                  </span>
                </button>
                <button class="custom-dd-opt" :class="{ active: orientation === 'landscape' }" @click="selectOrientation('landscape')">
                  <span>{{ t('exportUi.landscape') }}</span>
                  <span v-if="orientation === 'landscape'" class="dd-check" aria-hidden="true">
                    <AppIcon name="check" :size="12" />
                  </span>
                </button>
              </div>
            </Transition>
          </div>

          <div class="field-group export-actions-group">
            <label class="field-label">{{ t('exportUi.download') }}</label>
            <button class="modal-btn confirm export-btn" :disabled="isBusy || !colors.length" @click="downloadVisualExport">
              {{ isBusy ? t('exportUi.busy') : `${t('exportUi.download')} ${visualFormat.toUpperCase()}` }}
            </button>
          </div>
        </div>

        <p v-if="visualFormat==='ai' && exportStep!=='css'" class="field-hint">{{ t('exportUi.aiLegacy') }}</p>
        <div class="modal-divider"></div>

        <div v-if="exportStep !== 'css'" class="code-format-grid"><button class="chip-btn" :class="{active:rendering==='cards'}" @click="rendering='cards'">{{t('exportUi.cards')}}</button><button class="chip-btn" :class="{active:rendering==='block'}" @click="rendering='block'">{{t('exportUi.block')}}</button></div>
        <label v-if="exportStep !== 'css'" class="toggle-row">
          <input v-model="showLabels" type="checkbox" />
          <span>{{ t('exportUi.labels') }}</span>
        </label>
        <template v-if="exportStep === 'css'"><label class="field-label">CSS / SCSS Variables</label>
        <div class="code-format-grid">
          <button
            v-for="option in codeOptions"
            :key="option.value"
            class="chip-btn"
            :class="{ active: codeFormat === option.value }"
            @click="codeFormat = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <textarea
          v-model="editableCode"
          class="modal-input code-textarea"
          rows="10"
          spellcheck="false"
        ></textarea>

        <div class="code-actions">
          <button
            class="modal-btn cancel"
            :class="{ 'share-btn--copied': codeCopied }"
            :disabled="!editableCode.trim()"
            @click="copyCode"
          >
            <span v-if="codeCopied">✓ Copied</span>
            <span v-else>{{ t('exportUi.copyCode') }}</span>
          </button>
          <button class="modal-btn secondary" :disabled="!editableCode.trim()" @click="downloadCode">{{ t('exportUi.downloadCode') }}</button>
          <button
            v-if="isSavedPalette"
            class="modal-btn share-btn"
            :class="{ 'share-btn--copied': shareCopied }"
            :disabled="!shareUrl"
            @click="copyShareLink"
          >
            <AppIcon :name="shareCopied ? 'check' : 'copy'" :size="13" />
            <span>{{ shareCopied ? 'Link copied !' : 'Share palette link' }}</span>
          </button>
        </div>

        </template>
        </template>
        <p v-if="error" class="modal-error">{{ error }}</p>

        <Transition name="image-modal-loader-fade">
          <div v-if="isBusy" class="export-modal-loader-overlay">
            <AppLoader message="Preparing export..." />
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from '@/i18n'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import { colorApi } from '@/api/color'
import {
  buildExportCode,
  ensureExportFontLoaded,
  exportVisualPalette,
  EXPORT_FONT_OPTIONS,
  type ExportCodeFormat,
  type ExportColorCard,
  type ExportOrientation,
  type ExportVisualFormat,
} from '@/utils/paletteExport'

const props = defineProps<{
  open: boolean
  paletteTitle: string
  colors: Array<{ hex: string; label: string | null }>
  isSavedPalette: boolean
  shareUrl: string
}>()

defineEmits<{
  (e: 'close'): void
}>()

const {t}=useI18n()
const exportStep=ref<'svg'|'png'|'pdf'|'ai'|'css'|null>(null)
const fontOptions = EXPORT_FONT_OPTIONS
const fontKey = ref<string>('inter')
const visualFormat = ref<ExportVisualFormat>('pdf')
const orientation = ref<ExportOrientation>('portrait')
const showLabels = ref(true)
const rendering=ref<'cards'|'block'>('cards')
const codeFormat = ref<ExportCodeFormat>('css-hex')
const editableCode = ref('')
const error = ref('')
const isBusy = ref(false)
const colorNameMap = ref<Record<string, string>>({})
const shareCopied = ref(false)
const codeCopied = ref(false)
let shareCopiedTimer: ReturnType<typeof setTimeout> | null = null
let codeCopiedTimer: ReturnType<typeof setTimeout> | null = null

const fontDropdownOpen = ref(false)
const formatDropdownOpen = ref(false)
const orientationDropdownOpen = ref(false)
const fontDropdownEl = ref<HTMLElement | null>(null)
const formatDropdownEl = ref<HTMLElement | null>(null)
const orientationDropdownEl = ref<HTMLElement | null>(null)

const codeOptions: Array<{ value: ExportCodeFormat; label: string }> = [
  { value: 'css-hex', label: 'CSS HEX' },
  { value: 'css-hsl', label: 'CSS HSL' },
  { value: 'css-rgba', label: 'CSS RGBA' },
  { value: 'scss-hex', label: 'SCSS HEX' },
  { value: 'scss-hsl', label: 'SCSS HSL' },
  { value: 'scss-rgba', label: 'SCSS RGBA' },
]

const selectedFontLabel = computed(() => {
  return fontOptions.find(font => font.key === fontKey.value)?.label ?? 'Inter'
})
const orientationLabel = computed(() => (orientation.value === 'portrait' ? 'Portrait' : 'Landscape'))

const exportCards = computed<ExportColorCard[]>(() => {
  return props.colors.map((color, index) => {
    const key = color.hex.replace(/^#/, '').toUpperCase()
    return {
      hex: key,
      customLabel: color.label,
      colorName: colorNameMap.value[key] ?? `Color ${index + 1}`,
    }
  })
})

const codePreview = computed(() => buildExportCode(exportCards.value, codeFormat.value))

watch(codePreview, (value) => {
  editableCode.value = value
}, { immediate: true })

watch(
  () => [props.open, props.colors.map(color => color.hex).join(' ')],
  async ([open]) => {
    if (!open) return
    await fetchColorNames()
  },
  { immediate: true },
)

watch(codeFormat, () => {
  editableCode.value = codePreview.value
})

watch(() => props.open, (open) => {
  if (!open) {
    exportStep.value=null
    fontDropdownOpen.value = false
    formatDropdownOpen.value = false
    orientationDropdownOpen.value = false
  }
})

function toggleFontDropdown(): void {
  fontDropdownOpen.value = !fontDropdownOpen.value
  if (fontDropdownOpen.value) {
    formatDropdownOpen.value = false
    orientationDropdownOpen.value = false
  }
}

function toggleFormatDropdown(): void {
  formatDropdownOpen.value = !formatDropdownOpen.value
  if (formatDropdownOpen.value) {
    fontDropdownOpen.value = false
    orientationDropdownOpen.value = false
  }
}

function toggleOrientationDropdown(): void {
  orientationDropdownOpen.value = !orientationDropdownOpen.value
  if (orientationDropdownOpen.value) {
    fontDropdownOpen.value = false
    formatDropdownOpen.value = false
  }
}

function selectFont(value: string): void {
  fontKey.value = value
  fontDropdownOpen.value = false
}

function selectFormat(value: ExportVisualFormat): void {
  visualFormat.value = value
  formatDropdownOpen.value = false
}

function selectOrientation(value: ExportOrientation): void {
  orientation.value = value
  orientationDropdownOpen.value = false
}

function onDocPointerDown(event: Event): void {
  const target = event.target as Node | null
  if (fontDropdownOpen.value && fontDropdownEl.value && target && !fontDropdownEl.value.contains(target)) {
    fontDropdownOpen.value = false
  }
  if (formatDropdownOpen.value && formatDropdownEl.value && target && !formatDropdownEl.value.contains(target)) {
    formatDropdownOpen.value = false
  }
  if (orientationDropdownOpen.value && orientationDropdownEl.value && target && !orientationDropdownEl.value.contains(target)) {
    orientationDropdownOpen.value = false
  }
}

function onDocKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    fontDropdownOpen.value = false
    formatDropdownOpen.value = false
    orientationDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, { capture: true })
  document.addEventListener('keydown', onDocKeydown, { capture: true })
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, { capture: true })
  document.removeEventListener('keydown', onDocKeydown, { capture: true })
  if (shareCopiedTimer) clearTimeout(shareCopiedTimer)
  if (codeCopiedTimer) clearTimeout(codeCopiedTimer)
})

async function fetchColorNames(): Promise<void> {
  error.value = ''
  colorNameMap.value = {}
  if (!props.colors.length) return

  try {
    const uniqueHexes = Array.from(new Set(props.colors.map(color => color.hex.replace(/^#/, '').toUpperCase())))
    const response = await colorApi.getColorLabels(uniqueHexes)
    const map: Record<string, string> = {}
    response.labels.forEach((item) => {
      map[item.normalized_hex.toUpperCase()] = item.closest_name || `#${item.normalized_hex.toUpperCase()}`
    })
    colorNameMap.value = map
  } catch {
    // Keep fallback names if label lookup is unavailable.
  }
}

function fileBasename(): string {
  const raw = (props.paletteTitle || 'palette')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return raw || 'palette'
}

async function downloadVisualExport(): Promise<void> {
  error.value = ''
  if (!exportCards.value.length) {
    error.value = 'No colors available to export.'
    return
  }

  isBusy.value = true
  try {
    const fontFamily = await ensureExportFontLoaded(visualFormat.value === 'svg' ? 'inter' : fontKey.value)
    await exportVisualPalette({
      format: visualFormat.value,
      orientation: orientation.value,
      title: props.paletteTitle || 'Untitled palette',
      colors: exportCards.value,
      fontFamily,
      fileBaseName: fileBasename(),
      showLabels: showLabels.value,
      rendering:rendering.value,
    })
  } catch (e: any) {
    error.value = e?.message || 'Export failed.'
  } finally {
    isBusy.value = false
  }
}

async function copyCode(): Promise<void> {
  if (!navigator.clipboard?.writeText) return
  try {
    await navigator.clipboard.writeText(editableCode.value)
    codeCopied.value = true
    if (codeCopiedTimer) clearTimeout(codeCopiedTimer)
    codeCopiedTimer = setTimeout(() => {
      codeCopied.value = false
      codeCopiedTimer = null
    }, 1100)
  } catch {
    error.value = 'Could not copy code to clipboard.'
  }
}

function downloadCode(): void {
  const extension = codeFormat.value.startsWith('scss-') ? 'scss' : 'css'
  const blob = new Blob([editableCode.value], { type: 'text/plain;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${fileBasename()}.${extension}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}

async function copyShareLink(): Promise<void> {
  if (!props.shareUrl) return
  if (!navigator.clipboard?.writeText) return

  try {
    await navigator.clipboard.writeText(props.shareUrl)
    shareCopied.value = true
    if (shareCopiedTimer) clearTimeout(shareCopiedTimer)
    shareCopiedTimer = setTimeout(() => {
      shareCopied.value = false
      shareCopiedTimer = null
    }, 1200)
  } catch {
    error.value = 'Could not copy palette link.'
  }
}
</script>

<style scoped src="./PaletteExportModal.css"></style>
