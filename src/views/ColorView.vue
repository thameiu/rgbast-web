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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import AppLoader from '@/components/AppLoader.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import { colorApi } from '@/api/color'
import type { ColorInfoResponse, ColorContrastCheckResponse } from '@/api/types'

const route  = useRoute()
const router = useRouter()

// ── Color picker state ────────────────────────────────────────────────────────

type HSV = [number, number, number]
type RGB = [number, number, number]

function hexToRgb(h: string): RGB {
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
  return [isNaN(r)?0:r, isNaN(g)?0:g, isNaN(b)?0:b]
}
function rgbToHex(r:number,g:number,b:number): string {
  return [r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('').toUpperCase()
}
function rgbToHsv(r:number,g:number,b:number): HSV {
  r/=255;g/=255;b/=255
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min
  const h=d===0?0:max===r?60*(((g-b)/d+6)%6):max===g?60*((b-r)/d+2):60*((r-g)/d+4)
  return [h, max===0?0:d/max, max]
}
function hsvToRgb(h:number,s:number,v:number): RGB {
  const f=(n:number)=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))}
  return [Math.round(f(5)*255),Math.round(f(3)*255),Math.round(f(1)*255)]
}

function normalizeHex(raw: string): string {
  return raw.replace('#','').toUpperCase().padEnd(6,'0').slice(0,6)
}

const initHex = normalizeHex((route.params.hex as string) || 'B410CC')
const hsv = ref<HSV>(rgbToHsv(...hexToRgb(initHex)))

const displayHex  = computed(() => rgbToHex(...hsvToRgb(...hsv.value)))
const pickerRgb   = computed<RGB>(() => hsvToRgb(...hsv.value))

const swatchTextColor = computed(() => {
  const [r,g,b] = hexToRgb(displayHex.value)
  const lum = (0.299*r + 0.587*g + 0.114*b) / 255
  return lum > 0.5 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)'
})

// ── API state ─────────────────────────────────────────────────────────────────

const colorInfo  = ref<ColorInfoResponse | null>(null)
const loading    = ref(false)
const error      = ref<string | null>(null)
const copied     = ref(false)
const copiedSpace = ref<string | null>(null)

// ── Contrast check state ──────────────────────────────────────────────────────

const contrastHex        = ref('FFFFFF')
const contrastInfo       = ref<ColorContrastCheckResponse | null>(null)
const contrastLoading    = ref(false)
const contrastPicked     = ref(false)
const contrastPickerOpen = ref(false)
const contrastSwatchEl   = ref<HTMLElement | null>(null)
const contrastAnchorRect = ref<DOMRect | null>(null)

const compareSwatchTextColor = computed(() => {
  const [r,g,b] = hexToRgb(contrastHex.value)
  const lum = (0.299*r + 0.587*g + 0.114*b) / 255
  return lum > 0.5 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)'
})

function openContrastPicker() {
  contrastAnchorRect.value = contrastSwatchEl.value?.getBoundingClientRect() ?? null
  contrastPickerOpen.value = true
}

function onContrastPickerUpdate(hex: string) {
  contrastHex.value = hex
  if (!contrastPicked.value) contrastPicked.value = true
}

// ── Derived display ───────────────────────────────────────────────────────────

const labelDisplay = computed(() => {
  if (!colorInfo.value) return ''
  const { closest_name, label_is_approximate } = colorInfo.value
  if (!closest_name) return ''
  return label_is_approximate ? `~${closest_name}` : closest_name
})

const bastColor = computed(() => {
  const s = colorInfo.value?.bast_score ?? 0
  if (s < 30) return '#2a9d60'
  if (s < 60) return '#d4900a'
  if (s < 80) return '#d4600a'
  return '#c0392b'
})

const bastDescription = computed(() => {
  const s = colorInfo.value?.bast_score ?? 0
  if (s < 10) return 'Crystal clear — this colour has a well-known, unambiguous name.'
  if (s < 30) return 'Mostly nameable — sits close to a recognisable colour family.'
  if (s < 55) return 'Elusive — drifting between known categories, hard to pin down.'
  if (s < 75) return 'Genuinely ambiguous — no obvious name, lives in the in-between.'
  return 'Truly unnamed — no clear category, a colour of uncertain origin.'
})

// ── Color spaces data ─────────────────────────────────────────────────────────

const colorSpaces = computed(() => {
  const c = colorInfo.value
  if (!c) return []
  return [
    { name: 'HEX',  value: `#${c.normalized_hex.toUpperCase()}` },
    { name: 'RGB',  value: `${c.rgb.r}  ${c.rgb.g}  ${c.rgb.b}` },
    { name: 'HSL',  value: `${c.hsl.h.toFixed(1)}°  ${c.hsl.s.toFixed(1)}%  ${c.hsl.l.toFixed(1)}%` },
    { name: 'HSB',  value: `${c.hsb.h.toFixed(1)}°  ${c.hsb.s.toFixed(1)}%  ${c.hsb.b.toFixed(1)}%` },
    { name: 'HWB',  value: `${c.hwb.h.toFixed(1)}°  ${c.hwb.w.toFixed(1)}%  ${c.hwb.b.toFixed(1)}%` },
    { name: 'CMYK', value: `${c.cmyk.c.toFixed(1)}  ${c.cmyk.m.toFixed(1)}  ${c.cmyk.y.toFixed(1)}  ${c.cmyk.k.toFixed(1)}` },
    { name: 'LAB',  value: `${c.lab.l.toFixed(2)}  ${c.lab.a.toFixed(2)}  ${c.lab.b.toFixed(2)}` },
    { name: 'LCH',  value: `${c.lch.l.toFixed(2)}  ${c.lch.c.toFixed(2)}  ${c.lch.h.toFixed(2)}°` },
    { name: 'LUV',  value: `${c.luv.l.toFixed(2)}  ${c.luv.u.toFixed(2)}  ${c.luv.v.toFixed(2)}` },
    { name: 'XYZ',  value: `${c.xyz.x.toFixed(3)}  ${c.xyz.y.toFixed(3)}  ${c.xyz.z.toFixed(3)}` },
  ]
})

async function copySpace(sp: { name: string; value: string }) {
  try {
    await navigator.clipboard.writeText(sp.value)
    copiedSpace.value = sp.name
    setTimeout(() => { if (copiedSpace.value === sp.name) copiedSpace.value = null }, 1400)
  } catch {}
}

// ── Shark Tale quotes ─────────────────────────────────────────────────────────

const sharkTaleQuotes = [
  "I'm the shark slayer!",
  "Whale Wash. You get the whale, we do the rest.",
  "I'm a vegetarian.",
  "Don't you EVER take the last meatball!",
  "Oscar, I am your father.",
  "Thank you, fish!",
  "I got jelly in my head.",
  "Man, it is good to be alive!",
  "I just wanna be somebody.",
  "Keep it real, keep it real.",
  "You are so beautiful!",
  "Sykes, you beautiful fish!",
  "Sorry, pop. Lenny had a little accident. He was born!",
  "You live in a billboard? And I thought I was crazy!",
  "You coming at me like that? You come at the O like that?",
  'No, I said "What, what?" as in "What, what?',
  "Well, for your information, I am the Sharkslayer. That's what they're callin' me.",
  "That's what I'm talking about!",
  "You're killing me, Smalls!",
  "Just keep swimming, keep swimming.",
  "I'm the best there ever was!",
  "Nobody does it better than Oscar.",
  "Stay in school, kids.",
  "Mama's gonna make it all better.",
  "That's not how we do things around here.",
  "You gotta believe in yourself!",
  "I didn't come this far to give up now.",
  "That's hot, that's hot.",
  "Angler fish? More like danger fish!",
  "Plankton power!",
  "I've got big dreams, baby.",
  "This is my moment!",
  "Don't mess with the coral.",
  "Jellyfish jam session!",
  "Living large in the reef!",
  "That's a wrap, my fins.",
  "You feel me?",
  "I'm on top of the world!",
  "Legends never die.",
  "Keep your head in the game.",
  "That's the way the cookie crumbles.",
  "I'm bout to blow up!",
  "Fame is a funny thing.",
  "Money talks, you know?",
  "Friends forever, no matter what.",
  "That's just how we roll.",
  "I'm living my best life.",
  "Dreams do come true!",
  "Never give up, never surrender.",
  "That's the real deal right there.",
  "You've got potential, kid.",
  "This is gonna be legendary.",
  "I'm ready for anything!",
  "That's the ticket!",
  "Keep shining, bright star.",
  "We're in this together, buddy.",
  "That's a certified banger right there.",
]

// Quote keyed to the last fetched hex — only updates when request is done
const currentQuote = computed(() => {
  const hex = colorInfo.value?.normalized_hex ?? displayHex.value
  const n = parseInt(hex.slice(0, 4), 16)
  return sharkTaleQuotes[n % sharkTaleQuotes.length] ?? ''
})

// ── Fetch ─────────────────────────────────────────────────────────────────────

let fetchTimer: ReturnType<typeof setTimeout> | null = null

async function fetchContrastInfo() {
  if (!colorInfo.value) return
  contrastLoading.value = true
  try {
    contrastInfo.value = await colorApi.getContrastCheck(displayHex.value, contrastHex.value)
  } catch {
    contrastInfo.value = null
  } finally {
    contrastLoading.value = false
  }
}

async function fetchColorInfo(hex: string) {
  loading.value = true
  error.value = null
  try {
    colorInfo.value = await colorApi.getColorInfo(hex)
    if (contrastPicked.value) fetchContrastInfo()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load colour info.'
    colorInfo.value = null
  } finally {
    loading.value = false
  }
}

function scheduleUpdate(hex: string) {
  if (fetchTimer) clearTimeout(fetchTimer)
  fetchTimer = setTimeout(() => {
    router.replace('/color/' + hex)
    fetchColorInfo(hex)
  }, 280)
}

let contrastTimer: ReturnType<typeof setTimeout> | null = null

function scheduleContrastUpdate() {
  if (contrastTimer) clearTimeout(contrastTimer)
  contrastTimer = setTimeout(fetchContrastInfo, 300)
}

watch(displayHex, (hex) => {
  scheduleUpdate(hex)
})

watch(contrastHex, () => { if (contrastPicked.value) scheduleContrastUpdate() })

watch(() => route.params.hex as string, (raw) => {
  const hex = normalizeHex(raw || '')
  if (hex !== displayHex.value) {
    hsv.value = rgbToHsv(...hexToRgb(hex))
    fetchColorInfo(hex)
  }
})

onMounted(() => fetchColorInfo(initHex))

// ── Picker drag ───────────────────────────────────────────────────────────────

const areaEl = ref<HTMLElement|null>(null)
const hueEl  = ref<HTMLElement|null>(null)
let draggingArea = false, draggingHue = false

function startAreaDrag(e: MouseEvent|TouchEvent) { draggingArea=true; updateArea(e) }
function startHueDrag (e: MouseEvent|TouchEvent) { draggingHue=true;  updateHue(e)  }

function updateArea(e: MouseEvent|TouchEvent) {
  if (!areaEl.value) return
  const rect = areaEl.value.getBoundingClientRect()
  const cx = e instanceof MouseEvent ? e.clientX : e.touches[0]!.clientX
  const cy = e instanceof MouseEvent ? e.clientY : e.touches[0]!.clientY
  hsv.value = [
    hsv.value[0],
    Math.max(0,Math.min(1,(cx-rect.left)/rect.width)),
    Math.max(0,Math.min(1,1-(cy-rect.top)/rect.height)),
  ]
}
function updateHue(e: MouseEvent|TouchEvent) {
  if (!hueEl.value) return
  const rect = hueEl.value.getBoundingClientRect()
  const cx = e instanceof MouseEvent ? e.clientX : e.touches[0]!.clientX
  hsv.value = [Math.max(0,Math.min(360,((cx-rect.left)/rect.width)*360)), hsv.value[1], hsv.value[2]]
}

function onGlobalMove(e: MouseEvent|TouchEvent) {
  if (draggingArea) updateArea(e)
  else if (draggingHue) updateHue(e)
}
function onGlobalUp() { draggingArea=false; draggingHue=false }

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

// ── Text inputs ───────────────────────────────────────────────────────────────

function onHexInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/[^0-9a-fA-F]/g,'')
  if (raw.length === 6) hsv.value = rgbToHsv(...hexToRgb(raw))
}
function onHexBlur(e: Event) {
  const raw = normalizeHex((e.target as HTMLInputElement).value)
  hsv.value = rgbToHsv(...hexToRgb(raw))
}
function onRgbInput(ch: 0|1|2, e: Event) {
  const v = Math.max(0,Math.min(255,parseInt((e.target as HTMLInputElement).value)||0))
  const r = [...pickerRgb.value] as RGB
  r[ch] = v
  hsv.value = rgbToHsv(...r)
}

async function copyHex() {
  try {
    await navigator.clipboard.writeText('#' + displayHex.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {}
}

</script>

<style scoped>
.color-view {
  min-height: 100vh;
  color: var(--ink);
}

/* ── Loading overlay ──────────────────────────────── */
.color-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.overlay-fade-enter-active,
.overlay-fade-leave-active { transition: opacity 0.22s ease; }
.overlay-fade-enter-from,
.overlay-fade-leave-to { opacity: 0; }

/* ── Skeleton shimmer ─────────────────────────────── */
@keyframes skel-wave {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}
.skel {
  display: block;
  background: linear-gradient(90deg, #e0e0e0 25%, #d0d0d0 50%, #e0e0e0 75%);
  background-size: 1200px 100%;
  animation: skel-wave 1.5s ease-in-out infinite;
  border-radius: 6px;
  flex-shrink: 0;
}

/* ── Hero swatch ─────────────────────────────────────── */
.hero-swatch {
  width: 100%;
  height: 200px;
  position: relative;
  transition: background 0.15s;
}
.swatch-inner {
  position: absolute;
  bottom: 20px;
  left: clamp(20px, 4vw, 56px);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.swatch-label {
  font-family: 'Sora', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.75;
  line-height: 1;
}
.swatch-hex {
  font-family: 'Sora', monospace;
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
}

/* ── Body layout ─────────────────────────────────────── */
.body-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  padding: 24px clamp(16px, 4vw, 56px) 56px;
  max-width: 1100px;
  margin: 0 auto;
  align-items: start;
}
@media (max-width: 768px) {
  .body-layout { grid-template-columns: 1fr; }
}

/* ── Card base ───────────────────────────────────────── */
.card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.card-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.card-label-hint {
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: none;
  color: rgba(0,0,0,0.3);
  font-size: 9px;
}
.info-col { display: flex; flex-direction: column; gap: 14px; }

/* ── Picker card ─────────────────────────────────────── */
.picker-card { gap: 10px; position: sticky; top: 76px; }

.cp-area {
  position: relative;
  width: 100%;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  cursor: crosshair;
}
.cp-sat-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to right, #fff, transparent);
}
.cp-val-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, transparent, #000);
}
.cp-cursor {
  position: absolute;
  width: 14px; height: 14px;
  border: 2.5px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
}
.cp-hue-track {
  position: relative;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(to right,
    hsl(0,100%,50%),hsl(30,100%,50%),hsl(60,100%,50%),
    hsl(90,100%,50%),hsl(120,100%,50%),hsl(150,100%,50%),
    hsl(180,100%,50%),hsl(210,100%,50%),hsl(240,100%,50%),
    hsl(270,100%,50%),hsl(300,100%,50%),hsl(330,100%,50%),hsl(360,100%,50%));
  cursor: pointer;
}
.cp-hue-thumb {
  position: absolute; top: 50%;
  width: 18px; height: 18px;
  background: #fff; border-radius: 50%;
  transform: translate(-50%,-50%);
  box-shadow: 0 1px 5px rgba(0,0,0,0.35);
  pointer-events: none;
}
.cp-inputs {
  display: flex; gap: 6px; align-items: flex-end;
}
.cp-field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.cp-field--hex { flex: 2; }
.cp-field label {
  font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--ink-3);
}
.cp-hex-row {
  display: flex; align-items: center;
  background: var(--paper);
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 6px; overflow: hidden; padding-left: 8px;
}
.cp-hash { color: var(--ink-3); font-size: 12px; font-family: 'Sora', monospace; }
.cp-hex-row .cp-input { border: none; background: transparent; padding: 6px 6px 6px 2px; }
.cp-input {
  width: 100%;
  background: var(--paper);
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 6px; padding: 6px 8px;
  color: var(--ink); font-size: 12px; font-family: 'Sora', monospace;
  outline: none; transition: border-color 0.15s; text-transform: uppercase;
}
.cp-input:focus { border-color: rgba(0,0,0,0.3); }
input[type="number"].cp-input { -moz-appearance: textfield; appearance: textfield; }
input[type="number"].cp-input::-webkit-inner-spin-button,
input[type="number"].cp-input::-webkit-outer-spin-button { -webkit-appearance: none; }

.copy-btn {
  width: 100%; padding: 9px;
  background: var(--paper);
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  color: var(--ink-3);
  font-size: 12px; font-weight: 600; font-family: 'Sora', monospace;
  cursor: pointer; transition: background 0.15s, color 0.15s;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.copy-btn:hover { background: var(--paper-2); color: var(--ink); }

/* ── Bast score ──────────────────────────────────────── */
.bast-card { gap: 10px; }
.bast-header {
  display: flex; align-items: center; justify-content: space-between;
}
.bast-value {
  font-family: 'Sora', monospace;
  font-size: 28px; font-weight: 800;
  letter-spacing: -0.03em;
}
.bast-track {
  height: 6px;
  background: rgba(0,0,0,0.08);
  border-radius: 999px;
  overflow: hidden;
}
.bast-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.2,0.9,0.2,1), background 0.4s;
}
.bast-desc {
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.45;
  margin: 0;
}

/* ── Color spaces grid ───────────────────────────────── */
.spaces-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.space-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  background: var(--paper);
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, border-color 0.12s;
  position: relative;
  overflow: hidden;
}
.space-cell:hover {
  background: var(--paper-2);
  border-color: rgba(0,0,0,0.14);
}
.space-cell.copied {
  background: rgba(42, 157, 96, 0.08);
  border-color: rgba(42, 157, 96, 0.3);
}

.space-name {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-3);
  line-height: 1;
}
.space-vals {
  font-family: 'Sora', monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.space-copy-hint {
  position: absolute;
  top: 8px; right: 10px;
  font-size: 11px;
  font-weight: 700;
  color: #2a9d60;
}

/* ── Contrast Check card ─────────────────────────────── */
.cc-pair {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.cc-swatch {
  flex: 1;
  min-height: 72px;
  border-radius: 10px;
  display: flex;
  align-items: flex-end;
  padding: 8px 10px;
  border: 1px solid rgba(0,0,0,0.08);
  transition: background 0.15s;
}
.cc-swatch-hex {
  font-family: 'Sora', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.cc-swatch--compare {
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s, border-color 0.15s;
}
.cc-swatch--compare:hover { opacity: 0.85; }
.cc-swatch--inactive {
  background: var(--paper) !important;
  border: 2px dashed rgba(0,0,0,0.15);
  align-items: center;
  justify-content: center;
  padding: 0;
}
.cc-pick-hint {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ink-3);
}
.cc-vs {
  align-self: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-3);
  flex-shrink: 0;
  padding: 0 2px;
}

.cc-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.cc-result--loading { align-items: center; }
.cc-ratio-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.cc-ratio {
  font-family: 'Sora', monospace;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--ink);
  line-height: 1;
}
.cc-ratio-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.cc-badge-groups {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cc-badge-group {
  display: flex;
  align-items: center;
  gap: 5px;
}
.cc-badge-scope {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
  min-width: 52px;
}

/* ── Accessibility ───────────────────────────────────── */
.contrast-rows { display: flex; flex-direction: column; gap: 12px; }

.contrast-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  overflow: hidden;
}

.contrast-preview {
  width: 100%;
  min-height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 20px;
}
.contrast-preview--white { background: #ffffff; }
.contrast-preview--black { background: #000000; }

.contrast-quote {
  font-family: 'Sora', serif;
  font-size: clamp(12px, 2vw, 15px);
  font-weight: 600;
  font-style: italic;
  line-height: 1.4;
  text-align: center;
  max-width: 320px;
}

.contrast-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 12px;
}
.contrast-meta-top {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.contrast-ratio {
  font-family: 'Sora', monospace;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}
.contrast-bg-label {
  font-size: 10px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.badges { display: flex; gap: 5px; }
.badge {
  font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
  padding: 3px 7px; border-radius: 5px; border: 1px solid;
}
.badge--pass { background: rgba(42,157,96,0.1); border-color: rgba(42,157,96,0.35); color: #1e7a49; }
.badge--fail { background: rgba(192,57,43,0.06); border-color: rgba(192,57,43,0.2); color: rgba(192,57,43,0.7); }

/* ── Color blindness ─────────────────────────────────── */
.cb-row { display: flex; gap: 12px; }
.cb-swatch {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.cb-dot {
  width: 100%; height: 40px; border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.08);
}
.cb-label {
  font-size: 9px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--ink-3);
}
.cb-hex {
  font-family: 'Sora', monospace; font-size: 11px;
  color: var(--ink-2);
}

/* ── State messages ──────────────────────────────────── */
.state-msg {
  font-size: 13px; color: var(--ink-3);
  padding: 24px 0; text-align: center;
}
.state-msg--error { color: #c0392b; }
</style>
