<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay">
      <div class="modal">
        <button class="modal-close-btn" type="button" aria-label="Close adjustments modal" @click="$emit('cancel')">
          <AppIcon name="x" :size="16" />
        </button>
        <h3 class="modal-title font-display">Global Adjustments</h3>

        <div class="adj-grid">
          <label class="adj-row">
            <span class="adj-label">Hue</span>
            <input
              class="adj-slider"
              type="range"
              min="-180"
              max="180"
              step="1"
              :value="adjustments.hue"
              @input="emitUpdate('hue', Number(($event.target as HTMLInputElement).value))"
            />
            <span class="adj-value">{{ adjustments.hue }}</span>
          </label>

          <label class="adj-row">
            <span class="adj-label">Saturation</span>
            <input
              class="adj-slider"
              type="range"
              min="-100"
              max="100"
              step="1"
              :value="adjustments.saturation"
              @input="emitUpdate('saturation', Number(($event.target as HTMLInputElement).value))"
            />
            <span class="adj-value">{{ adjustments.saturation }}</span>
          </label>

          <label class="adj-row">
            <span class="adj-label">Temperature</span>
            <input
              class="adj-slider"
              type="range"
              min="-100"
              max="100"
              step="1"
              :value="adjustments.temperature"
              @input="emitUpdate('temperature', Number(($event.target as HTMLInputElement).value))"
            />
            <span class="adj-value">{{ adjustments.temperature }}</span>
          </label>

          <label class="adj-row">
            <span class="adj-label">Luminosity</span>
            <input
              class="adj-slider"
              type="range"
              min="-100"
              max="100"
              step="1"
              :value="adjustments.luminosity"
              @input="emitUpdate('luminosity', Number(($event.target as HTMLInputElement).value))"
            />
            <span class="adj-value">{{ adjustments.luminosity }}</span>
          </label>
        </div>

        <div class="modal-actions">
          <button class="modal-btn cancel" @click="$emit('cancel')">Cancel</button>
          <button class="modal-btn confirm" @click="$emit('apply')">Apply</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue'
import type { GlobalColorAdjustments } from '@/utils/paletteColorAdjustments'

type AdjustmentSliderKey = 'hue' | 'saturation' | 'temperature' | 'luminosity'

const props = defineProps<{
  open: boolean
  adjustments: GlobalColorAdjustments
}>()

const emit = defineEmits<{
  (e: 'update:adjustments', value: GlobalColorAdjustments): void
  (e: 'apply'): void
  (e: 'cancel'): void
}>()

function emitUpdate(key: AdjustmentSliderKey, value: number): void {
  emit('update:adjustments', { ...props.adjustments, [key]: value })
}
</script>

<style scoped src="./PaletteAdjustmentsModal.css"></style>
