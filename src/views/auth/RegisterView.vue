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
      <!-- Large concentric rings - full-panel background -->
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
            Atelier · new designer
          </p>
          <h1 class="panel-title font-display">
            Open a <em>new book</em>.
          </h1>
          <p class="panel-copy">
            A blank workspace for your first palette. Commit your first
            color, branch from day&nbsp;one.
          </p>
        </div>

        <!-- Scattered palette cards -->
        <div class="panel-art" aria-hidden="true">

          <!-- PlanMyAsso - top-left, small -->
          <div class="pc" style="left:3%;top:5%;transform:rotate(10deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#FFFFFF"></span>
              <span class="pc-col" style="background:#D2D6CE"></span>
              <span class="pc-col" style="background:#A9B299"></span>
              <span class="pc-col" style="background:#627356"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">PlanMyAsso</span></div>
          </div>

          <!-- Spendly - top-right, small -->
          <div class="pc" style="right:2%;top:7%;transform:rotate(-8deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#F6EDFF"></span>
              <span class="pc-col" style="background:#F1D4F4"></span>
              <span class="pc-col" style="background:#C3A6E8"></span>
              <span class="pc-col" style="background:#7C6CB3"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">Spendly</span></div>
          </div>

          <!-- Kwester - center, biggest -->
          <div class="pc pc--big" style="left:50%;top:50%;transform:translate(-50%,-50%) rotate(3deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#FFA62B"></span>
              <span class="pc-col" style="background:#16697B"></span>
              <span class="pc-col" style="background:#001C3E"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">Kwester</span></div>
          </div>

          <!-- GGPS - bottom-left, small -->
          <div class="pc" style="left:4%;bottom:7%;transform:rotate(-6deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#BD0000"></span>
              <span class="pc-col" style="background:#393938"></span>
              <span class="pc-col" style="background:#030303"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">GGPS</span></div>
          </div>

          <!-- Roadica - bottom-right, small -->
          <div class="pc" style="right:3%;bottom:10%;transform:rotate(9deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#002232"></span>
              <span class="pc-col" style="background:#1F2937"></span>
              <span class="pc-col" style="background:#FFFFFF"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">Roadica</span></div>
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
          <p class="step font-mono">Step 01 · Open an account</p>
          <h2 class="form-title font-display">Create account</h2>
          <p class="form-copy">Three required fields. Identity details are optional.</p>
        </header>

        <form class="form" @submit.prevent="handleRegister">
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
            <span class="field-label font-mono">Email</span>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="you@example.com"
              class="field-input"
            />
          </label>

          <label class="field">
            <span class="field-label font-mono">Password</span>
            <div class="password-input-wrap">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="field-input field-input--with-eye"
              />
              <button type="button" class="password-eye-btn" @click="showPassword = !showPassword">
                <svg v-if="showPassword" width="15" height="15" viewBox="0 0 16 16" fill="none">
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
            <span class="hint font-mono">
              Uppercase · lowercase · number · symbol · 8+
            </span>
          </label>

          <label class="field">
            <span class="field-label font-mono">Confirm password</span>
            <div class="password-input-wrap">
              <input
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="field-input field-input--with-eye"
              />
              <button type="button" class="password-eye-btn" @click="showConfirmPassword = !showConfirmPassword">
                <svg v-if="showConfirmPassword" width="15" height="15" viewBox="0 0 16 16" fill="none">
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
            <span v-if="passwordsMismatch" class="hint hint--error font-mono">
              Passwords do not match.
            </span>
          </label>

          <div class="optional-group">
            <p class="optional-label font-mono">Optional</p>
            <div class="field-row">
              <label class="field">
                <span class="field-label font-mono">First name</span>
                <input v-model="form.firstname" type="text" placeholder="Ada" class="field-input" />
              </label>
              <label class="field">
                <span class="field-label font-mono">Last name</span>
                <input v-model="form.lastname" type="text" placeholder="Lovelace" class="field-input" />
              </label>
            </div>
            <label class="field">
              <span class="field-label font-mono">Birthdate</span>
              <input v-model="form.birthdate" type="date" class="field-input field-input--date" />
            </label>
          </div>

          <p v-if="errorMessage" class="err">{{ errorMessage }}</p>
          <p v-if="successMessage" class="ok">{{ successMessage }}</p>

          <button type="submit" :disabled="isSubmitting || passwordsMismatch" class="submit">
            <span>{{ isSubmitting ? 'Creating…' : 'Create account' }}</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p class="alt">
          Already have an account?
          <RouterLink to="/login" class="alt-link">Sign in</RouterLink>
        </p>
      </div>
    </section>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * RegisterView - Two-column account creation page.
 * Left panel: decorative scattered palette cards with concentric rings.
 * Right panel: username/email/password form with optional identity fields.
 * On success, asks the user to verify email from the mailbox link.
 */
import { computed, ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { usersApi } from '@/api'
import RgbastLogo from '@/components/ui/RgbastLogo.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import { setPageSeo } from '@/utils/seo'

onMounted(() => {
  setPageSeo({
    title: 'Create account - RGBAST',
    description: 'Create your RGBAST account to generate palettes, track snapshot history, branch color experiments, and manage folders.',
    keywords: ['register', 'create account', 'palette account', 'color workspace signup'],
  })
})

/** All form field values including optional identity details. */
const form = ref({ username: '', email: '', password: '', confirmPassword: '', firstname: '', lastname: '', birthdate: '' })
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordsMismatch = computed(() => !!form.value.password && !!form.value.confirmPassword && form.value.password !== form.value.confirmPassword)

/** Whether a registration request is in-flight. */
const isSubmitting = ref(false)

/** Error message shown below the form on failure. */
const errorMessage = ref('')
const successMessage = ref('')

/**
 * Submits the registration form and asks the user to verify email.
 */
async function handleRegister() {
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  if (passwordsMismatch.value) {
    errorMessage.value = 'Passwords do not match.'
    isSubmitting.value = false
    return
  }
  try {
    await usersApi.create({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
      firstname: form.value.firstname || null,
      lastname: form.value.lastname || null,
      birthdate: form.value.birthdate || null,
      verify_type: 'link',
    })
    successMessage.value = 'Account created. Check your email and click the verification link to sign in.'
    form.value.password = ''
    form.value.confirmPassword = ''
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Registration failed.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style src="./RegisterView.css" scoped></style>
