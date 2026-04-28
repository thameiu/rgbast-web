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
      </template>
      <RouterLink to="/color/B410CC" class="nav-link" :class="{ 'nav-link--active': isOnColor }">Colors</RouterLink>
      <template v-if="isLoggedIn">
        <span v-if="user" class="user-chip font-mono">
          <span class="chip-label">user</span>
          <strong>{{ user.username }}</strong>
        </span>
        <RouterLink v-if="!isOnDashboard" to="/dashboard" class="nav-link">Dashboard</RouterLink>
        <button class="nav-cta" @click="handleLogout">Sign out <span aria-hidden="true">→</span></button>
      </template>
      <template v-else>
        <RouterLink to="/login" class="nav-link">Log in</RouterLink>
        <RouterLink to="/register" class="nav-cta">Start designing <span aria-hidden="true">→</span></RouterLink>
      </template>
    </nav>

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

        <template v-if="isLoggedIn">
          <span v-if="user" class="mob-user font-mono">{{ user.username }}</span>
          <RouterLink v-if="!isOnDashboard" to="/dashboard" class="mob-link" @click="closeSidebar">Dashboard</RouterLink>
          <button class="mob-link mob-signout" @click="handleLogout">Sign out →</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="mob-link" @click="closeSidebar">Log in</RouterLink>
          <RouterLink to="/register" class="mob-cta" @click="closeSidebar">Start designing →</RouterLink>
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
import { ref, computed, onMounted } from 'vue'
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

/** Whether the mobile sidebar is visually open. */
const mobileOpen = ref(false)

/** Reference to the sidebar element for GSAP animations. */
const sidebarEl  = ref<HTMLElement | null>(null)

onMounted(() => {
  if (sidebarEl.value) gsap.set(sidebarEl.value, { x: '100%' })
})

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
  closeSidebar()
  router.push('/login')
}
</script>

<style src="./SiteHeader.css" scoped></style>
