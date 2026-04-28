<template>
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
        <RouterLink to="/" class="brand">
          <RgbastLogo size="32px" />
          <span class="brand-name">RGBAST</span>
        </RouterLink>

        <div class="panel-lede">
          <p class="eyebrow font-mono">
            <RgbastLogo size="13px" :mono="true" class="eyebrow-logo" />
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

          <!-- PlanMyAsso — top-left, small -->
          <div class="pc" style="left:3%;top:5%;transform:rotate(10deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#FFFFFF"></span>
              <span class="pc-col" style="background:#D2D6CE"></span>
              <span class="pc-col" style="background:#A9B299"></span>
              <span class="pc-col" style="background:#627356"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">PlanMyAsso</span></div>
          </div>

          <!-- Spendly — top-right, small -->
          <div class="pc" style="right:2%;top:7%;transform:rotate(-8deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#F6EDFF"></span>
              <span class="pc-col" style="background:#F1D4F4"></span>
              <span class="pc-col" style="background:#C3A6E8"></span>
              <span class="pc-col" style="background:#7C6CB3"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">Spendly</span></div>
          </div>

          <!-- Kwester — center, biggest -->
          <div class="pc pc--big" style="left:50%;top:50%;transform:translate(-50%,-50%) rotate(3deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#FFA62B"></span>
              <span class="pc-col" style="background:#16697B"></span>
              <span class="pc-col" style="background:#001C3E"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">Kwester</span></div>
          </div>

          <!-- GGPS — bottom-left, small -->
          <div class="pc" style="left:4%;bottom:7%;transform:rotate(-6deg)">
            <div class="pc-strip">
              <span class="pc-col" style="background:#BD0000"></span>
              <span class="pc-col" style="background:#393938"></span>
              <span class="pc-col" style="background:#030303"></span>
            </div>
            <div class="pc-foot"><span class="pc-name">GGPS</span></div>
          </div>

          <!-- Roadica — bottom-right, small -->
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
            <input
              v-model="form.password"
              type="password"
              required
              placeholder="••••••••"
              class="field-input"
            />
            <span class="hint font-mono">
              Uppercase · lowercase · number · symbol · 8+
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

          <button type="submit" :disabled="isSubmitting" class="submit">
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
</template>

<script setup lang="ts">
/**
 * RegisterView — Two-column account creation page.
 * Left panel: decorative scattered palette cards with concentric rings.
 * Right panel: username/email/password form with optional identity fields.
 * On success, auto-logs in and redirects to /dashboard.
 */
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { authApi, usersApi } from '@/api'
import RgbastLogo from '@/components/ui/RgbastLogo.vue'

const router = useRouter()

/** All form field values including optional identity details. */
const form = ref({ username: '', email: '', password: '', firstname: '', lastname: '', birthdate: '' })

/** Whether a registration request is in-flight. */
const isSubmitting = ref(false)

/** Error message shown below the form on failure. */
const errorMessage = ref('')

/**
 * Submits the registration form, then auto-logs in and navigates to /dashboard.
 */
async function handleRegister() {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await usersApi.create({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
      firstname: form.value.firstname || null,
      lastname: form.value.lastname || null,
      birthdate: form.value.birthdate || null,
    })
    const loginResponse = await authApi.login({
      username: form.value.username,
      password: form.value.password,
    })
    localStorage.setItem('access_token', loginResponse.access_token)
    router.push('/dashboard')
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Registration failed.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style src="./RegisterView.css" scoped></style>
