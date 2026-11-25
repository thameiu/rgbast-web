<template>
  <section>
    <div class="project-tools">
      <input v-model="query" :placeholder="t('searchPage.palettePlaceholder')" :aria-label="t('searchPage.palettePlaceholder')" />
      <div v-if="can('add_palettes') || can('manage_folders')" class="project-new-menu" @mouseenter="newMenuOpen = true" @mouseleave="newMenuOpen = false" @keydown.esc="newMenuOpen = false">
        <button :aria-expanded="newMenuOpen" @click="newMenuOpen = !newMenuOpen">{{ t('common.new') }} <AppIcon name="chevron-down" :size="12" /></button>
        <Transition name="project-fade"><div v-if="newMenuOpen" class="project-new-options">
          <button v-if="can('add_palettes')" @click="newMenuOpen = false; newPalette()">{{ t('common.newPalette') }}</button>
          <button v-if="can('manage_folders') && active !== 'all'" @click="newMenuOpen = false; createFolderHere()">{{ t('common.newFolder') }}</button>
          <button v-if="can('add_palettes')" @click="newMenuOpen = false; openImport()">{{ t('projects.importPalette') }}</button>
        </div></Transition>
      </div>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
    <ProjectSkeleton v-if="loading" content-only />
    <div v-else class="project-palette-layout">
      <aside class="project-folder-sidebar">
        <p class="project-folder-sidebar-title">{{ t('dashboard.folders') }}</p>
        <FolderTree
          :folders="folders" :model-value="active" theme="light" mode="navigation"
          :allowFolderEditing="can('manage_folders')" :allowPaletteMoving="can('edit_palettes')"
          :palettes="palettes" :paletteCounts="counts" :totalCount="palettes.length"
          :rootCount="palettes.filter(p => p.folder_id == null).length" :draggingId="draggedId"
          @update:model-value="active = $event ?? 'root'" @selectPalette="openPalette"
          @createFolder="createTreeFolder" @renameFolder="renameTreeFolder"
          @deleteFolder="can('manage_folders') && open('deleteFolder', $event)" @movePalette="moveTreePalette"
        />
      </aside>
      <div>
        <nav class="project-path" :aria-label="t('dashboard.folders')">
          <button type="button" class="project-path-back" :aria-label="typeof active === 'number' ? t('palette.back') : t('folderTree.root')" @click="back"><AppIcon :name="typeof active === 'number' ? 'arrow-left' : 'home'" :size="18" /></button>
          <span v-if="active === 'all'">{{ t('folderTree.allPalettes') }}</span>
          <template v-else v-for="segment in breadcrumbSegments" :key="segment.key">
            <span class="project-path-separator" aria-hidden="true">/</span>
            <button type="button" class="project-path-segment" :aria-current="active === segment.key ? 'page' : undefined" @click="active = segment.key">{{ segment.label }}</button>
          </template>
        </nav>
        <div class="project-grid project-content-grid">
          <article v-if="isCreatingFolderCard" class="project-folder-card project-folder-card--creating">
            <input
              ref="folderCreateInput" v-model="folderCreateName" class="project-folder-create-input"
              :class="{ 'project-folder-create-input--error': !!folderCreateError }"
              :placeholder="t('folderTree.folderNamePlaceholder')" :aria-label="t('folderTree.folderNamePlaceholder')"
              :aria-invalid="!!folderCreateError" :disabled="savingFolderCard"
              @keydown.enter.prevent="saveFolderCard" @keydown.esc.prevent="cancelFolderCard"
            />
            <p v-if="folderCreateError" class="project-folder-create-error" role="alert">{{ folderCreateError }}</p>
            <div class="project-folder-create-actions">
              <button type="button" :disabled="savingFolderCard" @click="cancelFolderCard">{{ t('common.cancel') }}</button>
              <button type="button" :disabled="busy || !folderCreateName.trim() || !!folderCreateError" @click="saveFolderCard">{{ savingFolderCard ? t('dashboard.creatingFolder') : t('common.save') }}</button>
            </div>
          </article>
          <article v-for="folder in visibleFolders" :key="`f${folder.id}`" class="project-folder-card" tabindex="0" @click="folderEditId !== folder.id && (active = folder.id)" @keydown.enter.self="folderEditId !== folder.id && (active = folder.id)" @dragover.prevent @drop.prevent="dropPalette(folder.id, $event)">
            <template v-if="folderEditId === folder.id">
              <input v-model="folderEditName" class="project-folder-create-input" :class="{ 'project-folder-create-input--error': !!folderEditError }" :data-project-folder-edit-id="folder.id" :aria-label="t('folderTree.folderNamePlaceholder')" :aria-invalid="!!folderEditError" :disabled="savingFolderEdit" @click.stop @keydown.enter.prevent="saveFolderEdit" @keydown.esc.prevent="cancelFolderEdit" />
              <p v-if="folderEditError" class="project-folder-create-error" role="alert">{{ folderEditError }}</p>
              <div class="project-folder-create-actions">
                <button type="button" :disabled="savingFolderEdit" @click.stop="cancelFolderEdit">{{ t('common.cancel') }}</button>
                <button type="button" :disabled="busy || !folderEditName.trim() || !!folderEditError" @click.stop="saveFolderEdit">{{ t('common.save') }}</button>
              </div>
            </template>
            <template v-else>
              <h3 class="font-display">{{ folder.name }}</h3>
              <p><AppIcon name="palette" :size="14" /> {{ counts[folder.id] ?? 0 }} · <AppIcon name="folder" :size="14" /> {{ folders.filter(f => f.parent_folder_id === folder.id).length }}</p>
            </template>
            <div v-if="can('manage_folders') && folderEditId !== folder.id" class="project-folder-actions">
              <button :title="t('common.edit')" @click.stop="startFolderEdit(folder)"><AppIcon name="edit" :size="12" /></button>
              <button class="project-folder-action--danger" :title="t('dashboard.deleteFolder')" @click.stop="open('deleteFolder', folder)"><AppIcon name="trash" :size="13" /></button>
            </div>
          </article>
          <div v-for="palette in visiblePalettes" :key="`p${palette.id}`">
            <PaletteCard :palette="palette" :is-own="palette.owner_username === viewerUsername" :showActions="false" :draggableEnabled="can('edit_palettes')" @open="openPalette(palette)" @dragstart="draggedId = palette.id" @dragend="draggedId = null">
              <template #actions><div class="project-palette-actions" :class="{ 'project-palette-actions--clone': palette.owner_username !== viewerUsername }">
                <button v-if="can('edit_palettes')" :title="t('dashboard.editPalette')" :aria-label="t('dashboard.editPalette')" @click.stop="open('edit', palette)"><AppIcon name="edit" :size="14" /></button>
                <button v-if="can('remove_palettes')" :title="t('projects.removePalette')" @click.stop="open('remove', palette)"><AppIcon name="x" :size="14" /></button>
              </div></template>
            </PaletteCard>
          </div>
        </div>
        <AtelierEmptyState v-if="!isCreatingFolderCard && !visibleFolders.length && !visiblePalettes.length" icon="palette" :message="t(active === 'all' ? 'dashboard.noPalettes' : 'dashboard.noFolderPalettes')" />
      </div>
    </div>
    <Teleport to="body"><Transition name="project-fade">
      <div v-if="mode" class="project-overlay" @keydown.esc="mode = null">
        <form class="project-modal" role="dialog" aria-modal="true" :aria-label="t(mode === 'edit' ? 'dashboard.editPalette' : 'projects.contentAction')" @submit.prevent="submit">
          <button type="button" class="project-close" @click="mode = null" :aria-label="t('common.cancel')"><AppIcon name="x" :size="18" /></button>
          <h2>{{ t(mode === 'edit' ? 'dashboard.editPalette' : 'projects.contentAction') }}</h2>
          <template v-if="mode === 'edit'">
            <label>{{ t('common.name') }}<input v-model="name" required maxlength="50" pattern="[a-zA-Z0-9._-]+" :disabled="busy" :aria-invalid="mode === 'edit' && !!paletteTitleError" /></label>
            <p v-if="paletteTitleError" class="project-error" role="alert">{{ paletteTitleError }}</p>
            <label v-if="mode === 'edit'">{{ t('projects.description') }}<textarea v-model="description" maxlength="500" rows="3" :disabled="busy" /></label>
          </template>
          <div v-if="mode === 'import'" class="project-modal-field">
            <span>{{ t('projects.importPalette') }}</span>
            <ProjectContentSelect v-model="importId" :options="paletteOptions" :label="t('projects.importPalette')" :placeholder="t('projects.choosePalette')" :disabled="busy || loadingImport" />
            <p v-if="loadingImport" role="status">{{ t('common.loading') }}</p>
          </div>
          <div v-if="['edit', 'import'].includes(mode)" class="project-modal-field">
            <span>{{ t('dashboard.folders') }}</span>
            <fieldset class="project-folder-field" :disabled="busy" :aria-label="t('dashboard.folders')">
              <FolderPicker :key="mode" v-model="parentId" :folders="folders" theme="light" :allowFolderEditing="can('manage_folders')" @createFolder="createDestinationFolder" />
            </fieldset>
          </div>
          <p v-if="mode === 'import'">{{ t('projects.importWarning') }}</p>
          <template v-if="mode === 'remove'">
            <p class="project-removal-intro">{{ t('projects.removeChoice') }}</p>
            <label class="project-removal-option">
              <input v-model="removalStrategy" type="radio" value="make_public" :disabled="busy" />
              <span><strong>{{ t('projects.makePublic') }}</strong><small>{{ t('projects.removeWarning') }}</small></span>
            </label>
            <label class="project-removal-option" :class="{ 'project-removal-option--disabled': !canDeleteTarget }">
              <input v-model="removalStrategy" type="radio" value="delete" :disabled="busy || !canDeleteTarget" />
              <span><strong>{{ t('dashboard.deletePermanently') }}</strong><small>{{ t(canDeleteTarget ? 'projects.deletePaletteWarning' : 'projects.onlyCreatorCanDelete') }}</small></span>
            </label>
          </template>
          <template v-if="mode === 'deleteFolder'">
            <p>{{ t('projects.folderDeleteWarning') }}</p>
            <label class="project-removal-option"><input v-model="strategy" type="radio" value="move_root" :disabled="busy" /><span><strong>{{ t('projects.moveToRoot') }}</strong><small>{{ t('dashboard.deleteFolderConfirm') }}</small></span></label>
            <label class="project-removal-option"><input v-model="strategy" type="radio" value="delete" :disabled="busy" /><span><strong>{{ t('projects.deleteContained') }}</strong><small>{{ t('projects.deletePaletteWarning') }}</small></span></label>
          </template>
          <p v-if="modalError" role="alert">{{ modalError }}</p>
          <div class="project-modal-actions"><button type="button" :disabled="busy" @click="mode = null">{{ t('common.cancel') }}</button><button :disabled="busy || (mode === 'edit' && !!paletteTitleError) || (mode === 'remove' && removalStrategy === 'delete' && !canDeleteTarget) || (mode === 'import' && (importId === null || loadingImport))">{{ t(mode === 'edit' ? 'common.save' : 'profilePage.confirm') }}</button></div>
        </form>
      </div>
    </Transition></Teleport>
  </section>
</template>
<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { projectsApi, projectUrl, type Project, type ProjectPalette, type ProjectPermission } from '@/api/projects'
import { palettesApi } from '@/api/palettes'
import { getPaletteTitleError } from '@/utils/paletteConstraints'
import type { FolderResponse, PaletteCache, PaletteByUsernameItemResponse } from '@/api/types'
import FolderTree from '@/components/folder/FolderTree.vue'
import FolderPicker from '@/components/folder/FolderPicker.vue'
import ProjectContentSelect from './ProjectContentSelect.vue'
import PaletteCard from '@/components/palette/PaletteCard.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import ProjectSkeleton from './ProjectSkeleton.vue'
import AtelierEmptyState from '@/components/ui/AtelierEmptyState.vue'
import { useI18n } from '@/i18n'
const props = defineProps<{ project: Project; viewerUsername?: string }>()
const { t } = useI18n(), router = useRouter()
const folders = ref<FolderResponse[]>([]), palettes = ref<ProjectPalette[]>([])
const active = ref<'all' | 'root' | number>('root'), query = ref(''), loading = ref(true), error = ref(''), busy = ref(false), modalError = ref('')
type Mode = 'deleteFolder' | 'edit' | 'remove' | 'import'
const mode = ref<Mode | null>(null), name = ref(''), description = ref(''), parentId = ref<number | null>(null), targetId = ref<number | null>(null)
const removalStrategy = ref<'make_public' | 'delete'>('make_public')
const canDeleteTarget = computed(() => !!props.viewerUsername && palettes.value.find(palette => palette.id === targetId.value)?.owner_username === props.viewerUsername)
const paletteTitleError = computed(() => mode.value === 'edit' && getPaletteTitleError(name.value) ? t('errors.titleInvalid') : '')
const newMenuOpen = ref(false)
const folderEditId = ref<number | null>(null), folderEditName = ref(''), folderEditServerError = ref(''), savingFolderEdit = ref(false)
const folderEditError = computed(() => {
  if (folderEditServerError.value) return folderEditServerError.value
  const folder = folders.value.find(item => item.id === folderEditId.value), name = folderEditName.value.trim().toLocaleLowerCase()
  return folder && name && folders.value.some(item => item.id !== folder.id && item.parent_folder_id === folder.parent_folder_id && item.name.toLocaleLowerCase() === name) ? t('dashboard.folderNameTaken') : ''
})
watch(folderEditName, () => { folderEditServerError.value = '' })
watch(active, () => { folderEditId.value = null })
const isCreatingFolderCard = ref(false), savingFolderCard = ref(false), folderCreateName = ref(''), folderCreateServerError = ref('')
const folderCreateInput = ref<HTMLInputElement | null>(null)
const folderCreateParentId = ref<number | null>(null)
const folderCreateError = computed(() => {
  if (folderCreateServerError.value) return folderCreateServerError.value
  const name = folderCreateName.value.trim().toLocaleLowerCase()
  return name && folders.value.some(folder => (folder.parent_folder_id ?? null) === folderCreateParentId.value && folder.name.toLocaleLowerCase() === name)
    ? t('dashboard.folderNameTaken') : ''
})
watch(folderCreateName, () => { folderCreateServerError.value = '' })
watch(active, () => { isCreatingFolderCard.value = false })
const strategy = ref<'move_root' | 'delete'>('move_root'), importId = ref<number | null>(null), draggedId = ref<number | null>(null)
const personalPalettes = ref<PaletteByUsernameItemResponse[]>([])
const loadingImport = ref(false)
let importRequest = 0
const paletteOptions = computed(() => personalPalettes.value.map(palette => ({
  id: palette.id, title: palette.title, subtitle: '/ ' + (palette.folder_path ?? []).join(' / '),
  colors: palette.latest_main_snapshot?.palette_colors ?? [],
})))
const can = (permission: ProjectPermission) => props.project.permissions.includes(permission)
const counts = computed(() => { const result: Record<number, number> = {}; for (const p of palettes.value) if (p.folder_id != null) result[p.folder_id] = (result[p.folder_id] ?? 0) + 1; return result })
const visibleFolders = computed(() => active.value === 'all' ? [] : folders.value.filter(f => f.parent_folder_id === (typeof active.value === 'number' ? active.value : null) && f.name.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())).sort((a,b) => a.name.localeCompare(b.name)))
const visiblePalettes = computed(() => palettes.value.filter(p => (active.value === 'all' || p.folder_id === (typeof active.value === 'number' ? active.value : null)) && p.title.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())))
const breadcrumbSegments = computed(() => {
  const segments: Array<{ key: 'root' | number; label: string }> = [{ key: 'root', label: props.project.title }]
  const ancestors: Array<{ key: number; label: string }> = [], seen = new Set<number>()
  let folder = typeof active.value === 'number' ? folders.value.find(item => item.id === active.value) : undefined
  while (folder && !seen.has(folder.id)) {
    seen.add(folder.id); ancestors.unshift({ key: folder.id, label: folder.name })
    folder = folders.value.find(item => item.id === folder!.parent_folder_id)
  }
  return [...segments, ...ancestors]
})
function folderNames(id: number) { const names: string[] = [], seen = new Set<number>(); let folder = folders.value.find(f => f.id === id); while (folder && !seen.has(folder.id)) { names.unshift(folder.name); seen.add(folder.id); folder = folders.value.find(f => f.id === folder!.parent_folder_id) } return names }
function back() { active.value = typeof active.value === 'number' ? folders.value.find(f => f.id === active.value)?.parent_folder_id ?? 'root' : 'root' }
function openPalette(p: PaletteCache) { void router.push(`${projectUrl(props.project)}/${[...(p.folder_path ?? []), p.title].map(encodeURIComponent).join('/')}`) }
function newPalette() {
  if (busy.value || !can('add_palettes')) return
  void router.push({
    name: 'project-palette',
    params: { username: props.project.creator_username, projectSlug: props.project.slug, pathMatch: ['new'] },
    state: { folderId: typeof active.value === 'number' ? active.value : null, hasFolderPreset: true },
  })
}
function open(action: Mode, target?: { id: number; name?: string; title?: string; description?: string; parent_folder_id?: number | null; folder_id?: number | null }) {
  if (action === 'edit' && !can('edit_palettes')) return
  if (action === 'remove' && !can('remove_palettes')) return
  removalStrategy.value = 'make_public'
  cancelFolderCard()
  importRequest++; loadingImport.value = false
  mode.value = action; modalError.value = ''; targetId.value = target?.id ?? null; name.value = target?.name ?? target?.title ?? ''
  description.value = target?.description ?? ''
  parentId.value = target ? target.parent_folder_id ?? target.folder_id ?? null : typeof active.value === 'number' ? active.value : null
}
async function load() { error.value = ''; try { [folders.value, palettes.value] = await Promise.all([projectsApi.folders(props.project.id), projectsApi.palettes(props.project.id)]) } catch(e) { error.value = e instanceof Error ? e.message : String(e) } finally { loading.value = false } }
async function openImport() {
  open('import'); importId.value = null; personalPalettes.value = []; loadingImport.value = true
  const request = ++importRequest
  try {
    if (props.viewerUsername) {
      const result = await palettesApi.getByUsername(props.viewerUsername)
      if (request === importRequest) personalPalettes.value = result.palettes
    }
  } catch(e) { if (request === importRequest) modalError.value = e instanceof Error ? e.message : String(e) }
  finally { if (request === importRequest) loadingImport.value = false }
}
async function createDestinationFolder(payload: { name: string; parentId: number | null }) {
  if (busy.value || !can('manage_folders')) return
  busy.value = true; modalError.value = ''
  try {
    const folder = await projectsApi.createFolder(props.project.id, { name: payload.name, parent_folder_id: payload.parentId })
    folders.value.push(folder); parentId.value = folder.id
  } catch(e) { modalError.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
async function createFolderHere() {
  if (active.value === 'all' || busy.value || !can('manage_folders')) return
  cancelFolderEdit()
  if (!isCreatingFolderCard.value) {
    folderCreateName.value = ''; folderCreateServerError.value = ''
    folderCreateParentId.value = typeof active.value === 'number' ? active.value : null
    isCreatingFolderCard.value = true
  }
  query.value = ''
  await nextTick()
  folderCreateInput.value?.focus()
}
function cancelFolderCard() {
  if (savingFolderCard.value) return
  isCreatingFolderCard.value = false; folderCreateName.value = ''; folderCreateServerError.value = ''
}
async function saveFolderCard() {
  const name = folderCreateName.value.trim(), parentId = folderCreateParentId.value
  if (!isCreatingFolderCard.value || active.value === 'all' || busy.value || !can('manage_folders') || !name || folderCreateError.value) return
  busy.value = true; savingFolderCard.value = true; folderCreateServerError.value = ''
  try {
    const folder = await projectsApi.createFolder(props.project.id, { name, parent_folder_id: parentId })
    folders.value.push(folder)
    isCreatingFolderCard.value = false; folderCreateName.value = ''
  } catch(e) { folderCreateServerError.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false; savingFolderCard.value = false }
}
async function createTreeFolder(payload: { name: string; parentId: number | null }) {
  if (busy.value || !can('manage_folders')) return
  busy.value = true; error.value = ''
  try {
    const folder = await projectsApi.createFolder(props.project.id, { name: payload.name, parent_folder_id: payload.parentId })
    folders.value.push(folder)
  } catch(e) { error.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
async function startFolderEdit(folder: FolderResponse) {
  if (busy.value || !can('manage_folders')) return
  cancelFolderCard()
  folderEditId.value = folder.id; folderEditName.value = folder.name; folderEditServerError.value = ''
  await nextTick()
  document.querySelector<HTMLInputElement>(`[data-project-folder-edit-id="${folder.id}"]`)?.focus()
}
function cancelFolderEdit() {
  if (savingFolderEdit.value) return
  folderEditId.value = null; folderEditName.value = ''; folderEditServerError.value = ''
}
async function saveFolderEdit() {
  const id = folderEditId.value, name = folderEditName.value.trim()
  if (id === null || busy.value || !can('manage_folders') || !name || folderEditError.value) return
  busy.value = true; savingFolderEdit.value = true; folderEditServerError.value = ''
  try {
    const updated = await projectsApi.updateFolder(props.project.id, id, { name })
    const index = folders.value.findIndex(folder => folder.id === id)
    if (index >= 0) folders.value[index] = updated
    for (const palette of palettes.value) palette.folder_path = palette.folder_id == null ? [] : folderNames(palette.folder_id)
    folderEditId.value = null
  } catch(e) { folderEditServerError.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false; savingFolderEdit.value = false }
}
async function renameTreeFolder(payload: { id: number; name: string }) {
  if (busy.value || !can('manage_folders')) return
  busy.value = true; error.value = ''
  try {
    const updated = await projectsApi.updateFolder(props.project.id, payload.id, { name: payload.name })
    const index = folders.value.findIndex(folder => folder.id === payload.id)
    if (index >= 0) folders.value[index] = updated
    for (const palette of palettes.value) palette.folder_path = palette.folder_id == null ? [] : folderNames(palette.folder_id)
  } catch(e) { error.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
async function moveTreePalette(payload: { paletteId: number; targetFolderId: number | null }) {
  if (busy.value || !can('edit_palettes')) return
  const palette = palettes.value.find(item => item.id === payload.paletteId)
  if (!palette || palette.folder_id === payload.targetFolderId) return
  busy.value = true; error.value = ''
  try {
    await palettesApi.updatePalette(palette.id, { folder_id: payload.targetFolderId })
    palette.folder_id = payload.targetFolderId
    palette.folder_path = payload.targetFolderId === null ? [] : folderNames(payload.targetFolderId)
  } catch(e) { error.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
async function dropPalette(folderId: number, _event: DragEvent) {
  if (draggedId.value !== null) await moveTreePalette({ paletteId: draggedId.value, targetFolderId: folderId })
}
async function submit() {
  if (mode.value === 'remove' && (!can('remove_palettes') || (removalStrategy.value === 'delete' && !canDeleteTarget.value))) return
  if (busy.value || (mode.value === 'edit' && (!can('edit_palettes') || !!paletteTitleError.value || targetId.value === null)) || (mode.value === 'import' && (importId.value === null || loadingImport.value))) return
  busy.value = true; modalError.value = ''
  try {
    const id = props.project.id
    if (mode.value === 'deleteFolder') { await projectsApi.deleteFolder(id, targetId.value!, strategy.value); if (active.value === targetId.value) active.value = 'root' }
    if (mode.value === 'edit') {
      const updated = await palettesApi.updatePalette(targetId.value!, { title: name.value.trim(), description: description.value.trim(), folder_id: parentId.value })
      const palette = palettes.value.find(item => item.id === updated.id)
      if (palette) Object.assign(palette, { title: updated.title, description: updated.description, folder_id: updated.folder_id, folder_path: updated.folder_path })
      mode.value = null
      return
    }
    if (mode.value === 'remove') await projectsApi.removePalette(id, targetId.value!, removalStrategy.value)
    if (mode.value === 'import') await projectsApi.importPalette(id, importId.value!, { folder_id: parentId.value })
    mode.value = null; await load()
  } catch(e) { modalError.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
onMounted(load)
function refreshContent() { void load() }
onMounted(() => window.addEventListener('rgbast:project-content-updated', refreshContent))
onBeforeUnmount(() => window.removeEventListener('rgbast:project-content-updated', refreshContent))
</script>
<style scoped>
.project-palette-layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:clamp(24px,3vw,40px)}.project-tools{flex-wrap:wrap}.project-path{display:flex;gap:12px;align-items:center;margin-bottom:24px;overflow-wrap:anywhere;font-size:12px;color:var(--ink-2)}.project-path button{background:none;color:var(--ink);padding:4px;border:0;cursor:pointer}.project-content-grid{align-items:start;row-gap:44px}.project-palette-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.project-folder-sidebar{min-width:0;align-self:start;position:sticky;top:92px}.project-folder-sidebar-title{font:600 10px var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);margin:4px 0 14px}
.project-path{flex-wrap:wrap;gap:0;font:400 11px var(--font-mono);min-width:0}
.project-path .project-path-back{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:6px}
.project-path .project-path-segment{padding:3px 4px;max-width:100%;border-radius:5px;color:var(--ink-3);font:inherit;overflow-wrap:anywhere;transition:color .15s ease,background .15s ease}
.project-path .project-path-segment:hover{background:rgba(180,16,204,.08);color:var(--ink)}
.project-path .project-path-segment[aria-current=page]{color:var(--ink-2);font-weight:500}
.project-path .project-path-segment:focus-visible{outline:1px solid var(--ink);outline-offset:2px}
.project-path-separator{padding:0 2px;opacity:.4}
.project-folder-card--creating{cursor:default}
.project-folder-create-input{width:100%;min-width:0;box-sizing:border-box;padding:8px 10px 6px;border:1px solid rgba(14,14,16,.16);border-radius:8px;background:rgba(14,14,16,.07);color:var(--ink);font:700 28px/1 var(--font-display);outline:none;transition:background .16s ease,border-color .16s ease,box-shadow .16s ease}
.project-folder-create-input::placeholder{color:rgba(14,14,16,.28)}
.project-folder-create-input:focus{background:rgba(14,14,16,.1);border-color:rgba(180,16,204,.55);box-shadow:0 0 0 3px rgba(180,16,204,.1)}
.project-folder-create-input--error{color:#b32032}
.project-folder-create-error{display:block;margin-top:6px;font-size:10.5px;color:#b32032;overflow-wrap:anywhere}
.project-folder-create-actions{display:flex;gap:8px;margin-top:10px}
.project-folder-create-actions button{padding:6px 12px;border-radius:8px;border:1px solid var(--ink);background:var(--ink);color:var(--paper);font:600 11px var(--font-sans);cursor:pointer}
.project-folder-create-actions button:first-child{background:transparent;color:var(--ink-2);border-color:var(--rule)}
.project-folder-create-actions button:first-child:hover{color:var(--ink);border-color:var(--ink-3)}
.project-folder-create-actions button:disabled{opacity:.4;cursor:not-allowed}
.project-removal-intro{font-size:13px;margin-bottom:16px}
.project-modal .project-removal-option{display:flex;flex-direction:row;align-items:flex-start;gap:10px;padding:12px;border:1px solid var(--rule);border-radius:8px;cursor:pointer;letter-spacing:normal}
.project-removal-option input{margin-top:3px;flex-shrink:0}
.project-removal-option span{display:flex;flex-direction:column;gap:6px;min-width:0}
.project-removal-option strong{font-size:13px;color:var(--ink)}
.project-removal-option small{font-size:12px;line-height:1.5;font-weight:400;color:var(--ink-2)}
.project-removal-option:has(input:checked){border-color:var(--ink);background:rgba(14,14,16,.03)}
.project-removal-option--disabled{opacity:.55;cursor:not-allowed}
@media(max-width:800px){.project-palette-layout{grid-template-columns:minmax(0,1fr)}.project-folder-sidebar{position:static}.project-tools button{flex:1}.project-tools input{flex-basis:100%}}
</style>


<style scoped>
.project-content-grid{gap:16px;align-items:end}.project-palette-actions{position:absolute;top:8px;right:8px;display:flex;gap:6px;z-index:5;margin:0;opacity:0;transition:opacity .15s}.project-content-grid>div:hover .project-palette-actions,.project-content-grid>div:focus-within .project-palette-actions{opacity:1}.project-palette-actions button{width:28px;height:28px;display:flex;align-items:center;justify-content:center;padding:0;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:rgba(14,14,16,.55);color:#fff;cursor:pointer}
.project-palette-actions--clone{right:42px}
@media(hover:none){.project-palette-actions{opacity:1}}
</style>
<style scoped>@media(max-width:768px){.project-palette-actions{opacity:1}}</style>
