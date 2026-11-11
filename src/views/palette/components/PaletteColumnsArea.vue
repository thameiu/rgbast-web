<template>
  <div
    ref="rootEl"
    class="columns-area"
    :class="{ 'tutorial-focus': isTutorialFocus }"
    @mousemove="onColsMouseMove"
    @mouseleave="$emit('mouseleave')"
  >
    <TransitionGroup appear
      tag="div"
      class="cols-tg"
      :style="{ '--column-size': `calc(100% / ${Math.max(colors.length, 1)})` }"
      name="col"
      move-class="col-move"
      @appear="(el, done) => $emit('enter', el, done)"
      @enter="(el, done) => $emit('add-enter', el, done)"
      @leave="(el, done) => $emit('leave', el, done)"
    >
      <ColorColumn
        v-for="(col, i) in colors"
        :key="col._key"
        :data-index="i"
        :modelValue="col"
        :readOnly="readOnly"
        :keyboardSelected="selectedIndex === i"
        :colKey="col._key"
        :isDragging="draggedIdx === i"
        :dragStyle="getColStyle(i)"
        :swapSelected="swapSourceIdx === i"
        :displaySettings="displaySettings"
        :isGenerationBaseColor="isGenerationBaseColor(col.hex)"
        :canAddGenerationBaseColor="canAddGenerationBaseColor"
        @update:hex="hex => $emit('update:hex', i, hex)"
        @update:label="lbl => $emit('update:label', i, lbl)"
        @remove="$emit('remove', i)"
        @openAccessibility="$emit('openAccessibility', i)"
        @toggleGenerationBaseColor="$emit('toggleGenerationBaseColor', col.hex)"
        @dragStart="e => $emit('dragStart', i, e)"
        @swapTap="$emit('swapTap', i)"
      />
    </TransitionGroup>

    <button v-if="!readOnly" class="add-col-btn" :class="{ visible: showAddBtn }" @click="$emit('add')" title="Add color">
      <AppIcon name="plus" :size="20" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import ColorColumn from '@/components/palette/ColorColumn.vue'
import type { WorkingColor } from '../composables/usePaletteContext'
import type { PaletteDisplaySettings } from '@/utils/paletteColorFormats'

// PaletteColumnsArea component: renders and manages the color column list in PaletteView.
const props = defineProps<{
  colors: WorkingColor[]
  readOnly?: boolean
  selectedIndex?: number
  draggedIdx: number | null
  swapSourceIdx: number | null
  showAddBtn: boolean
  isTutorialFocus: boolean
  displaySettings: PaletteDisplaySettings
  isGenerationBaseColor: (hex: string) => boolean
  canAddGenerationBaseColor: boolean
  setColsAreaEl: (el: HTMLElement | null) => void
  onColsMouseMove: (e: MouseEvent) => void
  getColStyle: (i: number) => Record<string, string>
}>()

const rootEl = ref<HTMLElement | null>(null)

onMounted(() => { if (rootEl.value) props.setColsAreaEl(rootEl.value) })
onUnmounted(() => { props.setColsAreaEl(null) })

// Emits: updates for column edits, drag, swap, add, and transition hooks.
defineEmits<{
  (e: 'update:hex', i: number, hex: string): void
  (e: 'update:label', i: number, label: string | null): void
  (e: 'remove', i: number): void
  (e: 'openAccessibility', i: number): void
  (e: 'toggleGenerationBaseColor', hex: string): void
  (e: 'dragStart', i: number, ev: PointerEvent): void
  (e: 'swapTap', i: number): void
  (e: 'add'): void
  (e: 'mouseleave'): void
  (e: 'before-enter', el: Element): void
  (e: 'enter', el: Element, done: () => void): void
  (e: 'add-enter', el: Element, done: () => void): void
  (e: 'leave', el: Element, done: () => void): void
}>()
</script>

<style scoped src="./PaletteColumnsArea.css"></style>
