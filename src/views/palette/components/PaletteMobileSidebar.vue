<template>
  <Teleport to="body">
    <Transition name="sidebar-overlay">
      <div v-if="open" class="msb-overlay" @click="$emit('close')"></div>
    </Transition>
    <Transition name="sidebar-panel">
      <div v-if="open" class="msb-panel">
        <div class="msb-top">
          <span class="msb-title font-display">{{ t('palette.menu') }}</span>
          <button class="msb-close" @click="$emit('close')">
            <AppIcon name="x" :size="16" />
          </button>
        </div>

        <div class="msb-body">
          <div class="msb-section-label">{{ t('palette.branch') }}</div>
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
                {{ t('palette.mergeIntoMain') }}
              </button>
            </template>
          </div>

          <div v-if="snapshotCommitHint" class="msb-hint">{{ snapshotCommitHint }}</div>

          <div class="msb-divider"></div>

          <div class="msb-section-label">{{ t('palette.paletteSection') }}</div>
          <div class="msb-actions">
            <button
              v-if="isOwned"
              class="msb-action msb-action-primary"
              :disabled="isSaving || !hasUnsavedChanges"
              @click="$emit('requestSave'); $emit('close')"
            >
              <AppIcon name="download" :size="16" />
              {{ t('common.save') }}
            </button>
            <button v-if="isOwned" class="msb-action" @click="$emit('edit'); $emit('close')">
              <AppIcon name="edit" :size="15" />
              {{ t('palette.editPalette') }}
            </button>
            <button
              v-if="isOwned && !isNewPalette"
              class="msb-action msb-action-danger"
              @click="$emit('deletePalette'); $emit('close')"
            >
              <AppIcon name="trash" :size="16" />
              {{ t('common.delete') }}
            </button>
            <button
              v-if="!isOwned"
              class="msb-action msb-action-clone"
              @click="$emit('clonePalette'); $emit('close')"
            >
              <AppIcon name="clone" :size="16" />
              {{ t('palette.clonePalette') }}
            </button>

            <div class="msb-gen-group">
              <button class="msb-gen-main" @click="$emit('generate'); $emit('close')">
                <AppIcon name="sparkles" :size="14" />
                {{ t('palette.generate') }}
              </button>
              <button class="msb-gen-settings" @click="$emit('openGenerateSettings'); $emit('close')">
                <AppIcon name="settings" :size="12" />
              </button>
            </div>
            <button class="msb-action" @click="$emit('openImagePalette'); $emit('close')">
              <AppIcon name="image" :size="15" />
              {{ t('palette.paletteFromImage') }}
            </button>
            <button class="msb-action" @click="$emit('openExport'); $emit('close')">
              <AppIcon name="share" :size="15" />
              {{ t('palette.exportPalette') }}
            </button>
            <button class="msb-action" @click="$emit('openAccessibilityAudit'); $emit('close')">
              <AppIcon name="info-circle" :size="15" />
              {{ t('palette.accessibilityAudit') }}
            </button>
            <button class="msb-action" :class="{ 'msb-action-copy--copied': copyFeedback }" @click="$emit('copyPalette')">
              <AppIcon :name="copyFeedback ? 'check' : 'copy'" :size="14" />
              {{ t('palette.copyPaletteTitle') }}
            </button>
            <button class="msb-action" @click="$emit('pasteAdd'); $emit('close')">
              <AppIcon name="clipboard" :size="14" />
              {{ t('palette.pasteColorsAdd') }}
            </button>
            <button class="msb-action" @click="$emit('pasteReplace'); $emit('close')">
              <AppIcon name="clipboard" :size="14" />
              {{ t('palette.pasteColorsReplace') }}
            </button>
          </div>

          <div class="msb-divider"></div>

          <div class="msb-section-label">{{ t('palette.display') }}</div>
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
          <div class="msb-divider"></div>

          <div class="msb-section-label">{{ t('palette.help') }}</div>
          <div class="msb-actions">
            <button class="msb-action" @click="$emit('openHelpHistory'); $emit('close')">
              <AppIcon name="help-circle" :size="14" />
              {{ t('palette.history') }}
            </button>
            <button class="msb-action" @click="$emit('openHelpGeneration'); $emit('close')">
              <AppIcon name="help-circle" :size="14" />
              {{ t('palette.generation') }}
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
import { useI18n } from '@/i18n'

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
  (e: 'openExport'): void
  (e: 'edit'): void
  (e: 'openAccessibilityAudit'): void
}>()

const { t } = useI18n()
</script>

<style scoped src="./PaletteMobileSidebar.css"></style>
