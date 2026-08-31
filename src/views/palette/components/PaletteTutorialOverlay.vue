<template>
  <Teleport to="body">
    <div v-if="show" class="tutorial-shell" :class="{ 'focus-history': tutorialFocus === 'history' }">
      <div class="tutorial-dim"></div>
      <div class="tutorial-card" :class="tutorialCardClass">
        <div class="tutorial-top">
          <span class="tutorial-step">{{ t('paletteTutorial.step') }} {{ tutorialStep + 1 }} / {{ tutorialSteps.length }}</span>
          <button class="tutorial-close" type="button" :aria-label="t('paletteTutorial.close')" @click="$emit('close')">
            <AppIcon name="x" :size="16" />
          </button>
        </div>

        <h3 class="tutorial-title font-display">{{ currentTutorial.title }}</h3>
        <p class="tutorial-body">{{ currentTutorial.body }}</p>

        <div class="tutorial-actions">
          <button class="modal-btn cancel" :disabled="tutorialStep === 0" @click="$emit('prev')">{{ t('paletteTutorial.back') }}</button>
          <button
            v-if="tutorialStep < tutorialSteps.length - 1"
            class="modal-btn confirm"
            @click="$emit('next')"
          >
            {{ t('paletteTutorial.next') }}
          </button>
          <button v-else class="modal-btn confirm" @click="$emit('close')">{{ t('paletteTutorial.gotIt') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue'
import type { TutorialStep, TutorialFocus } from '../composables/usePaletteTutorial'
import { useI18n } from '@/i18n'

// PaletteTutorialOverlay component: shows the guided tutorial overlay for PaletteView.
defineProps<{
  show: boolean
  tutorialFocus: TutorialFocus
  tutorialCardClass: string
  tutorialStep: number
  tutorialSteps: TutorialStep[]
  currentTutorial: TutorialStep
}>()

// Emits: next/prev/close navigation events for the tutorial.
defineEmits<{
  (e: 'close'): void
  (e: 'next'): void
  (e: 'prev'): void
}>()

const { t } = useI18n()
</script>

<style scoped src="./PaletteTutorialOverlay.css"></style>
