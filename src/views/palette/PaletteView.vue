<template>
  <div class="palette-view">
    <PaletteAppHeader
      :paletteTitle="ctx.paletteTitle.value"
      :currentBranch="ctx.currentBranchName.value"
      :currentBranchId="ctx.currentBranchId.value"
      :branches="ctx.allBranches.value"
      :hasUnsavedChanges="ctx.hasUnsavedChanges.value"
      :isSaving="save.isSaving.value"
      :historyOpen="ctx.historyOpen.value"
      :snapshotHint="ctx.snapshotCommitHint.value"
      :isOwned="ctx.isOwned.value"
      :isNewPalette="ctx.isNewPalette.value"
      :canDelete="ctx.isOwned.value && !ctx.isNewPalette.value"
      :tutorialFocus="tutorial.headerTutorialFocus.value"
      :mobileMenuOpen="ctx.mobileSidebarOpen.value"
      :canUndo="undo.canUndo.value"
      :canRedo="undo.canRedo.value"
      :copyFeedback="copyFeedbackActive"
      @back="ctx.router.push('/dashboard')"
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
      @hamburgerClick="ctx.mobileSidebarOpen.value = !ctx.mobileSidebarOpen.value"
      @generate="generator.doGenerate"
      @openGenerateSettings="generator.generateOpen.value = true"
      @undo="undo.doUndo"
      @redo="undo.doRedo"
      @openImagePalette="openImagePaletteModal"
    />

    <div v-if="ctx.loading.value" class="loading-screen">
      <AppLoader message="Loading palette..." />
    </div>

    <div v-else-if="ctx.error.value" class="error-screen">
      <p>{{ ctx.error.value }}</p>
      <button @click="ctx.router.push('/dashboard')">&lt;- Back to dashboard</button>
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
      :genContrast="generator.genContrast.value"
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
      @update:genContrast="generator.genContrast.value = $event"
      @update:genHarmony="generator.genHarmony.value = $event as typeof generator.genHarmony.value"
    />

    <PaletteImageModal
      :open="imagePaletteOpen"
      :isLoading="imagePaletteLoading"
      :error="imagePaletteError"
      :count="imagePaletteCount"
      :file="imagePaletteFile"
      :fileName="imagePaletteFile?.name ?? ''"
      @close="closeImagePaletteModal"
      @update:count="imagePaletteCount = $event"
      @fileChange="onImagePaletteFileChange"
      @submit="extractPaletteFromImage"
    />

    <PaletteTutorialOverlay
      :show="tutorial.showTutorial.value"
      :tutorialFocus="tutorial.tutorialFocus.value"
      :tutorialCardClass="tutorial.tutorialCardClass.value"
      :tutorialStep="tutorial.tutorialStep.value"
      :tutorialSteps="tutorial.tutorialSteps"
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
      @close="ctx.mobileSidebarOpen.value = false"
      @switchBranch="switchBranchWithUndo"
      @merge="save.confirmMerge"
      @openHelpHistory="openHistoryHelp"
      @openHelpGeneration="openGenerationHelp"
      @openHelpCheatSheet="openCheatSheetHelp"
      @copyPalette="copyPaletteColors"
      @pasteAdd="pasteAddFromClipboard"
      @pasteReplace="pasteReplaceFromClipboard"
      @requestSave="save.requestSave"
      @clonePalette="ctx.clonePalette"
      @deletePalette="save.showDeletePaletteModal.value = true"
      @generate="generator.doGenerate"
      @openGenerateSettings="generator.generateOpen.value = true"
      @openImagePalette="openImagePaletteModal"
      @edit="save.openEditPalette"
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
import PaletteTutorialOverlay from './components/PaletteTutorialOverlay.vue'
import PaletteMobileSidebar from './components/PaletteMobileSidebar.vue'
import PaletteHelpModal from './components/PaletteHelpModal.vue'
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { foldersApi } from '@/api/folders'
import { colorApi } from '@/api/color'
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

// PaletteView component: orchestrates the palette editor UI and feature modules.
const ctx = usePaletteContext()

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
const helpModalOpen = ref(false)
const helpModalMode = ref<'generation' | 'cheatsheet'>('cheatsheet')
const copyFeedbackActive = ref(false)
let copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null

const hydratedDraftKey = ref<string | null>(null)
const hydratingDraft = ref(false)

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
    ctx.pendingTitle.value = draft.pendingTitle || ctx.pendingTitle.value
    ctx.pendingDescription.value = draft.pendingDescription
    ctx.pendingFolderId.value = draft.pendingFolderId
  }

  undo.undoPast.value = draft.undoPast.map(fromDraftHistorySnapshot)
  undo.undoFuture.value = draft.undoFuture.map(fromDraftHistorySnapshot)
  hydratingDraft.value = false
}

function persistDraftIfNeeded(): void {
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
    paletteTitle: ctx.isNewPalette.value ? (ctx.pendingTitle.value.trim() || 'Untitled draft') : ctx.paletteTitle.value,
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

function paletteToClipboardText(): string {
  return ctx.colors.value.map(color => `#${color.hex.toUpperCase()}`).join(' ')
}

function extractColorsFromClipboardText(text: string): string[] {
  const matches = text.match(/#?(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g) ?? []
  const output: string[] = []
  for (const match of matches) {
    const raw = match.replace('#', '').toUpperCase()
    if (raw.length === 6) {
      output.push(raw)
      continue
    }
    if (raw.length === 3) {
      output.push(raw.split('').map(ch => ch + ch).join(''))
    }
  }
  return output
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
  const nextColors = hexes.map(hex => ({ hex, label: null, _key: ctx.mkKey() }))
  if (mode === 'replace') {
    ctx.colors.value = nextColors
    return
  }
  ctx.colors.value = [...ctx.colors.value, ...nextColors]
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
  if (imagePaletteOpen.value) { closeImagePaletteModal(); return }
  if (generator.generateOpen.value) { generator.generateOpen.value = false; return }
  if (save.showRevertModal.value) { save.showRevertModal.value = false; return }
  if (save.deleteBranchTargetId.value !== null) { save.deleteBranchTargetId.value = null; return }
  if (save.showDeletePaletteModal.value) { save.showDeletePaletteModal.value = false; return }
  if (save.mergeTargetId.value !== null) { save.mergeTargetId.value = null; return }
  if (save.showEditModal.value) { save.showEditModal.value = false; return }
  if (ctx.showSaveModal.value) { ctx.showSaveModal.value = false; return }
  if (helpModalOpen.value) { helpModalOpen.value = false; return }
  if (tutorial.showTutorial.value) { tutorial.closeTutorial(); return }
  if (ctx.mobileSidebarOpen.value) { ctx.mobileSidebarOpen.value = false; return }
}

onMounted(() => {
  document.addEventListener('keydown', onEscapeKey, { capture: true })
})

onUnmounted(() => {
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
  if (!file) {
    imagePaletteFile.value = null
    return
  }
  if (file.size > IMAGE_MAX_BYTES) {
    imagePaletteFile.value = null
    imagePaletteError.value = 'Image is too large. Maximum size is 10MB.'
    return
  }
  if (!file.type.startsWith('image/')) {
    imagePaletteFile.value = null
    imagePaletteError.value = 'File must be an image.'
    return
  }
  imagePaletteFile.value = file
}

async function extractPaletteFromImage(): Promise<void> {
  if (!imagePaletteFile.value) {
    imagePaletteError.value = 'Please choose an image first.'
    return
  }
  imagePaletteLoading.value = true
  imagePaletteError.value = ''
  try {
    const resp = await colorApi.generatePaletteFromImage(imagePaletteFile.value, imagePaletteCount.value)
    if (!resp.colors.length) throw new Error('No dominant colors could be extracted.')
    undo.captureForUndo()
    ctx.colors.value = resp.colors.map(c => ({ hex: c.hex, label: null, _key: ctx.mkKey() }))
    closeImagePaletteModal()
  } catch (e: any) {
    imagePaletteError.value = e.message ?? 'Could not extract colors from image.'
  } finally {
    imagePaletteLoading.value = false
  }
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

// Update the browser tab title whenever the palette name or owner changes.
watch(
  [ctx.paletteTitle, () => ctx.history.value?.owner_username, ctx.isNewPalette],
  () => {
    if (ctx.isNewPalette.value) {
      document.title = 'New palette - RGBAST'
    } else {
      const owner = ctx.history.value?.owner_username
      document.title = owner
        ? `${ctx.paletteTitle.value} by ${owner} - RGBAST`
        : `${ctx.paletteTitle.value} - RGBAST`
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
