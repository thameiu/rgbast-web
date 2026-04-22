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
          <span class="mob-brand-name">RGBAST</span>
        </RouterLink>
        <button class="mob-close" @click="closeSidebar" aria-label="Close">×</button>
      </div>

      <div class="mob-links">
        <template v-if="isOnLanding">
          <a href="#features" class="mob-link" @click="closeSidebar">Features</a>
        </template>

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
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import gsap from 'gsap'
import RgbastLogo from './RgbastLogo.vue'

const props = defineProps<{
  user?: { username: string; firstname?: string | null; lastname?: string | null } | null
  brandMeta?: string
}>()

const route  = useRoute()
const router = useRouter()

const isOnLanding   = computed(() => route.path === '/')
const isOnDashboard = computed(() => route.path === '/dashboard')
const isLoggedIn    = computed(() => !!props.user || !!localStorage.getItem('access_token'))

const mobileOpen = ref(false)
const sidebarEl  = ref<HTMLElement | null>(null)

onMounted(() => {
  if (sidebarEl.value) gsap.set(sidebarEl.value, { x: '100%' })
})

function openSidebar() {
  mobileOpen.value = true
  gsap.to(sidebarEl.value, { x: '0%', duration: 0.42, ease: 'power3.out' })
}

function closeSidebar() {
  gsap.to(sidebarEl.value, {
    x: '100%',
    duration: 0.36,
    ease: 'power3.inOut',
    onComplete: () => { mobileOpen.value = false },
  })
}

function handleLogout() {
  localStorage.removeItem('access_token')
  closeSidebar()
  router.push('/login')
}
</script>

<style scoped>
.site-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(20px, 4vw, 56px);
  background: rgba(233, 233, 233, 0.82);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--rule);
}

/* ─── Brand ───────────────────────── */
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--ink);
}
.brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 20px;
  letter-spacing: -0.03em;
  font-variation-settings: "opsz" 144, "SOFT" 0, "WONK" 0;
}
.brand-meta {
  padding-left: 12px;
  margin-left: 2px;
  border-left: 1px solid var(--rule);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-3);
}

/* ─── Desktop nav ─────────────────── */
.site-nav {
  display: flex;
  align-items: center;
  gap: 24px;
}
.nav-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  text-decoration: none;
  transition: color 0.18s;
}
.nav-link:hover { color: var(--magenta); }
.nav-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  background: var(--ink);
  color: var(--paper);
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: background 0.18s, transform 0.18s;
}
.nav-cta:hover { background: var(--magenta); transform: translateY(-1px); }
.user-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink-2); }
.chip-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-3); }
.user-chip strong { font-weight: 600; color: var(--ink); }

/* ─── Mobile burger ───────────────── */
.burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 36px; height: 36px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
}
.burger span {
  display: block;
  height: 2px;
  background: var(--ink);
  border-radius: 2px;
  transition: transform 0.3s cubic-bezier(0.2,0.9,0.2,1), opacity 0.2s;
  transform-origin: center;
}
.burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

@media (max-width: 768px) {
  .site-nav  { display: none; }
  .burger    { display: flex; }
}

/* ─── Mobile sidebar ──────────────── */
.mob-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(3px);
  z-index: 199;
}
.mob-fade-enter-active, .mob-fade-leave-active { transition: opacity 0.3s ease; }
.mob-fade-enter-from, .mob-fade-leave-to { opacity: 0; }

.mob-sidebar {
  position: fixed;
  top: 0; right: 0;
  width: 280px;
  height: 100dvh;
  background: #0e0e14;
  border-left: 1px solid rgba(255,255,255,0.08);
  z-index: 200;
  display: flex;
  flex-direction: column;
  padding: 24px 20px 32px;
}

.mob-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}
.mob-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.mob-brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: -0.03em;
  color: #fff;
}
.mob-close {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 22px;
  cursor: pointer;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}
.mob-close:hover { color: #fff; background: rgba(255,255,255,0.07); }

.mob-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mob-link {
  display: block;
  padding: 12px 14px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  border-radius: 10px;
  transition: background 0.15s, color 0.15s;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}
.mob-link:hover { background: rgba(255,255,255,0.07); color: #fff; }

.mob-signout { color: rgba(255,255,255,0.45); font-size: 14px; }

.mob-cta {
  display: inline-flex;
  align-items: center;
  margin-top: 12px;
  padding: 13px 18px;
  background: #b410cc;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  transition: background 0.15s;
}
.mob-cta:hover { background: #9a0db0; }

.mob-user {
  display: block;
  padding: 10px 14px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
}
</style>
