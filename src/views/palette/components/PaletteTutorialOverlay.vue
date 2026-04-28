<template>
  <Teleport to="body">
    <div v-if="show" class="tutorial-shell" :class="{ 'focus-history': tutorialFocus === 'history' }">
      <div class="tutorial-dim"></div>
      <div class="tutorial-card" :class="tutorialCardClass">
        <div class="tutorial-top">
          <span class="tutorial-step">Step {{ tutorialStep + 1 }} / {{ tutorialSteps.length }}</span>
          <button class="tutorial-close" @click="$emit('close')">x</button>
        </div>

        <h3 class="tutorial-title font-display">{{ currentTutorial.title }}</h3>
        <p class="tutorial-body">{{ currentTutorial.body }}</p>

        <div class="tutorial-actions">
          <button class="modal-btn cancel" :disabled="tutorialStep === 0" @click="$emit('prev')">Back</button>
          <button
            v-if="tutorialStep < tutorialSteps.length - 1"
            class="modal-btn confirm"
            @click="$emit('next')"
          >
            Next
          </button>
          <button v-else class="modal-btn confirm" @click="$emit('close')">Got it</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { TutorialStep, TutorialFocus } from '../composables/usePaletteTutorial'

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
</script>

<style scoped src="./PaletteTutorialOverlay.css"></style>
