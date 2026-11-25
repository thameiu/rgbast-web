<template>
  <section class="projects-panel">
    <header class="project-tools">
      <input v-model="query" :placeholder="t('projects.search')" :aria-label="t('projects.search')" />
      <button v-if="!username" @click="createOpen = true">{{ t('projects.new') }}</button>
    </header>
    <AppLoader v-if="loading" :message="t('common.loading')" />
    <p v-if="error" role="alert">{{ error }}</p>
    <article v-for="inv in invitations" :key="inv.id" class="project-invitation">
      <UserAvatar class="project-avatar" :username="inv.inviter.username" :color="inv.inviter.profile_color" />
      <p>{{ t('projects.invitation', { username: inv.inviter.username, title: inv.title }) }}</p>
      <button :disabled="busy" @click="respond(inv.id, true)">{{ t('header.accept') }}</button>
      <button :disabled="busy" @click="respond(inv.id, false)">{{ t('header.deny') }}</button>
    </article>
    <div class="project-grid">
      <RouterLink v-for="project in filtered" :key="project.id" :to="projectUrl(project)" class="project-card">
        <div v-if="project.description" class="project-card-tooltip"><strong>{{ project.title }}</strong><p>{{ project.description }}</p></div>
        <div class="project-card-art" aria-hidden="true"><AppIcon name="project" :size="256" /></div>
        <span v-if="project.private" class="project-card-privacy" role="img" :aria-label="t('projects.private')" :title="t('projects.private')"><AppIcon name="lock" :size="14" /></span>
        <div class="project-card-content">
        <h3>{{ project.title }}</h3><span class="project-card-creator">{{ project.creator_username }}</span>
        <div class="project-card-counts">
          <span><span>{{ project.palette_count ?? 0 }}</span><AppIcon name="palette" :size="14" /></span>
          <i class="project-card-count-separator" aria-hidden="true" />
          <span><span>{{ project.bookmark_count ?? 0 }}</span><AppIcon name="bookmark" :size="14" /></span>
          <i class="project-card-count-separator" aria-hidden="true" />
          <span><span>{{ project.member_count ?? 1 }}</span><AppIcon name="users" :size="14" /></span>
        </div>
        </div>
      </RouterLink>
    </div>
    <AtelierEmptyState v-if="!loading && !error && !filtered.length" icon="project" :message="t('projects.empty')" />
    <Teleport to="body"><Transition name="project-fade">
      <div v-if="createOpen" class="project-overlay" @keydown.esc="createOpen = false">
        <form class="project-modal" role="dialog" aria-modal="true" :aria-label="t('projects.new')" @submit.prevent="create">
          <button class="project-close" type="button" :aria-label="t('common.cancel')" @click="createOpen = false"><AppIcon name="x" :size="18" /></button>
          <h2>{{ t('projects.new') }}</h2>
          <label>{{ t('projects.title') }}<input v-model="form.title" maxlength="50" required /></label>
          <label>{{ t('projects.slug') }}<input v-model="form.slug" maxlength="50" pattern="[a-z0-9]+(-[a-z0-9]+)*" :placeholder="t('projects.autoSlug')" /></label>
          <label>{{ t('projects.description') }}<textarea v-model="form.description" maxlength="5000" /></label>
          <p v-if="createError" role="alert">{{ createError }}</p>
          <div class="project-modal-actions project-create-actions">
            <ProjectPrivacyToggle v-model="form.private" :disabled="busy" />
            <button type="submit" :disabled="busy || !form.title.trim()">{{ t('common.save') }}</button>
          </div>
        </form>
      </div>
    </Transition></Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { projectsApi, projectUrl, type Project, type ProjectInvitation } from '@/api/projects'
import AppLoader from '@/components/ui/AppLoader.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import AtelierEmptyState from '@/components/ui/AtelierEmptyState.vue'
import ProjectPrivacyToggle from './ProjectPrivacyToggle.vue'
import { useI18n } from '@/i18n'
const props = defineProps<{ username?: string }>()
const { t } = useI18n()
const projects = ref<Project[]>([]), invitations = ref<ProjectInvitation[]>([])
const loading = ref(false), busy = ref(false), error = ref(''), createError = ref(''), query = ref(''), createOpen = ref(false)
const form = ref({ title: '', slug: '', description: '', private: false })
const filtered = computed(() => projects.value.filter(p => p.title.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())))
async function load() {
  loading.value = true; error.value = ''
  try {
    projects.value = props.username ? await projectsApi.byUser(props.username) : await projectsApi.mine()
    invitations.value = props.username ? [] : await projectsApi.invitations()
  } catch (e) { error.value = e instanceof Error ? e.message : String(e) }
  finally { loading.value = false }
}
async function create() {
  busy.value = true; createError.value = ''
  try {
    await projectsApi.create({ ...form.value, slug: form.value.slug || undefined })
    createOpen.value = false; form.value = { title: '', slug: '', description: '', private: false }; await load()
  } catch (e) { createError.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
async function respond(id: number, accept: boolean) {
  busy.value = true; error.value = ''
  try { if (accept) await projectsApi.accept(id); else await projectsApi.decline(id); window.dispatchEvent(new Event('rgbast:project-invitations-updated')) }
  catch (e) { error.value = e instanceof Error ? e.message : String(e) }
  finally { busy.value = false }
}
onMounted(load)
function refreshInvitations() { void load() }
onMounted(() => window.addEventListener('rgbast:project-invitations-updated', refreshInvitations))
onBeforeUnmount(() => window.removeEventListener('rgbast:project-invitations-updated', refreshInvitations))
onMounted(() => window.addEventListener('rgbast:projects-updated', refreshInvitations))
onBeforeUnmount(() => window.removeEventListener('rgbast:projects-updated', refreshInvitations))
watch(() => props.username, load)
</script>

<style scoped>
.project-create-actions{justify-content:space-between;align-items:center;gap:20px}
.project-create-actions :deep(.project-privacy-toggle){margin:0;align-self:center}
.project-create-actions>button{flex-shrink:0}
</style>

