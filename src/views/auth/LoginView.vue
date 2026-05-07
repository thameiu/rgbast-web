<template>
  <div class="auth-page">
    <SiteHeader />
    <main class="auth">
      <span class="regmark regmark-tl" aria-hidden="true"></span>
      <span class="regmark regmark-tr" aria-hidden="true"></span>
      <span class="regmark regmark-bl" aria-hidden="true"></span>
      <span class="regmark regmark-br" aria-hidden="true"></span>

    <!-- Left panel -->
    <aside class="panel">
      <!-- Large concentric rings — full-panel background -->
      <div class="rings" aria-hidden="true">
        <span class="ring r1"></span>
        <span class="ring r2"></span>
        <span class="ring r3"></span>
        <span class="ring r4"></span>
        <span class="ring r5"></span>
        <span class="ring r6"></span>
      </div>

      <div class="panel-inner">
        <div class="panel-lede">
          <p class="eyebrow font-mono">
            Atelier · returning designer
          </p>
          <h1 class="panel-title font-display">
            Welcome <em>back</em>.
          </h1>
          <p class="panel-copy">
            Your palettes, commits, and branches are waiting exactly where
            you left&nbsp;them.
          </p>
        </div>

        <!-- Scattered palette cards -->
        <div class="panel-art" aria-hidden="true">

          <!-- 2clock — top-left, small -->
          <div class="pc" style="left:3%;top:4%;transform:rotate(11deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#FF331E"></span>
              <span class="pc-col" style="background:#FF6758"></span>
              <span class="pc-col" style="background:#27314F"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">2clock</span></div>
          </div>

          <!-- gmanagr — top-right, small -->
          <div class="pc" style="right:2%;top:6%;transform:rotate(-9deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#CDD5F4"></span>
              <span class="pc-col" style="background:#CAA6F6"></span>
              <span class="pc-col" style="background:#90B2F8"></span>
              <span class="pc-col" style="background:#A6E3A1"></span>
              <span class="pc-col" style="background:#1F1F2F"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">gmanagr</span></div>
          </div>

          <!-- ErgoSix — center, biggest -->
          <div class="pc pc--big" style="left:50%;top:50%;transform:translate(-50%,-50%) rotate(-3deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#FBFFFB"></span>
              <span class="pc-col" style="background:#D3FCB6"></span>
              <span class="pc-col" style="background:#339936"></span>
              <span class="pc-col" style="background:#3C3C9C"></span>
              <span class="pc-col" style="background:#1F1F3F"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">ErgoSix</span></div>
          </div>

          <!-- RGBAST — bottom-left, medium -->
          <div class="pc pc--med" style="left:2%;bottom:6%;transform:rotate(7deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#B410CC"></span>
              <span class="pc-col" style="background:#D56A88"></span>
              <span class="pc-col" style="background:#F6C343"></span>
              <span class="pc-col" style="background:#82C58C"></span>
              <span class="pc-col" style="background:#0EC6D4"></span>
              <span class="pc-col" style="background:#616BD0"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">RGBAST</span></div>
          </div>

          <!-- E-Tron 3D — bottom-right, small -->
          <div class="pc" style="right:3%;bottom:9%;transform:rotate(-12deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#1CF1FF"></span>
              <span class="pc-col" style="background:#D90584"></span>
              <span class="pc-col" style="background:#0E1F2F"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">E-Tron 3D</span></div>
          </div>

        </div>

        <RouterLink to="/" class="back-link font-mono">← Back to index</RouterLink>
      </div>
    </aside>

    <!-- Right: form -->
    <section class="form-col">
      <div class="form-inner">
        <RouterLink to="/" class="brand brand-mobile">
          <RgbastLogo size="28px" />
          <span class="brand-name">RGBAST</span>
        </RouterLink>

        <header class="form-head">
          <p class="step font-mono">Step 01 · Authenticate</p>
          <h2 class="form-title font-display">Sign in</h2>
          <p class="form-copy">Pick up where you left your last commit.</p>
        </header>

        <form class="form" @submit.prevent="handleLogin">
          <label class="field">
            <span class="field-label font-mono">Username</span>
            <input
              v-model="form.username"
              type="text"
              required
              placeholder="your_username"
              class="field-input"
            />
          </label>

          <label class="field">
            <span class="field-label font-mono">Password</span>
            <input
              v-model="form.password"
              type="password"
              required
              placeholder="••••••••"
              class="field-input"
            />
          </label>

          <p class="forgot">
            <RouterLink to="/forgot-password" class="alt-link">Forgot password?</RouterLink>
          </p>

          <p v-if="errorMessage" class="err">{{ errorMessage }}</p>
          <p v-if="showResendVerification" class="resend-wrap">
            <button
              type="button"
              class="resend-link"
              :disabled="resendSubmitting"
              @click="handleResendVerification"
            >
              {{ resendSubmitting ? 'Sending…' : 'Resend verification email' }}
            </button>
          </p>
          <p v-if="infoMessage" class="ok">{{ infoMessage }}</p>

          <button type="submit" :disabled="isSubmitting" class="submit">
            <span>{{ isSubmitting ? 'Signing in…' : 'Sign in' }}</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p class="alt">
          No account yet?
          <RouterLink to="/register" class="alt-link">Create one</RouterLink>
        </p>
      </div>
    </section>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * LoginView — Two-column sign-in page.
 * Left panel: decorative scattered palette cards with concentric rings.
 * Right panel: username/password form that calls authApi.login and redirects to /dashboard.
 */
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api'
import RgbastLogo from '@/components/ui/RgbastLogo.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'

const router = useRouter()
const route = useRoute()
onMounted(() => { document.title = 'Sign in - RGBAST' })

/** Form field values. */
const form = ref({ username: '', password: '' })

/** Whether a login request is in-flight. */
const isSubmitting = ref(false)

/** Error message shown below the form on failure. */
const errorMessage = ref('')
const infoMessage = ref('')
const resendSubmitting = ref(false)
const showResendVerification = ref(false)

onMounted(() => {
  const verified = typeof route.query.verified === 'string' ? route.query.verified : ''
  if (verified === '1') {
    infoMessage.value = 'Email verified. You can now sign in.'
  } else if (verified === 'expired') {
    infoMessage.value = 'Verification link expired. Please register again to receive a new email.'
  } else if (verified === 'invalid') {
    infoMessage.value = 'Verification link is invalid.'
  }
})

/**
 * Submits the login form, stores the access token, and navigates to /dashboard.
 */
async function handleLogin() {
  isSubmitting.value = true
  errorMessage.value = ''
  infoMessage.value = ''
  showResendVerification.value = false
  try {
    const response = await authApi.login({
      username: form.value.username,
      password: form.value.password,
    })
    localStorage.setItem('access_token', response.access_token)
    router.push('/dashboard')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed.'
    errorMessage.value = message
    showResendVerification.value = message.toLowerCase().includes('email not verified')
  } finally {
    isSubmitting.value = false
  }
}

async function handleResendVerification() {
  if (!form.value.username.trim()) {
    errorMessage.value = 'Enter your username or email first.'
    return
  }
  resendSubmitting.value = true
  infoMessage.value = ''
  try {
    const response = await authApi.resendVerificationEmail({
      identifier: form.value.username.trim(),
    })
    infoMessage.value = response.response
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not resend verification email.'
  } finally {
    resendSubmitting.value = false
  }
}
</script>

<style src="./LoginView.css" scoped></style>
