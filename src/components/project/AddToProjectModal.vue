<template>
  <Teleport to="body"><Transition name="project-fade">
    <div v-if="projectTransfer" class="project-overlay" @keydown.esc.stop="close">
      <form class="project-modal" :class="{ 'project-modal--dark': isPaletteView }" role="dialog" aria-modal="true" :aria-label="modalTitle" @submit.prevent="creatingProject ? createProject() : submit()">
        <button type="button" class="project-close" @click="close" :aria-label="t('common.cancel')"><AppIcon name="x" :size="18" /></button>
        <h2>{{ modalTitle }}</h2>
        <p v-if="!loggedIn"><RouterLink to="/login" @click="close">{{ t('common.login') }}</RouterLink></p>
        <AppLoader v-else-if="loading" :message="t('common.loading')" />
        <template v-else-if="creatingProject">
          <label>{{ t('projects.title') }}<input ref="projectTitleInput" v-model="newProject.title" maxlength="50" required :disabled="busy" /></label>
          <label>{{ t('projects.slug') }}<input v-model="newProject.slug" maxlength="50" pattern="[a-z0-9]+(-[a-z0-9]+)*" :placeholder="t('projects.autoSlug')" :disabled="busy" /></label>
          <label>{{ t('projects.description') }}<textarea v-model="newProject.description" maxlength="5000" :disabled="busy" /></label>
          <ProjectPrivacyToggle v-model="newProject.private" :disabled="busy" />
          <p v-if="createError" class="project-error" role="alert">{{ createError }}</p>
          <div class="project-modal-actions">
            <button type="button" :disabled="busy" @click="creatingProject = false">{{ t('common.cancel') }}</button>
            <button :disabled="busy || !newProject.title.trim()">{{ busy ? t('dashboard.saving') : t('projects.create') }}</button>
          </div>
        </template>
        <template v-else>
          <button type="button" class="project-create-button" :disabled="busy" @click="startProjectCreation"><AppIcon name="plus" :size="14" />{{ t('projects.new') }}</button>
          <template v-if="projects.length || isClone">
            <div v-if="projectTransfer.kind === 'palette'" class="project-transfer-preview">
              <strong>{{ projectTransfer.title }}</strong>
              <div class="project-transfer-colors" aria-hidden="true"><span v-for="(color, index) in projectTransfer.colors" :key="index" :style="{ background: '#' + color.hex.replace(/^#/, '') }" /></div>
            </div>
            <div class="project-modal-field">
              <span>{{ destinationLabel }}</span>
              <ProjectContentSelect v-model="projectId" :options="projectOptions" :label="destinationLabel" :disabled="busy" />
            </div>
            <p v-if="selectedProject && !selectedProject.private">{{ t('projects.destinationPublic') }}</p>
            <div v-if="projectTransfer.kind === 'palette'" class="project-modal-field">
              <span>{{ t('dashboard.folders') }}</span>
              <p v-if="loadingContext" role="status">{{ t('common.loading') }}</p>
              <fieldset v-else class="project-folder-field" :disabled="busy" :aria-label="t('dashboard.folders')">
                <FolderPicker :key="projectId ?? 'none'" v-model="folderId" :folders="folders" :theme="isPaletteView ? 'dark' : 'light'" :allowFolderEditing="canCreateFolder" @createFolder="createFolder" />
              </fieldset>
            </div>
            <label>{{ projectTransfer.kind === 'palette' ? t('projects.title') : t('colorPage.customLabel') }}<input v-model="title" :maxlength="projectTransfer.kind === 'palette' ? 50 : 100" required :disabled="busy" /></label>
            <p v-if="titleError" class="project-error">{{ titleError }}</p>
            <template v-if="projectTransfer.kind === 'palette'">
              <p>{{ t(isClone ? 'projects.cloneExplanation' : 'projects.copyExplanation') }}</p>
              <label v-if="projectTransfer.canMove && !isClone" class="project-checkbox"><input v-model="move" type="checkbox" :disabled="busy" />{{ t('projects.moveOriginal') }}</label>
              <p v-if="move">{{ t('projects.importWarning') }}</p>
            </template>
            <div v-else-if="bookmarks.length" class="project-targets">
              <label class="project-removal-option"><input type="radio" name="project-bookmark-save-mode" :checked="bookmarkId === null" :disabled="busy || !selectedProject?.permissions.includes('add_bookmarks')" @change="bookmarkId = null" /><span><strong>{{ t('bookmarksPage.createAnother') }}</strong></span></label>
              <label v-for="bookmark in bookmarks" :key="bookmark.id" class="project-removal-option"><input type="radio" name="project-bookmark-save-mode" :checked="bookmarkId === bookmark.id" :disabled="busy || !selectedProject?.permissions.includes('edit_bookmarks')" @change="bookmarkId = bookmark.id; title = bookmark.label" /><span><strong>{{ t('bookmarksPage.updateExisting') }}</strong><small>{{ bookmark.label }} · {{ t('colorPage.updated') }} <time :datetime="bookmark.updated_at || bookmark.created_at">{{ formatBookmarkDate(bookmark.updated_at || bookmark.created_at) }}</time></small></span></label>
            </div>
            <div class="project-modal-actions"><button type="button" @click="close">{{ t('common.cancel') }}</button><button :disabled="busy || loadingContext || !title.trim() || !!titleError || !!contextError || !canWrite">{{ t(isClone ? 'projects.clone' : 'common.save') }}</button></div>
          </template>
          <p v-else>{{ t('projects.noWritable') }}</p>
        </template>
        <p v-if="!creatingProject && (error || contextError)" class="project-error" role="alert">{{ error || contextError }}</p>
      </form>
    </div>
  </Transition></Teleport>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { projectTransfer } from '@/composables/useProjectTransfer'
import { projectsApi, projectUrl, type Project } from '@/api/projects'
import { ApiClient } from '@/api/client'
import { colorBookmarksApi } from '@/api/colorBookmarks'
import { authApi } from '@/api/auth'
import { foldersApi } from '@/api/folders'
import { palettesApi } from '@/api/palettes'
import type { FolderResponse, ColorBookmarkResponse, PaletteCreateResponse } from '@/api/types'
import { getPaletteTitleError } from '@/utils/paletteConstraints'
import AppIcon from '@/components/icons/AppIcon.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import FolderPicker from '@/components/folder/FolderPicker.vue'
import ProjectContentSelect, { type ProjectContentOption } from './ProjectContentSelect.vue'
import ProjectPrivacyToggle from './ProjectPrivacyToggle.vue'
import { useI18n } from '@/i18n'
const { t, locale } = useI18n()
function formatBookmarkDate(value: string): string {
  return new Date(value).toLocaleString(locale.value, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const route = useRoute()
const isPaletteView = computed(() => route.name === 'palette' || !!route.meta.paletteView)
const projects = ref<Project[]>([]), folders = ref<FolderResponse[]>([]), bookmarks = ref<ColorBookmarkResponse[]>([])
const projectId = ref<number | null>(null), folderId = ref<number | null>(null), bookmarkId = ref<number | null>(null)
const loading = ref(false), loadingContext = ref(false), busy = ref(false), error = ref(''), contextError = ref(''), title = ref(''), move = ref(false), loggedIn = ref(false)
const creatingProject = ref(false), createError = ref('')
const newProject = ref({ title: '', slug: '', description: '', private: false })
const projectTitleInput = ref<HTMLInputElement | null>(null)
const isClone = computed(() => projectTransfer.value?.kind === 'palette' && !!projectTransfer.value.clone)
const isPersonalDestination = computed(() => isClone.value && projectId.value === null)
const modalTitle = computed(() => t(creatingProject.value ? 'projects.new' : isClone.value ? 'projects.clonePalette' : 'projects.addToProject'))
const destinationLabel = computed(() => t(isClone.value ? 'projects.cloneDestination' : 'projects.titlePlural'))
const selectedProject = computed(() => projects.value.find(p => p.id === projectId.value))
const projectOptions = computed<ProjectContentOption[]>(() => [
  ...(isClone.value ? [{ id: null, title: t('bookmarksPage.personal') }] : []),
  ...projects.value.map(project => ({ id: project.id, title: project.title, subtitle: project.creator_username })),
])
const canWrite = computed(() => loggedIn.value && (isPersonalDestination.value || (selectedProject.value?.permissions.includes(projectTransfer.value?.kind === 'palette' ? 'add_palettes' : bookmarkId.value === null ? 'add_bookmarks' : 'edit_bookmarks') ?? false)))
const canCreateFolder = computed(() => loggedIn.value && (isPersonalDestination.value || !!selectedProject.value?.permissions.includes('manage_folders')))
const titleError = computed(() => projectTransfer.value?.kind === 'palette' ? getPaletteTitleError(title.value) : '')
let generation = 0, contextRequest = 0
function close() { if (!busy.value) projectTransfer.value = null }
function onEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !projectTransfer.value) return
  event.preventDefault()
  event.stopImmediatePropagation()
  close()
}
onMounted(() => document.addEventListener('keydown', onEscape))
onBeforeUnmount(() => document.removeEventListener('keydown', onEscape))
async function startProjectCreation() {
  creatingProject.value = true
  createError.value = ''
  await nextTick()
  projectTitleInput.value?.focus()
}
async function createProject() {
  if (busy.value || !loggedIn.value || !newProject.value.title.trim()) return
  busy.value = true; createError.value = ''
  try {
    const project = await projectsApi.create({
      title: newProject.value.title.trim(),
      slug: newProject.value.slug.trim() || undefined,
      description: newProject.value.description,
      private: newProject.value.private,
    })
    projects.value.push(project)
    projectId.value = project.id
    creatingProject.value = false
    error.value = ''
    newProject.value = { title: '', slug: '', description: '', private: false }
    window.dispatchEvent(new Event('rgbast:projects-updated'))
  } catch(e) { createError.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
async function createFolder(payload: { name: string; parentId: number | null }) {
  const id = projectId.value, current = contextRequest
  if (busy.value || !canCreateFolder.value) return
  busy.value = true; error.value = ''
  try {
    const data = { name: payload.name, parent_folder_id: payload.parentId }
    const folder = id === null ? await foldersApi.create(data) : await projectsApi.createFolder(id, data)
    if (current === contextRequest) { folders.value.push(folder); folderId.value = folder.id }
    window.dispatchEvent(new Event('rgbast:project-content-updated'))
  } catch(e) { if (current === contextRequest) error.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
watch(projectTransfer, async item => {
  const current = ++generation
  contextRequest++; error.value = ''; contextError.value = ''; projectId.value = null; projects.value = []; folders.value = []; bookmarks.value = []; bookmarkId.value = null; move.value = false
  creatingProject.value = false; createError.value = ''; loading.value = false; loadingContext.value = false
  newProject.value = { title: '', slug: '', description: '', private: false }
  if (!item) return
  loggedIn.value = !!localStorage.getItem('access_token'); title.value = item.title
  if (!loggedIn.value) return
  loading.value = true
  try { const list = await projectsApi.mine(); if (current === generation) { projects.value = list.filter(p => item.kind === 'palette' ? p.permissions.includes('add_palettes') : p.permissions.includes('add_bookmarks') || p.permissions.includes('edit_bookmarks')); projectId.value = isClone.value ? null : projects.value[0]?.id ?? null } }
  catch(e) { if (current === generation) error.value = e instanceof Error ? e.message : String(e) }
  finally { if (current === generation) loading.value = false }
})
watch([projectId, projectTransfer], async ([id, item]) => {
  const current = ++contextRequest
  folderId.value = null; bookmarkId.value = null; folders.value = []; bookmarks.value = []; contextError.value = ''; loadingContext.value = false
  if (!item || !loggedIn.value || (id === null && !isPersonalDestination.value)) return
  loadingContext.value = true
  try {
    if (item.kind === 'palette') {
      let result: FolderResponse[]
      if (id === null) {
        const user = await authApi.checkAuth()
        if (current !== contextRequest) return
        result = await foldersApi.getByUsername(user.username)
      } else result = await projectsApi.folders(id)
      if (current === contextRequest) folders.value = result
    } else { const result = await colorBookmarksApi.listMine(item.hex, id); if (current === contextRequest) bookmarks.value = result.bookmarks }
  } catch(e) { if (current === contextRequest) contextError.value = e instanceof Error ? e.message : String(e) }
  finally { if (current === contextRequest) loadingContext.value = false }
})
async function submit() {
  const item = projectTransfer.value, project = selectedProject.value
  if (!item || (!project && !isPersonalDestination.value) || busy.value || loading.value || loadingContext.value || contextError.value || titleError.value || !title.value.trim() || !canWrite.value) return
  busy.value = true; error.value = ''
  try {
    if (item.kind === 'palette') {
      if (isPersonalDestination.value) {
        const result = await palettesApi.create({ title: title.value, description: item.description ?? '', folder_id: folderId.value, palette_colors: item.colors ?? [] })
        palettesApi.cachePalette({ ...result, palette_colors: item.colors ?? [] })
      } else if (project) {
        const result = await ApiClient.post<PaletteCreateResponse>(`/projects/${project.id}/add-palette`, { source_palette_id: item.id ?? null, mode: !isClone.value && move.value ? 'move' : 'copy', title: title.value, description: item.description ?? '', folder_id: folderId.value, palette_colors: item.colors ?? [] })
        if (!isClone.value && move.value) item.onMoved?.(`${projectUrl(project)}/${[...result.folder_path, result.title].map(encodeURIComponent).join('/')}`)
      }
    } else if (project) {
      if (bookmarkId.value !== null) await colorBookmarksApi.update(bookmarkId.value, { label: title.value.trim() })
      else await colorBookmarksApi.create(item.hex!, { label: title.value.trim() }, project.id)
    }
    window.dispatchEvent(new Event('rgbast:project-content-updated'))
    projectTransfer.value = null
  } catch(e) { error.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
</script>
<style scoped>
.project-create-button{display:inline-flex;align-items:center;gap:8px;margin-bottom:18px}
</style>

