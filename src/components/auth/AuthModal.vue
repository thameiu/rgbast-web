<template>
  <Teleport to="body">
    <div class="auth-overlay" :class="{ 'auth-overlay--light': theme === 'light' }">
      <div class="auth-modal" :class="{ 'auth-modal--light': theme === 'light' }">
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
          <button class="tab-btn" :class="{ active: tab === 'login' }" @click="switchAuthTab('login')">
            Sign in
          </button>
          <button class="tab-btn" :class="{ active: tab === 'register' }" @click="switchAuthTab('register')">
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
          <p v-if="showResendVerification" class="auth-inline-link">
            <button
              type="button"
              class="auth-link-btn"
              :disabled="resendSubmitting"
              @click="handleResendVerification"
            >
              {{ resendSubmitting ? 'Sending…' : 'Resend verification email' }}
            </button>
          </p>
          <p v-if="loginInfo" class="auth-success">{{ loginInfo }}</p>
          <button class="auth-submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <!-- Register form -->
        <form v-else-if="registerStep === 'form'" class="auth-form" @submit.prevent="doRegister">
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

        <form v-else class="auth-form" @submit.prevent="doVerifyCode">
          <label class="auth-field">
            <span class="auth-label font-mono">Verification code</span>
            <input
              v-model="verifyCode"
              class="auth-input"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              required
              placeholder="123456"
              autofocus
            />
            <span class="auth-hint font-mono">
              Enter the 6-digit code sent to {{ regForm.email }}
            </span>
          </label>
          <p v-if="regError" class="auth-error">{{ regError }}</p>
          <p v-if="regSuccess" class="auth-success">{{ regSuccess }}</p>
          <button class="auth-submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Verifying…' : 'Verify and continue' }}
            <span aria-hidden="true">→</span>
          </button>
          <button class="auth-back" type="button" :disabled="isSubmitting" @click="backToRegisterForm">
            Back
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

withDefaults(defineProps<{ theme?: 'dark' | 'light' }>(), {
  theme: 'dark',
})

const emit = defineEmits<{ authenticated: []; cancel: [] }>()

/** Currently selected tab: 'login' or 'register'. */
const tab = ref<'login' | 'register'>('login')

/** Whether a network request is in-flight. */
const isSubmitting = ref(false)

/** Login form reactive state. */
const loginForm = ref({ username: '', password: '' })

/** Error message for the login form. */
const loginError = ref('')
const loginInfo = ref('')
const resendSubmitting = ref(false)
const showResendVerification = ref(false)

/** Registration form reactive state. */
const regForm = ref({ username: '', email: '', password: '' })
const registerStep = ref<'form' | 'code'>('form')
const verifyCode = ref('')

/** Error message for the registration form. */
const regError = ref('')
const regSuccess = ref('')

function switchAuthTab(next: 'login' | 'register') {
  tab.value = next
  loginError.value = ''
  loginInfo.value = ''
  showResendVerification.value = false
  if (next === 'register') return
  registerStep.value = 'form'
  verifyCode.value = ''
  regError.value = ''
  regSuccess.value = ''
}

/**
 * Submits the login form. Stores the token and emits 'authenticated' on success.
 */
async function doLogin() {
  isSubmitting.value = true
  loginError.value = ''
  loginInfo.value = ''
  showResendVerification.value = false
  try {
    const resp = await authApi.login({ username: loginForm.value.username, password: loginForm.value.password })
    localStorage.setItem('access_token', resp.access_token)
    emit('authenticated')
  } catch (e: any) {
    const message = e.message ?? 'Login failed.'
    loginError.value = message
    showResendVerification.value = String(message).toLowerCase().includes('email not verified')
  } finally {
    isSubmitting.value = false
  }
}

async function handleResendVerification() {
  if (!loginForm.value.username.trim()) {
    loginError.value = 'Enter your username or email first.'
    return
  }
  resendSubmitting.value = true
  loginInfo.value = ''
  try {
    const response = await authApi.resendVerificationEmail({
      identifier: loginForm.value.username.trim(),
    })
    loginInfo.value = response.response
  } catch (e: any) {
    loginError.value = e.message ?? 'Could not resend verification email.'
  } finally {
    resendSubmitting.value = false
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
      verify_type: 'code',
    })
    registerStep.value = 'code'
    regSuccess.value = 'Account created. Enter the verification code sent by email.'
    regForm.value.password = ''
  } catch (e: any) {
    regError.value = e.message ?? 'Registration failed.'
  } finally {
    isSubmitting.value = false
  }
}

async function doVerifyCode() {
  isSubmitting.value = true
  regError.value = ''
  regSuccess.value = ''
  try {
    const resp = await authApi.verifyEmailCode({
      email: regForm.value.email,
      code: verifyCode.value.trim(),
    })
    localStorage.setItem('access_token', resp.access_token)
    emit('authenticated')
  } catch (e: any) {
    regError.value = e.message ?? 'Verification failed.'
  } finally {
    isSubmitting.value = false
  }
}

function backToRegisterForm() {
  registerStep.value = 'form'
  verifyCode.value = ''
  regError.value = ''
  regSuccess.value = ''
}
</script>

<style src="./AuthModal.css" scoped></style>
