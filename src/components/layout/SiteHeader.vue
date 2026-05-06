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
        <a href="#features" class="nav-link">Features</a>
        <span class="nav-sep" aria-hidden="true"></span>
      </template>
      <RouterLink to="/color/B410CC" class="nav-link" :class="{ 'nav-link--active': isOnColor }">Colors</RouterLink>
      <span class="nav-sep" aria-hidden="true"></span>
      <RouterLink :to="newPaletteTo" class="nav-link" :class="{ 'nav-link--active': isOnNewPalette }">New palette</RouterLink>
      <template v-if="isLoggedIn && !isOnDashboard">
        <span class="nav-sep" aria-hidden="true"></span>
        <RouterLink to="/dashboard" class="nav-link">Dashboard</RouterLink>
      </template>
    </nav>

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
      <RouterLink v-else to="/login" class="login-link">Log in</RouterLink>

      <Transition name="profile-menu-fade">
        <div v-if="isLoggedIn && profileMenuOpen" class="profile-menu">
          <button class="profile-menu-item" @click="onProfileSoon">Profile</button>
          <button class="profile-menu-item" @click="onSettingsSoon">Settings</button>
          <button class="profile-menu-item profile-menu-item--danger" @click="handleLogout">Sign out</button>
        </div>
      </Transition>
    </div>

    <!-- Mobile burger -->
    <button
      class="burger"
      :class="{ open: mobileOpen }"
      @click="openSidebar"
      aria-label="Open navigation"
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
        <button class="mob-close" @click="closeSidebar" aria-label="Close">×</button>
      </div>

      <div class="mob-links">
        <template v-if="isOnLanding">
          <a href="#features" class="mob-link" @click="closeSidebar">Features</a>
        </template>

        <RouterLink to="/color/B410CC" class="mob-link" @click="closeSidebar">Colors</RouterLink>
        <RouterLink :to="newPaletteTo" class="mob-link" @click="closeSidebar">New palette</RouterLink>
        <RouterLink v-if="isLoggedIn && !isOnDashboard" to="/dashboard" class="mob-link" @click="closeSidebar">Dashboard</RouterLink>

        <template v-if="isLoggedIn">
          <span class="mob-user font-mono">
            <span class="mob-user-avatar">{{ profileInitial }}</span>
            {{ profileName }}
          </span>
          <button class="mob-link mob-signout" @click="handleLogout">Sign out</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="mob-cta" @click="closeSidebar">Log in</RouterLink>
          <RouterLink to="/register" class="mob-link" @click="closeSidebar">Create account</RouterLink>
        </template>
      </div>
    </nav>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * SiteHeader — Fixed navigation header for public-facing pages.
 * Shows brand, desktop nav links, and a GSAP-animated mobile sidebar.
 * Props: user ({ username, firstname?, lastname? } | null) — authenticated user info
 *        brandMeta (string) — optional meta text shown after the brand name
 * Used in: LandingView, DashboardView, ColorView
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import gsap from 'gsap'
import RgbastLogo from '../ui/RgbastLogo.vue'

const props = defineProps<{
  user?: { username: string; firstname?: string | null; lastname?: string | null } | null
  brandMeta?: string
}>()

const route  = useRoute()
const router = useRouter()

/** True when the current route is the landing page. */
const isOnLanding   = computed(() => route.path === '/')

/** True when the current route is the dashboard. */
const isOnDashboard = computed(() => route.path === '/dashboard')

/** True when the current route starts with /color. */
const isOnColor     = computed(() => route.path.startsWith('/color'))

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

/** Whether the mobile sidebar is visually open. */
const mobileOpen = ref(false)
const profileMenuOpen = ref(false)

/** Reference to the sidebar element for GSAP animations. */
const sidebarEl  = ref<HTMLElement | null>(null)
const accountEl = ref<HTMLElement | null>(null)

onMounted(() => {
  if (sidebarEl.value) gsap.set(sidebarEl.value, { x: '100%' })
  document.addEventListener('pointerdown', onGlobalPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onGlobalPointerDown)
})

function toggleProfileMenu(): void {
  profileMenuOpen.value = !profileMenuOpen.value
}

function onProfileSoon(): void {
  profileMenuOpen.value = false
}

function onSettingsSoon(): void {
  profileMenuOpen.value = false
}

function onGlobalPointerDown(event: PointerEvent): void {
  if (!profileMenuOpen.value) return
  const target = event.target as Node | null
  if (!target) return
  if (accountEl.value?.contains(target)) return
  profileMenuOpen.value = false
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
  profileMenuOpen.value = false
  closeSidebar()
  router.push('/login')
}
</script>

<style src="./SiteHeader.css" scoped></style>
