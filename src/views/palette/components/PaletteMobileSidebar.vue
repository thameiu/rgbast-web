<template>
  <Teleport to="body">
    <Transition name="sidebar-overlay">
      <div v-if="open" class="msb-overlay" @click="$emit('close')"></div>
    </Transition>
    <Transition name="sidebar-panel">
      <div v-if="open" class="msb-panel">
        <div class="msb-top">
          <span class="msb-title font-display">Menu</span>
          <button class="msb-close" @click="$emit('close')">
            <AppIcon name="x" :size="16" />
          </button>
        </div>

        <div class="msb-body">
          <div class="msb-section-label">Branch</div>
          <div class="msb-branches">
            <button
              class="msb-branch-opt"
              :class="{ active: currentBranchId === null }"
              @click="$emit('switchBranch', null); $emit('close')"
            >
              <span class="msb-dot msb-dot-main"></span>
              <span class="msb-branch-name">main</span>
              <span v-if="currentBranchId === null" class="msb-branch-check" aria-hidden="true">
                <AppIcon name="check" :size="12" />
              </span>
            </button>
            <template v-for="(br, idx) in activeBranches" :key="br.id">
              <button
                class="msb-branch-opt"
                :class="{ active: currentBranchId === br.id }"
                @click="$emit('switchBranch', br.id); $emit('close')"
              >
                <span class="msb-dot" :style="{ background: branchColor(idx) }"></span>
                <span class="msb-branch-name">{{ br.title }}</span>
                <span v-if="currentBranchId === br.id" class="msb-branch-check" aria-hidden="true">
                  <AppIcon name="check" :size="12" />
                </span>
              </button>
              <button
                v-if="currentBranchId === br.id"
                class="msb-merge-btn"
                @click.stop="$emit('merge', br.id); $emit('close')"
              >
                Merge into main
              </button>
            </template>
          </div>

          <div v-if="snapshotCommitHint" class="msb-hint">{{ snapshotCommitHint }}</div>

          <div class="msb-divider"></div>

          <div class="msb-section-label">Palette</div>
          <div class="msb-actions">
            <button
              v-if="isOwned"
              class="msb-action msb-action-primary"
              :disabled="isSaving || !hasUnsavedChanges"
              @click="$emit('requestSave'); $emit('close')"
            >
              <AppIcon name="download" :size="16" />
              {{ isSaving ? 'Saving...' : 'Save snapshot' }}
            </button>
            <button v-if="isOwned" class="msb-action" @click="$emit('edit'); $emit('close')">
              <AppIcon name="edit" :size="15" />
              Edit palette
            </button>
            <button
              v-if="isOwned && !isNewPalette"
              class="msb-action msb-action-danger"
              @click="$emit('deletePalette'); $emit('close')"
            >
              <AppIcon name="trash" :size="16" />
              Delete palette
            </button>
            <button
              v-if="!isOwned"
              class="msb-action msb-action-clone"
              @click="$emit('clonePalette'); $emit('close')"
            >
              <AppIcon name="clone" :size="16" />
              Clone palette
            </button>

            <div class="msb-gen-group">
              <button class="msb-gen-main" @click="$emit('generate'); $emit('close')">
                <AppIcon name="sparkles" :size="14" />
                Generate
              </button>
              <button class="msb-gen-settings" @click="$emit('openGenerateSettings'); $emit('close')">
                <AppIcon name="settings" :size="12" />
              </button>
            </div>
            <button class="msb-action" @click="$emit('openImagePalette'); $emit('close')">
              <AppIcon name="image" :size="15" />
              Palette from image
            </button>
            <button class="msb-action" @click="$emit('openExport'); $emit('close')">
              <AppIcon name="share" :size="15" />
              Export palette
            </button>
            <button class="msb-action" @click="$emit('openAccessibilityAudit'); $emit('close')">
              <AppIcon name="search" :size="15" />
              Accessibility audit
            </button>
            <button class="msb-action" :class="{ 'msb-action-copy--copied': copyFeedback }" @click="$emit('copyPalette')">
              <AppIcon :name="copyFeedback ? 'check' : 'copy'" :size="14" />
              Copy colors
            </button>
            <button class="msb-action" @click="$emit('pasteAdd'); $emit('close')">
              <AppIcon name="clipboard" :size="14" />
              Paste colors (add)
            </button>
            <button class="msb-action" @click="$emit('pasteReplace'); $emit('close')">
              <AppIcon name="clipboard" :size="14" />
              Paste colors (replace)
            </button>
          </div>

          <div class="msb-divider"></div>

          <div class="msb-section-label">Display</div>
          <div class="msb-display-list">
            <label class="msb-check">
              <input type="checkbox" :checked="displaySettings.hex" @change="$emit('toggleDisplayFormat', 'hex')">
              <span>HEX</span>
            </label>
            <label class="msb-check">
              <input type="checkbox" :checked="displaySettings.rgb" @change="$emit('toggleDisplayFormat', 'rgb')">
              <span>RGB</span>
            </label>
            <label class="msb-check">
              <input type="checkbox" :checked="displaySettings.hsl" @change="$emit('toggleDisplayFormat', 'hsl')">
              <span>HSL</span>
            </label>
            <label class="msb-check">
              <input type="checkbox" :checked="displaySettings.cmyk" @change="$emit('toggleDisplayFormat', 'cmyk')">
              <span>CMYK</span>
            </label>
          </div>
          <div class="msb-display-adjustments">
            <div class="msb-display-adjust-title">Global adjustments</div>
            <label class="msb-slider-row">
              <span class="msb-slider-label">Hue</span>
              <input
                class="msb-slider msb-slider--hue"
                type="range"
                min="-180"
                max="180"
                step="1"
                :value="adjustments.hue"
                @input="onSliderInput('hue', Number(($event.target as HTMLInputElement).value))"
              >
              <span class="msb-slider-value">{{ adjustments.hue }}</span>
            </label>
            <label class="msb-slider-row">
              <span class="msb-slider-label">Saturation</span>
              <input
                class="msb-slider msb-slider--saturation"
                type="range"
                min="-100"
                max="100"
                step="1"
                :value="adjustments.saturation"
                @input="onSliderInput('saturation', Number(($event.target as HTMLInputElement).value))"
              >
              <span class="msb-slider-value">{{ adjustments.saturation }}</span>
            </label>
            <label class="msb-slider-row">
              <span class="msb-slider-label">Temperature</span>
              <input
                class="msb-slider msb-slider--temperature"
                type="range"
                min="-100"
                max="100"
                step="1"
                :value="adjustments.temperature"
                @input="onSliderInput('temperature', Number(($event.target as HTMLInputElement).value))"
              >
              <span class="msb-slider-value">{{ adjustments.temperature }}</span>
            </label>
            <label class="msb-slider-row">
              <span class="msb-slider-label">Luminosity</span>
              <input
                class="msb-slider msb-slider--luminosity"
                type="range"
                min="-100"
                max="100"
                step="1"
                :value="adjustments.luminosity"
                @input="onSliderInput('luminosity', Number(($event.target as HTMLInputElement).value))"
              >
              <span class="msb-slider-value">{{ adjustments.luminosity }}</span>
            </label>
            <div class="msb-vision-block">
              <div class="msb-display-adjust-title">Daltonism</div>
              <div class="msb-vision-options">
                <button class="msb-adjust-btn" :class="{ 'msb-adjust-btn--apply': adjustments.daltonism === 'protanopia' }" @click="onDaltonismToggle('protanopia')">Protanopia</button>
                <button class="msb-adjust-btn" :class="{ 'msb-adjust-btn--apply': adjustments.daltonism === 'deuteranopia' }" @click="onDaltonismToggle('deuteranopia')">Deuteranopia</button>
                <button class="msb-adjust-btn" :class="{ 'msb-adjust-btn--apply': adjustments.daltonism === 'tritanopia' }" @click="onDaltonismToggle('tritanopia')">Tritanopia</button>
              </div>
            </div>
            <div class="msb-adjust-actions">
              <button class="msb-adjust-btn msb-adjust-btn--cancel" @click="emit('cancelAdjustments')">Cancel</button>
              <button class="msb-adjust-btn msb-adjust-btn--apply" @click="emit('applyAdjustments')">Apply</button>
            </div>
          </div>

          <div class="msb-divider"></div>

          <div class="msb-section-label">Help</div>
          <div class="msb-actions">
            <button class="msb-action" @click="$emit('openHelpHistory'); $emit('close')">
              <AppIcon name="help-circle" :size="14" />
              History
            </button>
            <button class="msb-action" @click="$emit('openHelpGeneration'); $emit('close')">
              <AppIcon name="help-circle" :size="14" />
              Generation
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// PaletteMobileSidebar component: renders the mobile action sidebar for PaletteView.
import AppIcon from '@/components/icons/AppIcon.vue'
import type { PaletteColorFormat, PaletteDisplaySettings } from '@/utils/paletteColorFormats'
import type { GlobalColorAdjustments } from '@/utils/paletteColorAdjustments'

type AdjustmentSliderKey = 'hue' | 'saturation' | 'temperature' | 'luminosity'

const props = defineProps<{
  open: boolean
  currentBranchId: number | null
  activeBranches: Array<{ id: number; title: string; is_merged: boolean }>
  branchColor: (idx: number) => string
  snapshotCommitHint: string | null
  isOwned: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
  isNewPalette: boolean
  copyFeedback?: boolean
  displaySettings: PaletteDisplaySettings
  adjustments: GlobalColorAdjustments
}>()

// Emits: close sidebar and action events triggered from the menu.
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'switchBranch', id: number | null): void
  (e: 'merge', id: number): void
  (e: 'openHelpHistory'): void
  (e: 'openHelpGeneration'): void
  (e: 'openHelpCheatSheet'): void
  (e: 'copyPalette'): void
  (e: 'pasteAdd'): void
  (e: 'pasteReplace'): void
  (e: 'toggleDisplayFormat', format: PaletteColorFormat): void
  (e: 'requestSave'): void
  (e: 'clonePalette'): void
  (e: 'deletePalette'): void
  (e: 'generate'): void
  (e: 'openGenerateSettings'): void
  (e: 'openImagePalette'): void
  (e: 'startAdjustmentsSession'): void
  (e: 'updateAdjustments', value: GlobalColorAdjustments): void
  (e: 'cancelAdjustments'): void
  (e: 'applyAdjustments'): void
  (e: 'openExport'): void
  (e: 'edit'): void
  (e: 'openAccessibilityAudit'): void
}>()

function onSliderInput(key: AdjustmentSliderKey, value: number): void {
  emit('startAdjustmentsSession')
  emit('updateAdjustments', { ...props.adjustments, [key]: value })
}

function onDaltonismToggle(mode: GlobalColorAdjustments['daltonism']): void {
  emit('startAdjustmentsSession')
  emit('updateAdjustments', {
    ...props.adjustments,
    daltonism: props.adjustments.daltonism === mode ? 'none' : mode,
  })
}
</script>

<style scoped src="./PaletteMobileSidebar.css"></style>
