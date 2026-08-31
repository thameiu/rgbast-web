<template>
  <div class="ft" :class="`ft--${theme}`">

    <!-- All palettes (navigation only) -->
    <div
      v-if="mode === 'navigation'"
      class="ft-item"
      :class="[`ft-item--${theme}`, modelValue === 'all' && 'ft-item--active']"
      @click="emit('update:modelValue', 'all')"
    >
      <span class="ft-gap" />
      <svg class="ft-sicon" width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round">
        <rect x="1" y="2" width="12" height="9" rx="1.5" />
        <path d="M1 5.5h12" />
      </svg>
      <span class="ft-label">{{ t('folderTree.allPalettes') }}</span>
      <span class="ft-count">{{ totalCount }}</span>
    </div>

    <!-- Root item (collapsible) -->
    <div
      class="ft-item"
      :class="[
        `ft-item--${theme}`,
        (mode === 'navigation' ? modelValue === 'root' : modelValue === null) && 'ft-item--active',
        dragTargetId === 'root' && 'ft-item--drag',
      ]"
      @click="emit('update:modelValue', mode === 'navigation' ? 'root' : null)"
      @dblclick.stop="mode === 'navigation' && (rootFolders.length > 0 || rootPalettes.length > 0) && toggleRoot()"
      @dragover.prevent="onDragover($event, 'root')"
      @dragleave="onDragleave('root')"
      @drop.prevent="onDrop($event, null)"
    >
      <button
        v-if="mode === 'navigation' && (rootFolders.length > 0 || rootPalettes.length > 0)"
        class="ft-toggle"
        tabindex="-1"
        @click.stop="toggleRoot()"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path :d="rootOpen ? 'M1 2.5l3 3 3-3' : 'M2.5 1l3 3-3 3'" />
        </svg>
      </button>
      <span v-else class="ft-gap" />

      <svg class="ft-sicon" :class="{ 'ft-sicon--active': mode === 'navigation' ? modelValue === 'root' : modelValue === null }" width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round">
        <path d="M1 10V5a1 1 0 0 1 .5-.87l5-2.88a1 1 0 0 1 1 0l5 2.88A1 1 0 0 1 13 5v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1Z" />
      </svg>
      <span class="ft-label ft-label--root">{{ mode === 'picker' ? t('folderTree.rootNoFolder') : t('folderTree.root') }}</span>
      <span v-if="mode === 'navigation'" class="ft-count-icons">
        <span class="ft-count-item" :title="t('folderTree.palettes')">
          <svg class="ft-count-icon" width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="1" width="10" height="8" rx="1.3" />
            <path d="M4.33 1.4v7.2M7.67 1.4v7.2" />
          </svg>
          <span>{{ rootCount ?? 0 }}</span>
        </span>
        <span class="ft-count-item" :title="t('folderTree.subfolders')">
          <svg class="ft-count-icon" width="11" height="11" viewBox="0 0 14 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round">
            <path d="M1 3.5C1 2.67 1.67 2 2.5 2H5l1.5 1.5H11.5C12.33 3.5 13 4.17 13 5v4.5C13 10.33 12.33 11 11.5 11h-9C1.67 11 1 10.33 1 9.5V3.5Z" />
          </svg>
          <span>{{ rootFolders.length }}</span>
        </span>
      </span>
    </div>

    <!-- Root children when expanded (navigation mode) -->
    <template v-if="mode === 'navigation' && rootOpen">
      <!-- Root-level palettes -->
      <div
        v-for="p in rootPalettes"
        :key="p.id"
        class="ft-palette"
        :class="[`ft-palette--${theme}`, draggingPaletteId === p.id && 'ft-palette--dragging']"
        style="padding-left: 28px"
        :draggable="allowFolderEditing"
        @dblclick="emit('selectPalette', p)"
        @dragstart="allowFolderEditing && startPaletteDrag(p.id, $event)"
        @dragend="endPaletteDrag()"
        @dragover.prevent
      >
        <span class="ft-gap" />
        <span class="ft-p-title">{{ p.title }}</span>
        <span class="ft-p-colors">
          <span v-for="(c, ci) in p.palette_colors.slice(0, 5)" :key="ci" class="ft-cube" :style="{ background: '#' + c.hex }" />
          <span v-if="p.palette_colors.length > 5" class="ft-cube-more">+{{ p.palette_colors.length - 5 }}</span>
        </span>
      </div>

      <!-- Root-level folders at depth=1 -->
      <FolderTreeNode v-for="folder in rootFolders" :key="folder.id" :folder="folder" :depth="1" />

      <!-- Root-level inline create input -->
      <div
        v-if="allowFolderEditing && inlineCreate?.parentId === null"
        class="ft-item ft-item--new"
        :class="`ft-item--${theme}`"
        style="padding-left: 28px; flex-direction: column; align-items: stretch; gap: 0"
      >
        <div style="display: flex; align-items: center; gap: 5px;">
          <span class="ft-gap" />
          <svg class="ft-sicon" width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round">
            <path d="M1 3.5C1 2.67 1.67 2 2.5 2H5l1.5 1.5H11.5C12.33 3.5 13 4.17 13 5v4.5C13 10.33 12.33 11 11.5 11h-9C1.67 11 1 10.33 1 9.5V3.5Z" />
          </svg>
          <input
            ref="rootCreateRef"
            class="ft-inline-input"
            :class="{ 'ft-inline-input--error': !!rootCreateError }"
            :value="inlineValue"
            :placeholder="t('folderTree.folderNamePlaceholder')"
            @input="inlineValue = ($event.target as HTMLInputElement).value"
            @keydown.enter="!rootCreateError && commitInlineCreate(null)"
            @keydown.escape="cancelInline()"
          />
        </div>
        <span v-if="rootCreateError" class="ft-name-error">{{ rootCreateError }}</span>
      </div>
    </template>

    <!-- Picker mode: folder tree directly + root-level inline create -->
    <template v-if="mode === 'picker'">
      <FolderTreeNode v-for="folder in rootFolders" :key="folder.id" :folder="folder" :depth="1" />

      <!-- Root-level inline create input (picker mode) -->
      <div
        v-if="allowFolderEditing && inlineCreate?.parentId === null"
        class="ft-item ft-item--new"
        :class="`ft-item--${theme}`"
        style="padding-left: 28px; flex-direction: column; align-items: stretch; gap: 0"
      >
        <div style="display: flex; align-items: center; gap: 5px;">
          <span class="ft-gap" />
          <svg class="ft-sicon" width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round">
            <path d="M1 3.5C1 2.67 1.67 2 2.5 2H5l1.5 1.5H11.5C12.33 3.5 13 4.17 13 5v4.5C13 10.33 12.33 11 11.5 11h-9C1.67 11 1 10.33 1 9.5V3.5Z" />
          </svg>
          <input
            ref="rootCreateRef"
            class="ft-inline-input"
            :class="{ 'ft-inline-input--error': !!rootCreateError }"
            :value="inlineValue"
            :placeholder="t('folderTree.folderNamePlaceholder')"
            @input="inlineValue = ($event.target as HTMLInputElement).value"
            @keydown.enter="!rootCreateError && commitInlineCreate(null)"
            @keydown.escape="cancelInline()"
          />
        </div>
        <span v-if="rootCreateError" class="ft-name-error">{{ rootCreateError }}</span>
      </div>
    </template>

    <!-- New folder button (both modes) -->
    <button
      v-if="allowFolderEditing && !inlineCreate"
      class="ft-add-btn"
      :class="`ft-add-btn--${theme}`"
      @click="startInlineCreate(null)"
    >
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M4.5 1v7M1 4.5h7" />
      </svg>
      {{ t('folderTree.newFolder') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, provide, ref, watch } from 'vue'
import type { FolderResponse, PaletteCache } from '@/api/types'
import type { FolderTreeState } from './folderTreeTypes'
import FolderTreeNode from './FolderTreeNode.vue'
import { useI18n } from '@/i18n'

const props = withDefaults(defineProps<{
  folders: FolderResponse[]
  modelValue: 'all' | 'root' | number | null
  theme: 'light' | 'dark'
  mode: 'navigation' | 'picker'
  paletteCounts?: Record<number, number>
  totalCount?: number
  rootCount?: number
  draggingId?: number | null
  palettes?: PaletteCache[]
  allowFolderEditing?: boolean
}>(), {
  allowFolderEditing: true,
})

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'update:modelValue', val: 'all' | 'root' | number | null): void
  (e: 'createFolder', payload: { name: string; parentId: number | null }): void
  (e: 'renameFolder', payload: { id: number; name: string }): void
  (e: 'deleteFolder', folder: FolderResponse): void
  (e: 'movePalette', payload: { paletteId: number; targetFolderId: number | null }): void
  (e: 'selectPalette', p: PaletteCache): void
}>()

const openFolders = ref<Set<number>>(new Set())
const rootOpen = ref(false)
const dragTargetId = ref<number | 'root' | null>(null)
const draggingPaletteId = ref<number | null>(null)
const inlineCreate = ref<{ parentId: number | null } | null>(null)
const inlineRename = ref<{ folderId: number } | null>(null)
const inlineValue = ref('')
const expandTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const lastDragTarget = ref<number | 'root' | null>(null)
const rootCreateRef = ref<HTMLInputElement | null>(null)

const rootFolders = computed(() => getChildren(null))
const rootPalettes = computed(() => (props.palettes ?? []).filter(p => p.folder_id == null))
const childFolderCounts = computed(() => {
  const counts: Record<number, number> = {}
  for (const folder of props.folders) {
    const parentId = folder.parent_folder_id
    if (parentId != null) {
      counts[parentId] = (counts[parentId] ?? 0) + 1
    }
  }
  return counts
})

const rootCreateError = computed((): string | null => {
  if (!inlineCreate.value || inlineCreate.value.parentId !== null) return null
  const n = inlineValue.value.trim()
  if (!n) return null
  return isNameTaken(n, null) ? t('folderTree.nameAlreadyTaken') : null
})

function getChildren(parentId: number | null): FolderResponse[] {
  return props.folders
    .filter(f => (f.parent_folder_id ?? null) === parentId)
    .sort((a, b) => a.name.localeCompare(b.name))
}

function isNameTaken(name: string, parentId: number | null, excludeId?: number): boolean {
  const n = name.trim().toLowerCase()
  if (!n) return false
  return getChildren(parentId).some(f => f.name.toLowerCase() === n && f.id !== excludeId)
}

function toggle(id: number) {
  const next = new Set(openFolders.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openFolders.value = next
}

function toggleRoot() {
  rootOpen.value = !rootOpen.value
}

function select(key: 'all' | 'root' | number | null) {
  emit('update:modelValue', key)
}

function selectPalette(p: PaletteCache) {
  emit('selectPalette', p)
}

function startInlineCreate(parentId: number | null) {
  if (!props.allowFolderEditing) return
  if (parentId !== null) {
    openFolders.value = new Set([...openFolders.value, parentId])
  } else {
    rootOpen.value = true
  }
  inlineCreate.value = { parentId }
  inlineValue.value = ''
  if (parentId === null) nextTick(() => rootCreateRef.value?.focus())
}

function startInlineRename(folder: FolderResponse) {
  if (!props.allowFolderEditing) return
  inlineRename.value = { folderId: folder.id }
  inlineValue.value = folder.name
}

function commitInlineCreate(parentId: number | null) {
  if (!props.allowFolderEditing) return
  const name = inlineValue.value.trim()
  if (name) emit('createFolder', { name, parentId })
  cancelInline()
}

function commitInlineRename(folderId: number) {
  if (!props.allowFolderEditing) return
  const name = inlineValue.value.trim()
  if (name) emit('renameFolder', { id: folderId, name })
  cancelInline()
}

function cancelInline() {
  inlineCreate.value = null
  inlineRename.value = null
  inlineValue.value = ''
}

function updateInlineValue(value: string) { inlineValue.value = value }

function onDeleteFolder(folder: FolderResponse) { emit('deleteFolder', folder) }

function startPaletteDrag(id: number, event: DragEvent) {
  if (!props.allowFolderEditing) return
  draggingPaletteId.value = id
  event.dataTransfer?.setData('palette-id', String(id))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function endPaletteDrag() {
  draggingPaletteId.value = null
}

function onDragover(event: DragEvent, targetId: number | 'root' | null) {
  if (!props.allowFolderEditing) return
  event.preventDefault()
  if (lastDragTarget.value === targetId) return
  if (expandTimer.value) { clearTimeout(expandTimer.value); expandTimer.value = null }
  dragTargetId.value = targetId
  lastDragTarget.value = targetId
  if (typeof targetId === 'number' && !openFolders.value.has(targetId)) {
    expandTimer.value = setTimeout(() => {
      if (dragTargetId.value === targetId) openFolders.value = new Set([...openFolders.value, targetId])
      expandTimer.value = null
    }, 500)
  } else if (targetId === 'root' && !rootOpen.value) {
    expandTimer.value = setTimeout(() => {
      if (dragTargetId.value === 'root') rootOpen.value = true
      expandTimer.value = null
    }, 500)
  }
}

function onDragleave(targetId: number | 'root' | null) {
  if (dragTargetId.value === targetId) {
    dragTargetId.value = null
    lastDragTarget.value = null
    if (expandTimer.value) { clearTimeout(expandTimer.value); expandTimer.value = null }
  }
}

function onDrop(event: DragEvent, targetFolderId: number | null) {
  if (!props.allowFolderEditing) return
  dragTargetId.value = null
  lastDragTarget.value = null
  if (expandTimer.value) { clearTimeout(expandTimer.value); expandTimer.value = null }
  const paletteId = Number(event.dataTransfer?.getData('palette-id'))
  if (!isNaN(paletteId) && paletteId) emit('movePalette', { paletteId, targetFolderId })
}

watch(() => props.draggingId, id => {
  if (!id) {
    dragTargetId.value = null
    lastDragTarget.value = null
    if (expandTimer.value) { clearTimeout(expandTimer.value); expandTimer.value = null }
  }
})

const state: FolderTreeState = {
  get openFolders() { return openFolders.value },
  get rootOpen() { return rootOpen.value },
  get dragTargetId() { return dragTargetId.value },
  get theme() { return props.theme },
  get mode() { return props.mode },
  get allowFolderEditing() { return props.allowFolderEditing },
  get activeFolderKey() { return props.modelValue },
  get paletteCounts() { return props.paletteCounts ?? {} },
  get childFolderCounts() { return childFolderCounts.value },
  get rootChildFolderCount() { return rootFolders.value.length },
  get palettes() { return props.palettes ?? [] },
  get inlineCreate() { return inlineCreate.value },
  get inlineRename() { return inlineRename.value },
  get inlineValue() { return inlineValue.value },
  getChildren,
  toggle,
  toggleRoot,
  select,
  selectPalette,
  startInlineCreate,
  startInlineRename,
  commitInlineCreate,
  commitInlineRename,
  cancelInline,
  updateInlineValue,
  onDeleteFolder,
  onDragover,
  onDragleave,
  onDrop,
  isNameTaken,
  get draggingPaletteId() { return draggingPaletteId.value },
  startPaletteDrag,
  endPaletteDrag,
}

provide('folderTreeState', state)

defineExpose({
  startInlineCreate,
  cancelInline,
})
</script>

<style scoped src="./FolderTree.css"></style>
