<template>
  <Teleport to="body">
    <div v-if="open" class="audit-overlay" @click.self="$emit('close')">
      <div class="audit-modal">
        <div class="audit-head">
          <div>
            <p class="audit-kicker">Accessibility Audit</p>
            <h2 class="audit-title font-display">Palette color analysis</h2>
          </div>
          <button class="audit-close" @click="$emit('close')">
            <AppIcon name="x" :size="16" />
          </button>
        </div>

        <div class="audit-selector">
          <button
            v-for="(color, index) in colors"
            :key="color._key"
            class="audit-swatch"
            :class="{ 'audit-swatch--active': index === selectedIndex }"
            :style="{ background: '#' + color.hex }"
            @click="$emit('update:selectedIndex', index)"
          >
            <span v-if="index === selectedIndex" class="audit-swatch-check" aria-hidden="true">
              <AppIcon name="check" :size="14" />
            </span>
          </button>
        </div>

        <div v-if="audit" class="audit-grid">
          <section class="audit-card audit-card--hero audit-card--panel" :style="{ background: '#' + audit.selected_color.normalized_hex }">
            <div class="audit-hero-copy" :style="{ color: heroTextColor }">
              <span class="audit-selected-label">{{ selectedName }}</span>
              <span class="audit-selected-hex">#{{ audit.selected_color.normalized_hex.toUpperCase() }}</span>
            </div>
          </section>

          <section class="audit-card audit-card--panel">
            <div class="audit-card-head">
              <span class="audit-card-label">Bast Score</span>
              <span class="audit-bast-value" :style="{ color: bastColor }">{{ audit.selected_color.bast_score.toFixed(1) }}</span>
            </div>
            <div class="audit-bast-track">
              <div class="audit-bast-fill" :style="{ width: `${audit.selected_color.bast_score}%`, background: bastColor }"></div>
            </div>
            <p class="audit-bast-copy">{{ bastDescription }}</p>
          </section>

          <section class="audit-card audit-card--wide">
            <span class="audit-card-label">Color Spaces</span>
            <div class="audit-spaces-grid">
              <button
                v-for="space in colorSpaces"
                :key="space.name"
                class="audit-space-cell"
                :class="{ 'audit-space-cell--copied': copiedSpace === space.name }"
                @click="copySpace(space.name, space.value)"
              >
                <span class="audit-space-name">{{ space.name }}</span>
                <span class="audit-space-value">{{ space.value }}</span>
                <span class="audit-space-copy-hint" aria-hidden="true">
                  <AppIcon v-if="copiedSpace === space.name" name="check" :size="12" />
                </span>
              </button>
            </div>
          </section>

          <section class="audit-card audit-card--wide">
            <span class="audit-card-label">Contrast</span>
            <div class="audit-contrast-list">
              <div v-for="row in contrastRows" :key="row.key" class="audit-contrast-row">
                <div class="audit-contrast-preview" :style="{ background: row.background }">
                  <span class="audit-contrast-quote" :style="{ color: '#' + audit.selected_color.normalized_hex }">
                    "{{ quote }}"
                  </span>
                </div>
                <div class="audit-contrast-meta">
                  <div class="audit-contrast-top">
                    <span class="audit-contrast-ratio">{{ row.ratio.toFixed(2) }}:1</span>
                    <span class="audit-contrast-label">{{ row.label }}</span>
                  </div>
                  <div class="audit-contrast-badges">
                    <span class="audit-badge" :class="row.aa ? 'audit-badge--pass' : 'audit-badge--fail'">AA</span>
                    <span class="audit-badge" :class="row.aaa ? 'audit-badge--pass' : 'audit-badge--fail'">AAA</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="audit-card audit-card--wide">
            <span class="audit-card-label">Color Variants</span>
            <div class="audit-derived-groups">
              <section v-for="group in derivedColorGroups" :key="group.key" class="audit-derived-group">
                <span class="audit-derived-title">{{ group.title }}</span>
                <div class="audit-derived-row" :class="`audit-derived-row--${group.key}`">
                  <div
                    v-for="swatch in [...(group.leadingColors ?? []), ...group.colors, ...(group.trailingColors ?? [])]"
                    :key="swatch.key"
                    class="audit-derived-swatch"
                    :style="{ background: '#' + swatch.hex }"
                  >
                    <div v-if="['shades', 'tints'].includes(group.key)" class="card-tooltip audit-derived-tooltip">
                      <p class="card-tooltip-title">#{{ swatch.hex.toUpperCase() }}</p>
                    </div>
                    <button
                      class="audit-derived-copy"
                      :class="{ 'audit-derived-copy--copied': copiedDerivedHex === swatch.hex }"
                      :style="{ color: getSwatchTextColor(swatch.hex) }"
                      :title="copiedDerivedHex === swatch.hex ? 'Copied!' : 'Copy hex'"
                      @click="copyHexValue(swatch.hex)"
                    >
                      <AppIcon :name="copiedDerivedHex === swatch.hex ? 'check' : 'copy'" :size="14" />
                    </button>
                    <span
                      v-if="['complementary', 'triadic', 'analogous', 'web-safe'].includes(group.key)"
                      class="audit-derived-inline-hex"
                      :style="{ color: getSwatchTextColor(swatch.hex) }"
                    >
                      #{{ swatch.hex.toUpperCase() }}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <section class="audit-card audit-card--wide">
            <span class="audit-card-label">Color Blindness</span>
            <div class="audit-cb-row">
              <div v-for="entry in colorBlindnessCards" :key="entry.name" class="audit-cb-card">
                <div class="audit-cb-dot" :style="{ background: '#' + entry.hex }">
                  <span class="audit-cb-inline-hex" :style="{ color: getSwatchTextColor(entry.hex) }">#{{ entry.hex.toUpperCase() }}</span>
                </div>
                <span class="audit-cb-label">{{ entry.name }}</span>
              </div>
            </div>
          </section>
        </div>

        <div v-else class="audit-empty">{{ loading ? 'Loading accessibility audit…' : 'Could not load accessibility audit.' }}</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { colorApi } from '@/api/color'
import AppIcon from '@/components/icons/AppIcon.vue'
import type {
  PaletteAccessibilityAuditResponse,
  PaletteAccessibilityContrastItem,
} from '@/api/types'
import { getSharkTaleQuote } from '@/utils/colorAccessibility'
import { computed, ref, watch } from 'vue'

interface AuditColor {
  hex: string
  label: string | null
  _key: string
}

interface ContrastRow {
  key: string
  label: string
  background: string
  ratio: number
  aa: boolean
  aaa: boolean
}

interface AuditDisplaySwatch {
  key: string
  hex: string
}

interface AuditDisplayGroup {
  key: string
  title: string
  colors: AuditDisplaySwatch[]
  leadingColors?: AuditDisplaySwatch[]
  trailingColors?: AuditDisplaySwatch[]
}

const props = defineProps<{
  open: boolean
  colors: AuditColor[]
  selectedIndex: number
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'update:selectedIndex', value: number): void
}>()

const audit = ref<PaletteAccessibilityAuditResponse | null>(null)
const loading = ref(false)
const copiedSpace = ref<string | null>(null)
const copiedDerivedHex = ref<string | null>(null)
const auditCache = new Map<string, PaletteAccessibilityAuditResponse>()
let copyTimer: ReturnType<typeof setTimeout> | null = null

const selectedColor = computed(() => props.colors[props.selectedIndex] ?? props.colors[0] ?? null)
const quote = computed(() => getSharkTaleQuote(audit.value?.selected_color.normalized_hex ?? selectedColor.value?.hex ?? '000000'))
const selectedName = computed(() => {
  const color = audit.value?.selected_palette_color
  if (!color?.closest_name) return 'Unknown color'
  return color.label_is_approximate ? `~${color.closest_name}` : color.closest_name
})

const heroTextColor = computed(() => {
  const hex = audit.value?.selected_color.normalized_hex ?? selectedColor.value?.hex ?? '000000'
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.92)'
})

function getSwatchTextColor(hex: string): string {
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.92)'
}

const bastColor = computed(() => {
  const s = audit.value?.selected_color.bast_score ?? 0
  if (s < 30) return '#2a9d60'
  if (s < 60) return '#d4900a'
  if (s < 80) return '#d4600a'
  return '#c0392b'
})

const bastDescription = computed(() => {
  const s = audit.value?.selected_color.bast_score ?? 0
  if (s < 10) return 'Crystal clear - this colour has a well-known, unambiguous name.'
  if (s < 30) return 'Mostly nameable - sits close to a recognisable colour family.'
  if (s < 55) return 'Elusive - drifting between known categories, hard to pin down.'
  if (s < 75) return 'Genuinely ambiguous - no obvious name, lives in the in-between.'
  return 'Truly unnamed - no clear category, a colour of uncertain origin.'
})

const colorSpaces = computed(() => {
  const c = audit.value?.selected_color
  if (!c) return []
  return [
    { name: 'HEX', value: `#${c.normalized_hex.toUpperCase()}` },
    { name: 'RGB', value: `${c.rgb.r}  ${c.rgb.g}  ${c.rgb.b}` },
    { name: 'RGB %', value: `${c.rgb_percent.r.toFixed(2)}%  ${c.rgb_percent.g.toFixed(2)}%  ${c.rgb_percent.b.toFixed(2)}%` },
    { name: 'HSL', value: `${c.hsl.h.toFixed(1)}°  ${c.hsl.s.toFixed(1)}%  ${c.hsl.l.toFixed(1)}%` },
    { name: 'HSB', value: `${c.hsb.h.toFixed(1)}°  ${c.hsb.s.toFixed(1)}%  ${c.hsb.b.toFixed(1)}%` },
    { name: 'HWB', value: `${c.hwb.h.toFixed(1)}°  ${c.hwb.w.toFixed(1)}%  ${c.hwb.b.toFixed(1)}%` },
    { name: 'CMYK', value: `${c.cmyk.c.toFixed(1)}  ${c.cmyk.m.toFixed(1)}  ${c.cmyk.y.toFixed(1)}  ${c.cmyk.k.toFixed(1)}` },
    { name: 'CMYK %', value: `${c.cmyk_percent.c.toFixed(1)}%  ${c.cmyk_percent.m.toFixed(1)}%  ${c.cmyk_percent.y.toFixed(1)}%  ${c.cmyk_percent.k.toFixed(1)}%` },
    { name: 'LAB', value: `${c.lab.l.toFixed(2)}  ${c.lab.a.toFixed(2)}  ${c.lab.b.toFixed(2)}` },
    { name: 'LCH', value: `${c.lch.l.toFixed(2)}  ${c.lch.c.toFixed(2)}  ${c.lch.h.toFixed(2)}°` },
    { name: 'LUV', value: `${c.luv.l.toFixed(2)}  ${c.luv.u.toFixed(2)}  ${c.luv.v.toFixed(2)}` },
    { name: 'XYZ', value: `${c.xyz.x.toFixed(3)}  ${c.xyz.y.toFixed(3)}  ${c.xyz.z.toFixed(3)}` },
  ]
})

const derivedColorGroups = computed<AuditDisplayGroup[]>(() => {
  const c = audit.value?.selected_color
  if (!c) return []
  return [
    {
      key: 'shades',
      title: 'Shades',
      leadingColors: [{ key: `audit-shades-base-${c.normalized_hex}`, hex: c.normalized_hex }],
      trailingColors: [{ key: 'audit-shades-black', hex: '000000' }],
      colors: c.shades.map((row, index) => ({
        key: `shade-${row.hex}-${index}`,
        hex: row.hex,
      })),
    },
    {
      key: 'tints',
      title: 'Tints',
      leadingColors: [{ key: `audit-tints-base-${c.normalized_hex}`, hex: c.normalized_hex }],
      trailingColors: [{ key: 'audit-tints-white', hex: 'FFFFFF' }],
      colors: c.tints.map((row, index) => ({
        key: `tint-${row.hex}-${index}`,
        hex: row.hex,
      })),
    },
    {
      key: 'complementary',
      title: 'Complementary',
      leadingColors: [{ key: `comp-base-${c.complementary.base.hex}`, hex: c.complementary.base.hex }],
      colors: c.complementary.colors.map((row, index) => ({ key: `comp-${row.hex}-${index}`, hex: row.hex })),
    },
    {
      key: 'triadic',
      title: 'Triadic',
      leadingColors: [{ key: `tri-base-${c.triadic.base.hex}`, hex: c.triadic.base.hex }],
      colors: c.triadic.colors.map((row, index) => ({ key: `tri-${row.hex}-${index}`, hex: row.hex })),
    },
    {
      key: 'analogous',
      title: 'Analogous',
      leadingColors: [{ key: `ana-base-${c.analogous.base.hex}`, hex: c.analogous.base.hex }],
      colors: c.analogous.colors.map((row, index) => ({ key: `ana-${row.hex}-${index}`, hex: row.hex })),
    },
    {
      key: 'web-safe',
      title: 'Closest web-safe',
      colors: [{
        key: `web-${c.closest_web_safe.hex}`,
        hex: c.closest_web_safe.hex,
      }],
    },
  ]
})

const colorBlindnessCards = computed(() => {
  const c = audit.value?.selected_color.accessibility.color_blindness
  if (!c) return []
  return [
    { name: 'Protanopia', hex: c.protanopia.hex },
    { name: 'Deuteranopia', hex: c.deuteranopia.hex },
    { name: 'Tritanopia', hex: c.tritanopia.hex },
  ]
})

const contrastRows = computed<ContrastRow[]>(() => {
  const current = audit.value
  if (!current) return []

  const rows: ContrastRow[] = [
    {
      key: 'white',
      label: 'on white',
      background: '#ffffff',
      ratio: current.contrast_on_white.ratio,
      aa: current.contrast_on_white.aa_normal,
      aaa: current.contrast_on_white.aaa_normal,
    },
    {
      key: 'black',
      label: 'on black',
      background: '#000000',
      ratio: current.contrast_on_black.ratio,
      aa: current.contrast_on_black.aa_normal,
      aaa: current.contrast_on_black.aaa_normal,
    },
  ]

  current.contrast_with_palette.forEach((entry: PaletteAccessibilityContrastItem, index) => {
    rows.push({
      key: `${entry.color.normalized_hex}-${index}`,
      label: entry.color.label_is_approximate
        ? `~${entry.color.closest_name ?? `color ${index + 1}`}`
        : (entry.color.closest_name ?? `color ${index + 1}`),
      background: `#${entry.color.normalized_hex}`,
      ratio: entry.contrast.ratio,
      aa: entry.contrast.aa_normal,
      aaa: entry.contrast.aaa_normal,
    })
  })

  return rows
})

function buildCacheKey(): string | null {
  const selected = selectedColor.value
  if (!selected) return null
  return `${selected.hex}|${props.colors.map(color => `${color.hex}:${color.label ?? ''}`).join(',')}`
}

async function copySpace(name: string, value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value)
    copiedSpace.value = name
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedSpace.value = null
      copyTimer = null
    }, 1400)
  } catch {}
}

async function copyHexValue(hex: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(`#${hex}`)
    copiedDerivedHex.value = hex
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedDerivedHex.value = null
      copyTimer = null
    }, 1400)
  } catch {}
}

async function loadAudit(): Promise<void> {
  const selected = selectedColor.value
  const key = buildCacheKey()
  if (!selected || !key) {
    audit.value = null
    return
  }
  if (auditCache.has(key)) {
    audit.value = auditCache.get(key) ?? null
    return
  }

  loading.value = true
  try {
    const response = await colorApi.getPaletteAccessibilityAudit({
      selected_hex: selected.hex,
      palette_colors: props.colors.map(color => ({
        hex: color.hex,
        label: color.label,
      })),
    })
    auditCache.set(key, response)
    if (buildCacheKey() === key) audit.value = response
  } catch {
    if (buildCacheKey() === key) audit.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.open, props.selectedIndex, props.colors.map(color => `${color.hex}:${color.label ?? ''}`).join(',')] as const,
  ([open]) => {
    if (!open) return
    void loadAudit()
  },
  { immediate: true },
)
</script>

<style scoped src="./PaletteAccessibilityModal.css"></style>
