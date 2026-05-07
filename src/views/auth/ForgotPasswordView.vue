<template>
  <div class="auth-page">
    <SiteHeader />
    <main class="auth-shell">
      <section class="card">
        <p class="step font-mono">Account recovery</p>
        <h1 class="title font-display">Reset password</h1>
        <p class="copy">Enter your email address. If it exists, we will send a reset link.</p>

        <form class="form" @submit.prevent="submit">
          <label class="field">
            <span class="field-label font-mono">Email</span>
            <input v-model="email" class="field-input" type="email" required placeholder="you@example.com" />
          </label>

          <p v-if="errorMessage" class="err">{{ errorMessage }}</p>
          <p v-if="successMessage" class="ok">{{ successMessage }}</p>

          <button class="submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Sending…' : 'Send reset link' }}
          </button>
        </form>

        <p class="alt">Back to <RouterLink to="/login" class="alt-link">sign in</RouterLink></p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { authApi } from '@/api'
import SiteHeader from '@/components/layout/SiteHeader.vue'

onMounted(() => {
  document.title = 'Reset password - RGBAST'
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
    errorMessage.value = error instanceof Error ? error.message : 'Could not send reset email.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped src="./ForgotPasswordView.css"></style>
