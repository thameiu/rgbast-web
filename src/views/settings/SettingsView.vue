<template>
  <main class="settings-view">
    <SiteHeader :user="viewer" :brand-meta="t('common.settings')" />

    <section class="settings-shell">
      <header class="settings-head">
        <p class="eyebrow font-mono">{{ t('settingsPage.account') }}</p>
        <h1 class="settings-title font-display">{{ t('common.settings') }}</h1>
      </header>

      <section class="settings-card">
        <h2 class="card-title font-display">{{ t('settingsPage.profile') }}</h2>
        <form class="form" @submit.prevent="saveProfile">
          <label class="field">
            <span class="field-label font-mono">{{ t('settingsPage.username') }}</span>
            <input v-model="form.username" class="field-input" type="text" required />
          </label>

          <div class="field-row">
            <label class="field">
              <span class="field-label font-mono">{{ t('settingsPage.firstName') }}</span>
              <input v-model="form.firstname" class="field-input" type="text" />
            </label>
            <label class="field">
              <span class="field-label font-mono">{{ t('settingsPage.lastName') }}</span>
              <input v-model="form.lastname" class="field-input" type="text" />
            </label>
          </div>

          <p v-if="saveError" class="msg msg--error">{{ saveError }}</p>
          <p v-if="saveSuccess" class="msg msg--ok">{{ saveSuccess }}</p>

          <button class="btn btn--primary" type="submit" :disabled="saving">
            {{ saving ? t('dashboard.saving') : t('settingsPage.saveProfile') }}
          </button>
        </form>
      </section>

      <section class="settings-card danger">
        <h2 class="card-title font-display">{{ t('settingsPage.deleteAccount') }}</h2>
        <p class="danger-copy">{{ t('settingsPage.deleteCopy') }}</p>
        <label class="field">
          <span class="field-label font-mono">{{ t('settingsPage.deleteConfirm') }}</span>
          <input v-model="deleteConfirm" class="field-input" type="text" placeholder="DELETE" />
        </label>

        <p v-if="deleteError" class="msg msg--error">{{ deleteError }}</p>
        <button class="btn btn--danger" :disabled="deleting || deleteConfirm !== 'DELETE'" @click="deleteAccount">
          {{ deleting ? t('settingsPage.deleting') : t('settingsPage.deleteMyAccount') }}
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
import { useI18n } from '@/i18n'

const router = useRouter()
const { t } = useI18n()

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
    description: 'Manage your RGBAST account settings, profile information, and account lifecycle.',
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
    saveSuccess.value = t('settingsPage.profileUpdated')
  } catch (error: unknown) {
    saveError.value = error instanceof Error ? error.message : t('settingsPage.couldNotSave')
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
    deleteError.value = error instanceof Error ? error.message : t('settingsPage.couldNotDelete')
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped src="./SettingsView.css"></style>
