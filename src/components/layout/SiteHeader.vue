<template>
  <header class="site-header">
    <RouterLink to="/" class="brand">
      <RgbastLogo size="30px" />
      <span class="brand-name">RGBAST</span>
      <span v-if="brandMeta" class="brand-meta font-mono">{{ brandMeta }}</span>
    </RouterLink>

    <!-- Desktop nav -->
    <nav class="site-nav">
      <template v-if="isOnLanding">
        <a href="#features" class="nav-link">{{ t('common.features') }}</a>
        <span class="nav-sep" aria-hidden="true"></span>
      </template>
      <RouterLink :to="lastColorRoute" class="nav-link" :class="{ 'nav-link--active': isOnColor }">{{ t('common.colors') }}</RouterLink>
      <span class="nav-sep" aria-hidden="true"></span>
      <RouterLink to="/search" class="nav-link" :class="{ 'nav-link--active': isOnSearch }">{{ t('common.search') }}</RouterLink>
      <span class="nav-sep" aria-hidden="true"></span>
      <RouterLink :to="newPaletteTo" class="nav-link" :class="{ 'nav-link--active': isOnNewPalette }">{{ t('common.newPalette') }}</RouterLink>
      <template v-if="isLoggedIn">
        <span class="nav-sep" aria-hidden="true"></span>
        <RouterLink to="/dashboard" class="nav-link" :class="{ 'nav-link--active': isOnDashboard }">{{ t('common.dashboard') }}</RouterLink>
        <span class="nav-sep" aria-hidden="true"></span>
        <RouterLink to="/bookmarks" class="nav-link" :class="{ 'nav-link--active': isOnBookmarks }">{{ t('common.bookmarks') }}</RouterLink>
      </template>
    </nav>

    <div class="language-switcher" :aria-label="t('header.language')">
      <button class="lang-btn" :class="{ active: locale === 'fr' }" @click="setLocale('fr')" title="Français">FR</button>
      <button class="lang-btn" :class="{ active: locale === 'en' }" @click="setLocale('en')" title="English">EN</button>
    </div>

    <div v-if="isLoggedIn" class="notif-slot" ref="notifEl">
      <button
        class="notif-btn"
        :title="t('header.colleagueRequests')"
        :aria-label="t('header.openRequests')"
        :aria-expanded="notifMenuOpen"
        @click="toggleNotifMenu"
      >
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3.2 9.8h7.6l-.9-1.5V6.2a2.9 2.9 0 10-5.8 0v2.1l-.9 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5.6 10.4a1.5 1.5 0 002.8 0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <span v-if="incomingRequests.length" class="notif-badge">{{ incomingRequests.length }}</span>
      </button>

      <Transition name="profile-menu-fade">
        <div v-if="notifMenuOpen" class="notif-menu">
          <p class="notif-title font-mono">{{ t('header.colleagueRequests') }}</p>
          <p v-if="notifError" class="notif-error">{{ notifError }}</p>
          <div v-else-if="incomingRequests.length === 0" class="notif-empty">{{ t('header.noPendingRequest') }}</div>
          <div v-else class="notif-list">
            <div v-for="requestUser in incomingRequests" :key="requestUser.id" class="notif-item">
              <button class="notif-user" @click="goToUserFromNotif(requestUser.username)">
                <span class="notif-avatar">{{ requestUser.username.charAt(0).toUpperCase() }}</span>
                <span class="notif-username">{{ requestUser.username }}</span>
              </button>
              <div class="notif-actions">
                <button class="notif-action notif-action--accept" :disabled="notifPendingUser === requestUser.username" @click="acceptRequestFromNotif(requestUser.username)">{{ t('header.accept') }}</button>
                <button class="notif-action" :disabled="notifPendingUser === requestUser.username" @click="denyRequestFromNotif(requestUser.username)">{{ t('header.deny') }}</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <div class="account-slot" ref="accountEl">
      <button
        v-if="isLoggedIn"
        class="profile-link"
        title="Account menu"
        aria-label="Open account menu"
        :aria-expanded="profileMenuOpen"
        @click="toggleProfileMenu"
      >
        <span class="profile-avatar">{{ profileInitial }}</span>
      </button>
      <RouterLink v-else to="/login" class="login-link">{{ t('common.login') }}</RouterLink>

      <Transition name="profile-menu-fade">
        <div v-if="isLoggedIn && profileMenuOpen" class="profile-menu">
          <button class="profile-menu-item" @click="goToProfile">{{ t('common.profile') }}</button>
          <button class="profile-menu-item" @click="onSettingsSoon">{{ t('common.settings') }}</button>
          <button class="profile-menu-item profile-menu-item--danger" @click="handleLogout">{{ t('common.signOut') }}</button>
        </div>
      </Transition>
    </div>

    <!-- Mobile burger -->
    <button
      class="burger"
      :class="{ open: mobileOpen }"
      @click="openSidebar"
      :aria-label="t('header.openNavigation')"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  </header>

  <!-- Mobile sidebar + backdrop (always in DOM for GSAP) -->
  <Teleport to="body">
    <Transition name="mob-fade">
      <div v-if="mobileOpen" class="mob-overlay" @click="closeSidebar"></div>
    </Transition>

    <nav ref="sidebarEl" class="mob-sidebar" :aria-hidden="!mobileOpen">
      <div class="mob-top">
        <RouterLink to="/" class="mob-brand" @click="closeSidebar">
          <RgbastLogo size="28px" />
          <span class="mob-brand-name"><span style="color:#B410CC">R</span><span style="color:#D56A88">G</span><span style="color:#F6C343">B</span><span style="color:#82C58C">A</span><span style="color:#0EC6D4">S</span><span style="color:#616BD0">T</span></span>
        </RouterLink>
        <button class="mob-close" @click="closeSidebar" :aria-label="t('header.close')">×</button>
      </div>

      <div class="mob-links">
        <div class="mob-language-switcher" :aria-label="t('header.language')">
          <button class="lang-btn" :class="{ active: locale === 'fr' }" @click="setLocale('fr')">FR</button>
          <button class="lang-btn" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button>
        </div>

        <template v-if="isOnLanding">
          <a href="#features" class="mob-link" @click="closeSidebar">{{ t('common.features') }}</a>
        </template>

        <RouterLink :to="lastColorRoute" class="mob-link" @click="closeSidebar">{{ t('common.colors') }}</RouterLink>
        <RouterLink to="/search" class="mob-link" @click="closeSidebar">{{ t('common.search') }}</RouterLink>
        <RouterLink :to="newPaletteTo" class="mob-link" @click="closeSidebar">{{ t('common.newPalette') }}</RouterLink>
        <RouterLink v-if="isLoggedIn" to="/dashboard" class="mob-link" :class="{ 'mob-link--active': isOnDashboard }" @click="closeSidebar">{{ t('common.dashboard') }}</RouterLink>
        <RouterLink v-if="isLoggedIn" to="/bookmarks" class="mob-link" :class="{ 'mob-link--active': isOnBookmarks }" @click="closeSidebar">{{ t('common.bookmarks') }}</RouterLink>

        <template v-if="isLoggedIn">
          <span class="mob-user font-mono">
            <span class="mob-user-avatar">{{ profileInitial }}</span>
            <span class="mob-user-name">{{ profileName }}</span>
          </span>
          <div class="mob-requests" v-if="incomingRequests.length">
            <p class="mob-requests-title">{{ t('header.requests') }}</p>
            <div v-for="requestUser in incomingRequests" :key="requestUser.id" class="mob-request-row">
              <button class="mob-request-user" @click="goToUserFromNotif(requestUser.username)">
                {{ requestUser.username }}
              </button>
              <div class="mob-request-actions">
                <button class="mob-request-btn" :disabled="notifPendingUser === requestUser.username" @click="acceptRequestFromNotif(requestUser.username)">{{ t('header.accept') }}</button>
                <button class="mob-request-btn" :disabled="notifPendingUser === requestUser.username" @click="denyRequestFromNotif(requestUser.username)">{{ t('header.deny') }}</button>
              </div>
            </div>
          </div>
          <button class="mob-link" @click="goToProfile">{{ t('common.profile') }}</button>
          <button class="mob-link" @click="goToBookmarks">{{ t('common.bookmarks') }}</button>
          <button class="mob-link" @click="onSettingsSoon">{{ t('common.settings') }}</button>
          <button class="mob-link mob-signout" @click="handleLogout">{{ t('common.signOut') }}</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="mob-cta" @click="closeSidebar">{{ t('common.login') }}</RouterLink>
          <RouterLink to="/register" class="mob-link" @click="closeSidebar">{{ t('common.register') }}</RouterLink>
        </template>
      </div>
    </nav>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * SiteHeader - Fixed navigation header for public-facing pages.
 * Shows brand, desktop nav links, and a GSAP-animated mobile sidebar.
 * Props: user ({ username, firstname?, lastname? } | null) - authenticated user info
 *        brandMeta (string) - optional meta text shown after the brand name
 * Used in: LandingView, DashboardView, ColorView
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import gsap from 'gsap'
import RgbastLogo from '../ui/RgbastLogo.vue'
import { searchApi } from '@/api/search'
import { colleaguesApi } from '@/api/colleagues'
import type { ColleagueUserItem } from '@/api/types'
import { useI18n } from '@/i18n'

const props = defineProps<{
  user?: { username: string; firstname?: string | null; lastname?: string | null } | null
  brandMeta?: string
}>()

const route  = useRoute()
const router = useRouter()
const { locale, setLocale, t } = useI18n()

/** True when the current route is the landing page. */
const isOnLanding   = computed(() => route.path === '/')

/** True when the current route is the dashboard. */
const isOnDashboard = computed(() => route.path === '/dashboard')
const isOnBookmarks = computed(() => route.path === '/bookmarks')

/** True when the current route starts with /color. */
const isOnColor     = computed(() => route.path.startsWith('/color'))
const isOnSearch    = computed(() => route.path.startsWith('/search'))
const lastWatchedColor = ref('B410CC')

/** True when the user prop is set or a token exists in localStorage. */
const isLoggedIn    = computed(() => !!props.user || !!localStorage.getItem('access_token'))
const routeSegments = computed(() => {
  const raw = route.params.pathMatch
  if (!raw) return []
  const list = Array.isArray(raw) ? raw : String(raw).split('/')
  return list.filter(Boolean)
})
const isOnNewPalette = computed(() => route.name === 'palette' && routeSegments.value[routeSegments.value.length - 1] === 'new')

function getTokenUsername(): string | null {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
    const payload = JSON.parse(atob(normalized + pad))
    return payload?.sub ?? null
  } catch {
    return null
  }
}

const profileName = computed(() => props.user?.username ?? getTokenUsername() ?? 'User')
const profileInitial = computed(() => profileName.value.charAt(0).toUpperCase() || 'U')
const newPaletteTo = computed(() => {
  const username = profileName.value && isLoggedIn.value ? profileName.value : 'local'
  return { name: 'palette', params: { username, pathMatch: 'new' } }
})
const lastColorRoute = computed(() => `/color/${lastWatchedColor.value}`)

/** Whether the mobile sidebar is visually open. */
const mobileOpen = ref(false)
const profileMenuOpen = ref(false)
const notifMenuOpen = ref(false)
const incomingRequests = ref<ColleagueUserItem[]>([])
const notifError = ref('')
const notifPendingUser = ref<string | null>(null)

/** Reference to the sidebar element for GSAP animations. */
const sidebarEl  = ref<HTMLElement | null>(null)
const accountEl = ref<HTMLElement | null>(null)
const notifEl = ref<HTMLElement | null>(null)

onMounted(() => {
  syncLastWatchedColor()
  if (sidebarEl.value) gsap.set(sidebarEl.value, { x: '100%' })
  document.addEventListener('pointerdown', onGlobalPointerDown)
  window.addEventListener('rgbast:colleagues-updated', onColleaguesUpdated)
  window.addEventListener('rgbast:last-watched-color-changed', onLastWatchedColorChanged as EventListener)
  if (isLoggedIn.value) {
    void loadIncomingRequests()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onGlobalPointerDown)
  window.removeEventListener('rgbast:colleagues-updated', onColleaguesUpdated)
  window.removeEventListener('rgbast:last-watched-color-changed', onLastWatchedColorChanged as EventListener)
})

function syncLastWatchedColor(): void {
  try {
    const stored = localStorage.getItem('rgbast_last_watched_color')
    if (stored) lastWatchedColor.value = stored.replace('#', '').toUpperCase().slice(0, 6) || 'B410CC'
  } catch {}
}

function onLastWatchedColorChanged(event: Event): void {
  const detail = (event as CustomEvent<string>).detail
  if (typeof detail === 'string' && detail.trim()) {
    lastWatchedColor.value = detail.replace('#', '').toUpperCase().slice(0, 6)
    return
  }
  syncLastWatchedColor()
}

function toggleProfileMenu(): void {
  profileMenuOpen.value = !profileMenuOpen.value
  if (profileMenuOpen.value) notifMenuOpen.value = false
}

function toggleNotifMenu(): void {
  notifMenuOpen.value = !notifMenuOpen.value
  if (notifMenuOpen.value) profileMenuOpen.value = false
}

function goToProfile(): void {
  profileMenuOpen.value = false
  closeSidebar()
  router.push(`/users/${encodeURIComponent(profileName.value)}`)
}

function goToBookmarks(): void {
  profileMenuOpen.value = false
  closeSidebar()
  router.push('/bookmarks')
}

function onSettingsSoon(): void {
  profileMenuOpen.value = false
  closeSidebar()
  router.push('/settings')
}

function onGlobalPointerDown(event: PointerEvent): void {
  const target = event.target as Node | null
  if (!target) return

  if (profileMenuOpen.value) {
    if (accountEl.value?.contains(target)) return
    profileMenuOpen.value = false
  }
  if (notifMenuOpen.value && notifEl.value && !notifEl.value.contains(target)) {
    notifMenuOpen.value = false
  }
}

/**
 * Slides the mobile sidebar in from the right using GSAP.
 */
function openSidebar() {
  mobileOpen.value = true
  gsap.to(sidebarEl.value, { x: '0%', duration: 0.42, ease: 'power3.out' })
}

/**
 * Slides the mobile sidebar out using GSAP, then hides it.
 */
function closeSidebar() {
  profileMenuOpen.value = false
  notifMenuOpen.value = false
  gsap.to(sidebarEl.value, {
    x: '100%',
    duration: 0.36,
    ease: 'power3.inOut',
    onComplete: () => { mobileOpen.value = false },
  })
}

/**
 * Removes the access token and redirects to /login.
 */
function handleLogout() {
  localStorage.removeItem('access_token')
  searchApi.clearRecentSearches()
  profileMenuOpen.value = false
  notifMenuOpen.value = false
  incomingRequests.value = []
  notifError.value = ''
  closeSidebar()
  router.push('/login')
}

async function loadIncomingRequests(): Promise<void> {
  notifError.value = ''
  try {
    const payload = await colleaguesApi.listMine()
    incomingRequests.value = payload.incoming_pending
  } catch (e: any) {
    incomingRequests.value = []
    notifError.value = e?.message ?? t('header.couldNotLoadRequests')
  }
}

function onColleaguesUpdated(): void {
  if (!isLoggedIn.value) return
  void loadIncomingRequests()
}

async function acceptRequestFromNotif(username: string): Promise<void> {
  notifPendingUser.value = username
  try {
    await colleaguesApi.accept(username)
    window.dispatchEvent(new Event('rgbast:colleagues-updated'))
    await loadIncomingRequests()
  } finally {
    notifPendingUser.value = null
  }
}

async function denyRequestFromNotif(username: string): Promise<void> {
  notifPendingUser.value = username
  try {
    await colleaguesApi.remove(username)
    window.dispatchEvent(new Event('rgbast:colleagues-updated'))
    await loadIncomingRequests()
  } finally {
    notifPendingUser.value = null
  }
}

function goToUserFromNotif(username: string): void {
  notifMenuOpen.value = false
  closeSidebar()
  void router.push(`/users/${encodeURIComponent(username)}`)
}
</script>

<style src="./SiteHeader.css" scoped></style>
