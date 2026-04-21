<template>
  <main class="dash">
    <span class="regmark regmark-tl" aria-hidden="true"></span>
    <span class="regmark regmark-tr" aria-hidden="true"></span>
    <span class="regmark regmark-bl" aria-hidden="true"></span>
    <span class="regmark regmark-br" aria-hidden="true"></span>

    <!-- Top bar -->
    <header class="topbar">
      <RouterLink to="/" class="brand">
        <RgbastLogo size="32px" />
        <span class="brand-name">RGBAST</span>
        <span class="brand-meta font-mono">atelier</span>
      </RouterLink>

      <nav class="topnav">
        <span v-if="user" class="greeting">
          <span class="greet-label font-mono">user</span>
          <strong>{{ user.username }}</strong>
        </span>
        <RouterLink to="/" class="topnav-link">Home</RouterLink>
        <button class="topnav-cta" @click="logout">
          Sign out
          <span aria-hidden="true">→</span>
        </button>
      </nav>
    </header>

    <!-- Page shell -->
    <div class="shell">
      <!-- Sidebar -->
      <aside class="sidebar">
        <AppLoader v-if="loading" message="Loading palettes…" />

        <template v-else-if="user">
          <div class="avatar">
            {{ user.username?.charAt(0)?.toUpperCase() }}
          </div>
          <p class="sidebar-name font-display">{{ user.username }}</p>
          <p class="sidebar-email">{{ user.email || 'No email on file' }}</p>

          <dl class="sidebar-stats">
            <div>
              <dt class="font-mono">palettes</dt>
              <dd>{{ palettes.length }}</dd>
            </div>
          </dl>

          <div class="sidebar-foot font-mono">
            <span>session</span>
            <span class="pulse-row">
              <span class="pulse"></span>
              active
            </span>
          </div>
        </template>

        <p v-else class="err">Unable to fetch session.</p>
      </aside>

      <!-- Content -->
      <section class="content">
        <header class="content-head">
          <p class="eyebrow font-mono">
            <span class="eyebrow-bullet"></span>
            Atelier · active workspace
          </p>
          <h1 class="content-title font-display">
            Your <em>palettes</em>, committed.
          </h1>
        </header>

        <!-- Palettes grid -->
        <div class="palettes-section">
          <div class="section-bar">
            <h2 class="section-title font-display">Palettes</h2>
            <button class="new-palette-btn" @click="newPalette">
              New palette
              <span aria-hidden="true">+</span>
            </button>
          </div>

          <!-- Empty state -->
          <div v-if="palettes.length === 0" class="empty-state">
            <div class="empty-icon">◐</div>
            <p>No palettes yet.</p>
            <button class="empty-cta" @click="newPalette">Create your first palette</button>
          </div>

          <!-- Palette cards -->
          <div v-else class="palettes-grid">
            <article
              v-for="p in palettes"
              :key="p.id"
              class="palette-card"
              @click="openPalette(p)"
            >
              <!-- Color preview strip -->
              <div class="card-strip">
                <div
                  v-for="(col, ci) in p.palette_colors.slice(0, 6)"
                  :key="ci"
                  class="strip-swatch"
                  :style="{ background: '#' + col.hex }"
                ></div>
                <div v-if="p.palette_colors.length === 0" class="strip-empty">No colors</div>
              </div>
              <div class="card-body">
                <h3 class="card-title font-display">{{ p.title }}</h3>
                <p v-if="p.description" class="card-desc">{{ p.description }}</p>
                <p class="card-meta font-mono">{{ fmtDate(p.created_at) }}</p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>

  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { authApi } from '@/api'
import { palettesApi } from '@/api/palettes'
import type { PaletteCache } from '@/api/types'
import RgbastLogo from '@/components/RgbastLogo.vue'
import AppLoader from '@/components/AppLoader.vue'

const router = useRouter()
const loading = ref(true)
const user = ref<any>(null)
const palettes = ref<PaletteCache[]>([])


onMounted(async () => {
  try {
    user.value = await authApi.checkAuth()
    const resp = await palettesApi.getByUsername(user.value.username)
    palettes.value = resp.palettes.map(p => {
      const cached: PaletteCache = {
        id: p.id,
        title: p.title,
        description: undefined,
        created_at: p.created_at,
        palette_colors: p.latest_main_snapshot?.palette_colors ?? [],
      }
      palettesApi.cachePalette(cached)
      return cached
    })
  } catch {
    localStorage.removeItem('access_token')
    router.push('/login')
  } finally {
    loading.value = false
  }
})

function logout() {
  localStorage.removeItem('access_token')
  router.push('/login')
}

function openPalette(p: PaletteCache) {
  router.push({ name: 'palette', params: { id: p.id } })
}

function newPalette() {
  router.push({ name: 'palette', params: { id: 'new' } })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.dash {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  color: var(--ink);
}

/* Registration marks */
.regmark {
  position: fixed;
  width: 22px; height: 22px;
  z-index: 10;
  pointer-events: none;
}
.regmark::before,
.regmark::after {
  content: "";
  position: absolute;
  background: var(--ink);
  opacity: 0.5;
}
.regmark::before { top: 50%; left: 0; right: 0; height: 1px; transform: translateY(-50%); }
.regmark::after  { left: 50%; top: 0; bottom: 0; width: 1px; transform: translateX(-50%); }
.regmark-tl { top: 20px; left: 20px; }
.regmark-tr { top: 20px; right: 20px; }
.regmark-bl { bottom: 20px; left: 20px; }
.regmark-br { bottom: 20px; right: 20px; }

/* Topbar */
.topbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px clamp(24px, 4vw, 56px);
  border-bottom: 1px solid var(--rule);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: var(--ink);
}
.brand-name {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 22px;
  letter-spacing: -0.03em;
}
.brand-meta {
  padding-left: 12px;
  border-left: 1px solid var(--rule);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.topnav {
  display: flex;
  align-items: center;
  gap: 22px;
}
.greeting {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ink-2);
}
.greet-label {
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--ink-3);
  text-transform: uppercase;
}
.greeting strong { font-weight: 600; color: var(--ink); }
.topnav-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  text-decoration: none;
  transition: color .2s;
}
.topnav-link:hover { color: var(--magenta); }
.topnav-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--ink);
  color: var(--paper);
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  transition: background .2s, transform .2s;
}
.topnav-cta:hover { background: var(--magenta); transform: translateY(-1px); }

/* Shell */
.shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: clamp(24px, 3vw, 40px);
  padding: clamp(32px, 5vw, 64px) clamp(24px, 4vw, 56px);
}
@media (max-width: 960px) { .shell { grid-template-columns: 1fr; } }

/* Sidebar */
.sidebar { animation: riseIn .6s cubic-bezier(.2,.9,.2,1); }
.avatar {
  width: 64px; height: 64px;
  background: var(--ink);
  color: var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 28px;
  letter-spacing: -0.02em;
  border-radius: 16px;
}
.sidebar-name { margin-top: 18px; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; }
.sidebar-email { margin-top: 4px; font-size: 13px; color: var(--ink-3); }
.sidebar-stats {
  margin-top: 28px; padding-top: 20px;
  border-top: 1px solid var(--rule);
  display: grid; gap: 14px;
}
.sidebar-stats div { display: flex; align-items: baseline; justify-content: space-between; }
.sidebar-stats dt { font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-3); }
.sidebar-stats dd { font-size: 20px; font-family: var(--font-display); font-weight: 900; color: var(--ink); letter-spacing: -0.02em; }
.sidebar-foot {
  margin-top: 28px; padding-top: 18px;
  border-top: 1px solid var(--rule);
  display: flex; justify-content: space-between;
  font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3);
}
.pulse-row { display: inline-flex; align-items: center; gap: 6px; color: #1f7a2e; }
.pulse {
  width: 7px; height: 7px;
  background: #2faa45;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(47, 170, 69, 0.5);
  animation: pulse 2.2s infinite;
}
@keyframes pulse {
  0%   { box-shadow: 0 0 0 0 rgba(47, 170, 69, 0.45); }
  80%  { box-shadow: 0 0 0 8px rgba(47, 170, 69, 0); }
  100% { box-shadow: 0 0 0 0 rgba(47, 170, 69, 0); }
}
.muted { font-size: 13px; color: var(--ink-3); }
.err { padding: 10px 12px; border: 1px solid rgba(179,32,50,.3); border-radius: 10px; background: rgba(179,32,50,.08); color: #862028; font-size: 13px; }

/* Content */
.content {
  display: grid;
  gap: 28px;
  animation: riseIn .7s cubic-bezier(.2,.9,.2,1) .08s backwards;
}
.content-head { max-width: 680px; }
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
  box-shadow: 0 0 0 4px rgba(180,16,204,.15);
}
.content-title {
  margin-top: 14px;
  font-size: clamp(40px, 5vw, 64px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.035em;
}
.content-title em { font-style: italic; color: var(--magenta-ink); }

/* Palettes section */
.palettes-section { display: grid; gap: 16px; }
.section-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-title {
  font-size: clamp(22px, 2.5vw, 28px);
  font-weight: 900;
  letter-spacing: -0.02em;
}
.new-palette-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--ink);
  color: var(--paper);
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  transition: background .2s, transform .2s;
}
.new-palette-btn:hover { background: var(--magenta); transform: translateY(-1px); }

/* Empty state */
.empty-state {
  padding: 48px 24px;
  border: 1px dashed var(--rule);
  border-radius: 18px;
  text-align: center;
  color: var(--ink-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-icon { font-size: 36px; opacity: 0.4; }
.empty-state p { font-size: 15px; }
.empty-cta {
  padding: 9px 20px;
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
  cursor: pointer;
  transition: border-color .2s, color .2s;
}
.empty-cta:hover { border-color: var(--magenta); color: var(--magenta); }

/* Palette cards grid */
.palettes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.palette-card {
  background: #faf7f0;
  border: 1px solid var(--rule);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform .2s, border-color .2s, box-shadow .2s;
}
.palette-card:hover {
  transform: translateY(-3px);
  border-color: var(--ink-3);
  box-shadow: 0 8px 24px rgba(14,14,16,.08);
}

.card-strip {
  display: flex;
  height: 80px;
}
.strip-swatch { flex: 1; }
.strip-empty {
  flex: 1;
  background: var(--paper-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.05em;
}

.card-body { padding: 14px 16px 16px; }
.card-title { font-size: 16px; font-weight: 900; letter-spacing: -0.01em; color: var(--ink); }
.card-desc { margin-top: 4px; font-size: 12.5px; color: var(--ink-2); line-height: 1.4; }
.card-meta { margin-top: 8px; font-size: 11px; color: var(--ink-3); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(14,14,16,.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 18px;
  padding: 28px;
  width: 400px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 24px 80px rgba(14,14,16,.2);
  animation: modalPop 0.2s cubic-bezier(.2,.9,.2,1);
}
@keyframes modalPop {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-title {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: var(--ink);
  margin-bottom: 20px;
}
.field-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 8px;
}
.required { color: var(--magenta); }
.modal-input {
  width: 100%;
  background: var(--paper-2);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--ink);
  font-size: 14px;
  font-family: var(--font-sans);
  outline: none;
  transition: border-color .15s;
  margin-bottom: 16px;
}
.modal-input:focus { border-color: var(--magenta); }
.modal-error {
  font-size: 13px;
  color: #862028;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: rgba(179,32,50,.06);
  border-radius: 6px;
  border: 1px solid rgba(179,32,50,.2);
}
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
.modal-btn {
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, opacity .15s;
}
.modal-btn.cancel {
  background: transparent;
  border: 1px solid var(--rule);
  color: var(--ink-2);
}
.modal-btn.cancel:hover { border-color: var(--ink-3); color: var(--ink); }
.modal-btn.confirm {
  background: var(--ink);
  border: 1px solid transparent;
  color: var(--paper);
}
.modal-btn.confirm:hover:not(:disabled) { background: var(--magenta); }
.modal-btn.confirm:disabled { opacity: 0.35; cursor: not-allowed; }

@keyframes riseIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
