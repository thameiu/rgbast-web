<template>
  <div
    ref="rootEl"
    class="columns-area"
    :class="{ 'tutorial-focus': isTutorialFocus }"
    @mousemove="onColsMouseMove"
    @mouseleave="$emit('mouseleave')"
  >
    <TransitionGroup
      tag="div"
      class="cols-tg"
      name="col"
      move-class="col-move"
      @before-enter="el => $emit('before-enter', el)"
      @enter="(el, done) => $emit('enter', el, done)"
      @leave="(el, done) => $emit('leave', el, done)"
    >
      <ColorColumn
        v-for="(col, i) in colors"
        :key="col._key"
        :modelValue="col"
        :colKey="col._key"
        :isDragging="draggedIdx === i"
        :dragStyle="getColStyle(i)"
        :swapSelected="swapSourceIdx === i"
        @update:hex="hex => $emit('update:hex', i, hex)"
        @update:label="lbl => $emit('update:label', i, lbl)"
        @remove="$emit('remove', i)"
        @dragStart="e => $emit('dragStart', i, e)"
        @swapTap="$emit('swapTap', i)"
      />
    </TransitionGroup>

    <button class="add-col-btn" :class="{ visible: showAddBtn }" @click="$emit('add')" title="Add color">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ColorColumn from '@/components/palette/ColorColumn.vue'
import type { WorkingColor } from '../composables/usePaletteContext'

// PaletteColumnsArea component: renders and manages the color column list in PaletteView.
const props = defineProps<{
  colors: WorkingColor[]
  draggedIdx: number | null
  swapSourceIdx: number | null
  showAddBtn: boolean
  isTutorialFocus: boolean
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
  (e: 'dragStart', i: number, ev: PointerEvent): void
  (e: 'swapTap', i: number): void
  (e: 'add'): void
  (e: 'mouseleave'): void
  (e: 'before-enter', el: Element): void
  (e: 'enter', el: Element, done: () => void): void
  (e: 'leave', el: Element, done: () => void): void
}>()
</script>

<style scoped src="./PaletteColumnsArea.css"></style>
