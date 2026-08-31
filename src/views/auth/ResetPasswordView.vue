<template>
  <div class="auth-page">
    <SiteHeader />
    <main class="auth-shell">
      <section class="card">
        <p class="step font-mono">{{ t('auth.recovery') }}</p>
        <h1 class="title font-display">{{ t('auth.chooseNewPassword') }}</h1>
        <p class="copy">{{ t('auth.newPasswordCopy') }}</p>

        <form class="form" @submit.prevent="submit">
          <label class="field">
            <span class="field-label font-mono">{{ t('auth.newPassword') }}</span>
            <input v-model="password" class="field-input" type="password" required placeholder="••••••••" />
          </label>

          <p v-if="errorMessage" class="err">{{ errorMessage }}</p>
          <p v-if="successMessage" class="ok">{{ successMessage }}</p>

          <button class="submit" type="submit" :disabled="isSubmitting || !token">
            {{ isSubmitting ? t('auth.updating') : t('auth.updatePassword') }}
          </button>
        </form>

        <p class="alt">{{ t('auth.backTo') }} <RouterLink to="/login" class="alt-link">{{ t('auth.signIn') }}</RouterLink></p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import { useI18n } from '@/i18n'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

onMounted(() => {
  document.title = `${t('auth.chooseNewPassword')} - RGBAST`
})

const token = computed(() => {
  const raw = route.query.token
  return typeof raw === 'string' ? raw : ''
})

const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function submit(): Promise<void> {
  if (!token.value) {
    errorMessage.value = t('auth.missingResetToken')
    return
  }
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const response = await authApi.confirmPasswordReset({ token: token.value, password: password.value })
    successMessage.value = response.response
    setTimeout(() => {
      router.push('/login')
    }, 800)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('auth.couldNotResetPassword')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped src="./ResetPasswordView.css"></style>
