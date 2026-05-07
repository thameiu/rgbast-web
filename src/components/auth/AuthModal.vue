<template>
  <Teleport to="body">
    <div class="auth-overlay">
      <div class="auth-modal">
        <!-- Header -->
        <div class="auth-header">
          <RgbastLogo size="26px" />
          <p class="auth-headline font-display">
            {{ tab === 'login' ? 'Sign in to save' : 'Create account to save' }}
          </p>
          <button class="auth-close" @click="$emit('cancel')">×</button>
        </div>

        <!-- Tab switcher -->
        <div class="auth-tabs">
          <button class="tab-btn" :class="{ active: tab === 'login' }" @click="tab = 'login'">
            Sign in
          </button>
          <button class="tab-btn" :class="{ active: tab === 'register' }" @click="tab = 'register'">
            New account
          </button>
        </div>

        <!-- Login form -->
        <form v-if="tab === 'login'" class="auth-form" @submit.prevent="doLogin">
          <label class="auth-field">
            <span class="auth-label font-mono">Username</span>
            <input v-model="loginForm.username" class="auth-input" type="text" required placeholder="your_username" autofocus />
          </label>
          <label class="auth-field">
            <span class="auth-label font-mono">Password</span>
            <input v-model="loginForm.password" class="auth-input" type="password" required placeholder="••••••••" />
          </label>
          <RouterLink to="/forgot-password" class="auth-hint-link" @click="$emit('cancel')">Forgot password?</RouterLink>
          <p v-if="loginError" class="auth-error">{{ loginError }}</p>
          <button class="auth-submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <!-- Register form -->
        <form v-else class="auth-form" @submit.prevent="doRegister">
          <label class="auth-field">
            <span class="auth-label font-mono">Username</span>
            <input v-model="regForm.username" class="auth-input" type="text" required placeholder="your_username" autofocus />
          </label>
          <label class="auth-field">
            <span class="auth-label font-mono">Email</span>
            <input v-model="regForm.email" class="auth-input" type="email" required placeholder="you@example.com" />
          </label>
          <label class="auth-field">
            <span class="auth-label font-mono">Password</span>
            <input v-model="regForm.password" class="auth-input" type="password" required placeholder="••••••••" />
            <span class="auth-hint font-mono">Uppercase · lowercase · number · symbol · 8+</span>
          </label>
          <p v-if="regError" class="auth-error">{{ regError }}</p>
          <p v-if="regSuccess" class="auth-success">{{ regSuccess }}</p>
          <button class="auth-submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Creating…' : 'Create account' }}
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * AuthModal — Inline auth gate shown when an unauthenticated user tries to save a palette.
 * Provides login/register tabs inside a teleported overlay.
 * Emits: authenticated — on successful login
 *        cancel — when the user dismisses the modal
 * Used in: PaletteView
 */
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { authApi, usersApi } from '@/api'
import RgbastLogo from '../ui/RgbastLogo.vue'

const emit = defineEmits<{ authenticated: []; cancel: [] }>()

/** Currently selected tab: 'login' or 'register'. */
const tab = ref<'login' | 'register'>('login')

/** Whether a network request is in-flight. */
const isSubmitting = ref(false)

/** Login form reactive state. */
const loginForm = ref({ username: '', password: '' })

/** Error message for the login form. */
const loginError = ref('')

/** Registration form reactive state. */
const regForm = ref({ username: '', email: '', password: '' })

/** Error message for the registration form. */
const regError = ref('')
const regSuccess = ref('')

/**
 * Submits the login form. Stores the token and emits 'authenticated' on success.
 */
async function doLogin() {
  isSubmitting.value = true
  loginError.value = ''
  try {
    const resp = await authApi.login({ username: loginForm.value.username, password: loginForm.value.password })
    localStorage.setItem('access_token', resp.access_token)
    emit('authenticated')
  } catch (e: any) {
    loginError.value = e.message ?? 'Login failed.'
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Submits the registration form and shows a verification-email notice.
 */
async function doRegister() {
  isSubmitting.value = true
  regError.value = ''
  regSuccess.value = ''
  try {
    await usersApi.create({
      username: regForm.value.username,
      email: regForm.value.email,
      password: regForm.value.password,
      firstname: null,
      lastname: null,
      birthdate: null,
    })
    regSuccess.value = 'Account created. Verify your email from the link you received, then sign in.'
    regForm.value.password = ''
  } catch (e: any) {
    regError.value = e.message ?? 'Registration failed.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style src="./AuthModal.css" scoped></style>
