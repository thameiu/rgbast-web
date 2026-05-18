<template>
  <main class="settings-view">
    <SiteHeader :user="viewer" brand-meta="settings" />

    <section class="settings-shell">
      <header class="settings-head">
        <p class="eyebrow font-mono">Account</p>
        <h1 class="settings-title font-display">Settings</h1>
      </header>

      <section class="settings-card">
        <h2 class="card-title font-display">Profile</h2>
        <form class="form" @submit.prevent="saveProfile">
          <label class="field">
            <span class="field-label font-mono">Username</span>
            <input v-model="form.username" class="field-input" type="text" required />
          </label>

          <div class="field-row">
            <label class="field">
              <span class="field-label font-mono">First name</span>
              <input v-model="form.firstname" class="field-input" type="text" />
            </label>
            <label class="field">
              <span class="field-label font-mono">Last name</span>
              <input v-model="form.lastname" class="field-input" type="text" />
            </label>
          </div>

          <p v-if="saveError" class="msg msg--error">{{ saveError }}</p>
          <p v-if="saveSuccess" class="msg msg--ok">{{ saveSuccess }}</p>

          <button class="btn btn--primary" type="submit" :disabled="saving">
            {{ saving ? 'Saving…' : 'Save profile' }}
          </button>
        </form>
      </section>

      <section class="settings-card danger">
        <h2 class="card-title font-display">Delete account</h2>
        <p class="danger-copy">This action is permanent and removes your palettes, history, and folders.</p>
        <label class="field">
          <span class="field-label font-mono">Type DELETE to confirm</span>
          <input v-model="deleteConfirm" class="field-input" type="text" placeholder="DELETE" />
        </label>

        <p v-if="deleteError" class="msg msg--error">{{ deleteError }}</p>
        <button class="btn btn--danger" :disabled="deleting || deleteConfirm !== 'DELETE'" @click="deleteAccount">
          {{ deleting ? 'Deleting…' : 'Delete my account' }}
        </button>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { usersApi } from '@/api/users'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import { searchApi } from '@/api/search'
import { setPageSeo } from '@/utils/seo'

const router = useRouter()

const viewer = ref<{ username: string; firstname?: string | null; lastname?: string | null } | null>(null)
const form = ref({ username: '', firstname: '', lastname: '' })

const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

const deleting = ref(false)
const deleteConfirm = ref('')
const deleteError = ref('')

onMounted(async () => {
  setPageSeo({
    title: 'Settings - RGBAST',
    description: 'Manage your RGBAST account settings, update profile information, and control your account lifecycle.',
    keywords: ['account settings', 'profile settings', 'RGBAST account', 'user preferences'],
  })
  try {
    const me = await authApi.checkAuth()
    viewer.value = me
    form.value.username = me.username ?? ''
    form.value.firstname = me.firstname ?? ''
    form.value.lastname = me.lastname ?? ''
  } catch {
    localStorage.removeItem('access_token')
    await router.replace('/login')
  }
})

async function saveProfile(): Promise<void> {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = ''
  try {
    const response = await usersApi.updateMe({
      username: form.value.username,
      firstname: form.value.firstname || null,
      lastname: form.value.lastname || null,
    })
    if (response.access_token) {
      localStorage.setItem('access_token', response.access_token)
    }
    viewer.value = {
      username: response.username,
      firstname: response.firstname,
      lastname: response.lastname,
    }
    form.value.username = response.username
    form.value.firstname = response.firstname ?? ''
    form.value.lastname = response.lastname ?? ''
    saveSuccess.value = 'Profile updated.'
  } catch (error: unknown) {
    saveError.value = error instanceof Error ? error.message : 'Could not save profile.'
  } finally {
    saving.value = false
  }
}

async function deleteAccount(): Promise<void> {
  deleting.value = true
  deleteError.value = ''
  try {
    await usersApi.deleteMe()
    localStorage.removeItem('access_token')
    searchApi.clearRecentSearches()
    await router.replace('/')
  } catch (error: unknown) {
    deleteError.value = error instanceof Error ? error.message : 'Could not delete account.'
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped src="./SettingsView.css"></style>
