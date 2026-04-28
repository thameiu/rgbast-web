<template>
  <div class="color-view">
    <SiteHeader />

    <!-- Loading overlay (refetch / color change — skeleton handles first load) -->
    <Teleport to="body">
      <Transition name="overlay-fade">
        <div v-if="loading && colorInfo" class="color-loading-overlay">
          <AppLoader message="Loading color information" />
        </div>
      </Transition>
    </Teleport>

    <!-- Hero swatch -->
    <div class="hero-swatch" :style="{ background: '#' + displayHex }">
      <div class="swatch-inner">
        <span class="swatch-label" :style="{ color: swatchTextColor }">
          {{ labelDisplay }}
        </span>
        <span class="swatch-hex" :style="{ color: swatchTextColor }">
          #{{ displayHex.toUpperCase() }}
        </span>
      </div>
    </div>

    <!-- Body -->
    <div class="body-layout">

      <!-- Left: picker -->
      <aside class="picker-col">
        <div class="card picker-card">
          <!-- 2D sat/val area -->
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

          <!-- Inputs -->
          <div class="cp-inputs">
            <div class="cp-field cp-field--hex">
              <label>Hex</label>
              <div class="cp-hex-row">
                <span class="cp-hash">#</span>
                <input class="cp-input" :value="displayHex" maxlength="6" spellcheck="false"
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
          <button class="copy-btn" @click="copyHex">
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
          <!-- Accessibility skeleton -->
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
          <!-- Color blindness skeleton -->
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
            <span class="card-label">Color Spaces <span class="card-label-hint">— click any to copy</span></span>
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
                <span class="space-copy-hint">{{ copiedSpace === sp.name ? '✓' : '' }}</span>
              </button>
            </div>
          </div>

          <!-- Contrast Check -->
          <div class="card">
            <span class="card-label">Contrast Check</span>

            <!-- Paired swatch preview -->
            <div class="cc-pair">
              <!-- Left: current color (static) -->
              <div class="cc-swatch" :style="{ background: '#' + displayHex }">
                <span class="cc-swatch-hex" :style="{ color: swatchTextColor }">#{{ displayHex.toUpperCase() }}</span>
              </div>

              <span class="cc-vs">vs</span>

              <!-- Right: comparison color — inactive until picked, picker opens on click -->
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

            <!-- ColorPicker popover (same as palette view) -->
            <ColorPicker
              v-if="contrastPickerOpen"
              :modelValue="contrastHex"
              :anchorRect="contrastAnchorRect ?? undefined"
              @update:modelValue="onContrastPickerUpdate"
              @close="contrastPickerOpen = false"
            />

            <!-- Result (only once a color has been picked) -->
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

          <!-- Accessibility -->
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

          <!-- Color blindness -->
          <div class="card">
            <span class="card-label">Color Blindness</span>
            <div class="cb-row">
              <div class="cb-swatch">
                <div class="cb-dot" :style="{ background: '#' + colorInfo.accessibility.color_blindness.protanopia.hex }"></div>
                <span class="cb-label">Protanopia</span>
                <span class="cb-hex">#{{ colorInfo.accessibility.color_blindness.protanopia.hex.toUpperCase() }}</span>
              </div>
              <div class="cb-swatch">
                <div class="cb-dot" :style="{ background: '#' + colorInfo.accessibility.color_blindness.deuteranopia.hex }"></div>
                <span class="cb-label">Deuteranopia</span>
                <span class="cb-hex">#{{ colorInfo.accessibility.color_blindness.deuteranopia.hex.toUpperCase() }}</span>
              </div>
              <div class="cb-swatch">
                <div class="cb-dot" :style="{ background: '#' + colorInfo.accessibility.color_blindness.tritanopia.hex }"></div>
                <span class="cb-label">Tritanopia</span>
                <span class="cb-hex">#{{ colorInfo.accessibility.color_blindness.tritanopia.hex.toUpperCase() }}</span>
              </div>
            </div>
          </div>

        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import ColorPicker from '@/components/palette/ColorPicker.vue'
import { useColorView } from './composables/useColorView'

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
  currentQuote,
  areaEl,
  hueEl,
  startAreaDrag,
  startHueDrag,
  openContrastPicker,
  onContrastPickerUpdate,
  onHexInput,
  onHexBlur,
  onRgbInput,
  copyHex,
  copySpace,
} = view

watch(displayHex, hex => { document.title = `#${hex.toUpperCase()} - RGBAST` }, { immediate: true })
</script>

<style src="./ColorView.css" scoped></style>
