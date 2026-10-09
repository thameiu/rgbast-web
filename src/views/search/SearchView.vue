<template>
  <main class="search-view">
    <SiteHeader :user="viewerUser" :brand-meta="t('common.discover')" />

    <section class="search-shell">
      <div class="search-top">
        <header class="search-head">
          <h1 class="search-title font-display">{{ t('common.discover') }}</h1>
          <p class="search-sub font-mono">{{ t('discoverPage.subtitle') }}</p>
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
                  <button type="button" class="cselect-item" :class="{ active: scope === 'users' }" @click="setScope('users')">{{ t('searchPage.users') }}</button>
                  <button type="button" class="cselect-item" :class="{ active: scope === 'palettes' }" @click="setScope('palettes')">{{ t('searchPage.palettes') }}</button>
                </div>
              </transition>
            </div>

            <div class="search-input-wrap" ref="searchBoxRef">
              <input
                v-model="query"
                class="search-main-input"
                :placeholder="scope === 'users' ? t('searchPage.userPlaceholder') : t('searchPage.palettePlaceholder')"
                @focus="recentOpen = true"
                @input="onQueryInput"
                @keydown.escape.prevent="recentOpen = false"
              />
              <button type="submit" class="search-icon-btn" :aria-label="t('discoverPage.searchAria')">
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
                    <span class="recent-dd-main">{{ item.query || t('searchPage.colorsOnly') }}</span>
                    <span class="recent-dd-meta">
                      {{ recentScopeLabel(item.scope) }}
                      <template v-if="item.scope === 'palettes' && item.colors.length">
                        · {{ recentColorModeLabel(item.colorMode) }} · {{ item.colors.join(' ') }}
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
                  <button type="button" class="cselect-item" :class="{ active: colorMode === 'exact' }" @click="setColorMode('exact')">{{ t('searchPage.exactColors') }}</button>
                  <button type="button" class="cselect-item" :class="{ active: colorMode === 'similar' }" @click="setColorMode('similar')">{{ t('searchPage.similarRange') }}</button>
                </div>
              </transition>
            </div>

            <div class="color-field">
              <input
                v-model="colorInput"
                class="color-input"
                :placeholder="t('searchPage.colorPlaceholder')"
                @keydown.enter.prevent="addColorsFromInput"
              />
              <button type="button" class="small-btn" @click="addColorsFromInput">{{ t('searchPage.add') }}</button>
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

      <section v-if="!searchDone" class="discover-sections">
        <section v-if="colleaguePalettes.length" class="results discover-section">
          <div class="discover-section-head">
            <h2 class="results-title font-display">{{ t('discoverPage.byColleagues') }}</h2>
            <span class="discover-count font-mono">{{ colleaguePalettes.length }}</span>
          </div>
          <div class="palettes-grid">
            <PaletteCard
              v-for="palette in colleaguePalettes"
              :key="`colleague-${palette.owner_username}-${palette.id}`"
              :palette="paletteToCard(palette)"
              :show-actions="false"
              @open="openPaletteResult(palette)"
            />
          </div>
        </section>

        <section class="results discover-section">
          <div class="discover-section-head">
            <h2 class="results-title font-display">{{ t('discoverPage.mostRecent') }}</h2>
            <span v-if="recentPalettes.length" class="discover-count font-mono">{{ recentPalettes.length }}</span>
          </div>
          <div v-if="discoverLoading" class="empty">{{ t('common.loadingPalettes') }}</div>
          <div v-else-if="recentPalettes.length === 0" class="empty">{{ t('discoverPage.noPublicPalettes') }}</div>
          <div v-else class="palettes-grid">
            <PaletteCard
              v-for="palette in recentPalettes"
              :key="`recent-${palette.owner_username}-${palette.id}`"
              :palette="paletteToCard(palette)"
              :show-actions="false"
              @open="openPaletteResult(palette)"
            />
          </div>
        </section>
      </section>

      <section v-if="searchDone && scope === 'users'" class="results">
        <h2 class="results-title font-display">{{ t('searchPage.users') }} · {{ userResults.length }}</h2>
        <div v-if="userResults.length === 0" class="empty">{{ t('searchPage.noUsers') }}</div>
        <div v-else class="users-grid">
          <button
            v-for="user in userResults"
            :key="user.id"
            class="user-card"
            @click="router.push(`/users/${encodeURIComponent(user.username)}`)"
          >
            <span class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</span>
            <span class="user-name">{{ user.username }}</span>
            <span class="user-full">{{ [user.firstname, user.lastname].filter(Boolean).join(' ') || '-' }}</span>
          </button>
        </div>
      </section>

      <section v-if="searchDone && scope === 'palettes'" class="results">
        <h2 class="results-title font-display">{{ t('searchPage.palettes') }} · {{ paletteResults.length }}</h2>
        <div v-if="paletteResults.length === 0" class="empty">{{ t('searchPage.noPalettes') }}</div>
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
import { setPageSeo } from '@/utils/seo'
import { useI18n } from '@/i18n'

const router = useRouter()
const { t } = useI18n()
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
const recentPalettes = ref<PaletteSearchItem[]>([])
const colleaguePalettes = ref<PaletteSearchItem[]>([])
const discoverLoading = ref(false)
const recentSearches = ref<RecentSearchEntry[]>([])

const scopeOpen = ref(false)
const colorModeOpen = ref(false)
const recentOpen = ref(false)

const scopeSelectRef = ref<HTMLElement | null>(null)
const colorModeSelectRef = ref<HTMLElement | null>(null)
const searchBoxRef = ref<HTMLElement | null>(null)

const scopeLabel = computed(() => scope.value === 'users' ? t('searchPage.users') : t('searchPage.palettes'))
const colorModeLabel = computed(() => colorMode.value === 'exact' ? t('searchPage.exactColors') : t('searchPage.similarRange'))

function recentScopeLabel(value: RecentSearchEntry['scope']): string {
  return value === 'users' ? t('searchPage.users') : t('searchPage.palettes')
}

function recentColorModeLabel(value: RecentSearchEntry['colorMode']): string {
  return value === 'exact' ? t('searchPage.exactColors') : t('searchPage.similarRange')
}

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
  if (!query.value.trim() && colors.value.length === 0) {
    searchDone.value = false
    errorMessage.value = ''
  }
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
  if (!query.value.trim() && colors.value.length === 0) searchDone.value = false
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
    errorMessage.value = t('searchPage.enterUserQuery')
    return
  }
  if (scope.value === 'palettes' && !trimmed && colors.value.length === 0) {
    errorMessage.value = t('searchPage.enterPaletteQuery')
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
    errorMessage.value = e?.message ?? t('searchPage.searchFailed')
  }
}

async function loadDiscoverPalettes() {
  discoverLoading.value = true
  try {
    const [recent, colleagues] = await Promise.all([
      searchApi.discoverRecentPalettes(24),
      localStorage.getItem('access_token')
        ? searchApi.discoverColleaguePalettes(12).catch(() => ({ total: 0, results: [] }))
        : Promise.resolve({ total: 0, results: [] }),
    ])
    recentPalettes.value = recent.results
    colleaguePalettes.value = colleagues.results
  } catch (e: any) {
    errorMessage.value = e?.message ?? t('discoverPage.loadFailed')
  } finally {
    discoverLoading.value = false
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
  setPageSeo({
    title: `${t('common.discover')} - RGBAST`,
    description: t('discoverPage.metaDescription'),
    keywords: ['discover palettes', 'recent palettes', 'palette search', 'search colors', 'find palettes', 'color matching'],
  })
  const savedScope = localStorage.getItem(SEARCH_SCOPE_KEY)
  if (savedScope === 'users' || savedScope === 'palettes') {
    scope.value = savedScope
  }
  loadRecentSearches()
  document.addEventListener('pointerdown', onGlobalPointerDown)
  const token = localStorage.getItem('access_token')
  if (token) {
    try {
      viewerUser.value = await authApi.checkAuth()
    } catch {
      viewerUser.value = null
    }
  }
  await loadDiscoverPalettes()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onGlobalPointerDown)
})
</script>

<style scoped src="./SearchView.css"></style>
