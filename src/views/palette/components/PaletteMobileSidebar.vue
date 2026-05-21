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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
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
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M2.6 7.2l2.4 2.5 6.4-6.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
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
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M2.6 7.2l2.4 2.5 6.4-6.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
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
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v7M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              {{ isSaving ? 'Saving...' : 'Save snapshot' }}
            </button>
            <button v-if="isOwned" class="msb-action" @click="$emit('edit'); $emit('close')">
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 9.5L9.5 2.5l2 2-7 7H2.5v-2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                <path d="M8.8 3.2l2 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
              Edit palette
            </button>
            <button
              v-if="isOwned && !isNewPalette"
              class="msb-action msb-action-danger"
              @click="$emit('deletePalette'); $emit('close')"
            >
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M5.5 4V2.5h3V4M5 4l.5 8.5M7 4v8.5M9 4l-.5 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Delete palette
            </button>
            <button
              v-if="!isOwned"
              class="msb-action msb-action-clone"
              @click="$emit('clonePalette'); $emit('close')"
            >
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="4" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                <path d="M5 1h7a1 1 0 011 1v8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              Clone palette
            </button>

            <div class="msb-gen-group">
              <button class="msb-gen-main" @click="$emit('generate'); $emit('close')">
                <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 1.5l1.2 3.3L12 6l-3.3 1.2L7.5 10.5 6.3 7.2 3 6l3.3-1.2L7.5 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                  <path d="M12 10l.6 1.4L14 12l-1.4.6L12 14l-.6-1.4L10 12l1.4-.6L12 10z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>
                </svg>
                Generate
              </button>
              <button class="msb-gen-settings" @click="$emit('openGenerateSettings'); $emit('close')">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="1.8" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M6 1v1.2M6 9.8V11M1 6h1.2M9.8 6H11M2.2 2.2l.85.85M8.95 8.95l.85.85M9.8 2.2l-.85.85M3.05 8.95l-.85.85" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <button class="msb-action" @click="$emit('openImagePalette'); $emit('close')">
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                <rect x="1.4" y="2.2" width="11.2" height="9.6" rx="1.8" stroke="currentColor" stroke-width="1.3"/>
                <circle cx="4.6" cy="5.2" r="1" fill="currentColor"/>
                <path d="M2.8 10l2.8-2.4 1.9 1.6 1.8-1.5 2 2.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Palette from image
            </button>
            <button class="msb-action" @click="$emit('openExport'); $emit('close')">
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                <circle cx="3" cy="7" r="1.4" stroke="currentColor" stroke-width="1.2"/>
                <circle cx="10.8" cy="3" r="1.4" stroke="currentColor" stroke-width="1.2"/>
                <circle cx="10.8" cy="11" r="1.4" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4.2 6.2l5-2.3M4.2 7.8l5 2.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              Export palette
            </button>
            <button class="msb-action" :class="{ 'msb-action-copy--copied': copyFeedback }" @click="$emit('copyPalette')">
              <svg v-if="copyFeedback" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.6 7.2l2.4 2.5 6.4-6.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="4.2" y="3.2" width="7.2" height="8.6" rx="1.4" stroke="currentColor" stroke-width="1.2"/>
                <path d="M3.4 9.8H2.8A1.2 1.2 0 011.6 8.6V2.8A1.2 1.2 0 012.8 1.6h5.8A1.2 1.2 0 019.8 2.8v.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              Copy colors
            </button>
            <button class="msb-action" @click="$emit('pasteAdd'); $emit('close')">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9.8 2.4h.7A1.5 1.5 0 0112 3.9v7.7a1.5 1.5 0 01-1.5 1.5H4a1.5 1.5 0 01-1.5-1.5V3.9A1.5 1.5 0 014 2.4h.7" stroke="currentColor" stroke-width="1.2"/>
                <rect x="5.1" y="1.3" width="3.8" height="2.3" rx=".7" stroke="currentColor" stroke-width="1.2"/>
              </svg>
              Paste colors (add)
            </button>
            <button class="msb-action" @click="$emit('pasteReplace'); $emit('close')">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9.8 2.4h.7A1.5 1.5 0 0112 3.9v7.7a1.5 1.5 0 01-1.5 1.5H4a1.5 1.5 0 01-1.5-1.5V3.9A1.5 1.5 0 014 2.4h.7" stroke="currentColor" stroke-width="1.2"/>
                <rect x="5.1" y="1.3" width="3.8" height="2.3" rx=".7" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4.4 6.9h5.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
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
            <div class="msb-adjust-actions">
              <button class="msb-adjust-btn msb-adjust-btn--cancel" @click="emit('cancelAdjustments')">Cancel</button>
              <button class="msb-adjust-btn msb-adjust-btn--apply" @click="emit('applyAdjustments')">Apply</button>
            </div>
          </div>

          <div class="msb-divider"></div>

          <div class="msb-section-label">Help</div>
          <div class="msb-actions">
            <button class="msb-action" @click="$emit('openHelpHistory'); $emit('close')">
              <span class="msb-help-glyph">?</span>
              History
            </button>
            <button class="msb-action" @click="$emit('openHelpGeneration'); $emit('close')">
              <span class="msb-help-glyph">?</span>
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
import type { PaletteColorFormat, PaletteDisplaySettings } from '@/utils/paletteColorFormats'
import type { GlobalColorAdjustments } from '@/utils/paletteColorAdjustments'

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
}>()

function onSliderInput(key: keyof GlobalColorAdjustments, value: number): void {
  emit('startAdjustmentsSession')
  emit('updateAdjustments', { ...props.adjustments, [key]: value })
}
</script>

<style scoped src="./PaletteMobileSidebar.css"></style>
