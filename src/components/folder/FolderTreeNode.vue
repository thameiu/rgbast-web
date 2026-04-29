<script lang="ts">
export default { name: 'FolderTreeNode' }
</script>

<template>
  <div>
    <!-- Folder row -->
    <div
      class="ftn-row"
      :class="[`ftn-row--${state.theme}`, isActive && 'ftn-row--active', isDragTarget && 'ftn-row--drag']"
      :style="{ paddingLeft: `${8 + depth * 20}px` }"
      @click="handleRowClick"
      @dragover.prevent="state.onDragover($event, folder.id)"
      @dragleave="state.onDragleave(folder.id)"
      @drop.prevent="state.onDrop($event, folder.id)"
    >
      <button
        v-if="hasContent"
        class="ftn-toggle"
        tabindex="-1"
        @click.stop="state.toggle(folder.id)"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path :d="isOpen ? 'M1 2.5l3 3 3-3' : 'M2.5 1l3 3-3 3'" />
        </svg>
      </button>
      <span v-else class="ftn-gap" />

      <!-- Open folder icon when expanded/active, closed otherwise -->
      <svg class="ftn-icon" :class="{ 'ftn-icon--open': isOpen || isActive }" width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round">
        <path v-if="isOpen || isActive"
          d="M1 4V10a1 1 0 001 1h10a1 1 0 001-1V4M1 4V3a1 1 0 011-1h3.5l1.5-1.5H12a1 1 0 011 1V4" />
        <path v-else
          d="M1 3.5C1 2.67 1.67 2 2.5 2H5l1.5 1.5H11.5C12.33 3.5 13 4.17 13 5v4.5C13 10.33 12.33 11 11.5 11h-9C1.67 11 1 10.33 1 9.5V3.5Z" />
      </svg>

      <template v-if="state.inlineRename?.folderId === folder.id">
        <div class="ftn-input-wrap">
          <input
            ref="renameRef"
            class="ftn-input"
            :class="{ 'ftn-input--error': !!renameError }"
            :value="state.inlineValue"
            @input="state.updateInlineValue(($event.target as HTMLInputElement).value)"
            @keydown.enter="!renameError && state.commitInlineRename(folder.id)"
            @keydown.escape="state.cancelInline()"
            @click.stop
          />
          <span v-if="renameError" class="ftn-name-error">{{ renameError }}</span>
        </div>
      </template>
      <span v-else class="ftn-label">{{ folder.name }}</span>

      <span v-if="state.mode === 'navigation'" class="ftn-count">{{ state.paletteCounts[folder.id] ?? 0 }}</span>
      <span v-if="state.mode === 'navigation'" class="ftn-btns">
        <button class="ftn-btn" title="New subfolder" @click.stop="state.startInlineCreate(folder.id)">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 1v6M1 4h6" /></svg>
        </button>
        <button class="ftn-btn ftn-btn--del" title="Delete" @click.stop="state.onDeleteFolder(folder)">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1l6 6M7 1L1 7" /></svg>
        </button>
      </span>
    </div>

    <!-- Expanded contents: child folders, then palette items, then inline create -->
    <template v-if="isOpen">
      <FolderTreeNode v-for="child in children" :key="child.id" :folder="child" :depth="depth + 1" />

      <!-- Palette items (navigation mode only) -->
      <template v-if="state.mode === 'navigation'">
        <div
          v-for="p in myPalettes"
          :key="p.id"
          class="ftn-palette"
          :class="[`ftn-palette--${state.theme}`, state.draggingPaletteId === p.id && 'ftn-palette--dragging']"
          :style="{ paddingLeft: `${8 + (depth + 1) * 20}px` }"
          draggable="true"
          @click.stop="state.selectPalette(p)"
          @dragstart="state.startPaletteDrag(p.id, $event)"
          @dragend="state.endPaletteDrag()"
          @dragover.prevent
        >
          <span class="ftn-gap" />
          <span class="ftn-p-title">{{ p.title }}</span>
          <span class="ftn-p-colors">
            <span
              v-for="(c, ci) in p.palette_colors.slice(0, 5)"
              :key="ci"
              class="ftn-cube"
              :style="{ background: '#' + c.hex }"
            />
            <span v-if="p.palette_colors.length > 5" class="ftn-cube-more">+{{ p.palette_colors.length - 5 }}</span>
          </span>
        </div>
      </template>

      <!-- Inline create child input -->
      <div
        v-if="state.inlineCreate?.parentId === folder.id"
        class="ftn-row ftn-row--new"
        :class="`ftn-row--${state.theme}`"
        :style="{ paddingLeft: `${8 + (depth + 1) * 20}px`, flexDirection: 'column', alignItems: 'stretch', gap: '0' }"
      >
        <div style="display: flex; align-items: center; gap: 5px;">
          <span class="ftn-gap" />
          <svg class="ftn-icon" width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round">
            <path d="M1 3.5C1 2.67 1.67 2 2.5 2H5l1.5 1.5H11.5C12.33 3.5 13 4.17 13 5v4.5C13 10.33 12.33 11 11.5 11h-9C1.67 11 1 10.33 1 9.5V3.5Z" />
          </svg>
          <input
            ref="createRef"
            class="ftn-input ftn-input--new"
            :class="{ 'ftn-input--error': !!createError }"
            :value="state.inlineValue"
            placeholder="Folder name…"
            @input="state.updateInlineValue(($event.target as HTMLInputElement).value)"
            @keydown.enter="!createError && state.commitInlineCreate(folder.id)"
            @keydown.escape="state.cancelInline()"
            @click.stop
          />
        </div>
        <span v-if="createError" class="ftn-name-error">{{ createError }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue'
import type { FolderResponse } from '@/api/types'
import type { FolderTreeState } from './folderTreeTypes'

const props = defineProps<{ folder: FolderResponse; depth: number }>()

const state = inject<FolderTreeState>('folderTreeState')!

let clickCount = 0
let clickTimer: ReturnType<typeof setTimeout> | null = null

function handleRowClick() {
  clickCount++
  if (clickCount === 1) {
    state.select(props.folder.id)
  }
  if (clickTimer) clearTimeout(clickTimer)
  clickTimer = setTimeout(() => {
    if (clickCount === 2) {
      state.toggle(props.folder.id)
    } else if (clickCount >= 3) {
      state.startInlineRename(props.folder)
    }
    clickCount = 0
    clickTimer = null
  }, 280)
}
const isOpen = computed(() => state.openFolders.has(props.folder.id))
const isActive = computed(() => state.activeFolderKey === props.folder.id)
const isDragTarget = computed(() => state.dragTargetId === props.folder.id)
const children = computed(() => state.getChildren(props.folder.id))
const myPalettes = computed(() => state.palettes.filter(p => p.folder_id === props.folder.id))
const hasContent = computed(() => children.value.length > 0 || (state.mode === 'navigation' && myPalettes.value.length > 0))

const createError = computed((): string | null => {
  if (!state.inlineCreate || state.inlineCreate.parentId !== props.folder.id) return null
  const n = state.inlineValue.trim()
  if (!n) return null
  return state.isNameTaken(n, props.folder.id) ? 'Name already taken' : null
})

const renameError = computed((): string | null => {
  if (!state.inlineRename || state.inlineRename.folderId !== props.folder.id) return null
  const n = state.inlineValue.trim()
  if (!n) return null
  return state.isNameTaken(n, props.folder.parent_folder_id ?? null, props.folder.id) ? 'Name already taken' : null
})

const renameRef = ref<HTMLInputElement | null>(null)
const createRef = ref<HTMLInputElement | null>(null)

watch(() => state.inlineRename?.folderId === props.folder.id, yes => {
  if (yes) nextTick(() => renameRef.value?.focus())
})
watch(
  () => state.inlineCreate?.parentId === props.folder.id && isOpen.value,
  yes => { if (yes) nextTick(() => createRef.value?.focus()) }
)
</script>

<style scoped src="./FolderTreeNode.css"></style>
