import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { colorApi } from '@/api/color'
import type { ColorInfoResponse, ColorContrastCheckResponse } from '@/api/types'

/** Hue-Saturation-Value tuple: [0-360, 0-1, 0-1]. */
export type HSV = [number, number, number]

/** Red-Green-Blue tuple: [0-255, 0-255, 0-255]. */
export type RGB = [number, number, number]

/**
 * Convert a 6-char hex string to an RGB tuple.
 * @param h - 6-char hex string without a leading #.
 * @returns RGB tuple used by the picker and inputs.
 */
function hexToRgb(h: string): RGB {
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b]
}

/**
 * Convert RGB integers to a 6-char uppercase hex string.
 * @param r - Red channel 0-255.
 * @param g - Green channel 0-255.
 * @param b - Blue channel 0-255.
 * @returns 6-char uppercase hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  return [r, g, b]
    .map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

/**
 * Convert RGB integers to HSV tuple.
 * @param r - Red channel 0-255.
 * @param g - Green channel 0-255.
 * @param b - Blue channel 0-255.
 * @returns HSV tuple used by the picker.
 */
function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const h =
    d === 0
      ? 0
      : max === r
        ? 60 * (((g - b) / d + 6) % 6)
        : max === g
          ? 60 * ((b - r) / d + 2)
          : 60 * ((r - g) / d + 4)
  return [h, max === 0 ? 0 : d / max, max]
}

/**
 * Convert HSV tuple to RGB integers.
 * @param h - Hue 0-360.
 * @param s - Saturation 0-1.
 * @param v - Value 0-1.
 * @returns RGB tuple.
 */
function hsvToRgb(h: number, s: number, v: number): RGB {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)]
}

/**
 * Normalize a raw hex string to a 6-char uppercase string.
 * @param raw - Hex string that may contain a leading # or extra chars.
 * @returns Sanitized hex string used by the picker and API.
 */
function normalizeHex(raw: string): string {
  return raw.replace('#', '').toUpperCase().padEnd(6, '0').slice(0, 6)
}

/**
 * Build all reactive state and handlers for the ColorView page.
 * @returns State and callbacks consumed by ColorView.vue template.
 */
export function useColorView() {
  const route = useRoute()
  const router = useRouter()

  // ── Color picker state ────────────────────────────────────────────────────

  /** Initial hex from the route parameter. */
  const initHex = normalizeHex((route.params.hex as string) || 'B410CC')

  /** Internal HSV state for the inline picker. */
  const hsv = ref<HSV>(rgbToHsv(...hexToRgb(initHex)))

  /** Current display hex derived from HSV state. */
  const displayHex = computed(() => rgbToHex(...hsvToRgb(...hsv.value)))

  /** Current RGB tuple derived from HSV state (for number inputs). */
  const pickerRgb = computed<RGB>(() => hsvToRgb(...hsv.value))

  /** Foreground text color based on swatch luminance. */
  const swatchTextColor = computed(() => {
    const [r, g, b] = hexToRgb(displayHex.value)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return lum > 0.5 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)'
  })

  // ── API state ─────────────────────────────────────────────────────────────

  /** Most recently fetched color info from the API. */
  const colorInfo = ref<ColorInfoResponse | null>(null)

  /** Whether a color info request is in-flight. */
  const loading = ref(false)

  /** Error message from a failed API request. */
  const error = ref<string | null>(null)

  /** Whether the hex was just copied. */
  const copied = ref(false)

  /** Name of the color space whose value was just copied. */
  const copiedSpace = ref<string | null>(null)

  // ── Contrast check state ──────────────────────────────────────────────────

  /** Hex of the second color for the contrast check panel. */
  const contrastHex = ref('FFFFFF')

  /** Most recently fetched contrast ratio data. */
  const contrastInfo = ref<ColorContrastCheckResponse | null>(null)

  /** Whether a contrast check request is in-flight. */
  const contrastLoading = ref(false)

  /** Whether the user has picked a comparison color at least once. */
  const contrastPicked = ref(false)

  /** Whether the comparison color picker popover is open. */
  const contrastPickerOpen = ref(false)

  /** Reference to the comparison swatch element (used to anchor the picker). */
  const contrastSwatchEl = ref<HTMLElement | null>(null)

  /** Bounding rect used to position the contrast picker popover. */
  const contrastAnchorRect = ref<DOMRect | null>(null)

  /** Foreground text color for the comparison swatch based on luminance. */
  const compareSwatchTextColor = computed(() => {
    const [r, g, b] = hexToRgb(contrastHex.value)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return lum > 0.5 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)'
  })

  /**
   * Open the contrast comparison ColorPicker, anchored to the comparison swatch.
   */
  function openContrastPicker() {
    contrastAnchorRect.value = contrastSwatchEl.value?.getBoundingClientRect() ?? null
    contrastPickerOpen.value = true
  }

  /**
   * Handle color updates from the contrast ColorPicker.
   * @param hex - New hex value from the picker.
   */
  function onContrastPickerUpdate(hex: string) {
    contrastHex.value = hex
    if (!contrastPicked.value) contrastPicked.value = true
  }

  // ── Derived display ───────────────────────────────────────────────────────

  /** Formatted label for the hero swatch. */
  const labelDisplay = computed(() => {
    if (!colorInfo.value) return ''
    const { closest_name, label_is_approximate } = colorInfo.value
    if (!closest_name) return ''
    return label_is_approximate ? `~${closest_name}` : closest_name
  })

  /** CSS color for the Bast score text/bar keyed to score thresholds. */
  const bastColor = computed(() => {
    const s = colorInfo.value?.bast_score ?? 0
    if (s < 30) return '#2a9d60'
    if (s < 60) return '#d4900a'
    if (s < 80) return '#d4600a'
    return '#c0392b'
  })

  /** Human-readable description of the Bast score. */
  const bastDescription = computed(() => {
    const s = colorInfo.value?.bast_score ?? 0
    if (s < 10) return 'Crystal clear — this colour has a well-known, unambiguous name.'
    if (s < 30) return 'Mostly nameable — sits close to a recognisable colour family.'
    if (s < 55) return 'Elusive — drifting between known categories, hard to pin down.'
    if (s < 75) return 'Genuinely ambiguous — no obvious name, lives in the in-between.'
    return 'Truly unnamed — no clear category, a colour of uncertain origin.'
  })

  /** Array of color space cards derived from the API response. */
  const colorSpaces = computed(() => {
    const c = colorInfo.value
    if (!c) return []
    return [
      { name: 'HEX', value: `#${c.normalized_hex.toUpperCase()}` },
      { name: 'RGB', value: `${c.rgb.r}  ${c.rgb.g}  ${c.rgb.b}` },
      { name: 'HSL', value: `${c.hsl.h.toFixed(1)}°  ${c.hsl.s.toFixed(1)}%  ${c.hsl.l.toFixed(1)}%` },
      { name: 'HSB', value: `${c.hsb.h.toFixed(1)}°  ${c.hsb.s.toFixed(1)}%  ${c.hsb.b.toFixed(1)}%` },
      { name: 'HWB', value: `${c.hwb.h.toFixed(1)}°  ${c.hwb.w.toFixed(1)}%  ${c.hwb.b.toFixed(1)}%` },
      { name: 'CMYK', value: `${c.cmyk.c.toFixed(1)}  ${c.cmyk.m.toFixed(1)}  ${c.cmyk.y.toFixed(1)}  ${c.cmyk.k.toFixed(1)}` },
      { name: 'LAB', value: `${c.lab.l.toFixed(2)}  ${c.lab.a.toFixed(2)}  ${c.lab.b.toFixed(2)}` },
      { name: 'LCH', value: `${c.lch.l.toFixed(2)}  ${c.lch.c.toFixed(2)}  ${c.lch.h.toFixed(2)}°` },
      { name: 'LUV', value: `${c.luv.l.toFixed(2)}  ${c.luv.u.toFixed(2)}  ${c.luv.v.toFixed(2)}` },
      { name: 'XYZ', value: `${c.xyz.x.toFixed(3)}  ${c.xyz.y.toFixed(3)}  ${c.xyz.z.toFixed(3)}` },
    ]
  })

  /** Pool of quotes used in the accessibility preview. */
  const sharkTaleQuotes = [
    "I'm the shark slayer!",
    'Whale Wash. You get the whale, we do the rest.',
    "I'm a vegetarian.",
    "Don't you EVER take the last meatball!",
    'Oscar, I am your father.',
    'Thank you, fish!',
    'I got jelly in my head.',
    'Man, it is good to be alive!',
    'I just wanna be somebody.',
    'Keep it real, keep it real.',
    'You are so beautiful!',
    'Sykes, you beautiful fish!',
    'Sorry, pop. Lenny had a little accident. He was born!',
    'You live in a billboard? And I thought I was crazy!',
    'You coming at me like that? You come at the O like that?',
    'No, I said "What, what?" as in "What, what?',
    'Well, for your information, I am the Sharkslayer.',
    "That's what I'm talking about!",
    "You're killing me, Smalls!",
    'Just keep swimming, keep swimming.',
    "I'm the best there ever was!",
    'Nobody does it better than Oscar.',
    'Stay in school, kids.',
    "Mama's gonna make it all better.",
    "That's not how we do things around here.",
    'You gotta believe in yourself!',
    "I didn't come this far to give up now.",
    "That's hot, that's hot.",
    'Angler fish? More like danger fish!',
    'Plankton power!',
    "I've got big dreams, baby.",
    'This is my moment!',
    "Don't mess with the coral.",
    'Jellyfish jam session!',
    'Living large in the reef!',
    "That's a wrap, my fins.",
    'You feel me?',
    "I'm on top of the world!",
    'Legends never die.',
    'Keep your head in the game.',
    "That's the way the cookie crumbles.",
    "I'm bout to blow up!",
    'Fame is a funny thing.',
    'Money talks, you know?',
    'Friends forever, no matter what.',
    "That's just how we roll.",
    "I'm living my best life.",
    'Dreams do come true!',
    'Never give up, never surrender.',
    "That's the real deal right there.",
    "You've got potential, kid.",
    'This is gonna be legendary.',
    "I'm ready for anything!",
    "That's the ticket!",
    'Keep shining, bright star.',
    "We're in this together, buddy.",
    "That's a certified banger right there.",
  ]

  /** Quote deterministically selected based on the current hex. */
  const currentQuote = computed(() => {
    const hex = colorInfo.value?.normalized_hex ?? displayHex.value
    const n = parseInt(hex.slice(0, 4), 16)
    return sharkTaleQuotes[n % sharkTaleQuotes.length] ?? ''
  })

  // ── API fetch logic ───────────────────────────────────────────────────────

  /** Debounce timer handle for the main color info fetch. */
  let fetchTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Fetch contrast ratio data for the current display hex vs contrastHex.
   */
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

  /**
   * Fetch full color information for a given hex string.
   * @param hex - 6-char uppercase hex without #.
   */
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

  /**
   * Debounce URL and API updates when the picker changes.
   * @param hex - New display hex.
   */
  function scheduleUpdate(hex: string) {
    if (fetchTimer) clearTimeout(fetchTimer)
    fetchTimer = setTimeout(() => {
      router.replace('/color/' + hex)
      fetchColorInfo(hex)
    }, 280)
  }

  /** Debounce timer handle for the contrast check fetch. */
  let contrastTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Debounce contrast check API calls when the contrast hex changes.
   */
  function scheduleContrastUpdate() {
    if (contrastTimer) clearTimeout(contrastTimer)
    contrastTimer = setTimeout(fetchContrastInfo, 300)
  }

  watch(displayHex, hex => {
    scheduleUpdate(hex)
  })

  watch(contrastHex, () => {
    if (contrastPicked.value) scheduleContrastUpdate()
  })

  watch(
    () => route.params.hex as string,
    raw => {
      const hex = normalizeHex(raw || '')
      if (hex !== displayHex.value) {
        hsv.value = rgbToHsv(...hexToRgb(hex))
        fetchColorInfo(hex)
      }
    },
  )

  onMounted(() => fetchColorInfo(initHex))

  // ── Picker drag and input handling ────────────────────────────────────────

  /** Reference to the 2D SV area element. */
  const areaEl = ref<HTMLElement | null>(null)

  /** Reference to the hue track element. */
  const hueEl = ref<HTMLElement | null>(null)

  /** Whether a drag on the 2D area is active. */
  let draggingArea = false

  /** Whether a drag on the hue slider is active. */
  let draggingHue = false

  /**
   * Begin a drag on the 2D SV area and update immediately.
   * @param e - Mouse or touch event from the picker area.
   */
  function startAreaDrag(e: MouseEvent | TouchEvent) {
    draggingArea = true
    updateArea(e)
  }

  /**
   * Begin a drag on the hue track and update immediately.
   * @param e - Mouse or touch event from the hue track.
   */
  function startHueDrag(e: MouseEvent | TouchEvent) {
    draggingHue = true
    updateHue(e)
  }

  /**
   * Update HSV from a pointer move within the SV area.
   * @param e - Mouse or touch event from the picker area.
   */
  function updateArea(e: MouseEvent | TouchEvent) {
    if (!areaEl.value) return
    const rect = areaEl.value.getBoundingClientRect()
    const cx = e instanceof MouseEvent ? e.clientX : e.touches[0]!.clientX
    const cy = e instanceof MouseEvent ? e.clientY : e.touches[0]!.clientY
    hsv.value = [
      hsv.value[0],
      Math.max(0, Math.min(1, (cx - rect.left) / rect.width)),
      Math.max(0, Math.min(1, 1 - (cy - rect.top) / rect.height)),
    ]
  }

  /**
   * Update hue from a pointer move within the hue track.
   * @param e - Mouse or touch event from the hue track.
   */
  function updateHue(e: MouseEvent | TouchEvent) {
    if (!hueEl.value) return
    const rect = hueEl.value.getBoundingClientRect()
    const cx = e instanceof MouseEvent ? e.clientX : e.touches[0]!.clientX
    hsv.value = [
      Math.max(0, Math.min(360, ((cx - rect.left) / rect.width) * 360)),
      hsv.value[1],
      hsv.value[2],
    ]
  }

  /**
   * Handle global pointer move events for the picker drag interactions.
   * @param e - Mouse or touch event from the window.
   */
  function onGlobalMove(e: MouseEvent | TouchEvent) {
    if (draggingArea) updateArea(e)
    else if (draggingHue) updateHue(e)
  }

  /**
   * End any active picker drag interactions.
   */
  function onGlobalUp() {
    draggingArea = false
    draggingHue = false
  }

  onMounted(() => {
    window.addEventListener('mousemove', onGlobalMove)
    window.addEventListener('mouseup', onGlobalUp)
    window.addEventListener('touchmove', onGlobalMove, { passive: false })
    window.addEventListener('touchend', onGlobalUp)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', onGlobalMove)
    window.removeEventListener('mouseup', onGlobalUp)
    window.removeEventListener('touchmove', onGlobalMove)
    window.removeEventListener('touchend', onGlobalUp)
  })

  /**
   * Update HSV when the hex input changes to a full 6-char value.
   * @param e - Input event from the hex field.
   */
  function onHexInput(e: Event) {
    const input = e.target as HTMLInputElement
    const raw = input.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase()
    if (input.value !== raw) input.value = raw
    if (raw.length === 6) hsv.value = rgbToHsv(...hexToRgb(raw))
  }

  /**
   * Normalize the hex input on blur and apply it to HSV state.
   * @param e - Blur event from the hex field.
   */
  function onHexBlur(e: Event) {
    const raw = normalizeHex((e.target as HTMLInputElement).value)
    hsv.value = rgbToHsv(...hexToRgb(raw))
  }

  /**
   * Update HSV from a RGB channel input.
   * @param ch - RGB channel index (0=R, 1=G, 2=B).
   * @param e - Input event from the number field.
   */
  function onRgbInput(ch: 0 | 1 | 2, e: Event) {
    const v = Math.max(0, Math.min(255, parseInt((e.target as HTMLInputElement).value) || 0))
    const r = [...pickerRgb.value] as RGB
    r[ch] = v
    hsv.value = rgbToHsv(...r)
  }

  /**
   * Apply an external hex value (e.g. from the 3D cube selector) to HSV state.
   * @param hex - Hex value with or without leading #.
   */
  function applyHex(hex: string) {
    const raw = normalizeHex(hex)
    hsv.value = rgbToHsv(...hexToRgb(raw))
  }

  /**
   * Copy the current hex to the clipboard and show a brief confirmation.
   */
  async function copyHex() {
    try {
      await navigator.clipboard.writeText('#' + displayHex.value)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 1500)
    } catch {}
  }

  /**
   * Copy a color space value to the clipboard and show a brief ✓.
   * @param sp - Color space entry from the colorSpaces list.
   */
  async function copySpace(sp: { name: string; value: string }) {
    try {
      await navigator.clipboard.writeText(sp.value)
      copiedSpace.value = sp.name
      setTimeout(() => {
        if (copiedSpace.value === sp.name) copiedSpace.value = null
      }, 1400)
    } catch {}
  }

  return {
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
    applyHex,
    copyHex,
    copySpace,
  }
}
