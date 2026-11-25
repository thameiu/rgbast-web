<template>
  <Teleport to="body">
    <div v-if="open" class="bookmark-modal-overlay" @click.self="$emit('close')">
      <form class="bookmark-modal" role="dialog" aria-modal="true" @keydown.esc.prevent="$emit('close')" @submit.prevent="submit">
        <button class="bookmark-modal-close" type="button" :aria-label="t('colorPage.closeSaveColorModal')" @click="$emit('close')">
          <AppIcon name="x" :size="16" />
        </button>

        <h3 class="bookmark-modal-title font-display">{{ selectedId !== null ? t('colorPage.updateBookmark') : t('colorPage.saveBookmark') }}</h3>
        <p class="bookmark-modal-sub">{{ t('colorPage.bookmarkSub') }}</p>

        <slot name="picker"></slot>
        <template v-if="allowCreate">
          <span class="bookmark-field-label">{{ t('bookmarksPage.destination') }}</span>
          <ProjectContentSelect v-model="projectId" :options="destinationOptions" :label="t('bookmarksPage.destination')" :disabled="isSaving" />
          <div v-if="candidates.length" class="bookmark-targets" role="group" :aria-label="t('bookmarksPage.saveMode')">
            <label class="project-removal-option">
              <input type="radio" name="bookmark-save-mode" :checked="selectedId === null" :disabled="isSaving" @change="selectedId = null" />
              <span><strong>{{ t('bookmarksPage.createAnother') }}</strong></span>
            </label>
            <label v-for="candidate in candidates" :key="candidate.id" class="project-removal-option">
              <input type="radio" name="bookmark-save-mode" :checked="selectedId === candidate.id" :disabled="isSaving" @change="selectCandidate(candidate)" />
              <span><strong>{{ t('bookmarksPage.updateExisting') }}</strong><small>{{ candidate.label }} · {{ t('colorPage.updated') }} <time :datetime="candidate.updated_at || candidate.created_at">{{ formatDate(candidate.updated_at || candidate.created_at) }}</time></small></span>
            </label>
          </div>
          <p v-if="loadingTargets">{{ t('common.loading') }}</p>
          <p v-if="targetError" class="bookmark-error">{{ targetError }}</p>
        </template>
        <div v-if="!$slots.picker" class="bookmark-preview" :style="{ background: '#' + hex }">
          <span class="bookmark-preview-hex" :style="{ color: textColor }">#{{ hex.toUpperCase() }}</span>
        </div>

        <label class="bookmark-field-label">{{ t('colorPage.customLabel') }}</label>
        <input
          :value="label"
          class="bookmark-input"
          maxlength="100"
          :placeholder="t('colorPage.favoriteViolet')"
          autofocus
          @input="$emit('update:label', ($event.target as HTMLInputElement).value)"
        />

        <div v-if="selectedId !== null && (createdAt || updatedAt)" class="bookmark-meta">
          <p v-if="createdAt" class="bookmark-meta-line">
            <span class="bookmark-meta-key">{{ t('colorPage.created') }}</span>
            <span>{{ formatDate(createdAt) }}</span>
          </p>
          <p v-if="updatedAt" class="bookmark-meta-line">
            <span class="bookmark-meta-key">{{ t('colorPage.updated') }}</span>
            <span>{{ formatDate(updatedAt) }}</span>
          </p>
        </div>

        <p v-if="error" class="bookmark-error">{{ error }}</p>

        <div class="bookmark-actions">
          <button class="bookmark-btn bookmark-btn--ghost" type="button" @click="$emit('close')">{{ t('common.cancel') }}</button>
          <button class="bookmark-btn" type="submit" :disabled="isSaving || !label.trim() || loadingTargets || !!targetError || !canSave">
            {{ isSaving ? t('colorPage.saving') : (selectedId !== null ? t('colorPage.updateBookmark') : t('colorPage.saveBookmark')) }}
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { colorBookmarksApi } from '@/api/colorBookmarks'
import { projectsApi, type Project } from '@/api/projects'
import type { ColorBookmarkResponse } from '@/api/types'

import AppIcon from '@/components/icons/AppIcon.vue'
import ProjectContentSelect, { type ProjectContentOption } from '@/components/project/ProjectContentSelect.vue'
import { useI18n } from '@/i18n'

const props = defineProps<{
  open: boolean
  allowCreate?: boolean
  bookmarkId?: number | null
  initialProjectId?: number | null
  hex: string
  label: string
  existing: boolean
  isSaving: boolean
  error: string
  createdAt?: string | null
  updatedAt?: string | null
}>()

const { locale, t } = useI18n()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', selection: { id: number | null; project_id: number | null }): void
  (e: 'update:label', value: string): void
}>()

const projects = ref<Project[]>([]), candidates = ref<ColorBookmarkResponse[]>([])
const projectId = ref<number | null>(null), selectedId = ref<number | null>(null)
const destinationOptions = computed<ProjectContentOption[]>(() => [
  { id: null, title: t('bookmarksPage.personal') },
  ...projects.value.map(project => ({ id: project.id, title: project.title, subtitle: project.creator_username })),
])
const loadingTargets = ref(false), targetError = ref('')
let request = 0
const canSave = computed(() => {
  if (!props.allowCreate || projectId.value === null) return true
  return projects.value.find(project => project.id === projectId.value)?.permissions.includes(selectedId.value === null ? 'add_bookmarks' : 'edit_bookmarks') ?? false
})
function selectCandidate(candidate: ColorBookmarkResponse) { selectedId.value = candidate.id; emit('update:label', candidate.label) }
function submit() {
  if (props.isSaving || loadingTargets.value || targetError.value || !canSave.value || !props.label.trim()) return
  emit('save', { id: selectedId.value, project_id: projectId.value })
}
watch(() => props.open, async open => {
  if (!open) { request++; return }
  selectedId.value = props.allowCreate ? null : props.bookmarkId ?? null
  projectId.value = props.initialProjectId ?? null; targetError.value = ''
  if (props.allowCreate) {
    try { projects.value = (await projectsApi.mine()).filter(p => p.permissions.includes('add_bookmarks') || p.permissions.includes('edit_bookmarks')) }
    catch (e) { targetError.value = e instanceof Error ? e.message : String(e) }
  }
})
watch([() => props.open, () => props.hex, projectId], async () => {
  if (!props.open || !props.allowCreate) return
  const current = ++request
  selectedId.value = null; candidates.value = []; loadingTargets.value = true; targetError.value = ''
  try { const response = await colorBookmarksApi.listMine(props.hex, projectId.value); if (request === current) candidates.value = response.bookmarks }
  catch (e) { if (request === current) targetError.value = e instanceof Error ? e.message : String(e) }
  finally { if (request === current) loadingTargets.value = false }
})

const textColor = computed(() => {
  const hex = props.hex
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.92)'
})

function formatDate(value: string): string {
  return new Date(value).toLocaleString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped src="./ColorBookmarkModal.css"></style>
