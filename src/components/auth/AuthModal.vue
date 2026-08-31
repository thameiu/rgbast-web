<template>
  <Teleport to="body">
    <div class="auth-overlay" :class="{ 'auth-overlay--light': theme === 'light' }">
      <div class="auth-modal" :class="{ 'auth-modal--light': theme === 'light' }">
        <!-- Header -->
        <div class="auth-header">
          <RgbastLogo size="26px" />
          <p class="auth-headline font-display">
            {{ tab === 'login' ? t('authModal.signInToSave') : t('authModal.createAccountToSave') }}
          </p>
          <button class="auth-close" @click="$emit('cancel')">×</button>
        </div>

        <!-- Tab switcher -->
        <div class="auth-tabs">
          <button class="tab-btn" :class="{ active: tab === 'login' }" @click="switchAuthTab('login')">
            {{ t('auth.signIn') }}
          </button>
          <button class="tab-btn" :class="{ active: tab === 'register' }" @click="switchAuthTab('register')">
            {{ t('authModal.newAccount') }}
          </button>
        </div>

        <!-- Login form -->
        <form v-if="tab === 'login'" class="auth-form" @submit.prevent="doLogin">
          <label class="auth-field">
            <span class="auth-label font-mono">{{ t('auth.username') }}</span>
            <input v-model="loginForm.username" class="auth-input" type="text" required placeholder="your_username" autofocus />
          </label>
          <label class="auth-field">
            <span class="auth-label font-mono">{{ t('auth.password') }}</span>
            <div class="auth-pass-wrap">
              <input
                v-model="loginForm.password"
                class="auth-input auth-input--with-eye"
                :type="showLoginPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
              />
              <button type="button" class="auth-eye-btn" @click="showLoginPassword = !showLoginPassword">
                <svg v-if="showLoginPassword" width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M6.1 6.2A2.8 2.8 0 019.9 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  <path d="M13.4 9.8C12.2 11.3 10.2 12.5 8 12.5c-3.3 0-6-2.5-7-4.5.4-.8 1-1.7 1.8-2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M4.4 4.6C5.4 4 6.6 3.5 8 3.5c3.3 0 6 2.5 7 4.5-.2.3-.5.8-.9 1.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M1.7 8c1-2 3.7-4.5 6.3-4.5S13.3 6 14.3 8c-1 2-3.7 4.5-6.3 4.5S2.7 10 1.7 8Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                  <circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.4"/>
                </svg>
              </button>
            </div>
          </label>
          <RouterLink to="/forgot-password" class="auth-hint-link" @click="$emit('cancel')">{{ t('auth.forgotPassword') }}</RouterLink>
          <p v-if="loginError" class="auth-error">{{ loginError }}</p>
          <p v-if="showResendVerification" class="auth-inline-link">
            <button
              type="button"
              class="auth-link-btn"
              :disabled="resendSubmitting"
              @click="handleResendVerification"
            >
              {{ resendSubmitting ? t('auth.sending') : t('auth.resendVerification') }}
            </button>
          </p>
          <p v-if="loginInfo" class="auth-success">{{ loginInfo }}</p>
          <button class="auth-submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? t('auth.signingIn') : t('auth.signIn') }}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <!-- Register form -->
        <form v-else-if="registerStep === 'form'" class="auth-form" @submit.prevent="doRegister">
          <label class="auth-field">
            <span class="auth-label font-mono">{{ t('auth.username') }}</span>
            <input v-model="regForm.username" class="auth-input" type="text" required placeholder="your_username" autofocus />
          </label>
          <label class="auth-field">
            <span class="auth-label font-mono">{{ t('auth.email') }}</span>
            <input v-model="regForm.email" class="auth-input" type="email" required placeholder="you@example.com" />
          </label>
          <label class="auth-field">
            <span class="auth-label font-mono">{{ t('auth.password') }}</span>
            <div class="auth-pass-wrap">
              <input
                v-model="regForm.password"
                class="auth-input auth-input--with-eye"
                :type="showRegisterPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
              />
              <button type="button" class="auth-eye-btn" @click="showRegisterPassword = !showRegisterPassword">
                <svg v-if="showRegisterPassword" width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M6.1 6.2A2.8 2.8 0 019.9 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  <path d="M13.4 9.8C12.2 11.3 10.2 12.5 8 12.5c-3.3 0-6-2.5-7-4.5.4-.8 1-1.7 1.8-2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M4.4 4.6C5.4 4 6.6 3.5 8 3.5c3.3 0 6 2.5 7 4.5-.2.3-.5.8-.9 1.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M1.7 8c1-2 3.7-4.5 6.3-4.5S13.3 6 14.3 8c-1 2-3.7 4.5-6.3 4.5S2.7 10 1.7 8Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                  <circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.4"/>
                </svg>
              </button>
            </div>
            <span class="auth-hint font-mono">{{ t('auth.passwordRules') }}</span>
          </label>
          <label class="auth-field">
            <span class="auth-label font-mono">{{ t('auth.confirmPassword') }}</span>
            <div class="auth-pass-wrap">
              <input
                v-model="regForm.confirmPassword"
                class="auth-input auth-input--with-eye"
                :type="showRegisterConfirmPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
              />
              <button type="button" class="auth-eye-btn" @click="showRegisterConfirmPassword = !showRegisterConfirmPassword">
                <svg v-if="showRegisterConfirmPassword" width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M6.1 6.2A2.8 2.8 0 019.9 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  <path d="M13.4 9.8C12.2 11.3 10.2 12.5 8 12.5c-3.3 0-6-2.5-7-4.5.4-.8 1-1.7 1.8-2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M4.4 4.6C5.4 4 6.6 3.5 8 3.5c3.3 0 6 2.5 7 4.5-.2.3-.5.8-.9 1.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M1.7 8c1-2 3.7-4.5 6.3-4.5S13.3 6 14.3 8c-1 2-3.7 4.5-6.3 4.5S2.7 10 1.7 8Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                  <circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.4"/>
                </svg>
              </button>
            </div>
            <span v-if="passwordsMismatch" class="auth-hint auth-hint--error">{{ t('auth.passwordMismatch') }}</span>
          </label>
          <p v-if="regError" class="auth-error">{{ regError }}</p>
          <p v-if="regSuccess" class="auth-success">{{ regSuccess }}</p>
          <button class="auth-submit" type="submit" :disabled="isSubmitting || passwordsMismatch">
            {{ isSubmitting ? t('auth.creating') : t('auth.createAccount') }}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <form v-else class="auth-form" @submit.prevent="doVerifyCode">
          <label class="auth-field">
            <span class="auth-label font-mono">{{ t('authModal.verificationCode') }}</span>
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
              {{ t('authModal.codeHint', { email: regForm.email }) }}
            </span>
          </label>
          <p v-if="regError" class="auth-error">{{ regError }}</p>
          <p v-if="regSuccess" class="auth-success">{{ regSuccess }}</p>
          <button class="auth-submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? t('authModal.verifying') : t('authModal.verifyContinue') }}
            <span aria-hidden="true">→</span>
          </button>
          <button class="auth-back" type="button" :disabled="isSubmitting" @click="backToRegisterForm">
            {{ t('authModal.back') }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * AuthModal - Inline auth gate shown when an unauthenticated user tries to save a palette.
 * Provides login/register tabs inside a teleported overlay.
 * Emits: authenticated - on successful login
 *        cancel - when the user dismisses the modal
 * Used in: PaletteView
 */
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { authApi, usersApi } from '@/api'
import RgbastLogo from '../ui/RgbastLogo.vue'
import { useI18n } from '@/i18n'

withDefaults(defineProps<{ theme?: 'dark' | 'light' }>(), {
  theme: 'dark',
})

const emit = defineEmits<{ authenticated: []; cancel: [] }>()
const { t } = useI18n()

/** Currently selected tab: 'login' or 'register'. */
const tab = ref<'login' | 'register'>('login')

/** Whether a network request is in-flight. */
const isSubmitting = ref(false)

/** Login form reactive state. */
const loginForm = ref({ username: '', password: '' })
const showLoginPassword = ref(false)

/** Error message for the login form. */
const loginError = ref('')
const loginInfo = ref('')
const resendSubmitting = ref(false)
const showResendVerification = ref(false)

/** Registration form reactive state. */
const regForm = ref({ username: '', email: '', password: '', confirmPassword: '' })
const showRegisterPassword = ref(false)
const showRegisterConfirmPassword = ref(false)
const passwordsMismatch = computed(
  () => !!regForm.value.password && !!regForm.value.confirmPassword && regForm.value.password !== regForm.value.confirmPassword,
)
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
  showLoginPassword.value = false
  showRegisterPassword.value = false
  showRegisterConfirmPassword.value = false
  if (next === 'register') return
  registerStep.value = 'form'
  verifyCode.value = ''
  regError.value = ''
  regSuccess.value = ''
  showRegisterPassword.value = false
  showRegisterConfirmPassword.value = false
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
    const message = e.message ?? t('authModal.loginFailed')
    loginError.value = message
    showResendVerification.value = String(message).toLowerCase().includes('email not verified')
  } finally {
    isSubmitting.value = false
  }
}

async function handleResendVerification() {
  if (!loginForm.value.username.trim()) {
    loginError.value = t('authModal.enterIdentifier')
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
    loginError.value = e.message ?? t('authModal.couldNotResend')
  } finally {
    resendSubmitting.value = false
  }
}

/**
 * Submits the registration form and shows a verification-email notice.
 */
async function doRegister() {
  if (passwordsMismatch.value) {
    regError.value = t('auth.passwordMismatch')
    return
  }
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
    regSuccess.value = t('authModal.accountCreatedCode')
    regForm.value.password = ''
    regForm.value.confirmPassword = ''
  } catch (e: any) {
    regError.value = e.message ?? t('authModal.registrationFailed')
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
    regError.value = e.message ?? t('auth.verificationFailed')
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
