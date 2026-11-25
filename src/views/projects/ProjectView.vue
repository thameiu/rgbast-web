<template>
  <main class="project-view">
    <SiteHeader :user="viewer" />
    <section class="project-shell" :aria-busy="loading">
      <RouterLink to="/atelier/projects" class="project-back"><AppIcon name="arrow-left" :size="16" />{{ t('projects.back') }}</RouterLink>
      <ProjectSkeleton v-if="loading" />
      <p v-if="error" class="project-error" role="alert">{{ error }}</p>
      <template v-if="project && !loading">
        <div class="project-heading">
          <div class="project-heading-main">
            <AppIcon class="project-heading-icon" name="project" :size="42" />
            <div class="project-title-line">
              <h1 :title="project.title">{{ project.title }}</h1>
              <span class="project-byline">by <RouterLink :to="`/users/${encodeURIComponent(project.creator_username)}`" class="project-author" :title="project.creator_username">{{ project.creator_username }}</RouterLink></span>
            </div>
          </div>
          <span v-if="project.private" class="project-privacy"><AppIcon name="lock" :size="14" />{{ t('projects.private') }}</span>
        </div>
        <p v-if="project.description" class="project-description">{{ project.description }}</p>
        <section class="project-content-section">
          <AtelierTabs :model-value="contentTab" :visible-tabs="['palettes', 'bookmarks']" @update:model-value="tab => { if (tab !== 'projects') contentTab = tab }" />
          <ProjectPalettesPanel v-show="contentTab === 'palettes'" :key="`palettes-${project.id}`" :project="project" :viewerUsername="viewer?.username" />
          <BookmarksView v-show="contentTab === 'bookmarks'" :key="`bookmarks-${project.id}`" embedded :projectId="project.id" :permissions="project.permissions" />
        </section>
        <div class="project-management" :class="{ 'project-management--readonly': !can('edit_project') && !canLeave }">
        <section class="project-section project-members">
          <header class="project-section-head">
            <h2>{{ t('projects.members') }} <span class="project-member-count">{{ members.filter(member => !member.pending).length }}</span></h2>
            <button v-if="can('manage_access')" class="project-action" @click="openInvitation"><AppIcon name="plus" :size="14" />{{ t('projects.invite') }}</button>
          </header>
          <div class="project-member-search"><AppIcon name="search" :size="14" /><input v-model="memberQuery" type="search" :placeholder="t('projects.searchMembers')" :aria-label="t('projects.searchMembers')" /></div>
          <div ref="memberListEl" class="project-member-list" tabindex="0" :aria-label="t('projects.members')" :style="{ maxHeight: memberListMaxHeight === null ? undefined : `${memberListMaxHeight}px` }">
          <p v-if="!filteredMembers.length" class="project-member-empty">{{ t('colleaguesModal.noSearchResults') }}</p>
          <article v-for="member in filteredMembers" :key="member.id" class="project-member">
            <UserAvatar class="project-avatar" :username="member.username" :color="member.profile_color" />
            <RouterLink :to="`/users/${encodeURIComponent(member.username)}`" class="project-member-name">{{ member.username }}</RouterLink>
            <span v-if="member.creator" class="project-role">{{ t('projects.creator') }}</span>
            <span v-else-if="member.pending" class="project-role project-role--pending"><AppIcon name="clock-3" :size="13" />{{ t('projects.pending') }}</span>
            <div v-if="!member.creator && can('manage_access')" class="project-member-actions">
              <button v-if="!member.pending" class="project-icon-button" :aria-label="t('projects.permissions')" :title="t('projects.permissions')" @click="editMember(member)"><AppIcon name="settings" :size="16" /></button>
              <button class="project-icon-button project-icon-button--danger" :disabled="busy" :aria-label="t(member.pending ? 'projects.cancelInvitation' : 'profilePage.remove')" :title="t(member.pending ? 'projects.cancelInvitation' : 'profilePage.remove')" @click="openRemoval(member)"><AppIcon name="x" :size="16" /></button>
            </div>
          </article>
          </div>
        </section>
        <section v-if="can('edit_project') || canLeave" ref="projectSettingsEl" class="project-section project-settings">
          <header class="project-section-head"><h2>{{ t('common.settings') }}</h2></header>
          <form v-if="can('edit_project')" class="project-settings-form" @submit.prevent="save">
          <div class="project-field-row">
          <label>{{ t('projects.title') }}<input v-model="form.title" maxlength="50" required /></label>
          <label>{{ t('projects.slug') }}<input v-model="form.slug" maxlength="50" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label>
          </div>
          <p v-if="form.slug !== project.slug" class="project-field-hint">{{ t('projects.slugWarning') }}</p>
          <label>{{ t('projects.description') }}<textarea v-model="form.description" maxlength="5000" rows="4" /></label>
          <div class="project-settings-actions"><ProjectPrivacyToggle v-model="form.private" :disabled="busy" /><button type="submit" class="project-action" :disabled="busy || !form.title.trim()">{{ busy ? t('dashboard.saving') : t('common.save') }}</button></div>
          </form>
        <div v-if="viewer?.id === project.creator_id" class="project-danger">
          <h2>{{ t('projects.delete') }}</h2>
          <button class="project-action project-action--danger" :disabled="busy" @click="openRemoval()"><AppIcon name="trash" :size="15" />{{ t('common.delete') }}</button>
        </div>
        <div v-else-if="canLeave" class="project-danger">
          <h2>{{ t('projects.leave') }}</h2>
          <button type="button" class="project-action project-action--danger" :disabled="busy" @click="modalError = ''; leaveOpen = true"><AppIcon name="logout" :size="15" />{{ t('projects.leave') }}</button>
        </div>
        </section>
        </div>
      </template>
    </section>
    <Teleport to="body"><Transition name="project-fade">
      <div v-if="memberOpen" class="project-overlay" @keydown.esc="closeDialogs">
        <form class="project-modal project-permissions-modal" role="dialog" aria-modal="true" :aria-label="t(editingMember ? 'projects.permissions' : 'projects.invite')" @submit.prevent="saveMember">
          <button class="project-close" type="button" @click="closeDialogs" :aria-label="t('common.cancel')"><AppIcon name="x" :size="18" /></button>
          <h2>{{ editingMember?.username ?? t('projects.invite') }}</h2>
          <div v-if="!editingMember" class="project-invite-picker">
            <div class="project-presets"><button type="button" :class="{ active: inviteScope === 'colleagues' }" @click="inviteScope = 'colleagues'">{{ t('profilePage.colleagues') }}</button><button type="button" :class="{ active: inviteScope === 'users' }" @click="inviteScope = 'users'">{{ t('projects.allUsers') }}</button></div>
            <ProjectMemberPicker v-model:query="inviteQuery" :users="inviteCandidates" :loading="inviteSearching" :disabled="busy" @select="user => { inviteQuery = user.username; inviteUsername = user.username }" @search="searchInviteUsers" />
            <p v-if="inviteSearchError" class="project-error">{{ inviteSearchError }}</p>
          </div>
          <div class="project-presets"><button v-for="preset in ['viewer', 'contributor', 'admin']" :key="preset" type="button" :class="{ active: matchesPreset(preset) }" :disabled="busy" @click="setPreset(preset)">{{ t(`projects.${preset}`) }}</button></div>
          <div class="project-permission-grid">
          <label v-for="permission in projectPermissions" :key="permission" class="project-checkbox project-permission-option">
            <input v-model="selected" type="checkbox" :value="permission" :disabled="busy || permission === 'read'" />{{ t(`projects.permissionLabels.${permission}`) }}
          </label>
          </div>
          <p v-if="modalError" class="project-error" role="alert">{{ modalError }}</p>
          <div class="project-modal-actions"><button type="button" :disabled="busy" @click="closeDialogs">{{ t('common.cancel') }}</button><button :disabled="busy || (!editingMember && !inviteUsername)">{{ t(editingMember ? 'common.save' : 'projects.invite') }}</button></div>
        </form>
      </div>
      <div v-else-if="leaveOpen" class="project-overlay" @keydown.esc="closeDialogs">
        <form class="project-modal" role="dialog" aria-modal="true" :aria-label="t('projects.leave')" @submit.prevent="leaveProject">
          <button class="project-close" type="button" @click="closeDialogs" :aria-label="t('common.cancel')"><AppIcon name="x" :size="18" /></button>
          <h2>{{ t('projects.leave') }}</h2>
          <p>{{ t('projects.leaveWarning') }}</p>
          <p v-if="modalError" class="project-error" role="alert">{{ modalError }}</p>
          <div class="project-modal-actions"><button type="button" :disabled="busy" @click="closeDialogs">{{ t('common.cancel') }}</button><button class="project-confirm-danger" :disabled="busy">{{ t('projects.leave') }}</button></div>
        </form>
      </div>
      <div v-else-if="deleteOpen || removalTarget" class="project-overlay" @keydown.esc="closeDialogs">
        <form class="project-modal" role="dialog" aria-modal="true" :aria-label="t('profilePage.confirm')" @submit.prevent="confirmRemoval">
          <button class="project-close" type="button" @click="closeDialogs" :aria-label="t('common.cancel')"><AppIcon name="x" :size="18" /></button>
          <h2>{{ t('profilePage.confirm') }}</h2>
          <p>{{ removalTarget ? t(removalTarget.pending ? 'projects.cancelInvitationConfirm' : 'projects.removeMember', { username: removalTarget.username }) : t('projects.deleteWarning') }}</p>
          <label v-if="deleteOpen">{{ t('projects.typeTitle') }}<input v-model="deleteTitle" required /></label>
          <p v-if="modalError" class="project-error" role="alert">{{ modalError }}</p>
          <div class="project-modal-actions"><button type="button" :disabled="busy" @click="closeDialogs">{{ t('common.cancel') }}</button><button class="project-confirm-danger" :disabled="busy || (deleteOpen && deleteTitle !== project?.title)">{{ t('profilePage.confirm') }}</button></div>
        </form>
      </div>
    </Transition></Teleport>
  </main>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ProjectMemberPicker from '@/components/project/ProjectMemberPicker.vue'
import { searchApi } from '@/api/search'
import type { UserSearchItem } from '@/api/types'
import { authApi } from '@/api/auth'
import { colleaguesApi } from '@/api/colleagues'
import { projectsApi, projectUrl, projectPermissions, type Project, type ProjectMember, type ProjectPermission } from '@/api/projects'
import type { ColleagueUserItem, UserMeResponse } from '@/api/types'
import AppIcon from '@/components/icons/AppIcon.vue'
import ProjectSkeleton from '@/components/project/ProjectSkeleton.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import AtelierTabs from '@/components/layout/AtelierTabs.vue'
import BookmarksView from '@/views/bookmarks/BookmarksView.vue'
import ProjectPalettesPanel from '@/components/project/ProjectPalettesPanel.vue'
import ProjectPrivacyToggle from '@/components/project/ProjectPrivacyToggle.vue'
import { useI18n } from '@/i18n'
import { setPageSeo } from '@/utils/seo'
const route = useRoute(), router = useRouter(), { t } = useI18n()
const project = ref<Project | null>(null), viewer = ref<UserMeResponse | null>(null), members = ref<ProjectMember[]>([]), colleagues = ref<ColleagueUserItem[]>([])
const contentTab = ref<'palettes' | 'bookmarks'>('palettes')
const memberQuery = ref('')
const memberListEl = ref<HTMLElement | null>(null), projectSettingsEl = ref<HTMLElement | null>(null)
const memberListMaxHeight = ref<number | null>(null)
let memberListObserver: ResizeObserver | undefined
function measureMemberList() {
  const settings = projectSettingsEl.value, list = memberListEl.value
  // Stacked mobile sections need a viewport cap, not the next section's bottom.
  memberListMaxHeight.value = settings && list && window.matchMedia('(min-width: 901px)').matches
    ? Math.max(64, Math.floor(settings.getBoundingClientRect().bottom - list.getBoundingClientRect().top))
    : null
}
watch([projectSettingsEl, memberListEl], ([settings, list]) => {
  memberListObserver?.disconnect()
  if (settings && list) {
    memberListObserver = new ResizeObserver(measureMemberList)
    memberListObserver.observe(settings)
  }
  measureMemberList()
}, { flush: 'post' })
onMounted(() => window.addEventListener('resize', measureMemberList))
onBeforeUnmount(() => { memberListObserver?.disconnect(); window.removeEventListener('resize', measureMemberList) })
const filteredMembers = computed(() => {
  const query = memberQuery.value.trim().toLocaleLowerCase()
  return members.value.filter(member => !query || [member.username, member.firstname, member.lastname, [member.firstname, member.lastname].filter(Boolean).join(' ')].some(value => value?.toLocaleLowerCase().includes(query)))
})
const loading = ref(true), busy = ref(false), error = ref(''), modalError = ref('')
const form = ref({ title: '', slug: '', description: '', private: false })
const memberOpen = ref(false), editingMember = ref<ProjectMember | null>(null), inviteUsername = ref(''), selected = ref<ProjectPermission[]>(['read'])
const inviteScope = ref<'colleagues' | 'users'>('colleagues'), inviteQuery = ref('')
const inviteResults = ref<UserSearchItem[]>([]), inviteSearching = ref(false), inviteSearchError = ref('')
let inviteRequest = 0
const inviteCandidates = computed(() => (inviteScope.value === 'colleagues' ? colleagues.value.filter(user => user.username.toLowerCase().includes(inviteQuery.value.trim().toLowerCase())) : inviteResults.value).filter(user => user.id !== viewer.value?.id && !members.value.some(member => member.id === user.id)))
watch([inviteScope, inviteQuery], () => { inviteUsername.value = ''; inviteRequest++; inviteSearching.value = false; inviteResults.value = [] }, { flush: 'sync' })
async function searchInviteUsers() {
  if (inviteScope.value === 'colleagues' || !inviteQuery.value.trim()) return
  const request = ++inviteRequest
  inviteSearching.value = true; inviteSearchError.value = ''
  try {
    const result = await searchApi.searchUsers(inviteQuery.value.trim())
    if (request === inviteRequest) inviteResults.value = result.results
  } catch (e) { if (request === inviteRequest) inviteSearchError.value = e instanceof Error ? e.message : String(e) }
  finally { if (request === inviteRequest) inviteSearching.value = false }
}
const deleteOpen = ref(false), deleteTitle = ref(''), removalTarget = ref<ProjectMember | null>(null)
const leaveOpen = ref(false)
const canLeave = computed(() => !!viewer.value && !!project.value && viewer.value.id !== project.value.creator_id && members.value.some(member => !member.pending && member.id === viewer.value!.id))
const can = (permission: ProjectPermission) => project.value?.permissions.includes(permission)
async function refreshMembers() {
  if (!project.value) return
  members.value = await projectsApi.members(project.value.id)
  colleagues.value = viewer.value && can('manage_access') ? (await colleaguesApi.listMine()).colleagues.filter(c => !members.value.some(m => m.id === c.id)) : []
}
async function load() {
  memberQuery.value = ''
  loading.value = true; error.value = ''; project.value = null
  memberOpen.value = false; deleteOpen.value = false; removalTarget.value = null
  leaveOpen.value = false
  try {
    viewer.value = localStorage.getItem('access_token') ? await authApi.checkAuth() : null
    const p = await projectsApi.byPath(String(route.params.username), String(route.params.projectSlug))
    project.value = p; form.value = { title: p.title, slug: p.slug, description: p.description ?? '', private: p.private }
    await refreshMembers()
    setPageSeo({ title: `${p.title} - RGBAST`, description: p.description || p.title })
  } catch (e) { error.value = e instanceof Error ? e.message : String(e) }
  finally { loading.value = false }
}
async function save() {
  if (!project.value) return
  busy.value = true; error.value = ''
  try { const p = await projectsApi.update(project.value.id, form.value); project.value = p; await router.replace(projectUrl(p)) }
  catch (e) { error.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
function openInvitation() { inviteRequest++; inviteScope.value = 'colleagues'; inviteQuery.value = ''; inviteResults.value = []; inviteSearchError.value = ''; editingMember.value = null; inviteUsername.value = ''; selected.value = ['read']; modalError.value = ''; memberOpen.value = true }
function openRemoval(member?: ProjectMember) { modalError.value = ''; deleteTitle.value = ''; removalTarget.value = member ?? null; deleteOpen.value = !member }
function closeDialogs() { if (busy.value) return; memberOpen.value = false; deleteOpen.value = false; leaveOpen.value = false; removalTarget.value = null; modalError.value = '' }
async function leaveProject() {
  if (busy.value || !canLeave.value || !project.value) return
  busy.value = true; modalError.value = ''
  try {
    await projectsApi.leave(project.value.id)
    leaveOpen.value = false
    window.dispatchEvent(new Event('rgbast:projects-updated'))
    await router.push('/atelier/projects')
  } catch (e) { modalError.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
function editMember(member: ProjectMember) { editingMember.value = member; selected.value = [...member.permissions]; modalError.value = ''; memberOpen.value = true }
function presetPermissions(preset: string): ProjectPermission[] {
  return preset === 'admin' ? [...projectPermissions] : preset === 'contributor' ? ['read', 'add_palettes', 'edit_palettes', 'add_bookmarks', 'edit_bookmarks'] : ['read']
}
function matchesPreset(preset: string) { const values = presetPermissions(preset); return values.length === selected.value.length && values.every(value => selected.value.includes(value)) }
function setPreset(preset: string) {
  selected.value = presetPermissions(preset)
}
async function saveMember() {
  if (!project.value) return
  busy.value = true; modalError.value = ''
  try {
    if (editingMember.value) await projectsApi.setMember(project.value.id, editingMember.value.username, selected.value)
    else await projectsApi.invite(project.value.id, inviteUsername.value, selected.value)
    await refreshMembers(); memberOpen.value = false; inviteUsername.value = ''
  } catch (e) { modalError.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
async function confirmRemoval() {
  if (!project.value) return
  busy.value = true; modalError.value = ''
  try {
    if (removalTarget.value) { await projectsApi.removeMember(project.value.id, removalTarget.value.username); await refreshMembers(); removalTarget.value = null }
    else { await projectsApi.remove(project.value.id, deleteTitle.value); await router.push('/atelier/projects') }
  } catch (e) { modalError.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
onMounted(load)
watch(() => route.fullPath, load)
</script>
<style src="./ProjectView.css" scoped></style>

