<template>
  <div class="palette-view">
    <PaletteAppHeader
      :paletteTitle="ctx.paletteTitle.value"
      :ownerUsername="ctx.isNewPalette.value ? null : (ctx.history.value?.owner_username ?? ctx.username.value)"
      :ownerProfileClickable="!ctx.isNewPalette.value"
      :currentBranch="ctx.currentBranchName.value"
      :currentBranchId="ctx.currentBranchId.value"
      :branches="ctx.allBranches.value"
      :hasUnsavedChanges="ctx.hasUnsavedChanges.value"
      :isSaving="save.isSaving.value"
      :historyOpen="ctx.historyOpen.value"
      :isOwned="ctx.isOwned.value"
      :isNewPalette="ctx.isNewPalette.value"
      :canDelete="ctx.isOwned.value && !ctx.isNewPalette.value"
      :tutorialFocus="tutorial.headerTutorialFocus.value"
      :mobileMenuOpen="ctx.mobileSidebarOpen.value"
      :canUndo="undo.canUndo.value"
      :canRedo="undo.canRedo.value"
      :copyFeedback="copyFeedbackActive"
      :displaySettings="displaySettings"
      :copyFormat="copyFormat"
      :adjustments="globalAdjustments"
      :canChangeCopyFormat="!isMobileViewport"
      @back="goBackOrDashboard"
      @save="save.requestSave"
      @clone="ctx.clonePalette"
      @branchChange="switchBranchWithUndo"
      @toggleHistory="ctx.historyOpen.value = !ctx.historyOpen.value"
      @merge="save.confirmMerge"
      @deletePalette="save.showDeletePaletteModal.value = true"
      @edit="save.openEditPalette"
      @openHelpHistory="openHistoryHelp"
      @openHelpGeneration="openGenerationHelp"
      @openHelpCheatSheet="openCheatSheetHelp"
      @copyPalette="copyPaletteColors"
      @pasteAdd="pasteAddFromClipboard"
      @pasteReplace="pasteReplaceFromClipboard"
      @toggleDisplayFormat="toggleDisplayFormat"
      @setCopyFormat="setCopyFormat"
      @hamburgerClick="ctx.mobileSidebarOpen.value = !ctx.mobileSidebarOpen.value"
      @generate="generator.doGenerate"
      @openGenerateSettings="generator.generateOpen.value = true"
      @undo="undo.doUndo"
      @redo="undo.doRedo"
      @openImagePalette="openImagePaletteModal"
      @openExport="openExportModal"
      @startAdjustmentsSession="startAdjustmentsSession"
      @updateAdjustments="onAdjustmentsChange"
      @cancelAdjustments="cancelAdjustments"
      @applyAdjustments="applyAdjustments"
      @openOwnerProfile="openOwnerProfile"
      @openPaletteInfo="openPaletteInfoModal"
      @openAccessibilityAudit="openAccessibilityAuditModal"
    />

    <div v-if="ctx.loading.value" class="loading-screen">
      <AppLoader message="Loading palette..." textTone="light" />
    </div>

    <div v-else-if="ctx.error.value" class="error-screen">
      <p>{{ ctx.error.value }}</p>
      <button @click="goBackOrDashboard">&lt;- Go back</button>
    </div>

    <div v-else class="editor-shell" :class="{ 'history-open': ctx.historyOpen.value, 'has-banner': ctx.showSnapshotBanner.value }">
      <PaletteSnapshotBanner
        :show="ctx.showSnapshotBanner.value"
        :isOwned="ctx.isOwned.value"
        :ctx="ctx.selectedSnapshotCtx.value"
        :isSelectedLatestMainSnapshot="ctx.isSelectedLatestMainSnapshot.value"
        :revertableSnapshotCount="save.revertableSnapshotCount.value"
        @clear="clearSnapshotSelectionWithUndo"
        @revert="save.showRevertModal.value = true"
      />

      <PaletteColumnsArea
        :colors="ctx.colors.value"
        :draggedIdx="interactions.draggedIdx.value"
        :swapSourceIdx="interactions.swapSourceIdx.value"
        :showAddBtn="interactions.showAddBtn.value"
        :isTutorialFocus="tutorial.tutorialFocus.value === 'canvas'"
        :displaySettings="displaySettings"
        :setColsAreaEl="setColsAreaEl"
        :onColsMouseMove="interactions.onColsMouseMove"
        :getColStyle="interactions.getColStyle"
        @update:hex="interactions.updateHex"
        @update:label="interactions.updateLabel"
        @remove="interactions.removeColor"
        @dragStart="interactions.onDragStart"
        @swapTap="interactions.onSwapTap"
        @add="interactions.addColor"
        @mouseleave="interactions.hideAddButton"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @leave="onLeave"
      />

      <PaletteHistoryPanel
        :historyOpen="ctx.historyOpen.value"
        :isTutorialFocus="tutorial.tutorialFocus.value === 'history'"
        :historyForDisplay="tutorial.historyForDisplay.value"
        :selectedSnapshotId="ctx.selectedSnapshotId.value"
        :showDemoHistory="tutorial.showDemoHistory.value"
        :isOwned="ctx.isOwned.value"
        :revertableSnapshotCount="save.revertableSnapshotCount.value"
        @close="ctx.historyOpen.value = false"
        @selectSnapshot="historyActions.onHistorySelectSnapshot"
        @selectBranch="historyActions.onHistorySelectBranch"
        @deleteBranch="historyActions.onHistoryDeleteBranch"
        @revertSnapshot="historyActions.onHistoryRevertSnapshot"
      />
    </div>

    <PaletteSaveModal
      :open="ctx.showSaveModal.value"
      :isNewPalette="ctx.isNewPalette.value"
      :currentBranchId="ctx.currentBranchId.value"
      :currentBranchName="ctx.currentBranchName.value"
      :pendingTitle="ctx.pendingTitle.value"
      :pendingDescription="ctx.pendingDescription.value"
      :pendingFolderId="ctx.pendingFolderId.value"
      :folders="ctx.folders.value"
      :saveComment="save.saveComment.value"
      :saveError="save.saveError.value"
      :titleErrorMessage="saveTitleErrorMessage"
      :createNewBranch="save.createNewBranch.value"
      :newBranchName="save.newBranchName.value"
      :isSaving="save.isSaving.value"
      :selectedSnapshotCtx="ctx.selectedSnapshotCtx.value"
      :isSelectedLatestMainSnapshot="ctx.isSelectedLatestMainSnapshot.value"
      @close="ctx.showSaveModal.value = false"
      @save="save.doSave"
      @update:pendingTitle="ctx.pendingTitle.value = $event"
      @update:pendingDescription="ctx.pendingDescription.value = $event"
      @update:pendingFolderId="ctx.pendingFolderId.value = $event"
      @update:saveComment="save.saveComment.value = $event"
      @update:createNewBranch="save.createNewBranch.value = $event"
      @update:newBranchName="save.newBranchName.value = $event"
      @createFolder="handleCreateFolder"
    />

    <PaletteEditModal
      :open="save.showEditModal.value"
      :title="save.editTitle.value"
      :description="save.editDescription.value"
      :folderId="save.editFolderId.value"
      :folders="ctx.folders.value"
      :isSaving="save.isEditing.value"
      :error="save.editError.value"
      :titleErrorMessage="editTitleErrorMessage"
      @close="save.showEditModal.value = false"
      @save="save.doEditPalette"
      @update:title="save.editTitle.value = $event"
      @update:description="save.editDescription.value = $event"
      @update:folderId="save.editFolderId.value = $event"
      @createFolder="handleCreateFolder"
    />

    <AuthModal
      v-if="ctx.showAuthModal.value"
      @authenticated="save.onAuthenticated"
      @cancel="ctx.showAuthModal.value = false"
    />

    <PaletteMergeModal
      :open="save.mergeTargetId.value !== null"
      :mergeTargetName="save.mergeTargetName.value"
      :mergeError="save.mergeError.value"
      :isMerging="save.isMerging.value"
      @close="save.mergeTargetId.value = null"
      @confirm="save.doMerge"
    />

    <PaletteDeletePaletteModal
      :open="save.showDeletePaletteModal.value"
      :paletteTitle="ctx.paletteTitle.value"
      :deleteError="save.deletePaletteError.value"
      :isDeleting="save.isDeletingPalette.value"
      @close="save.showDeletePaletteModal.value = false"
      @confirm="save.doDeletePalette"
    />

    <PaletteDeleteBranchModal
      :open="save.deleteBranchTargetId.value !== null"
      :branchName="save.deleteBranchTargetName.value"
      :deleteError="save.deleteBranchError.value"
      :isDeleting="save.isDeletingBranch.value"
      @close="save.deleteBranchTargetId.value = null"
      @confirm="save.doDeleteBranch"
    />

    <PaletteRevertModal
      :open="save.showRevertModal.value"
      :revertTargetLabel="save.revertTargetLabel.value"
      :revertableSnapshotCount="save.revertableSnapshotCount.value"
      :revertError="save.revertError.value"
      :isReverting="save.isReverting.value"
      @close="save.showRevertModal.value = false"
      @confirm="save.doRevert"
    />

    <PaletteGenerateModal
      :open="generator.generateOpen.value"
      :generateLoading="generator.generateLoading.value"
      :generateError="generator.generateError.value"
      :genCount="generator.genCount.value"
      :genHarmony="generator.genHarmony.value"
      :genBaseColors="generator.genBaseColors.value"
      :genPaletteDropIdx="generator.genPaletteDropIdx.value"
      :genPaletteDropStyle="generator.genPaletteDropStyle.value"
      :genPickerOpenIdx="generator.genPickerOpenIdx.value"
      :genPickerAnchorRect="generator.genPickerAnchorRect.value"
      :colors="ctx.colors.value"
      :isValidHex="generator.isValidHex"
      :openGenPicker="generator.openGenPicker"
      :toggleGenPaletteDrop="generator.toggleGenPaletteDrop"
      :onBaseColorInput="generator.onBaseColorInput"
      :setBaseColor="generator.setBaseColor"
      :removeBaseColor="generator.removeBaseColor"
      :addBaseColor="generator.addBaseColor"
      :doGenerate="generator.doGenerate"
      :setGenPaletteDropIdx="setGenPaletteDropIdx"
      :setGenPickerOpenIdx="setGenPickerOpenIdx"
      :setGenPickerAnchorRect="setGenPickerAnchorRect"
      @close="generator.generateOpen.value = false"
      @update:genCount="generator.genCount.value = $event"
      @update:genHarmony="generator.genHarmony.value = $event as typeof generator.genHarmony.value"
    />

    <PaletteImageModal
      :open="imagePaletteOpen"
      :isLoading="imagePaletteLoading"
      :error="imagePaletteError"
      :count="imagePaletteCount"
      :file="imagePaletteFile"
      :fileName="imagePaletteFile?.name ?? ''"
      :extractedColors="imagePaletteExtractedColors"
      @close="closeImagePaletteModal"
      @update:count="imagePaletteCount = $event"
      @fileChange="onImagePaletteFileChange"
      @submit="extractPaletteFromImage"
      @toggleExtractedColor="toggleExtractedImageColor"
      @addExtractedColors="applyExtractedImageColors('add')"
      @replaceExtractedColors="applyExtractedImageColors('replace')"
    />

    <PaletteExportModal
      :open="exportModalOpen"
      :paletteTitle="ctx.paletteTitle.value"
      :colors="ctx.colors.value"
      :isSavedPalette="!ctx.isNewPalette.value"
      :shareUrl="sharePaletteUrl"
      @close="exportModalOpen = false"
    />

    <PaletteTutorialOverlay
      :show="tutorial.showTutorial.value"
      :tutorialFocus="tutorial.tutorialFocus.value"
      :tutorialCardClass="tutorial.tutorialCardClass.value"
      :tutorialStep="tutorial.tutorialStep.value"
      :tutorialSteps="tutorial.tutorialSteps.value"
      :currentTutorial="tutorial.currentTutorial.value"
      @close="tutorial.closeTutorial"
      @next="tutorial.nextTutorialStep"
      @prev="tutorial.prevTutorialStep"
    />
    <PaletteHelpModal
      :open="helpModalOpen"
      :mode="helpModalMode"
      @close="closeHelpModal"
      @openHistory="openHistoryHelpFromModal"
    />

    <PaletteAccessibilityModal
      :open="showAccessibilityAuditModal"
      :colors="ctx.colors.value"
      :selectedIndex="accessibilityAuditIndex"
      @close="closeAccessibilityAuditModal"
      @update:selectedIndex="setAccessibilityAuditIndex"
    />

    <Teleport to="body">
      <div v-if="showPaletteInfoModal" class="palette-info-overlay" @click.self="showPaletteInfoModal = false">
        <div class="palette-info-modal">
          <div class="palette-info-head">
            <p class="palette-info-title">{{ ctx.paletteTitle.value }}</p>
            <button class="palette-info-close" type="button" aria-label="Close palette information" @click="showPaletteInfoModal = false">
              <AppIcon name="x" :size="16" />
            </button>
          </div>
          <p v-if="ctx.history.value?.owner_username || ctx.username.value" class="palette-info-owner">
            by {{ ctx.history.value?.owner_username ?? ctx.username.value }}
          </p>
          <div class="palette-info-description">
            {{ (ctx.history.value?.description ?? ctx.pendingDescription.value)?.trim() || 'No description.' }}
          </div>
        </div>
      </div>
    </Teleport>

    <PaletteMobileSidebar
      :open="ctx.mobileSidebarOpen.value"
      :currentBranchId="ctx.currentBranchId.value"
      :activeBranches="ctx.mobileSidebarActiveBranches.value"
      :branchColor="ctx.mobileBranchColor"
      :snapshotCommitHint="ctx.snapshotCommitHint.value"
      :isOwned="ctx.isOwned.value"
      :isSaving="save.isSaving.value"
      :hasUnsavedChanges="ctx.hasUnsavedChanges.value"
      :isNewPalette="ctx.isNewPalette.value"
      :copyFeedback="copyFeedbackActive"
      :displaySettings="displaySettings"
      @close="closeMobileSidebar"
      @switchBranch="switchBranchWithUndo"
      @merge="save.confirmMerge"
      @openHelpHistory="openHistoryHelp"
      @openHelpGeneration="openGenerationHelp"
      @openHelpCheatSheet="openCheatSheetHelp"
      @copyPalette="copyPaletteColors"
      @pasteAdd="pasteAddFromClipboard"
      @pasteReplace="pasteReplaceFromClipboard"
      @toggleDisplayFormat="toggleDisplayFormat"
      @requestSave="save.requestSave"
      @clonePalette="ctx.clonePalette"
      @deletePalette="save.showDeletePaletteModal.value = true"
      @generate="generator.doGenerate"
      @openGenerateSettings="generator.generateOpen.value = true"
      @openImagePalette="openImagePaletteModal"
      @openExport="openExportModal"
      @edit="save.openEditPalette"
      @openAccessibilityAudit="openAccessibilityAuditModal"
    />

  </div>
</template>

<script setup lang="ts">
import PaletteAppHeader from '@/components/palette/PaletteAppHeader.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import AuthModal from '@/components/auth/AuthModal.vue'
import PaletteSnapshotBanner from './components/PaletteSnapshotBanner.vue'
import PaletteColumnsArea from './components/PaletteColumnsArea.vue'
import PaletteHistoryPanel from './components/PaletteHistoryPanel.vue'
import PaletteSaveModal from './components/modals/PaletteSaveModal.vue'
import PaletteEditModal from './components/modals/PaletteEditModal.vue'
import PaletteMergeModal from './components/modals/PaletteMergeModal.vue'
import PaletteDeletePaletteModal from './components/modals/PaletteDeletePaletteModal.vue'
import PaletteDeleteBranchModal from './components/modals/PaletteDeleteBranchModal.vue'
import PaletteRevertModal from './components/modals/PaletteRevertModal.vue'
import PaletteGenerateModal from './components/modals/PaletteGenerateModal.vue'
import PaletteImageModal from './components/modals/PaletteImageModal.vue'
import PaletteExportModal from './components/modals/PaletteExportModal.vue'
import PaletteTutorialOverlay from './components/PaletteTutorialOverlay.vue'
import PaletteMobileSidebar from './components/PaletteMobileSidebar.vue'
import PaletteHelpModal from './components/PaletteHelpModal.vue'
import PaletteAccessibilityModal from './components/PaletteAccessibilityModal.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import analyzeImage from 'rgbaster'
import { foldersApi } from '@/api/folders'
import { paletteDraftsApi } from '@/api/paletteDrafts'
import type { PaletteDraftHistorySnapshot } from '@/api/paletteDrafts'
import type { PaletteColorSave } from '@/api/types'
import { usePaletteContext } from './composables/usePaletteContext'
import { usePaletteUndo } from './composables/usePaletteUndo'
import type { HistorySnapshot } from './composables/usePaletteUndo'
import { usePaletteInteractions } from './composables/usePaletteInteractions'
import { usePaletteGenerator } from './composables/usePaletteGenerator'
import { usePaletteTutorial } from './composables/usePaletteTutorial'
import { usePaletteSave } from './composables/usePaletteSave'
import { usePaletteKeyboard } from './composables/usePaletteKeyboard'
import { usePaletteHistoryActions } from './composables/usePaletteHistoryActions'
import {
  DEFAULT_PALETTE_COPY_FORMAT,
  DEFAULT_PALETTE_DISPLAY_SETTINGS,
  formatHexByMode,
  parseColorsFromText,
} from '@/utils/paletteColorFormats'
import type { PaletteColorFormat, PaletteDisplaySettings } from '@/utils/paletteColorFormats'
import { getPaletteTitleError, MAX_PALETTE_COLORS } from '@/utils/paletteConstraints'
import { setPageSeo } from '@/utils/seo'
import {
  applyAdjustmentsToHex,
  isNeutralAdjustments,
  type GlobalColorAdjustments,
} from '@/utils/paletteColorAdjustments'
import { useI18n } from '@/i18n'

// PaletteView component: orchestrates the palette editor UI and feature modules.
const ctx = usePaletteContext()
const { t } = useI18n()

const undo = usePaletteUndo({
  colors: ctx.colors,
  selectedSnapshotId: ctx.selectedSnapshotId,
  currentBranchId: ctx.currentBranchId,
  savedColorsSig: ctx.savedColorsSig,
})

const interactions = usePaletteInteractions(
  { colors: ctx.colors, mkKey: ctx.mkKey },
  { captureForUndo: undo.captureForUndo },
)

const generator = usePaletteGenerator(
  { colors: ctx.colors, mkKey: ctx.mkKey },
  { captureForUndo: undo.captureForUndo },
)

const tutorial = usePaletteTutorial({
  history: ctx.history,
  historyOpen: ctx.historyOpen,
})

const save = usePaletteSave(ctx, {
  loadHistory: ctx.loadHistory,
  clearHistory: undo.clearHistory,
})

const IMAGE_MAX_BYTES = 10 * 1024 * 1024
const imagePaletteOpen = ref(false)
const imagePaletteLoading = ref(false)
const imagePaletteError = ref('')
const imagePaletteCount = ref(5)
const imagePaletteFile = ref<File | null>(null)
const imagePaletteExtractedColors = ref<Array<{ hex: string; count: number; selected: boolean }>>([])
const helpModalOpen = ref(false)
const helpModalMode = ref<'generation' | 'cheatsheet'>('cheatsheet')
const copyFeedbackActive = ref(false)
const exportModalOpen = ref(false)
let copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null
const DISPLAY_SETTINGS_KEY = 'rgbast_palette_display_settings_v1'
const COPY_FORMAT_KEY = 'rgbast_palette_copy_format_v1'
const displaySettings = ref<PaletteDisplaySettings>({ ...DEFAULT_PALETTE_DISPLAY_SETTINGS })
const copyFormat = ref<PaletteColorFormat>(DEFAULT_PALETTE_COPY_FORMAT)
const isMobileViewport = ref(false)
const showPaletteInfoModal = ref(false)
const globalAdjustments = ref<GlobalColorAdjustments>({
  hue: 0,
  saturation: 0,
  temperature: 0,
  luminosity: 0,
  daltonism: 'none',
})
const adjustmentsBaseColors = ref<Array<{ hex: string; label: string | null; _key: string }> | null>(null)
const showAccessibilityAuditModal = ref(false)
const accessibilityAuditIndex = ref(0)

const saveTitleErrorMessage = computed(() =>
  ctx.isNewPalette.value ? getPaletteTitleError(ctx.pendingTitle.value) : null,
)
const editTitleErrorMessage = computed(() =>
  save.showEditModal.value ? getPaletteTitleError(save.editTitle.value) : null,
)

const hydratedDraftKey = ref<string | null>(null)
const hydratingDraft = ref(false)

function getNavigationState(): Record<string, unknown> {
  if (typeof window === 'undefined') return {}
  const state = window.history.state
  return state && typeof state === 'object' ? (state as Record<string, unknown>) : {}
}

function goBackOrDashboard(): void {
  if (window.history.length > 1) {
    ctx.router.back()
    return
  }
  void ctx.router.push('/dashboard')
}

function toSaveColors(colors: Array<{ hex: string; label: string | null }>): PaletteColorSave[] {
  return colors.map(c => ({ hex: c.hex, label: c.label ?? null }))
}

function toDraftHistorySnapshot(snap: HistorySnapshot): PaletteDraftHistorySnapshot {
  return {
    colors: toSaveColors(snap.colors),
    selectedSnapshotId: snap.selectedSnapshotId,
    currentBranchId: snap.currentBranchId,
    savedColorsSig: snap.savedColorsSig,
  }
}

function fromDraftHistorySnapshot(snap: PaletteDraftHistorySnapshot): HistorySnapshot {
  return {
    colors: ctx.wrapColors(snap.colors),
    selectedSnapshotId: snap.selectedSnapshotId,
    currentBranchId: snap.currentBranchId,
    savedColorsSig: snap.savedColorsSig,
  }
}

function hydrateDraftIfReady(): void {
  if (ctx.loading.value) return
  const key = ctx.draftKey.value
  if (!key || hydratedDraftKey.value === key) return

  const draft = paletteDraftsApi.getDraft(key)
  hydratedDraftKey.value = key
  if (!draft) return

  hydratingDraft.value = true
  if (ctx.error.value) ctx.error.value = null
  if (!ctx.history.value && draft.paletteId !== null) {
    ctx.paletteId.value = draft.paletteId
  }
  ctx.colors.value = ctx.wrapColors(draft.colors)
  ctx.selectedSnapshotId.value = draft.selectedSnapshotId
  ctx.currentBranchId.value = draft.currentBranchId
  ctx.savedColorsSig.value = draft.savedColorsSig

  if (ctx.isNewPalette.value) {
    const navigationState = getNavigationState()
    const hasFolderPreset = navigationState.hasFolderPreset === true
    ctx.pendingTitle.value = draft.pendingTitle || ctx.pendingTitle.value
    ctx.pendingDescription.value = draft.pendingDescription
    ctx.pendingFolderId.value = hasFolderPreset
      ? (typeof navigationState.folderId === 'number' ? navigationState.folderId : null)
      : draft.pendingFolderId
  }

  undo.undoPast.value = draft.undoPast.map(fromDraftHistorySnapshot)
  undo.undoFuture.value = draft.undoFuture.map(fromDraftHistorySnapshot)
  hydratingDraft.value = false
}

function persistDraftIfNeeded(): void {
  if (save.isSaving.value) return
  if (hydratingDraft.value || ctx.loading.value) return
  const key = ctx.draftKey.value
  if (!key || !ctx.username.value) return
  if (hydratedDraftKey.value !== key) return

  if (!ctx.hasUnsavedChanges.value) {
    paletteDraftsApi.removeDraft(key)
    return
  }

  const isExisting = !ctx.isNewPalette.value && ctx.paletteId.value !== null
  const pendingFolderPath =
    ctx.pendingFolderId.value === null
      ? []
      : (ctx.folderOptions.value.find(f => f.id === ctx.pendingFolderId.value)?.label.split(' / ') ?? [])
  const folderPath = isExisting
    ? (ctx.history.value?.folder_path ?? ctx.folderPath.value)
    : pendingFolderPath

  paletteDraftsApi.saveDraft({
    key,
    mode: isExisting ? 'existing' : 'new',
    paletteId: isExisting ? ctx.paletteId.value : null,
    ownerUsername: ctx.username.value,
    palettePath: ctx.palettePath.value,
    paletteTitle: ctx.isNewPalette.value ? (ctx.pendingTitle.value.trim() || t('common.untitledDraft')) : ctx.paletteTitle.value,
    description: ctx.isNewPalette.value ? ctx.pendingDescription.value : (ctx.history.value?.description ?? ''),
    folderPath,
    pendingTitle: ctx.pendingTitle.value,
    pendingDescription: ctx.pendingDescription.value,
    pendingFolderId: ctx.pendingFolderId.value,
    linkPath: ctx.route.fullPath,
    colors: toSaveColors(ctx.colors.value),
    selectedSnapshotId: ctx.selectedSnapshotId.value,
    currentBranchId: ctx.currentBranchId.value,
    savedColorsSig: ctx.savedColorsSig.value,
    undoPast: undo.undoPast.value.map(toDraftHistorySnapshot),
    undoFuture: undo.undoFuture.value.map(toDraftHistorySnapshot),
    updatedAt: new Date().toISOString(),
  })
}

const historyActions = usePaletteHistoryActions({
  ctx,
  showDemoHistory: tutorial.showDemoHistory,
  captureForUndo: undo.captureForUndo,
  switchBranch: switchBranchWithUndo,
  onDeleteBranchRequest: save.onDeleteBranchRequest,
  revertableSnapshotCount: save.revertableSnapshotCount,
  showRevertModal: save.showRevertModal,
})

usePaletteKeyboard(
  { generateOpen: generator.generateOpen },
  {
    doUndo: undo.doUndo,
    doRedo: undo.doRedo,
    requestSave: save.requestSave,
    doGenerate: generator.doGenerate,
    openImagePalette: openImagePaletteModal,
    openEditPalette: openEditPaletteShortcut,
    deleteLastColor: deleteLastColorShortcut,
    deleteFirstColor: deleteFirstColorShortcut,
    openDeletePaletteModal: openDeletePaletteShortcut,
    historyLeft: openHistorySidebarShortcut,
    historyRight: openHistorySidebarShortcut,
    copyPalette: copyPaletteColors,
    pasteAddFromClipboard,
    pasteReplaceFromClipboard,
    openCheatSheet: openCheatSheetHelp,
    openShare: openExportModal,
    openAccessibilityAudit: openAccessibilityAuditModal,
    toggleDisplaySettings: toggleDisplaySettingsShortcut,
  },
)

// Sync the DOM ref from the columns area component into the interactions module.
function setColsAreaEl(el: HTMLElement | null): void {
  interactions.colsAreaEl.value = el
}

// Switch branches while capturing undo history in PaletteView.
function switchBranchWithUndo(id: number | null): void {
  undo.captureForUndo()
  void ctx.switchBranch(id)
}

// Clear snapshot selection while capturing undo history in PaletteView.
function clearSnapshotSelectionWithUndo(): void {
  undo.captureForUndo()
  ctx.clearSnapshotSelection()
}

// Update the generator palette dropdown index from the modal component.
function setGenPaletteDropIdx(value: number | null): void {
  generator.genPaletteDropIdx.value = value
}

function openImagePaletteModal(): void {
  imagePaletteOpen.value = true
  imagePaletteError.value = ''
}

function openExportModal(): void {
  exportModalOpen.value = true
}

function toggleDisplaySettingsShortcut(): void {
  window.dispatchEvent(new CustomEvent('palette-shortcut-toggle-display'))
}

function startAdjustmentsSession(): void {
  if (adjustmentsBaseColors.value) return
  adjustmentsBaseColors.value = ctx.colors.value.map(c => ({ ...c }))
  globalAdjustments.value = { hue: 0, saturation: 0, temperature: 0, luminosity: 0, daltonism: 'none' }
}

function openEditPaletteShortcut(): void {
  if (!ctx.isOwned.value || ctx.isNewPalette.value) return
  save.openEditPalette()
}

function openDeletePaletteShortcut(): void {
  if (!ctx.isOwned.value || ctx.isNewPalette.value) return
  save.showDeletePaletteModal.value = true
}

function openHistorySidebarShortcut(): void {
  if (ctx.isNewPalette.value) return
  ctx.historyOpen.value = !ctx.historyOpen.value
}

function openOwnerProfile(): void {
  const owner = ctx.history.value?.owner_username ?? ctx.username.value
  if (!owner || ctx.isNewPalette.value) return
  void ctx.router.push(`/users/${encodeURIComponent(owner)}`)
}

function openPaletteInfoModal(): void {
  showPaletteInfoModal.value = true
}

function openAccessibilityAuditModal(): void {
  accessibilityAuditIndex.value = Math.max(0, Math.min(ctx.colors.value.length - 1, accessibilityAuditIndex.value))
  showAccessibilityAuditModal.value = true
}

function closeAccessibilityAuditModal(): void {
  showAccessibilityAuditModal.value = false
}

function setAccessibilityAuditIndex(index: number): void {
  accessibilityAuditIndex.value = Math.max(0, Math.min(ctx.colors.value.length - 1, index))
}

function deleteLastColorShortcut(): void {
  const lastIdx = ctx.colors.value.length - 1
  if (lastIdx < 0) return
  interactions.removeColor(lastIdx)
}

function deleteFirstColorShortcut(): void {
  if (!ctx.colors.value.length) return
  interactions.removeColor(0)
}

function closeImagePaletteModal(): void {
  imagePaletteOpen.value = false
  imagePaletteLoading.value = false
  imagePaletteError.value = ''
}

function closeMobileSidebar(): void {
  cancelAdjustments()
  ctx.mobileSidebarOpen.value = false
}

function openHistoryHelp(): void {
  tutorial.openTutorial()
}

function openGenerationHelp(): void {
  helpModalMode.value = 'generation'
  helpModalOpen.value = true
}

function openCheatSheetHelp(): void {
  helpModalMode.value = 'cheatsheet'
  helpModalOpen.value = true
}

function openHistoryHelpFromModal(): void {
  closeHelpModal()
  tutorial.openTutorial()
}

function closeHelpModal(): void {
  helpModalOpen.value = false
}

function buildAdjustedColorsFromBase(): Array<{ hex: string; label: string | null; _key: string }> {
  const base = adjustmentsBaseColors.value ?? ctx.colors.value
  return base.map(color => ({
    ...color,
    hex: applyAdjustmentsToHex(color.hex, globalAdjustments.value),
  }))
}

function onAdjustmentsChange(next: GlobalColorAdjustments): void {
  if (!adjustmentsBaseColors.value) startAdjustmentsSession()
  globalAdjustments.value = next
  if (!adjustmentsBaseColors.value) return
  ctx.colors.value = buildAdjustedColorsFromBase()
}

function cancelAdjustments(): void {
  if (adjustmentsBaseColors.value) {
    ctx.colors.value = adjustmentsBaseColors.value.map(c => ({ ...c }))
  }
  adjustmentsBaseColors.value = null
  globalAdjustments.value = { hue: 0, saturation: 0, temperature: 0, luminosity: 0, daltonism: 'none' }
}

function applyAdjustments(): void {
  if (!adjustmentsBaseColors.value) {
    globalAdjustments.value = { hue: 0, saturation: 0, temperature: 0, luminosity: 0, daltonism: 'none' }
    return
  }

  const appliedAdjustments = { ...globalAdjustments.value }
  const base = adjustmentsBaseColors.value.map(c => ({ ...c }))
  const next = buildAdjustedColorsFromBase()
  adjustmentsBaseColors.value = null
  globalAdjustments.value = { hue: 0, saturation: 0, temperature: 0, luminosity: 0, daltonism: 'none' }

  if (isNeutralAdjustments(appliedAdjustments)) {
    ctx.colors.value = base
    return
  }

  ctx.colors.value = base
  undo.captureForUndo()
  ctx.colors.value = next
}

function paletteToClipboardText(): string {
  return ctx.colors.value.map(color => formatHexByMode(color.hex, copyFormat.value)).join(' ')
}

function extractColorsFromClipboardText(text: string): string[] {
  return parseColorsFromText(text)
}

async function readClipboardColors(): Promise<string[]> {
  if (!navigator.clipboard?.readText) return []
  try {
    const text = await navigator.clipboard.readText()
    return extractColorsFromClipboardText(text)
  } catch {
    return []
  }
}

function applyClipboardColors(hexes: string[], mode: 'add' | 'replace'): void {
  if (!hexes.length) return
  undo.captureForUndo()
  const nextColors = hexes
    .slice(0, MAX_PALETTE_COLORS)
    .map(hex => ({ hex, label: null, _key: ctx.mkKey() }))
  if (mode === 'replace') {
    ctx.colors.value = nextColors
    return
  }
  const slotsLeft = Math.max(0, MAX_PALETTE_COLORS - ctx.colors.value.length)
  if (!slotsLeft) return
  ctx.colors.value = [...ctx.colors.value, ...nextColors.slice(0, slotsLeft)]
}

function toggleDisplayFormat(format: PaletteColorFormat): void {
  const next: PaletteDisplaySettings = { ...displaySettings.value }
  next[format] = !next[format]
  if (!next.hex && !next.rgb && !next.hsl && !next.cmyk) return
  displaySettings.value = next
}

function setCopyFormat(format: PaletteColorFormat): void {
  copyFormat.value = format
}

function loadLocalDisplaySettings(): void {
  try {
    const rawDisplay = localStorage.getItem(DISPLAY_SETTINGS_KEY)
    if (rawDisplay) {
      const parsed = JSON.parse(rawDisplay) as Partial<PaletteDisplaySettings>
      displaySettings.value = {
        hex: parsed.hex ?? DEFAULT_PALETTE_DISPLAY_SETTINGS.hex,
        rgb: parsed.rgb ?? DEFAULT_PALETTE_DISPLAY_SETTINGS.rgb,
        hsl: parsed.hsl ?? DEFAULT_PALETTE_DISPLAY_SETTINGS.hsl,
        cmyk: parsed.cmyk ?? DEFAULT_PALETTE_DISPLAY_SETTINGS.cmyk,
      }
      if (!displaySettings.value.hex && !displaySettings.value.rgb && !displaySettings.value.hsl && !displaySettings.value.cmyk) {
        displaySettings.value = { ...DEFAULT_PALETTE_DISPLAY_SETTINGS }
      }
    }
  } catch {
    displaySettings.value = { ...DEFAULT_PALETTE_DISPLAY_SETTINGS }
  }

  const rawCopyFormat = localStorage.getItem(COPY_FORMAT_KEY)
  if (rawCopyFormat === 'hex' || rawCopyFormat === 'rgb' || rawCopyFormat === 'hsl' || rawCopyFormat === 'cmyk') {
    copyFormat.value = rawCopyFormat
  } else {
    copyFormat.value = DEFAULT_PALETTE_COPY_FORMAT
  }
}

function updateViewportMode(): void {
  isMobileViewport.value = window.matchMedia('(max-width: 768px)').matches
}

async function copyPaletteColors(): Promise<void> {
  if (!navigator.clipboard?.writeText) return
  try {
    await navigator.clipboard.writeText(paletteToClipboardText())
    copyFeedbackActive.value = true
    if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer)
    copyFeedbackTimer = setTimeout(() => {
      copyFeedbackActive.value = false
      copyFeedbackTimer = null
    }, 1100)
  } catch {}
}

onUnmounted(() => {
  if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer)
})

function onEscapeKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopImmediatePropagation()

  if (ctx.showAuthModal.value) { ctx.showAuthModal.value = false; return }
  if (exportModalOpen.value) { exportModalOpen.value = false; return }
  if (imagePaletteOpen.value) { closeImagePaletteModal(); return }
  if (generator.generateOpen.value) { generator.generateOpen.value = false; return }
  if (save.showRevertModal.value) { save.showRevertModal.value = false; return }
  if (save.deleteBranchTargetId.value !== null) { save.deleteBranchTargetId.value = null; return }
  if (save.showDeletePaletteModal.value) { save.showDeletePaletteModal.value = false; return }
  if (save.mergeTargetId.value !== null) { save.mergeTargetId.value = null; return }
  if (save.showEditModal.value) { save.showEditModal.value = false; return }
  if (ctx.showSaveModal.value) { ctx.showSaveModal.value = false; return }
  if (helpModalOpen.value) { helpModalOpen.value = false; return }
  if (showAccessibilityAuditModal.value) { closeAccessibilityAuditModal(); return }
  if (showPaletteInfoModal.value) { showPaletteInfoModal.value = false; return }
  if (tutorial.showTutorial.value) { tutorial.closeTutorial(); return }
  if (ctx.mobileSidebarOpen.value) { closeMobileSidebar(); return }
}

const sharePaletteUrl = computed(() => {
  if (ctx.isNewPalette.value) return ''
  if (typeof window === 'undefined') return ''
  return window.location.href
})

onMounted(() => {
  loadLocalDisplaySettings()
  updateViewportMode()
  window.addEventListener('resize', updateViewportMode, { passive: true })
  document.addEventListener('keydown', onEscapeKey, { capture: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportMode)
  document.removeEventListener('keydown', onEscapeKey, { capture: true })
})

async function pasteAddFromClipboard(): Promise<void> {
  const hexes = await readClipboardColors()
  applyClipboardColors(hexes, 'add')
}

async function pasteReplaceFromClipboard(): Promise<void> {
  const hexes = await readClipboardColors()
  applyClipboardColors(hexes, 'replace')
}

function onImagePaletteFileChange(file: File | null): void {
  imagePaletteError.value = ''
  imagePaletteExtractedColors.value = []
  if (!file) {
    imagePaletteFile.value = null
    return
  }
  if (file.size > IMAGE_MAX_BYTES) {
    imagePaletteFile.value = null
    imagePaletteError.value = t('palette.imageTooLarge')
    return
  }
  if (!file.type.startsWith('image/')) {
    imagePaletteFile.value = null
    imagePaletteError.value = t('palette.fileMustBeImage')
    return
  }
  imagePaletteFile.value = file
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Could not read image file.'))
    reader.readAsDataURL(file)
  })
}

function rgbStringToHex(value: string): string | null {
  const match = value.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i)
  if (!match) return null
  const channels = match.slice(1, 4).map(Number)
  if (channels.some(channel => Number.isNaN(channel) || channel < 0 || channel > 255)) return null
  return channels.map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function hexRgbDistance(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(0, 2), 16)
  const g1 = parseInt(hex1.slice(2, 4), 16)
  const b1 = parseInt(hex1.slice(4, 6), 16)
  const r2 = parseInt(hex2.slice(0, 2), 16)
  const g2 = parseInt(hex2.slice(2, 4), 16)
  const b2 = parseInt(hex2.slice(4, 6), 16)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

function pickDistinctImageColors(colors: Array<{ hex: string; count: number }>, count: number): Array<{ hex: string; count: number }> {
  const selected: Array<{ hex: string; count: number }> = []
  const deferred: Array<{ hex: string; count: number }> = []
  for (const color of colors) {
    if (selected.every(chosen => hexRgbDistance(color.hex, chosen.hex) >= 34)) {
      selected.push(color)
    } else {
      deferred.push(color)
    }
    if (selected.length >= count) return selected
  }
  for (const color of deferred) {
    if (selected.length >= count) break
    if (!selected.some(chosen => chosen.hex === color.hex)) selected.push(color)
  }
  return selected
}

async function extractPaletteFromImage(): Promise<void> {
  if (!imagePaletteFile.value) {
    imagePaletteError.value = t('palette.imageRequired')
    return
  }
  imagePaletteLoading.value = true
  imagePaletteError.value = ''
  try {
    const dataUrl = await readImageAsDataUrl(imagePaletteFile.value)
    const analyzed = await analyzeImage(dataUrl, {
      scale: 0.6,
      skipTransparentPixels: true,
    })
    const ranked: Array<{ hex: string; count: number }> = []
    const seen = new Set<string>()
    for (const item of analyzed) {
      const hex = rgbStringToHex(item.color)
      if (!hex || seen.has(hex)) continue
      seen.add(hex)
      ranked.push({ hex, count: item.count })
    }
    const colors = pickDistinctImageColors(ranked, imagePaletteCount.value)
    if (!colors.length) throw new Error(t('palette.noDominantColors'))
    imagePaletteExtractedColors.value = colors.map(color => ({ ...color, selected: true }))
  } catch (e: any) {
    imagePaletteError.value = e.message ?? t('palette.couldNotExtract')
  } finally {
    imagePaletteLoading.value = false
  }
}

function toggleExtractedImageColor(hex: string): void {
  imagePaletteExtractedColors.value = imagePaletteExtractedColors.value.map(color =>
    color.hex === hex ? { ...color, selected: !color.selected } : color,
  )
}

function applyExtractedImageColors(mode: 'add' | 'replace'): void {
  const hexes = imagePaletteExtractedColors.value
    .filter(color => color.selected)
    .map(color => color.hex)
  if (!hexes.length) {
    imagePaletteError.value = t('palette.selectExtracted')
    return
  }
  applyClipboardColors(hexes, mode)
  closeImagePaletteModal()
}

async function handleCreateFolder(payload: { name: string; parentId: number | null }) {
  try {
    await foldersApi.create({ name: payload.name, parent_folder_id: payload.parentId })
    await ctx.loadFolders()
  } catch {}
}

// Update the generator picker index from the modal component.
function setGenPickerOpenIdx(value: number | null): void {
  generator.genPickerOpenIdx.value = value
}

// Update the generator picker anchor rect from the modal component.
function setGenPickerAnchorRect(value: DOMRect | null): void {
  generator.genPickerAnchorRect.value = value
}

// Update SEO metadata whenever the palette identity changes.
watch(
  [ctx.paletteTitle, () => ctx.history.value?.owner_username, ctx.isNewPalette, ctx.currentColorsSig],
  () => {
    if (ctx.isNewPalette.value) {
      setPageSeo({
        title: 'New palette - RGBAST',
        description: 'Generate colors for a new palette in RGBAST, label swatches, and save a versioned snapshot.',
        keywords: ['new palette', 'palette creation', 'palette editor', 'color generator'],
      })
    } else {
      const owner = ctx.history.value?.owner_username
      const title = owner
        ? `${ctx.paletteTitle.value} by ${owner} - RGBAST`
        : `${ctx.paletteTitle.value} - RGBAST`
      const colorsPreview = ctx.colors.value
        .slice(0, 4)
        .map(color => `#${color.hex.toUpperCase()}`)
        .join(', ')
      setPageSeo({
        title,
        description: owner
          ? `Generate-inspired palette "${ctx.paletteTitle.value}" by ${owner} on RGBAST. ${colorsPreview ? `Key colors: ${colorsPreview}. ` : ''}Explore history, branches, and accessibility.`
          : `Generate-inspired palette "${ctx.paletteTitle.value}" on RGBAST. ${colorsPreview ? `Key colors: ${colorsPreview}. ` : ''}Explore history, branches, and accessibility.`,
        keywords: [
          'palette',
          'color palette',
          'palette history',
          'palette branches',
          ctx.paletteTitle.value,
          ...(owner ? [owner] : []),
          ...ctx.colors.value.slice(0, 6).map(color => color.hex.toUpperCase()),
        ],
      })
    }
  },
  { immediate: true },
)

watch(
  () => [ctx.route.params.username, ctx.route.params.pathMatch, ctx.route.query.palette],
  () => {
    hydratedDraftKey.value = null
  },
)

watch(
  [ctx.loading, ctx.error, ctx.draftKey],
  () => {
    hydrateDraftIfReady()
  },
  { immediate: true },
)

watch(
  [
    ctx.currentColorsSig,
    ctx.savedColorsSig,
    ctx.currentBranchId,
    ctx.selectedSnapshotId,
    ctx.pendingTitle,
    ctx.pendingDescription,
    ctx.pendingFolderId,
    undo.undoPast,
    undo.undoFuture,
    ctx.loading,
    ctx.error,
    ctx.paletteId,
  ],
  () => {
    persistDraftIfNeeded()
  },
  { deep: true },
)

watch(
  displaySettings,
  (value) => {
    localStorage.setItem(DISPLAY_SETTINGS_KEY, JSON.stringify(value))
  },
  { deep: true },
)

watch(copyFormat, (value) => {
  localStorage.setItem(COPY_FORMAT_KEY, value)
})

watch(
  () => ctx.colors.value.length,
  (count) => {
    if (!count) {
      accessibilityAuditIndex.value = 0
      return
    }
    if (accessibilityAuditIndex.value > count - 1) {
      accessibilityAuditIndex.value = count - 1
    }
  },
)

// Initialize palette loading when the route changes.
ctx.startRouteWatch(undo.clearHistory)

// Prepare transition styles for column enter animations.
function onBeforeEnter(el: Element): void {
  const e = el as HTMLElement
  e.style.flexBasis = '0px'
  e.style.flexGrow = '0'
  e.style.flexShrink = '0'
  e.style.minWidth = '0'
  e.style.opacity = '0'
  e.style.overflow = 'hidden'
}

// Animate column entry during palette edits.
function onEnter(el: Element, done: () => void): void {
  const e = el as HTMLElement
  const container = e.parentElement!
  const targetBasis = container.getBoundingClientRect().width / container.children.length
  e.offsetWidth
  e.style.transition = 'flex-basis 0.2s cubic-bezier(0.2,0,0,1), opacity 0.16s ease'
  e.style.flexBasis = targetBasis + 'px'
  e.style.opacity = '1'
  e.addEventListener(
    'transitionend',
    () => {
      e.style.flexBasis = ''
      e.style.flexGrow = ''
      e.style.flexShrink = ''
      e.style.minWidth = ''
      e.style.overflow = ''
      e.style.transition = ''
      e.style.opacity = ''
      done()
    },
    { once: true },
  )
}

// Animate column removal during palette edits.
function onLeave(el: Element, done: () => void): void {
  const e = el as HTMLElement
  const w = e.getBoundingClientRect().width
  e.style.flexBasis = w + 'px'
  e.style.flexGrow = '0'
  e.style.flexShrink = '0'
  e.style.minWidth = '0'
  e.style.overflow = 'hidden'
  e.offsetWidth
  e.style.transition = 'flex-basis 0.18s cubic-bezier(0.4,0,1,1), opacity 0.14s ease'
  e.style.flexBasis = '0px'
  e.style.opacity = '0'
  e.addEventListener('transitionend', done, { once: true })
}
</script>

<style scoped src="./PaletteView.css"></style>
