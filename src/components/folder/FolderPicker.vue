<template>
  <div class="fp" :class="`fp--${props.theme}`">
    <div class="fp-selected font-mono">
      <span class="fp-selected-label">{{ selectedLabel }}</span>
    </div>
    <div class="fp-tree">
      <FolderTree
        :folders="folders"
        :modelValue="modelValue"
        :theme="props.theme"
        mode="picker"
        @update:modelValue="emit('update:modelValue', typeof $event === 'number' ? $event : null)"
        @createFolder="emit('createFolder', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FolderResponse } from '@/api/types'
import FolderTree from './FolderTree.vue'

const props = withDefaults(defineProps<{
  folders: FolderResponse[]
  modelValue: number | null
  theme?: 'light' | 'dark'
}>(), { theme: 'dark' })

const emit = defineEmits<{
  (e: 'update:modelValue', val: number | null): void
  (e: 'createFolder', payload: { name: string; parentId: number | null }): void
}>()

const selectedLabel = computed(() => {
  if (props.modelValue === null) return '/ (root)'
  const folder = props.folders.find(f => f.id === props.modelValue)
  if (!folder) return '/ (root)'
  const parts: string[] = []
  let cur: FolderResponse | undefined = folder
  const seen = new Set<number>()
  while (cur) {
    if (seen.has(cur.id)) break
    seen.add(cur.id)
    parts.unshift(cur.name)
    cur = cur.parent_folder_id != null ? props.folders.find(f => f.id === cur!.parent_folder_id) : undefined
  }
  return '/ ' + parts.join(' / ')
})
</script>

<style scoped src="./FolderPicker.css"></style>
