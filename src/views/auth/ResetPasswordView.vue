<template>
  <div class="auth-page">
    <SiteHeader />
    <main class="auth-shell">
      <section class="card">
        <p class="step font-mono">Account recovery</p>
        <h1 class="title font-display">Choose a new password</h1>
        <p class="copy">Use a strong password (uppercase, lowercase, number, symbol, 8+ chars).</p>

        <form class="form" @submit.prevent="submit">
          <label class="field">
            <span class="field-label font-mono">New password</span>
            <input v-model="password" class="field-input" type="password" required placeholder="••••••••" />
          </label>

          <p v-if="errorMessage" class="err">{{ errorMessage }}</p>
          <p v-if="successMessage" class="ok">{{ successMessage }}</p>

          <button class="submit" type="submit" :disabled="isSubmitting || !token">
            {{ isSubmitting ? 'Updating…' : 'Update password' }}
          </button>
        </form>

        <p class="alt">Back to <RouterLink to="/login" class="alt-link">sign in</RouterLink></p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api'
import SiteHeader from '@/components/layout/SiteHeader.vue'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  document.title = 'Set new password - RGBAST'
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
    errorMessage.value = 'Reset token is missing.'
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
    errorMessage.value = error instanceof Error ? error.message : 'Could not reset password.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped src="./ResetPasswordView.css"></style>
