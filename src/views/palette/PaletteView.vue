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
      :canDelete="ctx.isOwned.value && !ctx.isNewPalette.value"
      :tutorialFocus="tutorial.headerTutorialFocus.value"
      :mobileMenuOpen="ctx.mobileSidebarOpen.value"
      :canUndo="undo.canUndo.value"
      :canRedo="undo.canRedo.value"
      @back="ctx.router.push('/dashboard')"
      @save="save.requestSave"
      @clone="ctx.clonePalette"
      @branchChange="switchBranchWithUndo"
      @toggleHistory="ctx.historyOpen.value = !ctx.historyOpen.value"
      @merge="save.confirmMerge"
      @deletePalette="save.showDeletePaletteModal.value = true"
      @openTutorial="tutorial.openTutorial"
      @hamburgerClick="ctx.mobileSidebarOpen.value = !ctx.mobileSidebarOpen.value"
      @generate="generator.doGenerate"
      @openGenerateSettings="generator.generateOpen.value = true"
      @undo="undo.doUndo"
      @redo="undo.doRedo"
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
      @update:saveComment="save.saveComment.value = $event"
      @update:createNewBranch="save.createNewBranch.value = $event"
      @update:newBranchName="save.newBranchName.value = $event"
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
      :historyForDisplay="tutorial.historyForDisplay.value"
      :selectedSnapshotId="ctx.selectedSnapshotId.value"
      :showDemoHistory="tutorial.showDemoHistory.value"
      :revertableSnapshotCount="save.revertableSnapshotCount.value"
      @close="ctx.mobileSidebarOpen.value = false"
      @switchBranch="switchBranchWithUndo"
      @merge="save.confirmMerge"
      @openTutorial="tutorial.openTutorial"
      @requestSave="save.requestSave"
      @clonePalette="ctx.clonePalette"
      @deletePalette="save.showDeletePaletteModal.value = true"
      @selectSnapshot="historyActions.onHistorySelectSnapshot"
      @selectBranch="historyActions.onHistorySelectBranch"
      @deleteBranch="historyActions.onHistoryDeleteBranch"
      @revertSnapshot="historyActions.onHistoryRevertSnapshot"
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
import PaletteMergeModal from './components/modals/PaletteMergeModal.vue'
import PaletteDeletePaletteModal from './components/modals/PaletteDeletePaletteModal.vue'
import PaletteDeleteBranchModal from './components/modals/PaletteDeleteBranchModal.vue'
import PaletteRevertModal from './components/modals/PaletteRevertModal.vue'
import PaletteGenerateModal from './components/modals/PaletteGenerateModal.vue'
import PaletteTutorialOverlay from './components/PaletteTutorialOverlay.vue'
import PaletteMobileSidebar from './components/PaletteMobileSidebar.vue'
import { usePaletteContext } from './composables/usePaletteContext'
import { usePaletteUndo } from './composables/usePaletteUndo'
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
  { historyOpen: ctx.historyOpen, generateOpen: generator.generateOpen },
  {
    doUndo: undo.doUndo,
    doRedo: undo.doRedo,
    requestSave: save.requestSave,
    doGenerate: generator.doGenerate,
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

// Update the generator picker index from the modal component.
function setGenPickerOpenIdx(value: number | null): void {
  generator.genPickerOpenIdx.value = value
}

// Update the generator picker anchor rect from the modal component.
function setGenPickerAnchorRect(value: DOMRect | null): void {
  generator.genPickerAnchorRect.value = value
}

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
