import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import type { PaletteHistoryGraphResponse } from '@/api/types'
import { translate } from '@/i18n'

export type TutorialFocus = 'header' | 'branches' | 'canvas' | 'history' | 'save' | null

export interface TutorialStep {
  title: string
  body: string
  focus: TutorialFocus
  showHistory?: boolean
  showDemo?: boolean
  useDemoHistory?: boolean
}

export interface TutorialContext {
  history: Ref<PaletteHistoryGraphResponse | null>
  historyOpen: Ref<boolean>
}

// Manage the tutorial overlay and demo history for PaletteView.
export function usePaletteTutorial(ctx: TutorialContext) {
  const showTutorial = ref(false)
  const tutorialStep = ref(0)
  const previousHistoryOpen = ref(false)

  const tutorialNow = Date.now()

  const tutorialDemoHistory = computed<PaletteHistoryGraphResponse>(() => ({
    palette_id: 999,
    owner_username: 'tutorial-user',
    title: 'brand-system',
    folder_path: [],
    main: [
      {
        id: 9004,
        palette_id: 999,
        parent_snapshot_id: 9003,
        branch_id: null,
        comment: translate('paletteTutorial.demo.mergeWarm'),
        created_at: new Date(tutorialNow - 10 * 60_000).toISOString(),
        palette_colors: [
          { hex: '121826', label: 'bg-main' },
          { hex: 'F6C343', label: 'accent' },
          { hex: '16C9D8', label: 'info' },
          { hex: 'F4EFE6', label: 'surface' },
        ],
        colors_added: 1,
        colors_deleted: 0,
        colors_modified: 1,
      },
      {
        id: 9003,
        palette_id: 999,
        parent_snapshot_id: 9001,
        branch_id: null,
        comment: translate('paletteTutorial.demo.mainBaseline'),
        created_at: new Date(tutorialNow - 5 * 60 * 60_000).toISOString(),
        palette_colors: [
          { hex: '121826', label: 'bg-main' },
          { hex: 'B410CC', label: 'accent' },
          { hex: '16C9D8', label: 'info' },
        ],
        colors_added: 1,
        colors_deleted: 0,
        colors_modified: 1,
      },
      {
        id: 9001,
        palette_id: 999,
        parent_snapshot_id: null,
        branch_id: null,
        comment: translate('paletteTutorial.demo.initialCreation'),
        created_at: new Date(tutorialNow - 6 * 24 * 60 * 60_000).toISOString(),
        palette_colors: [
          { hex: '121826', label: 'bg-main' },
          { hex: '9A7BFF', label: 'accent' },
        ],
        colors_added: 0,
        colors_deleted: 0,
        colors_modified: 0,
      },
    ],
    branches: [
      {
        id: 9101,
        title: 'brouillon/warm-variant',
        merged_at: new Date(tutorialNow - 10 * 60_000).toISOString(),
        is_merged: true,
        snapshots: [
          {
            id: 9103,
            palette_id: 999,
            parent_snapshot_id: 9102,
            branch_id: 9101,
            comment: translate('paletteTutorial.demo.warmCandidate'),
            created_at: new Date(tutorialNow - 120 * 60_000).toISOString(),
            palette_colors: [
              { hex: '121826', label: 'bg-main' },
              { hex: 'F6C343', label: 'accent' },
              { hex: '16C9D8', label: 'info' },
            ],
            colors_added: 0,
            colors_deleted: 0,
            colors_modified: 1,
          },
          {
            id: 9102,
            palette_id: 999,
            parent_snapshot_id: 9003,
            branch_id: 9101,
            comment: translate('paletteTutorial.demo.forkWarm'),
            created_at: new Date(tutorialNow - 220 * 60_000).toISOString(),
            palette_colors: [
              { hex: '121826', label: 'bg-main' },
              { hex: 'E38B2F', label: 'accent' },
              { hex: '16C9D8', label: 'info' },
            ],
            colors_added: 0,
            colors_deleted: 0,
            colors_modified: 1,
          },
        ],
      },
      {
        id: 9102,
        title: 'brouillon/cta-focus',
        merged_at: null,
        is_merged: false,
        snapshots: [
          {
            id: 9203,
            palette_id: 999,
            parent_snapshot_id: 9202,
            branch_id: 9102,
            comment: translate('paletteTutorial.demo.ctaTooStrong'),
            created_at: new Date(tutorialNow - 80 * 60_000).toISOString(),
            palette_colors: [
              { hex: '121826', label: 'bg-main' },
              { hex: 'FF4B5C', label: 'cta' },
              { hex: '16C9D8', label: 'info' },
            ],
            colors_added: 0,
            colors_deleted: 0,
            colors_modified: 1,
          },
          {
            id: 9202,
            palette_id: 999,
            parent_snapshot_id: 9201,
            branch_id: 9102,
            comment: translate('paletteTutorial.demo.ctaBalanced'),
            created_at: new Date(tutorialNow - 170 * 60_000).toISOString(),
            palette_colors: [
              { hex: '121826', label: 'bg-main' },
              { hex: 'F28B52', label: 'cta' },
              { hex: '16C9D8', label: 'info' },
            ],
            colors_added: 0,
            colors_deleted: 0,
            colors_modified: 1,
          },
          {
            id: 9201,
            palette_id: 999,
            parent_snapshot_id: 9003,
            branch_id: 9102,
            comment: translate('paletteTutorial.demo.forkCta'),
            created_at: new Date(tutorialNow - 260 * 60_000).toISOString(),
            palette_colors: [
              { hex: '121826', label: 'bg-main' },
              { hex: 'B410CC', label: 'accent' },
              { hex: '16C9D8', label: 'info' },
            ],
            colors_added: 0,
            colors_deleted: 0,
            colors_modified: 0,
          },
        ],
      },
    ],
  }))

  const tutorialSteps = computed<TutorialStep[]>(() => [
    {
      title: translate('paletteTutorial.steps.snapshots.title'),
      body: translate('paletteTutorial.steps.snapshots.body'),
      focus: 'header',
    },
    {
      title: translate('paletteTutorial.steps.branches.title'),
      body: translate('paletteTutorial.steps.branches.body'),
      focus: 'branches',
    },
    {
      title: translate('paletteTutorial.steps.example.title'),
      body: translate('paletteTutorial.steps.example.body'),
      focus: 'history',
      showHistory: true,
      showDemo: true,
      useDemoHistory: true,
    },
    {
      title: translate('paletteTutorial.steps.mergeRevert.title'),
      body: translate('paletteTutorial.steps.mergeRevert.body'),
      focus: 'history',
      showHistory: true,
      showDemo: true,
      useDemoHistory: true,
    },
    {
      title: translate('paletteTutorial.steps.oldSnapshotRules.title'),
      body: translate('paletteTutorial.steps.oldSnapshotRules.body'),
      focus: 'canvas',
    },
    {
      title: translate('paletteTutorial.steps.saveContinue.title'),
      body: translate('paletteTutorial.steps.saveContinue.body'),
      focus: 'save',
    },
  ])

  const currentTutorial = computed<TutorialStep>(() => {
    const idx = Math.max(0, Math.min(tutorialStep.value, tutorialSteps.value.length - 1))
    return tutorialSteps.value[idx]!
  })

  const tutorialFocus = computed<TutorialFocus>(() => (showTutorial.value ? currentTutorial.value.focus : null))
  const headerTutorialFocus = computed(() => (tutorialFocus.value === 'canvas' ? null : tutorialFocus.value))
  const showDemoHistory = computed(() => showTutorial.value && !!currentTutorial.value.useDemoHistory)
  const historyForDisplay = computed(() => (showDemoHistory.value ? tutorialDemoHistory.value : ctx.history.value))
  const tutorialCardClass = computed(() => `focus-${currentTutorial.value.focus ?? 'header'}`)

  // Open the tutorial overlay and optionally show the history panel.
  function openTutorial(): void {
    previousHistoryOpen.value = ctx.historyOpen.value
    tutorialStep.value = 0
    showTutorial.value = true
    if (currentTutorial.value.showHistory) ctx.historyOpen.value = true
  }

  // Close the tutorial and restore the previous history panel state.
  function closeTutorial(): void {
    showTutorial.value = false
    tutorialStep.value = 0
    ctx.historyOpen.value = previousHistoryOpen.value
  }

  // Advance to the next tutorial step within the overlay.
  function nextTutorialStep(): void {
    tutorialStep.value = Math.min(tutorialStep.value + 1, tutorialSteps.value.length - 1)
  }

  // Go back one tutorial step within the overlay.
  function prevTutorialStep(): void {
    tutorialStep.value = Math.max(tutorialStep.value - 1, 0)
  }

  watch([showTutorial, tutorialStep], ([open]) => {
    if (!open) return
    ctx.historyOpen.value = currentTutorial.value.showHistory ? true : previousHistoryOpen.value
  })

  return {
    showTutorial,
    tutorialStep,
    tutorialSteps,
    currentTutorial,
    tutorialFocus,
    headerTutorialFocus,
    showDemoHistory,
    historyForDisplay,
    tutorialCardClass,
    openTutorial,
    closeTutorial,
    nextTutorialStep,
    prevTutorialStep,
  }
}
