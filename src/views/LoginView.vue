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

          <p v-if="errorMessage" class="err">{{ errorMessage }}</p>

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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { authApi } from '@/api'
import RgbastLogo from '@/components/RgbastLogo.vue'

const router = useRouter()

const form = ref({ username: '', password: '' })
const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const response = await authApi.login({
      username: form.value.username,
      password: form.value.password,
    })
    localStorage.setItem('access_token', response.access_token)
    router.push('/dashboard')
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Login failed.'
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

/* ===== Registration marks ===== */
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

/* ===== Left panel ===== */
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
  background: radial-gradient(circle at 1px 1px, rgba(14, 14, 16, 0.06) 1px, transparent 0) 0 0 / 24px 24px;
  pointer-events: none;
  z-index: 0;
}

/* ===== Concentric rings (large, vertically centered) ===== */
.rings {
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(600px, 130%, 1000px);
  aspect-ratio: 1 / 1;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 0;
}
.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: none;
  border: none;
}
.r1 { border: 1.5px solid #B410CC; opacity: 0.22; }
.r2 { inset: 14%; border: 1.5px solid #D56A88; opacity: 0.14; }
.r3 { inset: 27%; border: 1.5px solid #F6C343; opacity: 0.16; }
.r4 { inset: 40%; border: 1.5px solid #82C58C; opacity: 0.18; }
.r5 { inset: 53%; border: 1.5px solid #0EC6D4; opacity: 0.18; }
.r6 { inset: 66%; border: 1.5px solid #616BD0; opacity: 0.16; }

/* ===== Panel inner content ===== */
.panel-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 28px;
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
}

.panel-lede { max-width: 440px; }
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-2);
}
.eyebrow-logo { flex-shrink: 0; }

.panel-title {
  margin-top: 18px;
  font-size: clamp(44px, 5vw, 76px);
  font-weight: 700;
  line-height: 0.95;
}
.panel-title em {
  font-style: italic;
  color: var(--magenta-ink);
}
.panel-copy {
  margin-top: 16px;
  font-size: 15px;
  line-height: 1.55;
  color: var(--ink-2);
  max-width: 40ch;
}

/* ===== Scattered palette cards ===== */
.panel-art {
  position: relative;
  flex: 1;
  min-height: 360px;
}

/* Mini palette card */
.pc {
  position: absolute;
  width: 148px;
  background: #faf7f0;
  border: 1px solid rgba(14, 14, 16, 0.12);
  border-radius: 11px;
  overflow: hidden;
  box-shadow: 0 4px 18px rgba(14, 14, 16, 0.18);
}
.pc--med  { width: 172px; }
.pc--big  { width: 228px; }

.pc-strip {
  display: flex;
  height: 54px;
}
.pc--big .pc-strip  { height: 74px; }
.pc--med .pc-strip  { height: 62px; }

.pc-col { flex: 1; }

.pc-foot {
  padding: 7px 10px 9px;
  background: #faf7f0;
}
.pc--big .pc-foot { padding: 9px 12px 11px; }

.pc-name {
  display: block;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc--big .pc-name  { font-size: 22px; }
.pc--med .pc-name  { font-size: 19px; }

.back-link {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-3);
  text-decoration: none;
  transition: color .2s;
}
.back-link:hover { color: var(--magenta); }

/* ===== Right form column ===== */
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
  font-weight: 700;
  line-height: 1;
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
