import { ref, computed, watch } from 'vue'
import type { CSSProperties } from 'vue'
import type { Ref } from 'vue'
import { colorApi } from '@/api/color'
import type { PaletteHarmony } from '@/api/types'
import type { WorkingColor } from './usePaletteContext'
import { useI18n } from '@/i18n'

export interface GeneratorContext {
  colors: Ref<WorkingColor[]>
  mkKey: () => string
}

export interface GeneratorActions {
  captureForUndo: () => void
}

// Manage palette generation state and UI logic for PaletteView.
export function usePaletteGenerator(ctx: GeneratorContext, actions: GeneratorActions) {
  const { t } = useI18n()
  const generateOpen = ref(false)
  const generateLoading = ref(false)
  const generateError = ref('')
  const genCount = ref(5)
  type GenHarmony = PaletteHarmony | 'shades'
  const genHarmony = ref<GenHarmony>('analogous')
  const genBaseColors = ref<string[]>([])

  const genPickerOpenIdx = ref<number | null>(null)
  const genPickerAnchorRect = ref<DOMRect | null>(null)
  const genPaletteDropIdx = ref<number | null>(null)
  const genPaletteDropRect = ref<DOMRect | null>(null)

  const genPaletteDropStyle = computed<CSSProperties>(() => {
    const r = genPaletteDropRect.value
    if (!r) return {}
    return { position: 'fixed', top: `${r.bottom + 4}px`, left: `${r.left}px`, zIndex: '9999' }
  })

  const GENERATE_COOLDOWN_MS = 250
  let lastGenerateMs = 0

  // Open the base-color picker for a specific base color input.
  function openGenPicker(i: number, e: MouseEvent): void {
    genPickerAnchorRect.value = (e.currentTarget as HTMLElement).getBoundingClientRect()
    genPickerOpenIdx.value = i
    genPaletteDropIdx.value = null
  }

  // Toggle the palette dropdown for selecting base colors from the current palette.
  function toggleGenPaletteDrop(i: number, e: MouseEvent): void {
    if (genPaletteDropIdx.value === i) {
      genPaletteDropIdx.value = null
    } else {
      genPaletteDropRect.value = (e.currentTarget as HTMLElement).getBoundingClientRect()
      genPaletteDropIdx.value = i
      genPickerOpenIdx.value = null
    }
  }

  // Validate a hex string without a leading "#".
  function isValidHex(hex: string): boolean {
    return /^[0-9a-fA-F]{6}$/.test(hex)
  }

  // Normalize base color input text to six uppercase hex chars.
  function onBaseColorInput(i: number, e: Event): void {
    const val = (e.target as HTMLInputElement).value.replace('#', '').toUpperCase().slice(0, 6)
    genBaseColors.value[i] = val
  }

  // Set a base color at the given index for generator inputs.
  function setBaseColor(i: number, value: string): void {
    genBaseColors.value[i] = value
  }

  function normalizeBaseHex(hex: string): string {
    return hex.replace('#', '').toUpperCase().slice(0, 6)
  }

  function isGenerationBaseColor(hex: string): boolean {
    const normalized = normalizeBaseHex(hex)
    return genBaseColors.value.some(base => normalizeBaseHex(base) === normalized)
  }

  const canAddGenerationBaseColor = computed(() => genBaseColors.value.length < 3)

  function toggleGenerationBaseColor(hex: string): void {
    const normalized = normalizeBaseHex(hex)
    const existingIndex = genBaseColors.value.findIndex(base => normalizeBaseHex(base) === normalized)
    if (existingIndex >= 0) {
      genBaseColors.value.splice(existingIndex, 1)
      return
    }
    if (genBaseColors.value.length >= 3 || !isValidHex(normalized)) return
    genBaseColors.value.push(normalized)
  }

  // Remove a base color row from the generator inputs.
  function removeBaseColor(i: number): void {
    genBaseColors.value.splice(i, 1)
  }

  // Add the next existing palette color when available; otherwise leave the row empty.
  function addBaseColor(): void {
    const index = genBaseColors.value.length
    genBaseColors.value.push(ctx.colors.value[index]?.hex ?? '')
  }

  // Generate a palette from the API and replace current colors.
  async function doGenerate(): Promise<void> {
    const now = Date.now()
    if (now - lastGenerateMs < GENERATE_COOLDOWN_MS) return
    lastGenerateMs = now
    generateLoading.value = true
    generateError.value = ''
    try {
      const isShades = genHarmony.value === 'shades'
      const result = await colorApi.generatePalette({
        count: genCount.value,
        contrast: 5,
        harmony: isShades ? 'analogous' : (genHarmony.value as PaletteHarmony),
        base_colors: genBaseColors.value.filter(h => isValidHex(h)),
        include_shades: isShades,
      })
      actions.captureForUndo()
      ctx.colors.value = result.colors.map(c => ({ hex: c.hex, label: null, _key: ctx.mkKey() }))
      generateOpen.value = false
    } catch (e: any) {
      generateError.value = e.message ?? t('palette.generationFailed')
    } finally {
      generateLoading.value = false
    }
  }

  watch(generateOpen, open => {
    if (!open) {
      genPaletteDropIdx.value = null
      genPickerOpenIdx.value = null
    }
  })

  return {
    generateOpen,
    generateLoading,
    generateError,
    genCount,
    genHarmony,
    genBaseColors,
    genPickerOpenIdx,
    genPickerAnchorRect,
    genPaletteDropIdx,
    genPaletteDropRect,
    genPaletteDropStyle,
    openGenPicker,
    toggleGenPaletteDrop,
    isValidHex,
    isGenerationBaseColor,
    canAddGenerationBaseColor,
    onBaseColorInput,
    setBaseColor,
    toggleGenerationBaseColor,
    removeBaseColor,
    addBaseColor,
    doGenerate,
  }
}
