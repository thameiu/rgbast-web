<template>
  <header class="pal-header" :class="{ 'focus-header': tutorialFocus === 'header' }">
    <!-- Left: back + title -->
    <div class="left-group">
      <button class="back-btn" @click="$emit('back')" :title="t('palette.back')">
        <AppIcon name="arrow-left" :size="16" />
      </button>
      <div class="divider"></div>
      <div class="palette-title-wrap">
        <button class="palette-name" title="Palette information" @click="$emit('openPaletteInfo')">
          {{ paletteTitle }}
        </button>
        <button
          v-if="ownerUsername"
          class="palette-owner-link"
          :class="{ 'palette-owner-link--disabled': !ownerProfileClickable }"
          :disabled="!ownerProfileClickable"
          @click.stop="$emit('openOwnerProfile')"
        >
          by {{ ownerUsername }}
        </button>
      </div>
    </div>

    <!-- Center: branch selector (desktop) -->
    <div class="center-group">
      <span
        v-if="isOwned && hasUnsavedChanges"
        class="unsaved-dot"
        :title="t('palette.unsavedChanges')"
      ></span>
      <div
        class="branch-selector"
        :class="{ open: branchOpen, 'focus-ring': tutorialFocus === 'branches' }"
        @click="branchOpen = !branchOpen"
      >
        <AppIcon class="branch-icon" name="git-branch" :size="15" />
        <span class="branch-name">{{ currentBranch }}</span>
        <AppIcon class="chevron" name="chevron-down" :size="10" :class="{ rotated: branchOpen }" />
      </div>

      <Teleport to="body">
        <div v-if="branchOpen" class="branch-dropdown-overlay" @click="branchOpen = false"></div>
        <div v-if="branchOpen" class="branch-dropdown" :style="dropdownStyle">
          <button
            class="branch-opt"
            :class="{ active: currentBranchId === null }"
            @click="selectBranch(null, 'main')"
          >
            <span class="branch-dot main-dot"></span>
            main
            <span v-if="currentBranchId === null" class="active-check" aria-hidden="true">
              <AppIcon name="check" :size="12" />
            </span>
          </button>
          <template v-for="br in activeBranches" :key="br.id">
            <button
              class="branch-opt"
              :class="{ active: currentBranchId === br.id }"
              @click="selectBranch(br.id, br.title)"
            >
              <span class="branch-dot" :style="{ background: branchColor(br.id) }"></span>
              {{ br.title }}
              <span v-if="currentBranchId === br.id" class="active-check" aria-hidden="true">
                <AppIcon name="check" :size="12" />
              </span>
            </button>
            <button
              v-if="currentBranchId === br.id"
              class="merge-inline-btn"
              @click.stop="$emit('merge', br.id); branchOpen = false"
            >
              ↩ {{ t('palette.mergeIntoMain') }}
            </button>
          </template>
        </div>
      </Teleport>
      <div ref="helpGroupEl" class="header-dropdown-group">
        <button
          class="help-split-btn"
          :class="{ open: helpMenuOpen }"
          :title="t('palette.help')"
          @click.stop="toggleHelpMenu"
        >
          <AppIcon name="help-circle" :size="14" />
          <AppIcon name="chevron-down" :size="10" />
        </button>
        <Transition name="header-dd">
          <div v-if="helpMenuOpen" class="header-dropdown-menu help-menu">
            <button class="header-menu-opt" @click="onHelpHistory">{{ t('palette.history') }}</button>
            <button class="header-menu-opt" @click="onHelpGeneration">{{ t('palette.generation') }}</button>
            <button class="header-menu-opt" @click="onHelpCheatSheet">
              {{ t('palette.cheatSheet') }}
              <span class="header-menu-kbd">H</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Right: actions (desktop) -->
    <div class="right-group">
      <button
        class="icon-action-btn"
        :class="{ 'icon-action-btn--copied': copyFeedback }"
        :title="t('palette.copyPaletteTitle')"
        @click="emit('copyPalette')"
      >
        <AppIcon :name="copyFeedback ? 'check' : 'copy'" :size="13" />
      </button>

      <div ref="pasteGroupEl" class="header-dropdown-group">
        <div class="paste-split-btn">
          <button
            class="icon-action-btn paste-main-btn"
            :title="t('palette.pasteAddTitle')"
            @click="emit('pasteAdd')"
          >
            <AppIcon name="clipboard" :size="13" />
          </button>
          <button
            class="paste-menu-toggle"
            :class="{ open: pasteMenuOpen }"
            :title="t('palette.pasteOptions')"
            @click.stop="togglePasteMenu"
          >
            <AppIcon name="chevron-down" :size="9" />
          </button>
        </div>
        <Transition name="header-dd">
          <div v-if="pasteMenuOpen" class="header-dropdown-menu paste-menu">
            <button class="header-menu-opt" @click="onPasteAddOption">
              {{ t('palette.addPastedColors') }}
              <span class="header-menu-kbd">Ctrl+V</span>
            </button>
            <button class="header-menu-opt" @click="onPasteReplaceOption">
              {{ t('palette.replaceAllColors') }}
              <span class="header-menu-kbd">Ctrl+Shift+V</span>
            </button>
          </div>
        </Transition>
      </div>

      <div ref="displayGroupEl" class="header-dropdown-group">
        <button
          class="icon-action-btn"
          :class="{ 'icon-action-btn--active': displayMenuOpen }"
          title="Display settings"
          @click.stop="toggleDisplayMenu"
        >
          <AppIcon name="sliders" :size="13" />
        </button>
        <Transition name="header-dd">
          <div v-if="displayMenuOpen" class="header-dropdown-menu display-menu">
            <p class="header-menu-title">{{ t('palette.displayValues') }}</p>
            <label class="header-check-opt">
              <input type="checkbox" :checked="displaySettings.hex" @change="emit('toggleDisplayFormat', 'hex')">
              <span>HEX</span>
            </label>
            <label class="header-check-opt">
              <input type="checkbox" :checked="displaySettings.rgb" @change="emit('toggleDisplayFormat', 'rgb')">
              <span>RGB</span>
            </label>
            <label class="header-check-opt">
              <input type="checkbox" :checked="displaySettings.hsl" @change="emit('toggleDisplayFormat', 'hsl')">
              <span>HSL</span>
            </label>
            <label class="header-check-opt">
              <input type="checkbox" :checked="displaySettings.cmyk" @change="emit('toggleDisplayFormat', 'cmyk')">
              <span>CMYK</span>
            </label>
            <div v-if="canChangeCopyFormat" class="header-menu-divider"></div>
            <template v-if="canChangeCopyFormat">
              <p class="header-menu-title">{{ t('palette.copyFullPaletteAs') }}</p>
              <div class="header-inline-options">
                <button class="header-chip-opt" :class="{ active: copyFormat === 'hex' }" @click="emit('setCopyFormat', 'hex')">HEX</button>
                <button class="header-chip-opt" :class="{ active: copyFormat === 'rgb' }" @click="emit('setCopyFormat', 'rgb')">RGB</button>
                <button class="header-chip-opt" :class="{ active: copyFormat === 'hsl' }" @click="emit('setCopyFormat', 'hsl')">HSL</button>
                <button class="header-chip-opt" :class="{ active: copyFormat === 'cmyk' }" @click="emit('setCopyFormat', 'cmyk')">CMYK</button>
              </div>
            </template>
            <div class="header-menu-divider"></div>
            <p class="header-menu-title">{{ t('palette.globalAdjustments') }}</p>
            <div class="header-adjustments">
              <label class="header-slider-row">
                <span class="header-slider-label">{{ t('palette.hue') }}</span>
                <input
                  class="header-slider header-slider--hue"
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  :value="adjustments.hue"
                  @input="onSliderInput('hue', Number(($event.target as HTMLInputElement).value))"
                />
                <span class="header-slider-value">{{ adjustments.hue }}</span>
              </label>
              <label class="header-slider-row">
                <span class="header-slider-label">{{ t('palette.saturation') }}</span>
                <input
                  class="header-slider header-slider--saturation"
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  :value="adjustments.saturation"
                  @input="onSliderInput('saturation', Number(($event.target as HTMLInputElement).value))"
                />
                <span class="header-slider-value">{{ adjustments.saturation }}</span>
              </label>
              <label class="header-slider-row">
                <span class="header-slider-label">{{ t('palette.temperature') }}</span>
                <input
                  class="header-slider header-slider--temperature"
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  :value="adjustments.temperature"
                  @input="onSliderInput('temperature', Number(($event.target as HTMLInputElement).value))"
                />
                <span class="header-slider-value">{{ adjustments.temperature }}</span>
              </label>
              <label class="header-slider-row">
                <span class="header-slider-label">{{ t('palette.luminosity') }}</span>
                <input
                  class="header-slider header-slider--luminosity"
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  :value="adjustments.luminosity"
                  @input="onSliderInput('luminosity', Number(($event.target as HTMLInputElement).value))"
                />
                <span class="header-slider-value">{{ adjustments.luminosity }}</span>
              </label>
              <div class="header-adjustments-vision">
                <span class="header-slider-label">{{ t('palette.daltonism') }}</span>
                <div class="header-inline-options">
                  <button class="header-chip-opt" :class="{ active: adjustments.daltonism === 'protanopia' }" @click="onDaltonismToggle('protanopia')">Protanopia</button>
                  <button class="header-chip-opt" :class="{ active: adjustments.daltonism === 'deuteranopia' }" @click="onDaltonismToggle('deuteranopia')">Deuteranopia</button>
                  <button class="header-chip-opt" :class="{ active: adjustments.daltonism === 'tritanopia' }" @click="onDaltonismToggle('tritanopia')">Tritanopia</button>
                </div>
              </div>
              <div class="header-adjustments-actions">
                <button class="header-adjust-btn header-adjust-btn--cancel" @click="onAdjustmentsCancel">{{ t('common.cancel') }}</button>
                <button class="header-adjust-btn header-adjust-btn--apply" @click="onAdjustmentsApply">{{ t('palette.apply') }}</button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
      <!-- Undo / Redo arrows -->
      <div class="undo-redo-group">
        <button
          class="undo-redo-btn"
          :disabled="!canUndo"
          title="Undo (Ctrl+Z)"
          @click="$emit('undo')"
        >
          <AppIcon name="undo" :size="13" />
        </button>
        <button
          class="undo-redo-btn"
          :disabled="!canRedo"
          title="Redo (Ctrl+Y)"
          @click="$emit('redo')"
        >
          <AppIcon name="redo" :size="13" />
        </button>
      </div>

      <!-- Generate split-button -->
      <div class="gen-btn-group">
        <button class="gen-instant-btn" @click="$emit('generate')" :title="t('palette.generatePaletteTitle')">
          <AppIcon name="sparkles" :size="13" />
          {{ t('palette.generate') }}
        </button>
        <button class="gen-settings-btn" @click="$emit('openGenerateSettings')" :title="t('palette.generateSettingsTitle')">
          <AppIcon name="settings" :size="12" />
        </button>
      </div>
      <button
        class="image-action-btn"
        :title="t('palette.imageExtractTitle')"
        @click="$emit('openImagePalette')"
      >
        <AppIcon name="image" :size="13" />
      </button>
      <button
        class="image-action-btn"
        :title="t('palette.exportPalette')"
        @click="$emit('openExport')"
      >
        <AppIcon name="share" :size="13" />
      </button>

      <button
        class="icon-action-btn"
        :title="t('palette.accessibilityAudit')"
        @click="$emit('openAccessibilityAudit')"
      >
        <AppIcon name="info-circle" :size="13" />
      </button>
      <button
        v-if="isOwned && canDelete"
        class="action-btn danger-icon"
        :title="t('common.delete')"
        @click="$emit('deletePalette')"
      >
        <AppIcon name="trash" :size="14" />
      </button>
      <button
        v-if="!isNewPalette"
        class="action-btn secondary"
        @click="$emit('toggleHistory')"
        :class="{ active: historyOpen, 'focus-ring': tutorialFocus === 'history' }"
      >
        <AppIcon name="history" :size="14" />
        {{ t('palette.history') }}
      </button>
      <button
        v-if="isOwned && !isNewPalette"
        class="action-btn secondary"
        :title="t('palette.editPalette')"
        @click="$emit('edit')"
      >
        <AppIcon name="edit" :size="14" />
        {{ t('palette.editPalette') }}
      </button>
      <button
        v-if="isOwned"
        class="action-btn primary"
        :disabled="isSaving || !hasUnsavedChanges"
        :class="{ 'focus-ring': tutorialFocus === 'save' }"
        @click="$emit('save')"
      >
        <AppIcon name="download" :size="14" />
        {{ t('common.save') }}
      </button>
      <button
        v-else
        class="action-btn clone"
        @click="$emit('clone')"
      >
        <AppIcon name="clone" :size="14" />
        {{ t('palette.clonePalette') }}
      </button>
    </div>

    <!-- Mobile right: unsaved indicator + undo/redo + history + hamburger -->
    <div class="mobile-right">
      <span v-if="isOwned && hasUnsavedChanges" class="unsaved-dot" :title="t('palette.unsavedChanges')"></span>
      <div class="mobile-nav-group">
        <button
          class="mobile-nav-btn"
          :disabled="!canUndo"
          title="Undo (Ctrl+Z)"
          @click="$emit('undo')"
        >
          <AppIcon name="undo" :size="13" />
        </button>
        <button
          class="mobile-nav-btn"
          :disabled="!canRedo"
          title="Redo (Ctrl+Y)"
          @click="$emit('redo')"
        >
          <AppIcon name="redo" :size="13" />
        </button>
      </div>
      <button
        v-if="!isNewPalette"
        class="history-mobile-btn"
        :class="{ active: historyOpen }"
        aria-label="Toggle history"
        @click="$emit('toggleHistory')"
      >
        <AppIcon name="history" :size="15" />
      </button>
      <div ref="mobileDisplayGroupEl" class="header-dropdown-group mobile-display-group">
        <button
          class="history-mobile-btn"
          :class="{ active: displayMenuOpen }"
          :title="t('palette.display')"
          @click.stop="toggleDisplayMenu"
        >
          <AppIcon name="sliders" :size="15" />
        </button>
        <Transition name="header-dd">
          <div v-if="displayMenuOpen" class="header-dropdown-menu display-menu mobile-display-menu">
            <p class="header-menu-title">{{ t('palette.globalAdjustments') }}</p>
            <div class="header-adjustments">
              <label class="header-slider-row">
                <span class="header-slider-label">{{ t('palette.hue') }}</span>
                <input
                  class="header-slider header-slider--hue"
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  :value="adjustments.hue"
                  @input="onSliderInput('hue', Number(($event.target as HTMLInputElement).value))"
                />
                <span class="header-slider-value">{{ adjustments.hue }}</span>
              </label>
              <label class="header-slider-row">
                <span class="header-slider-label">{{ t('palette.saturation') }}</span>
                <input
                  class="header-slider header-slider--saturation"
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  :value="adjustments.saturation"
                  @input="onSliderInput('saturation', Number(($event.target as HTMLInputElement).value))"
                />
                <span class="header-slider-value">{{ adjustments.saturation }}</span>
              </label>
              <label class="header-slider-row">
                <span class="header-slider-label">{{ t('palette.temperature') }}</span>
                <input
                  class="header-slider header-slider--temperature"
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  :value="adjustments.temperature"
                  @input="onSliderInput('temperature', Number(($event.target as HTMLInputElement).value))"
                />
                <span class="header-slider-value">{{ adjustments.temperature }}</span>
              </label>
              <label class="header-slider-row">
                <span class="header-slider-label">{{ t('palette.luminosity') }}</span>
                <input
                  class="header-slider header-slider--luminosity"
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  :value="adjustments.luminosity"
                  @input="onSliderInput('luminosity', Number(($event.target as HTMLInputElement).value))"
                />
                <span class="header-slider-value">{{ adjustments.luminosity }}</span>
              </label>
              <div class="header-adjustments-vision">
                <span class="header-slider-label">{{ t('palette.daltonism') }}</span>
                <div class="header-inline-options">
                  <button class="header-chip-opt" :class="{ active: adjustments.daltonism === 'protanopia' }" @click="onDaltonismToggle('protanopia')">Protanopia</button>
                  <button class="header-chip-opt" :class="{ active: adjustments.daltonism === 'deuteranopia' }" @click="onDaltonismToggle('deuteranopia')">Deuteranopia</button>
                  <button class="header-chip-opt" :class="{ active: adjustments.daltonism === 'tritanopia' }" @click="onDaltonismToggle('tritanopia')">Tritanopia</button>
                </div>
              </div>
              <div class="header-adjustments-actions">
                <button class="header-adjust-btn header-adjust-btn--cancel" @click="onAdjustmentsCancel">{{ t('common.cancel') }}</button>
                <button class="header-adjust-btn header-adjust-btn--apply" @click="onAdjustmentsApply">{{ t('palette.apply') }}</button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
      <button
        class="hamburger-btn"
        :class="{ open: mobileMenuOpen }"
        :aria-expanded="mobileMenuOpen"
        :aria-label="t('palette.openMenu')"
        @click="$emit('hamburgerClick')"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

  </header>
</template>

<script setup lang="ts">
/**
 * PaletteAppHeader - Fixed top bar for the palette editor.
 * Shows back button, palette title, branch selector (desktop), undo/redo,
 * history toggle, generate split-button, and save/clone action.
 * On mobile the center and right groups are hidden; a compact mobile-right
 * group is shown instead (undo/redo controls, history, and hamburger).
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { getBranchColor } from '@/utils/branchColors'
import type { PaletteColorFormat, PaletteDisplaySettings } from '@/utils/paletteColorFormats'
import type { GlobalColorAdjustments } from '@/utils/paletteColorAdjustments'
import { useI18n } from '@/i18n'

type AdjustmentSliderKey = 'hue' | 'saturation' | 'temperature' | 'luminosity'

const props = defineProps<{
  /** Display name for the current palette. */
  paletteTitle: string
  /** Owner username displayed next to the palette title. */
  ownerUsername?: string | null
  /** Whether owner link should be clickable. */
  ownerProfileClickable?: boolean
  /** Name of the currently-active branch. */
  currentBranch: string
  /** ID of the currently-active branch, or null for main. */
  currentBranchId: number | null
  /** All branches for the palette. */
  branches: Array<{ id: number; title: string; is_merged: boolean }>
  /** Whether there are unsaved local changes. */
  hasUnsavedChanges: boolean
  /** Whether this is a draft/new palette route. */
  isNewPalette?: boolean
  /** Whether a save request is in-flight. */
  isSaving: boolean
  /** Whether the history panel is currently open. */
  historyOpen: boolean
  /** Whether the current user owns the palette. */
  isOwned?: boolean
  /** Whether the delete-palette action is available. */
  canDelete?: boolean
  /** Which element the tutorial spotlight should highlight. */
  tutorialFocus?: 'header' | 'branches' | 'save' | 'history' | null
  /** Whether the mobile side-menu is open. */
  mobileMenuOpen?: boolean
  /** Whether there is a state available to undo. */
  canUndo?: boolean
  /** Whether there is a state available to redo. */
  canRedo?: boolean
  /** Whether copy feedback is active. */
  copyFeedback?: boolean
  /** Local display toggles for color formats. */
  displaySettings: PaletteDisplaySettings
  /** Active format used by full-palette copy. */
  copyFormat: PaletteColorFormat
  /** Whether the copy format selector should be visible. */
  canChangeCopyFormat?: boolean
  /** Current global color adjustments preview values. */
  adjustments: GlobalColorAdjustments
}>()

const emit = defineEmits<{
  back: []
  save: []
  clone: []
  branchChange: [id: number | null]
  toggleHistory: []
  merge: [branchId: number]
  deletePalette: []
  edit: []
  openTutorial: []
  openHelpHistory: []
  openHelpGeneration: []
  openHelpCheatSheet: []
  copyPalette: []
  pasteAdd: []
  pasteReplace: []
  toggleDisplayFormat: [format: PaletteColorFormat]
  setCopyFormat: [format: PaletteColorFormat]
  startAdjustmentsSession: []
  updateAdjustments: [value: GlobalColorAdjustments]
  applyAdjustments: []
  cancelAdjustments: []
  hamburgerClick: []
  generate: []
  openGenerateSettings: []
  openImagePalette: []
  openExport: []
  undo: []
  redo: []
  openOwnerProfile: []
  openPaletteInfo: []
  openAccessibilityAudit: []
}>()

const { t } = useI18n()

/** Whether the branch dropdown flyout is open. */
const branchOpen = ref(false)
const pasteMenuOpen = ref(false)
const helpMenuOpen = ref(false)
const displayMenuOpen = ref(false)
const pasteGroupEl = ref<HTMLElement | null>(null)
const helpGroupEl = ref<HTMLElement | null>(null)
const displayGroupEl = ref<HTMLElement | null>(null)
const mobileDisplayGroupEl = ref<HTMLElement | null>(null)

/** Only non-merged branches shown in the selector. */
const activeBranches = computed(() => props.branches.filter(b => !b.is_merged))

/**
 * Returns the CSS color string for a branch dot based on its index.
 * @param id - Branch ID to look up.
 */
function branchColor(id: number) {
  const idx = props.branches.findIndex(b => b.id === id)
  return getBranchColor(idx >= 0 ? idx : 0)
}

/**
 * Emits a branchChange event and closes the dropdown.
 * @param id - Branch ID to switch to, or null for main.
 * @param _name - Branch name (unused, kept for call-site clarity).
 */
function selectBranch(id: number | null, _name: string) {
  emit('branchChange', id)
  branchOpen.value = false
}

/** Fixed-position style for the Teleported branch dropdown. */
const dropdownStyle = ref({
  position: 'fixed' as const,
  top: '58px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: '9999',
})

function onPasteAddOption(): void {
  emit('pasteAdd')
  pasteMenuOpen.value = false
}

function onPasteReplaceOption(): void {
  emit('pasteReplace')
  pasteMenuOpen.value = false
}

function togglePasteMenu(): void {
  pasteMenuOpen.value = !pasteMenuOpen.value
  if (pasteMenuOpen.value) {
    helpMenuOpen.value = false
    displayMenuOpen.value = false
  }
}

function onHelpHistory(): void {
  emit('openHelpHistory')
  helpMenuOpen.value = false
}

function onHelpGeneration(): void {
  emit('openHelpGeneration')
  helpMenuOpen.value = false
}

function onHelpCheatSheet(): void {
  emit('openHelpCheatSheet')
  helpMenuOpen.value = false
}

function toggleHelpMenu(): void {
  helpMenuOpen.value = !helpMenuOpen.value
  if (helpMenuOpen.value) {
    pasteMenuOpen.value = false
    displayMenuOpen.value = false
  }
}

function toggleDisplayMenu(): void {
  if (!displayMenuOpen.value) emit('startAdjustmentsSession')
  displayMenuOpen.value = !displayMenuOpen.value
  if (!displayMenuOpen.value) {
    emit('cancelAdjustments')
    return
  }
  if (displayMenuOpen.value) {
    helpMenuOpen.value = false
    pasteMenuOpen.value = false
  }
}

function onSliderInput(key: AdjustmentSliderKey, value: number): void {
  emit('updateAdjustments', { ...props.adjustments, [key]: value })
}

function onDaltonismToggle(mode: GlobalColorAdjustments['daltonism']): void {
  emit('updateAdjustments', {
    ...props.adjustments,
    daltonism: props.adjustments.daltonism === mode ? 'none' : mode,
  })
}

function onAdjustmentsCancel(): void {
  emit('cancelAdjustments')
  displayMenuOpen.value = false
}

function onAdjustmentsApply(): void {
  emit('applyAdjustments')
  displayMenuOpen.value = false
}

function onDocumentPointerDown(event: Event): void {
  const target = event.target as Node | null
  if (pasteMenuOpen.value && pasteGroupEl.value && target && !pasteGroupEl.value.contains(target)) {
    pasteMenuOpen.value = false
  }
  if (helpMenuOpen.value && helpGroupEl.value && target && !helpGroupEl.value.contains(target)) {
    helpMenuOpen.value = false
  }
  const insideDesktopDisplay = displayGroupEl.value && target && displayGroupEl.value.contains(target)
  const insideMobileDisplay = mobileDisplayGroupEl.value && target && mobileDisplayGroupEl.value.contains(target)
  if (displayMenuOpen.value && target && !insideDesktopDisplay && !insideMobileDisplay) {
    emit('cancelAdjustments')
    displayMenuOpen.value = false
  }
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    pasteMenuOpen.value = false
    helpMenuOpen.value = false
    if (displayMenuOpen.value) {
      emit('cancelAdjustments')
    }
    displayMenuOpen.value = false
  }
}

function onToggleDisplayShortcut(): void {
  toggleDisplayMenu()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, { capture: true })
  document.addEventListener('keydown', onDocumentKeydown, { capture: true })
  window.addEventListener('palette-shortcut-toggle-display', onToggleDisplayShortcut)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, { capture: true })
  document.removeEventListener('keydown', onDocumentKeydown, { capture: true })
  window.removeEventListener('palette-shortcut-toggle-display', onToggleDisplayShortcut)
})
</script>

<style src="./PaletteAppHeader.css" scoped></style>
