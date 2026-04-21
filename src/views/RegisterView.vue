<template>
  <main class="auth">
    <span class="regmark regmark-tl" aria-hidden="true"></span>
    <span class="regmark regmark-tr" aria-hidden="true"></span>
    <span class="regmark regmark-bl" aria-hidden="true"></span>
    <span class="regmark regmark-br" aria-hidden="true"></span>

    <!-- Left panel: editorial composition -->
    <aside class="panel">
      <div class="panel-inner">
        <RouterLink to="/" class="brand">
          <RgbastLogo size="32px" />
          <span class="brand-name">RGBAST</span>
        </RouterLink>

        <div class="panel-lede">
          <p class="eyebrow font-mono">
            <span class="eyebrow-bullet"></span>
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

        <div class="panel-art" aria-hidden="true">
          <div class="rings">
            <span class="ring r1"></span>
            <span class="ring r2"></span>
            <span class="ring r3"></span>
          </div>
          <div class="grid">
            <span class="g" style="--c:#0e0e10"></span>
            <span class="g" style="--c:#2b2035"></span>
            <span class="g" style="--c:#b410cc"></span>
            <span class="g" style="--c:#f6c343"></span>
            <span class="g" style="--c:#0ec6d4"></span>
            <span class="g" style="--c:#f4efe6"></span>
          </div>
          <div class="ticket font-mono">
            <span class="ticket-row"><span>branch</span><strong>main</strong></span>
            <span class="ticket-row"><span>commits</span><strong>0</strong></span>
            <span class="ticket-row"><span>status</span><strong class="new">initializing</strong></span>
          </div>
        </div>

        <RouterLink to="/" class="back-link font-mono">
          ← Back to index
        </RouterLink>
      </div>
    </aside>

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

          <button
            type="submit"
            :disabled="isSubmitting"
            class="submit"
          >
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
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { authApi, usersApi } from '@/api'
import RgbastLogo from '@/components/RgbastLogo.vue'

const router = useRouter()

const form = ref({ username: '', email: '', password: '', firstname: '', lastname: '', birthdate: '' })
const isSubmitting = ref(false)
const errorMessage = ref('')

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

<style scoped>
.auth {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  background: var(--paper);
}
@media (max-width: 960px) {
  .auth { grid-template-columns: 1fr; }
}

.regmark {
  position: absolute;
  width: 22px; height: 22px;
  z-index: 3;
  pointer-events: none;
}
.regmark::before,
.regmark::after {
  content: "";
  position: absolute;
  background: var(--ink);
  opacity: 0.55;
}
.regmark::before { top: 50%; left: 0; right: 0; height: 1px; transform: translateY(-50%); }
.regmark::after  { left: 50%; top: 0; bottom: 0; width: 1px; transform: translateX(-50%); }
.regmark-tl { top: 20px; left: 20px; }
.regmark-tr { top: 20px; right: 20px; }
.regmark-bl { bottom: 20px; left: 20px; }
.regmark-br { bottom: 20px; right: 20px; }

.panel {
  position: relative;
  background: #DCDCDC;
  border-right: 1px solid var(--rule);
  overflow: hidden;
  padding: 48px clamp(32px, 4vw, 56px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
@media (max-width: 960px) {
  .panel { display: none; }
}
.panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 1px 1px, rgba(14, 14, 16, 0.08) 1px, transparent 0) 0 0 / 24px 24px;
  pointer-events: none;
  opacity: 0.8;
}

.panel-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
  height: 100%;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--ink);
  width: fit-content;
}
.brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -0.03em;
}

.panel-lede { max-width: 440px; }
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-2);
}
.eyebrow-bullet {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--magenta);
  box-shadow: 0 0 0 4px rgba(180, 16, 204, 0.15);
}
.panel-title {
  margin-top: 18px;
  font-size: clamp(48px, 5.5vw, 80px);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.02em;
}
.panel-title em {
  font-style: italic;
  color: var(--magenta-ink);
}
.panel-copy {
  margin-top: 18px;
  font-size: 16px;
  line-height: 1.55;
  color: var(--ink-2);
  max-width: 40ch;
}

.panel-art {
  position: relative;
  flex: 1;
  min-height: 280px;
  display: grid;
  place-items: center;
}
.rings {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(340px, 70%);
  aspect-ratio: 1 / 1;
  transform: translate(-50%, -50%);
}
.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(14, 14, 16, 0.18);
}
.r2 { inset: 14%; border-color: rgba(180, 16, 204, 0.28); }
.r3 { inset: 30%; border: 1px dashed rgba(14, 14, 16, 0.2); animation: spin 100s linear infinite; }

.grid {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: grid;
  grid-template-columns: repeat(3, 44px);
  grid-template-rows: repeat(2, 44px);
  gap: 6px;
}
.g {
  background: var(--c);
  border-radius: 6px;
  box-shadow: 0 1px 0 rgba(14, 14, 16, 0.08), 0 8px 18px -14px rgba(14, 14, 16, 0.4);
  animation: bob 5s ease-in-out infinite;
}
.g:nth-child(1) { animation-delay: 0s; }
.g:nth-child(2) { animation-delay: 0.15s; }
.g:nth-child(3) { animation-delay: 0.3s; }
.g:nth-child(4) { animation-delay: 0.45s; }
.g:nth-child(5) { animation-delay: 0.6s; }
.g:nth-child(6) { animation-delay: 0.75s; }

@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.ticket {
  position: absolute;
  right: 8%;
  bottom: 8%;
  background: var(--paper);
  border: 1px solid var(--rule);
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 170px;
  box-shadow: 0 6px 18px -10px rgba(14, 14, 16, 0.2);
}
.ticket-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  color: var(--ink-3);
}
.ticket-row strong {
  color: var(--ink);
  font-weight: 600;
}
.ticket-row .new { color: var(--magenta); }

.back-link {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-3);
  text-decoration: none;
  transition: color .2s;
}
.back-link:hover { color: var(--magenta); }

.form-col {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px clamp(24px, 5vw, 72px);
}
.form-inner {
  width: 100%;
  max-width: 420px;
  animation: riseIn .7s cubic-bezier(.2,.9,.2,1);
}

.brand-mobile { margin-bottom: 24px; display: none; }
@media (max-width: 960px) {
  .brand-mobile { display: inline-flex; }
}

.form-head { margin-bottom: 32px; }
.step {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.form-title {
  margin-top: 6px;
  font-size: clamp(40px, 4vw, 56px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.form-copy {
  margin-top: 12px;
  font-size: 15px;
  color: var(--ink-2);
  max-width: 34ch;
}

.form { display: grid; gap: 18px; }
.field { display: grid; gap: 6px; }

.optional-group {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--rule);
  border-radius: 12px;
  background: rgba(14,14,16,0.02);
}
.optional-label {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: -4px;
}
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.field-input--date { color-scheme: light; }
.field-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.field-input {
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 12px;
  color: var(--ink);
  font-size: 15px;
  font-family: var(--font-sans);
  outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.field-input::placeholder { color: var(--ink-3); opacity: 0.6; }
.field-input:focus {
  border-color: var(--ink);
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 0 3px rgba(14, 14, 16, 0.06);
}
.hint {
  font-size: 10.5px;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  margin-top: 2px;
}

.err {
  padding: 10px 12px;
  border: 1px solid rgba(179, 32, 50, 0.3);
  border-radius: 10px;
  background: rgba(179, 32, 50, 0.08);
  color: #862028;
  font-size: 13px;
  font-weight: 500;
}

.submit {
  margin-top: 8px;
  padding: 16px 20px;
  background: var(--ink);
  color: var(--paper);
  border: none;
  border-radius: 999px;
  font-weight: 600;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: background .2s, transform .2s;
}
.submit:hover:not(:disabled) { background: var(--magenta); transform: translateY(-1px); }
.submit:disabled { opacity: 0.6; cursor: not-allowed; }

.alt {
  margin-top: 24px;
  font-size: 13.5px;
  color: var(--ink-2);
}
.alt-link {
  color: var(--magenta);
  text-decoration: none;
  font-weight: 600;
  border-bottom: 1px solid transparent;
  transition: border-color .2s;
}
.alt-link:hover { border-bottom-color: var(--magenta); }

@keyframes riseIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
