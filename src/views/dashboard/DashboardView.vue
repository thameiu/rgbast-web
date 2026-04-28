<template>
  <main class="dash">
    <span class="regmark regmark-tl" aria-hidden="true"></span>
    <span class="regmark regmark-tr" aria-hidden="true"></span>
    <span class="regmark regmark-bl" aria-hidden="true"></span>
    <span class="regmark regmark-br" aria-hidden="true"></span>

    <SiteHeader :user="user" brand-meta="atelier" />

    <div class="shell">
      <aside class="sidebar">
        <AppLoader v-if="loading" message="Loading palettes..." />

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

        <div class="palettes-section">
          <div class="section-bar">
            <h2 class="section-title font-display">Palettes</h2>
            <button class="new-palette-btn" @click="newPalette">
              New palette
              <span aria-hidden="true">+</span>
            </button>
          </div>

          <div v-if="palettes.length === 0" class="empty-state">
            <div class="empty-icon">◐</div>
            <p>No palettes yet.</p>
            <button class="empty-cta" @click="newPalette">Create your first palette</button>
          </div>

          <div v-else class="palettes-grid">
            <article
              v-for="p in palettes"
              :key="p.id"
              class="palette-card"
              @click="openPalette(p)"
            >
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

    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal">
          <h3 class="modal-title font-display">Delete Palette</h3>
          <p class="modal-sub">
            Delete <strong>{{ deleteTarget.title }}</strong>? All snapshots and branches will be permanently lost.
          </p>
          <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="deleteTarget = null">Cancel</button>
            <button class="modal-btn danger" :disabled="isDeleting" @click="doDeletePalette">
              {{ isDeleting ? 'Deleting...' : 'Delete permanently' }}
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
import RgbastLogo from '@/components/ui/RgbastLogo.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import AppLoader from '@/components/ui/AppLoader.vue'

// DashboardView component: displays user profile details and palette cards.
const router = useRouter()
const loading = ref(true)
const user = ref<any>(null)
const palettes = ref<PaletteCache[]>([])
const deleteTarget = ref<PaletteCache | null>(null)
const isDeleting = ref(false)
const deleteError = ref('')

/**
 * Load the current user session and their palettes for the dashboard.
 */
async function loadDashboard() {
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
}

onMounted(() => {
  document.title = 'Dashboard - RGBAST'
  void loadDashboard()
})

/**
 * Navigate to a palette editor for the selected palette.
 * @param p - Palette cache entry to open.
 */
function openPalette(p: PaletteCache) {
  router.push({ name: 'palette', params: { id: p.id } })
}

/**
 * Navigate to a new palette draft page.
 */
function newPalette() {
  router.push({ name: 'palette', params: { id: 'new' } })
}

/**
 * Format the palette created_at ISO date for display in the card.
 * @param iso - ISO date string.
 */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Open the delete confirmation modal for a palette.
 * @param p - Palette cache entry to delete.
 */
function confirmDeletePalette(p: PaletteCache) {
  deleteTarget.value = p
  deleteError.value = ''
}

/**
 * Delete the selected palette and update the grid.
 */
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

<style src="./DashboardView.css" scoped></style>
