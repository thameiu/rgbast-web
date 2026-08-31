<template>
  <div class="auth-page">
    <SiteHeader />
    <main class="auth-shell">
      <section class="card">
        <p class="step font-mono">{{ t('auth.recovery') }}</p>
        <h1 class="title font-display">{{ t('auth.resetPassword') }}</h1>
        <p class="copy">{{ t('auth.forgotCopy') }}</p>

        <form class="form" @submit.prevent="submit">
          <label class="field">
            <span class="field-label font-mono">{{ t('auth.email') }}</span>
            <input v-model="email" class="field-input" type="email" required placeholder="you@example.com" />
          </label>

          <p v-if="errorMessage" class="err">{{ errorMessage }}</p>
          <p v-if="successMessage" class="ok">{{ successMessage }}</p>

          <button class="submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? t('auth.sending') : t('auth.sendResetLink') }}
          </button>
        </form>

        <p class="alt">{{ t('auth.backTo') }} <RouterLink to="/login" class="alt-link">{{ t('auth.signIn') }}</RouterLink></p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { authApi } from '@/api'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

onMounted(() => {
  document.title = `${t('auth.resetPassword')} - RGBAST`
})

const email = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function submit(): Promise<void> {
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const response = await authApi.requestPasswordReset({ email: email.value })
    successMessage.value = response.response
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('auth.couldNotSendReset')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped src="./ForgotPasswordView.css"></style>
