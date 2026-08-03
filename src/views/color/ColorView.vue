<template>
  <div class="color-view">
    <SiteHeader />

    <!-- Hero swatch -->
    <div class="hero-swatch" :class="{ 'hero-swatch--loading': loading }" :style="{ background: '#' + displayHex }">
      <div class="swatch-inner">
        <span class="swatch-label" :style="{ color: swatchTextColor }">
          {{ labelDisplay }}
        </span>
        <div class="swatch-hex-row">
          <span class="swatch-hex" :style="{ color: swatchTextColor }">
            #{{ displayHex.toUpperCase() }}
          </span>
          <button
            class="hero-bookmark-btn"
            :class="{ 'hero-bookmark-btn--active': !!currentBookmark }"
            :style="{ color: swatchTextColor }"
            :title="currentBookmark ? 'Update saved color' : 'Save color'"
            @click="onBookmarkClick"
          >
            <AppIcon name="bookmark" :size="18" />
          </button>
        </div>
      </div>
      <transition name="hero-loader-fade">
        <div v-if="loading" class="hero-loader-overlay">
          <AppLoader message="Loading color information..." />
        </div>
      </transition>
    </div>

    <!-- Body -->
    <div class="body-layout" :class="{ 'body-layout--3d': pickerMode === '3d' }">

      <!-- Left: picker -->
      <aside class="picker-col" :class="{ 'picker-col--3d': pickerMode === '3d' }">
        <div class="card picker-card" :class="{ 'picker-card--3d': pickerMode === '3d' }">
          <div class="picker-mode-tabs">
            <button class="color-history-btn" :disabled="!canGoBackColor" title="Previous color (Ctrl+Z)" @click="goToPreviousColor">
              <AppIcon name="arrow-left" :size="13" />
            </button>
            <button class="color-history-btn" :disabled="!canGoForwardColor" title="Next color (Ctrl+Y / Ctrl+Shift+Z)" @click="goToNextColor">
              <AppIcon name="arrow-right" :size="13" />
            </button>
            <button class="picker-mode-btn" :class="{ active: pickerMode === '2d' }" @click="pickerMode = '2d'">
              Normal
            </button>
            <button class="picker-mode-btn" :class="{ active: pickerMode === '3d' }" @click="pickerMode = '3d'">
              3D selector
            </button>
          </div>

          <!-- 2D sat/val area -->
          <template v-if="pickerMode === '2d'">
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
                  background: '#' + displayHex,
                }"
              ></div>
            </div>

            <!-- Hue slider -->
            <div class="cp-hue-track" ref="hueEl" @mousedown="startHueDrag" @touchstart.prevent="startHueDrag">
              <div class="cp-hue-thumb" :style="{ left: (hsv[0] / 360 * 100) + '%' }"></div>
            </div>
          </template>

          <RgbCube3DPicker
            v-else
            :hex="displayHex"
            @pick="applyHex"
          />

          <!-- Inputs -->
          <div class="cp-inputs">
            <div class="cp-field cp-field--hex">
              <label>Hex</label>
              <div class="cp-hex-row">
                <span class="cp-hash">#</span>
                <input class="cp-input" :value="displayHex" maxlength="7" spellcheck="false"
                  @input="onHexInput" @blur="onHexBlur" />
              </div>
            </div>
            <div class="cp-field">
              <label>R</label>
              <input class="cp-input" type="number" min="0" max="255" :value="pickerRgb[0]"
                @input="e => onRgbInput(0, e)" />
            </div>
            <div class="cp-field">
              <label>G</label>
              <input class="cp-input" type="number" min="0" max="255" :value="pickerRgb[1]"
                @input="e => onRgbInput(1, e)" />
            </div>
            <div class="cp-field">
              <label>B</label>
              <input class="cp-input" type="number" min="0" max="255" :value="pickerRgb[2]"
                @input="e => onRgbInput(2, e)" />
            </div>
          </div>

          <!-- Copy hex -->
          <button class="copy-btn" :class="{ 'copy-btn--copied': copied }" @click="copyHex">
            <span v-if="copied">✓ Copied</span>
            <span v-else>Copy #{{ displayHex.toUpperCase() }}</span>
          </button>
        </div>
      </aside>

      <!-- Right: info -->
      <div class="info-col">

        <!-- Error -->
        <div v-if="error && !colorInfo" class="state-msg state-msg--error">{{ error }}</div>

        <!-- Skeleton: first load only (no prior data) -->
        <template v-else-if="loading && !colorInfo">
          <!-- Bast score skeleton -->
          <div class="card bast-card">
            <div class="bast-header">
              <span class="skel" style="width:70px;height:10px;"></span>
              <span class="skel" style="width:52px;height:28px;border-radius:4px;"></span>
            </div>
            <div class="skel" style="height:6px;border-radius:999px;"></div>
            <div style="display:flex;flex-direction:column;gap:5px;">
              <span class="skel" style="height:11px;width:100%;"></span>
              <span class="skel" style="height:11px;width:72%;"></span>
            </div>
          </div>
          <!-- Color spaces skeleton -->
          <div class="card">
            <span class="skel" style="width:100px;height:10px;"></span>
            <div class="spaces-grid">
              <div v-for="i in 10" :key="i" class="skel" style="height:54px;border-radius:10px;"></div>
            </div>
          </div>
        </template>

        <template v-if="colorInfo">

          <!-- Bast score -->
          <div class="card bast-card">
            <div class="bast-header">
              <span class="card-label">Bast Score</span>
              <span class="bast-value" :style="{ color: bastColor }">{{ colorInfo.bast_score.toFixed(1) }}</span>
            </div>
            <div class="bast-track">
              <div class="bast-fill" :style="{ width: colorInfo.bast_score + '%', background: bastColor }"></div>
            </div>
            <p class="bast-desc">{{ bastDescription }}</p>
          </div>

          <!-- Color spaces -->
          <div class="card">
            <span class="card-label">Color Spaces</span>
            <div class="spaces-grid">
              <button
                v-for="sp in colorSpaces"
                :key="sp.name"
                class="space-cell"
                :class="{ copied: copiedSpace === sp.name }"
                @click="copySpace(sp)"
              >
                <span class="space-name">{{ sp.name }}</span>
                <span class="space-vals">{{ sp.value }}</span>
                <span class="space-copy-hint" aria-hidden="true">
                  <AppIcon :name="copiedSpace === sp.name ? 'check' : 'copy'" :size="13" />
                </span>
              </button>
            </div>
          </div>
        </template>
      </div>

      <div v-if="loading && !colorInfo" class="full-width-col">
        <!-- Contrast check skeleton -->
        <div class="card">
          <span class="skel" style="width:110px;height:10px;"></span>
          <div class="cc-pair">
            <div class="skel" style="flex:1;height:64px;border-radius:10px;"></div>
            <div class="skel" style="width:28px;height:16px;border-radius:6px;align-self:center;"></div>
            <div class="skel" style="flex:1;height:64px;border-radius:10px;"></div>
          </div>
          <div class="skel" style="height:36px;border-radius:8px;"></div>
          <div style="display:flex;gap:8px;">
            <span class="skel" style="width:80px;height:28px;border-radius:8px;"></span>
            <div style="display:flex;gap:5px;margin-left:auto;">
              <span class="skel" style="width:28px;height:20px;border-radius:5px;"></span>
              <span class="skel" style="width:32px;height:20px;border-radius:5px;"></span>
              <span class="skel" style="width:28px;height:20px;border-radius:5px;"></span>
              <span class="skel" style="width:32px;height:20px;border-radius:5px;"></span>
            </div>
          </div>
        </div>
        <div class="card">
          <span class="skel" style="width:90px;height:10px;"></span>
          <div class="contrast-rows">
            <div class="contrast-row">
              <div class="skel" style="width:100%;height:88px;border-radius:12px 12px 0 0;"></div>
              <div class="contrast-meta">
                <div class="contrast-meta-top" style="gap:5px;">
                  <span class="skel" style="width:50px;height:15px;"></span>
                  <span class="skel" style="width:40px;height:9px;"></span>
                </div>
                <div style="display:flex;gap:5px;">
                  <span class="skel" style="width:28px;height:20px;border-radius:5px;"></span>
                  <span class="skel" style="width:32px;height:20px;border-radius:5px;"></span>
                </div>
              </div>
            </div>
            <div class="contrast-row">
              <div class="skel" style="width:100%;height:88px;border-radius:12px 12px 0 0;"></div>
              <div class="contrast-meta">
                <div class="contrast-meta-top" style="gap:5px;">
                  <span class="skel" style="width:50px;height:15px;"></span>
                  <span class="skel" style="width:40px;height:9px;"></span>
                </div>
                <div style="display:flex;gap:5px;">
                  <span class="skel" style="width:28px;height:20px;border-radius:5px;"></span>
                  <span class="skel" style="width:32px;height:20px;border-radius:5px;"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <span class="skel" style="width:110px;height:10px;"></span>
          <div class="cb-row">
            <div v-for="i in 3" :key="i" class="cb-swatch">
              <div class="skel" style="width:100%;height:40px;border-radius:8px;"></div>
              <span class="skel" style="width:60%;height:9px;"></span>
              <span class="skel" style="width:50%;height:11px;"></span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="colorInfo" class="full-width-col">
        <div class="card">
          <span class="card-label">Color Variants</span>
          <div class="derived-groups">
            <section v-for="group in derivedColorGroups" :key="group.key" class="derived-group">
              <div class="derived-head">
                <span class="derived-title">{{ group.title }}</span>
              </div>
              <div class="derived-row" :class="`derived-row--${group.key}`">
                <div
                  v-for="swatch in [...(group.leadingColors ?? []), ...group.colors, ...(group.trailingColors ?? [])]"
                  :key="swatch.key"
                  class="derived-swatch"
                  :style="{ background: '#' + swatch.hex }"
                >
                  <div v-if="['shades', 'tints'].includes(group.key)" class="card-tooltip derived-tooltip">
                    <p class="card-tooltip-title">#{{ swatch.hex.toUpperCase() }}</p>
                  </div>
                  <div class="derived-swatch-actions">
                    <button
                      class="derived-action-btn"
                      :style="{ color: getSwatchTextColor(swatch.hex) }"
                      title="Set as current color"
                      @click.stop="setCurrentColor(swatch.hex)"
                    >
                      <AppIcon name="external-link" :size="14" />
                    </button>
                    <button
                      class="derived-action-btn"
                      :class="{ 'derived-action-btn--copied': copiedDerivedHex === swatch.hex }"
                      :style="{ color: getSwatchTextColor(swatch.hex) }"
                      :title="copiedDerivedHex === swatch.hex ? 'Copied!' : 'Copy hex'"
                      @click.stop="copyHexValue(swatch.hex)"
                    >
                      <AppIcon :name="copiedDerivedHex === swatch.hex ? 'check' : 'copy'" :size="14" />
                    </button>
                  </div>
                  <span
                    v-if="['complementary', 'triadic', 'analogous', 'web-safe'].includes(group.key)"
                    class="derived-inline-hex"
                    :style="{ color: getSwatchTextColor(swatch.hex) }"
                  >
                    #{{ swatch.hex.toUpperCase() }}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div class="card">
          <span class="card-label">Contrast Check</span>
          <div class="cc-pair">
            <div class="cc-swatch" :style="{ background: '#' + displayHex }">
              <span class="cc-swatch-hex" :style="{ color: swatchTextColor }">#{{ displayHex.toUpperCase() }}</span>
            </div>
            <span class="cc-vs">vs</span>
            <div
              ref="contrastSwatchEl"
              class="cc-swatch cc-swatch--compare"
              :class="{ 'cc-swatch--inactive': !contrastPicked }"
              :style="contrastPicked ? { background: '#' + contrastHex } : {}"
              @click="openContrastPicker"
            >
              <template v-if="contrastPicked">
                <span class="cc-swatch-hex" :style="{ color: compareSwatchTextColor }">#{{ contrastHex.toUpperCase() }}</span>
              </template>
              <template v-else>
                <span class="cc-pick-hint">+ pick color</span>
              </template>
            </div>
          </div>
          <ColorPicker
            v-if="contrastPickerOpen"
            :modelValue="contrastHex"
            :anchorRect="contrastAnchorRect ?? undefined"
            @update:modelValue="onContrastPickerUpdate"
            @close="contrastPickerOpen = false"
          />
          <template v-if="contrastPicked">
            <div v-if="contrastInfo && !contrastLoading" class="cc-result">
              <div class="cc-ratio-row">
                <span class="cc-ratio">{{ contrastInfo.ratio.toFixed(2) }}:1</span>
                <span class="cc-ratio-label">contrast ratio</span>
              </div>
              <div class="cc-badge-groups">
                <div class="cc-badge-group">
                  <span class="cc-badge-scope">Normal</span>
                  <span class="badge" :class="contrastInfo.aa_normal ? 'badge--pass' : 'badge--fail'">AA</span>
                  <span class="badge" :class="contrastInfo.aaa_normal ? 'badge--pass' : 'badge--fail'">AAA</span>
                </div>
                <div class="cc-badge-group">
                  <span class="cc-badge-scope">Large text</span>
                  <span class="badge" :class="contrastInfo.aa_large ? 'badge--pass' : 'badge--fail'">AA</span>
                  <span class="badge" :class="contrastInfo.aaa_large ? 'badge--pass' : 'badge--fail'">AAA</span>
                </div>
              </div>
            </div>
            <div v-else-if="contrastLoading" class="cc-result cc-result--loading">
              <span class="skel" style="width:80px;height:28px;border-radius:8px;"></span>
              <div class="cc-badge-groups">
                <div class="cc-badge-group">
                  <span class="skel" style="width:36px;height:9px;border-radius:4px;"></span>
                  <span class="skel" style="width:28px;height:20px;border-radius:5px;"></span>
                  <span class="skel" style="width:28px;height:20px;border-radius:5px;"></span>
                </div>
                <div class="cc-badge-group">
                  <span class="skel" style="width:52px;height:9px;border-radius:4px;"></span>
                  <span class="skel" style="width:28px;height:20px;border-radius:5px;"></span>
                  <span class="skel" style="width:28px;height:20px;border-radius:5px;"></span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="card">
          <span class="card-label">Accessibility</span>
          <div class="contrast-rows">
            <div class="contrast-row">
              <div class="contrast-preview contrast-preview--white">
                <span class="contrast-quote" :style="{ color: '#' + displayHex }">
                  "{{ currentQuote }}"
                </span>
              </div>
              <div class="contrast-meta">
                <div class="contrast-meta-top">
                  <span class="contrast-ratio">{{ colorInfo.accessibility.contrast.on_white.toFixed(2) }}:1</span>
                  <span class="contrast-bg-label">on white</span>
                </div>
                <div class="badges">
                  <span class="badge" :class="colorInfo.accessibility.contrast.aa_on_white_normal_text ? 'badge--pass' : 'badge--fail'">AA</span>
                  <span class="badge" :class="colorInfo.accessibility.contrast.aaa_on_white_normal_text ? 'badge--pass' : 'badge--fail'">AAA</span>
                </div>
              </div>
            </div>
            <div class="contrast-row">
              <div class="contrast-preview contrast-preview--black">
                <span class="contrast-quote" :style="{ color: '#' + displayHex }">
                  "{{ currentQuote }}"
                </span>
              </div>
              <div class="contrast-meta">
                <div class="contrast-meta-top">
                  <span class="contrast-ratio">{{ colorInfo.accessibility.contrast.on_black.toFixed(2) }}:1</span>
                  <span class="contrast-bg-label">on black</span>
                </div>
                <div class="badges">
                  <span class="badge" :class="colorInfo.accessibility.contrast.aa_on_black_normal_text ? 'badge--pass' : 'badge--fail'">AA</span>
                  <span class="badge" :class="colorInfo.accessibility.contrast.aaa_on_black_normal_text ? 'badge--pass' : 'badge--fail'">AAA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <span class="card-label">Color Blindness</span>
          <div class="cb-row">
            <div class="cb-swatch">
              <div class="cb-dot" :style="{ background: '#' + colorInfo.accessibility.color_blindness.protanopia.hex }">
                <span class="cb-inline-hex" :style="{ color: getSwatchTextColor(colorInfo.accessibility.color_blindness.protanopia.hex) }">
                  #{{ colorInfo.accessibility.color_blindness.protanopia.hex.toUpperCase() }}
                </span>
              </div>
              <span class="cb-label">Protanopia</span>
            </div>
            <div class="cb-swatch">
              <div class="cb-dot" :style="{ background: '#' + colorInfo.accessibility.color_blindness.deuteranopia.hex }">
                <span class="cb-inline-hex" :style="{ color: getSwatchTextColor(colorInfo.accessibility.color_blindness.deuteranopia.hex) }">
                  #{{ colorInfo.accessibility.color_blindness.deuteranopia.hex.toUpperCase() }}
                </span>
              </div>
              <span class="cb-label">Deuteranopia</span>
            </div>
            <div class="cb-swatch">
              <div class="cb-dot" :style="{ background: '#' + colorInfo.accessibility.color_blindness.tritanopia.hex }">
                <span class="cb-inline-hex" :style="{ color: getSwatchTextColor(colorInfo.accessibility.color_blindness.tritanopia.hex) }">
                  #{{ colorInfo.accessibility.color_blindness.tritanopia.hex.toUpperCase() }}
                </span>
              </div>
              <span class="cb-label">Tritanopia</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ColorBookmarkModal
      :open="bookmarkModalOpen"
      :hex="displayHex"
      :label="bookmarkLabel"
      :existing="!!currentBookmark"
      :isSaving="bookmarkSaving"
      :error="bookmarkError"
      :createdAt="currentBookmark?.created_at ?? null"
      :updatedAt="currentBookmark?.updated_at ?? null"
      @close="closeBookmarkModal"
      @save="saveBookmark"
      @update:label="bookmarkLabel = $event"
    />

    <AuthModal
      v-if="showBookmarkAuthModal"
      theme="light"
      @authenticated="onBookmarkAuthSuccess"
      @cancel="onBookmarkAuthCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { UserMeResponse, ColorBookmarkResponse } from '@/api/types'
import { authApi } from '@/api'
import { colorBookmarksApi } from '@/api/colorBookmarks'
import AuthModal from '@/components/auth/AuthModal.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import ColorPicker from '@/components/palette/ColorPicker.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import RgbCube3DPicker from '@/components/color/RgbCube3DPicker.vue'
import ColorBookmarkModal from '@/views/color/components/ColorBookmarkModal.vue'
import { useColorView } from './composables/useColorView'
import { setPageSeo } from '@/utils/seo'

// ColorView component: orchestrates the color explorer layout and state.
const view = useColorView()

const {
  hsv,
  displayHex,
  pickerRgb,
  swatchTextColor,
  colorInfo,
  loading,
  error,
  copied,
  copiedSpace,
  copiedDerivedHex,
  contrastHex,
  contrastInfo,
  contrastLoading,
  contrastPicked,
  contrastPickerOpen,
  contrastSwatchEl,
  contrastAnchorRect,
  compareSwatchTextColor,
  labelDisplay,
  bastColor,
  bastDescription,
  colorSpaces,
  derivedColorGroups,
  currentQuote,
  canGoBackColor,
  canGoForwardColor,
  areaEl,
  hueEl,
  startAreaDrag,
  startHueDrag,
  openContrastPicker,
  onContrastPickerUpdate,
  onHexInput,
  onHexBlur,
  onRgbInput,
  applyHex,
  copyHex,
  copyHexValue,
  copySpace,
  setCurrentColor,
  getSwatchTextColor,
  goToPreviousColor,
  goToNextColor,
} = view

const pickerMode = ref<'2d' | '3d'>('2d')
const viewerUser = ref<UserMeResponse | null>(null)
const currentBookmark = ref<ColorBookmarkResponse | null>(null)
const bookmarkModalOpen = ref(false)
const showBookmarkAuthModal = ref(false)
const bookmarkLabel = ref('')
const bookmarkError = ref('')
const bookmarkSaving = ref(false)
const pendingBookmarkAfterAuth = ref(false)

function buildDefaultBookmarkLabel(): string {
  const label = labelDisplay.value?.trim().replace(/^~\s*/, '')
  return label || `#${displayHex.value.toUpperCase()}`
}

function isBookmarkNotFound(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /bookmark not found/i.test(message) || /http error 404/i.test(message)
}

async function loadBookmarkViewer(): Promise<void> {
  const token = localStorage.getItem('access_token')
  if (!token) {
    viewerUser.value = null
    currentBookmark.value = null
    return
  }
  try {
    viewerUser.value = await authApi.checkAuth()
  } catch {
    viewerUser.value = null
    currentBookmark.value = null
    localStorage.removeItem('access_token')
  }
}

async function refreshCurrentBookmark(hex: string): Promise<void> {
  if (!viewerUser.value) {
    currentBookmark.value = null
    return
  }
  try {
    const bookmark = await colorBookmarksApi.getMineByHex(hex)
    currentBookmark.value = bookmark
    if (bookmarkModalOpen.value) {
      bookmarkLabel.value = bookmark.label
    }
  } catch (error) {
    if (isBookmarkNotFound(error)) {
      currentBookmark.value = null
      if (bookmarkModalOpen.value) {
        bookmarkLabel.value = buildDefaultBookmarkLabel()
      }
      return
    }
    currentBookmark.value = null
  }
}

async function openBookmarkModal(): Promise<void> {
  bookmarkError.value = ''
  bookmarkLabel.value = buildDefaultBookmarkLabel()
  await refreshCurrentBookmark(displayHex.value)
  bookmarkLabel.value = currentBookmark.value?.label ?? buildDefaultBookmarkLabel()
  bookmarkModalOpen.value = true
}

function closeBookmarkModal(): void {
  bookmarkModalOpen.value = false
  bookmarkError.value = ''
}

function onBookmarkClick(): void {
  if (!viewerUser.value) {
    pendingBookmarkAfterAuth.value = true
    showBookmarkAuthModal.value = true
    return
  }
  void openBookmarkModal()
}

async function saveBookmark(): Promise<void> {
  const label = bookmarkLabel.value.trim()
  if (!label) return
  bookmarkSaving.value = true
  bookmarkError.value = ''
  try {
    const saved = await colorBookmarksApi.upsert(displayHex.value, { label })
    currentBookmark.value = saved
    bookmarkLabel.value = saved.label
    bookmarkModalOpen.value = false
  } catch (error: any) {
    bookmarkError.value = error?.message ?? 'Could not save this bookmark.'
  } finally {
    bookmarkSaving.value = false
  }
}

async function onBookmarkAuthSuccess(): Promise<void> {
  showBookmarkAuthModal.value = false
  await loadBookmarkViewer()
  if (pendingBookmarkAfterAuth.value) {
    pendingBookmarkAfterAuth.value = false
    await openBookmarkModal()
  }
}

function onBookmarkAuthCancel(): void {
  showBookmarkAuthModal.value = false
  pendingBookmarkAfterAuth.value = false
}

watch(displayHex, hex => {
  const normalized = hex.toUpperCase()
  setPageSeo({
    title: `#${normalized} - RGBAST`,
    description: `Explore color #${normalized}: inspect RGB/HSL/CMYK spaces, accessibility contrast, color blindness simulation, and 3D picker tools.`,
    keywords: ['color selection', 'hex color', 'rgb converter', 'hsl converter', 'cmyk converter', normalized],
  })
}, { immediate: true })

watch(displayHex, () => {
  currentBookmark.value = null
})

void loadBookmarkViewer()
</script>

<style src="./ColorView.css" scoped></style>
