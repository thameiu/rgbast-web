<template>
  <main class="search-view">
    <SiteHeader :user="viewerUser" brand-meta="search" />

    <section class="search-shell">
      <div class="search-top">
        <header class="search-head">
          <h1 class="search-title font-display">Search</h1>
          <p class="search-sub font-mono">Users and palettes</p>
        </header>

        <form class="search-main" @submit.prevent="runSearch">
          <div class="main-controls">
            <div class="cselect" ref="scopeSelectRef">
              <button type="button" class="cselect-trigger" @click="scopeOpen = !scopeOpen">
                <span>{{ scopeLabel }}</span>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <transition name="dd-fade">
                <div v-if="scopeOpen" class="cselect-menu">
                  <button type="button" class="cselect-item" :class="{ active: scope === 'users' }" @click="setScope('users')">Users</button>
                  <button type="button" class="cselect-item" :class="{ active: scope === 'palettes' }" @click="setScope('palettes')">Palettes</button>
                </div>
              </transition>
            </div>

            <div class="search-input-wrap" ref="searchBoxRef">
              <input
                v-model="query"
                class="search-main-input"
                :placeholder="scope === 'users' ? 'Search username, first name, last name' : 'Search palette titles'"
                @focus="recentOpen = true"
                @input="onQueryInput"
                @keydown.escape.prevent="recentOpen = false"
              />
              <button type="submit" class="search-icon-btn" aria-label="Search">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.6" />
                  <path d="M10.6 10.6L14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
              </button>

              <transition name="dd-fade">
                <div v-if="recentOpen && filteredRecentSearches.length > 0" class="recent-dropdown">
                  <button
                    v-for="(item, idx) in filteredRecentSearches"
                    :key="idx + item.createdAt"
                    type="button"
                    class="recent-dd-item"
                    @click="applyRecent(item)"
                  >
                    <span class="recent-dd-main">{{ item.query || '(colors only)' }}</span>
                    <span class="recent-dd-meta">
                      {{ item.scope }}
                      <template v-if="item.scope === 'palettes' && item.colors.length">
                        · {{ item.colorMode }} · {{ item.colors.join(' ') }}
                      </template>
                    </span>
                  </button>
                </div>
              </transition>
            </div>
          </div>

          <div v-if="scope === 'palettes'" class="palette-filters">
            <div class="cselect" ref="colorModeSelectRef">
              <button type="button" class="cselect-trigger" @click="colorModeOpen = !colorModeOpen">
                <span>{{ colorModeLabel }}</span>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <transition name="dd-fade">
                <div v-if="colorModeOpen" class="cselect-menu">
                  <button type="button" class="cselect-item" :class="{ active: colorMode === 'exact' }" @click="setColorMode('exact')">Exact colors</button>
                  <button type="button" class="cselect-item" :class="{ active: colorMode === 'similar' }" @click="setColorMode('similar')">Similar range</button>
                </div>
              </transition>
            </div>

            <div class="color-field">
              <input
                v-model="colorInput"
                class="color-input"
                placeholder="Colors: #FF0055 #1A9C6F"
                @keydown.enter.prevent="addColorsFromInput"
              />
              <button type="button" class="small-btn" @click="addColorsFromInput">Add</button>
            </div>
          </div>

          <div v-if="scope === 'palettes' && colors.length" class="color-chips">
            <button
              v-for="hex in colors"
              :key="hex"
              type="button"
              class="chip"
              @click="removeColor(hex)"
            >
              <span class="chip-dot" :style="{ background: '#' + hex }"></span>
              {{ hex }}
              <span>×</span>
            </button>
          </div>
        </form>
      </div>

      <p v-if="errorMessage" class="search-error">{{ errorMessage }}</p>

      <section v-if="searchDone && scope === 'users'" class="results">
        <h2 class="results-title font-display">Users · {{ userResults.length }}</h2>
        <div v-if="userResults.length === 0" class="empty">No users found.</div>
        <div v-else class="users-grid">
          <button
            v-for="user in userResults"
            :key="user.id"
            class="user-card"
            @click="router.push(`/users/${encodeURIComponent(user.username)}`)"
          >
            <span class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</span>
            <span class="user-name">{{ user.username }}</span>
            <span class="user-full">{{ [user.firstname, user.lastname].filter(Boolean).join(' ') || '—' }}</span>
          </button>
        </div>
      </section>

      <section v-if="searchDone && scope === 'palettes'" class="results">
        <h2 class="results-title font-display">Palettes · {{ paletteResults.length }}</h2>
        <div v-if="paletteResults.length === 0" class="empty">No palettes found.</div>
        <div v-else class="palettes-grid">
          <PaletteCard
            v-for="palette in paletteResults"
            :key="`${palette.owner_username}-${palette.id}`"
            :palette="paletteToCard(palette)"
            :show-actions="false"
            @open="openPaletteResult(palette)"
          />
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { searchApi } from '@/api/search'
import type { PaletteCache, PaletteSearchItem, UserSearchItem } from '@/api/types'
import type { RecentSearchEntry } from '@/api/search'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import PaletteCard from '@/components/palette/PaletteCard.vue'

const router = useRouter()
const viewerUser = ref<any>(null)
const SEARCH_SCOPE_KEY = 'rgbast_search_scope'

const scope = ref<'users' | 'palettes'>('users')
const query = ref('')
const colorMode = ref<'exact' | 'similar'>('exact')
const colorInput = ref('')
const colors = ref<string[]>([])

const errorMessage = ref('')
const searchDone = ref(false)
const userResults = ref<UserSearchItem[]>([])
const paletteResults = ref<PaletteSearchItem[]>([])
const recentSearches = ref<RecentSearchEntry[]>([])

const scopeOpen = ref(false)
const colorModeOpen = ref(false)
const recentOpen = ref(false)

const scopeSelectRef = ref<HTMLElement | null>(null)
const colorModeSelectRef = ref<HTMLElement | null>(null)
const searchBoxRef = ref<HTMLElement | null>(null)

const scopeLabel = computed(() => scope.value === 'users' ? 'Users' : 'Palettes')
const colorModeLabel = computed(() => colorMode.value === 'exact' ? 'Exact colors' : 'Similar range')

const filteredRecentSearches = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return recentSearches.value
    .filter(item => item.scope === scope.value)
    .filter((item) => {
      if (!needle) return true
      if (item.query.toLowerCase().includes(needle)) return true
      return item.colors.some(c => c.toLowerCase().includes(needle.replace('#', '')))
    })
    .slice(0, 8)
})

function loadRecentSearches() {
  recentSearches.value = searchApi.getRecentSearches()
}

function onQueryInput() {
  recentOpen.value = true
}

function setScope(next: 'users' | 'palettes') {
  scope.value = next
  scopeOpen.value = false
  recentOpen.value = true
  localStorage.setItem(SEARCH_SCOPE_KEY, next)
}

function setColorMode(next: 'exact' | 'similar') {
  colorMode.value = next
  colorModeOpen.value = false
}

function addColorsFromInput() {
  const matches = colorInput.value.match(/#?[0-9a-fA-F]{6}/g) ?? []
  const next = [...colors.value]
  for (const raw of matches) {
    const normalized = raw.replace('#', '').toUpperCase()
    if (!next.includes(normalized)) next.push(normalized)
  }
  colors.value = next.slice(0, 8)
  colorInput.value = ''
}

function removeColor(hex: string) {
  colors.value = colors.value.filter(item => item !== hex)
}

function applyRecent(item: RecentSearchEntry) {
  scope.value = item.scope
  localStorage.setItem(SEARCH_SCOPE_KEY, item.scope)
  query.value = item.query
  colorMode.value = item.colorMode
  colors.value = [...item.colors]
  recentOpen.value = false
  void runSearch()
}

async function runSearch() {
  errorMessage.value = ''
  searchDone.value = false
  userResults.value = []
  paletteResults.value = []
  recentOpen.value = false

  const trimmed = query.value.trim()
  if (scope.value === 'users' && !trimmed) {
    errorMessage.value = 'Enter a user query.'
    return
  }
  if (scope.value === 'palettes' && !trimmed && colors.value.length === 0) {
    errorMessage.value = 'Enter a title query or at least one color.'
    return
  }

  try {
    if (scope.value === 'users') {
      const response = await searchApi.searchUsers(trimmed)
      userResults.value = response.results
    } else {
      const response = await searchApi.searchPalettes({
        query: trimmed || undefined,
        colors: colors.value,
        colorMode: colorMode.value,
      })
      paletteResults.value = response.results
    }
    searchApi.saveRecentSearch({
      scope: scope.value,
      query: trimmed,
      colors: colors.value,
      colorMode: colorMode.value,
    })
    loadRecentSearches()
    searchDone.value = true
  } catch (e: any) {
    errorMessage.value = e?.message ?? 'Search failed.'
  }
}

function paletteToCard(item: PaletteSearchItem): PaletteCache & { ownerUsername: string; ownerClickable: boolean } {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? undefined,
    folder_path: item.folder_path,
    created_at: item.created_at,
    last_snapshot_at: item.latest_main_snapshot_created_at ?? undefined,
    palette_colors: item.palette_colors,
    ownerUsername: item.owner_username,
    ownerClickable: true,
  }
}

function openPaletteResult(item: PaletteSearchItem) {
  const path = [...item.folder_path, item.title].join('/')
  router.push({
    name: 'palette',
    params: { username: item.owner_username, pathMatch: path },
  })
}

function onGlobalPointerDown(event: PointerEvent) {
  const target = event.target as Node | null
  if (!target) return

  if (!scopeSelectRef.value?.contains(target)) scopeOpen.value = false
  if (!colorModeSelectRef.value?.contains(target)) colorModeOpen.value = false
  if (!searchBoxRef.value?.contains(target)) recentOpen.value = false
}

onMounted(async () => {
  const savedScope = localStorage.getItem(SEARCH_SCOPE_KEY)
  if (savedScope === 'users' || savedScope === 'palettes') {
    scope.value = savedScope
  }
  loadRecentSearches()
  document.addEventListener('pointerdown', onGlobalPointerDown)
  const token = localStorage.getItem('access_token')
  if (!token) return
  try {
    viewerUser.value = await authApi.checkAuth()
  } catch {
    viewerUser.value = null
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onGlobalPointerDown)
})
</script>

<style scoped src="./SearchView.css"></style>
