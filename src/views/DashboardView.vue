<template>
  <main class="dash">
    <span class="regmark regmark-tl" aria-hidden="true"></span>
    <span class="regmark regmark-tr" aria-hidden="true"></span>
    <span class="regmark regmark-bl" aria-hidden="true"></span>
    <span class="regmark regmark-br" aria-hidden="true"></span>

    <SiteHeader :user="user" brand-meta="atelier" />

    <!-- Page shell (offset for fixed header) -->
    <div class="shell">
      <!-- Sidebar -->
      <aside class="sidebar">
        <AppLoader v-if="loading" message="Loading palettes…" />

        <template v-else-if="user">
          <div class="avatar">{{ user.username?.charAt(0)?.toUpperCase() }}</div>
          <p class="sidebar-name font-display">{{ user.username }}</p>
          <p v-if="user.firstname || user.lastname" class="sidebar-fullname">
            {{ [user.firstname, user.lastname].filter(Boolean).join(' ') }}
          </p>
          <p class="sidebar-email">{{ user.email || 'No email on file' }}</p>

          <dl class="sidebar-stats">
            <div>
              <dt class="font-mono">palettes</dt>
              <dd>{{ palettes.length }}</dd>
            </div>
          </dl>

        </template>

        <p v-else class="err">Unable to fetch session.</p>
      </aside>

      <!-- Content -->
      <section class="content">
        <header class="content-head">
          <p class="eyebrow font-mono">
            <RgbastLogo size="13px" :mono="true" class="eyebrow-logo" />
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
              <button class="card-del-btn" title="Delete palette" @click.stop="confirmDeletePalette(p)">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M1.5 3h10M5 3V1.5h3V3M4 3l.5 8M6.5 3v8M9 3l-.5 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </article>
          </div>
        </div>
      </section>
    </div>

  <!-- Delete confirm modal -->
  <Teleport to="body">
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal">
        <h3 class="modal-title font-display">Delete Palette</h3>
        <p class="modal-sub">Delete <strong>{{ deleteTarget.title }}</strong>? All snapshots and branches will be permanently lost.</p>
        <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="deleteTarget = null">Cancel</button>
          <button class="modal-btn danger" :disabled="isDeleting" @click="doDeletePalette">
            {{ isDeleting ? 'Deleting…' : 'Delete permanently' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { authApi } from '@/api'
import { palettesApi } from '@/api/palettes'
import type { PaletteCache } from '@/api/types'
import RgbastLogo from '@/components/RgbastLogo.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import AppLoader from '@/components/AppLoader.vue'

const router = useRouter()
const loading = ref(true)
const user = ref<any>(null)
const palettes = ref<PaletteCache[]>([])
const deleteTarget = ref<PaletteCache | null>(null)
const isDeleting = ref(false)
const deleteError = ref('')


onMounted(async () => {
  try {
    user.value = await authApi.checkAuth()
    const resp = await palettesApi.getByUsername(user.value.username)
    palettes.value = resp.palettes.map(p => {
      const cached: PaletteCache = {
        id: p.id,
        title: p.title,
        description: p.description,
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

function openPalette(p: PaletteCache) {
  router.push({ name: 'palette', params: { id: p.id } })
}

function newPalette() {
  router.push({ name: 'palette', params: { id: 'new' } })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

function confirmDeletePalette(p: PaletteCache) {
  deleteTarget.value = p
  deleteError.value = ''
}

async function doDeletePalette() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  deleteError.value = ''
  try {
    await palettesApi.deletePalette(deleteTarget.value.id)
    palettes.value = palettes.value.filter(p => p.id !== deleteTarget.value!.id)
    deleteTarget.value = null
  } catch (e: any) {
    deleteError.value = e.message ?? 'Delete failed'
  } finally {
    isDeleting.value = false
  }
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

/* Shell */
.shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: clamp(24px, 3vw, 40px);
  padding: calc(68px + clamp(32px, 5vw, 64px)) clamp(24px, 4vw, 56px) clamp(32px, 5vw, 64px);
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
  font-weight: 700;
  font-size: 35px;
  line-height: 1;
  padding-top: 4px;
  border-radius: 16px;
}
.sidebar-name { margin-top: 18px; font-size: 30px; font-weight: 700; }
.sidebar-fullname { margin-top: 3px; font-size: 14px; color: var(--ink-2); font-weight: 500; }
.sidebar-email { margin-top: 4px; font-size: 12px; color: var(--ink-3); }
.sidebar-stats {
  margin-top: 28px; padding-top: 20px;
  border-top: 1px solid var(--rule);
  display: grid; gap: 14px;
}
.sidebar-stats div { display: flex; align-items: baseline; justify-content: space-between; }
.sidebar-stats dt { font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-3); }
.sidebar-stats dd { font-size: 25px; font-family: var(--font-display); font-weight: 700; color: var(--ink); }
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
.eyebrow-logo {
  flex-shrink: 0;
}
.content-title {
  margin-top: 14px;
  font-size: clamp(50px, 6.25vw, 80px);
  font-weight: 700;
  line-height: 1;
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
  font-size: clamp(28px, 3.1vw, 35px);
  font-weight: 700;
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
  position: relative;
}
.palette-card:hover {
  transform: translateY(-3px);
  border-color: var(--ink-3);
  box-shadow: 0 8px 24px rgba(14,14,16,.08);
}

.card-del-btn {
  position: absolute;
  top: 8px; right: 8px;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: rgba(14,14,16,0.55);
  border: 1px solid rgba(255,255,255,0.18);
  color: rgba(255,255,255,0.75);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
  z-index: 5;
}
.palette-card:hover .card-del-btn { opacity: 1; }
.card-del-btn:hover { background: rgba(180,20,20,0.85) !important; border-color: rgba(255,80,80,0.4); color: #fff; }

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
.card-title { font-size: 20px; font-weight: 700; color: var(--ink); }
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
  font-size: 28px;
  font-weight: 700;
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
.modal-btn.danger {
  background: #b41414;
  border: 1px solid transparent;
  color: #fff;
}
.modal-btn.danger:hover:not(:disabled) { background: #991010; }
.modal-btn.danger:disabled { opacity: 0.35; cursor: not-allowed; }

@keyframes riseIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
