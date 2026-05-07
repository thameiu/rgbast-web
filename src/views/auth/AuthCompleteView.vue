<template>
  <div class="complete-page">
    <SiteHeader />
    <main class="complete-shell">
      <section class="complete-card">
        <h1 class="complete-title font-display">{{ title }}</h1>
        <p class="complete-copy">{{ message }}</p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteHeader from '@/components/layout/SiteHeader.vue'

const route = useRoute()
const router = useRouter()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const verified = computed(() => (typeof route.query.verified === 'string' ? route.query.verified : ''))

const title = computed(() => (token.value ? 'Email verified' : 'Verification failed'))
const message = computed(() =>
  token.value
    ? 'Your email has been verified. Redirecting to your dashboard…'
    : 'Your verification link is invalid or expired. Redirecting to sign in…',
)

onMounted(() => {
  document.title = 'Authentication complete - RGBAST'
  if (token.value) {
    localStorage.setItem('access_token', token.value)
    void router.replace('/dashboard')
    return
  }
  void router.replace(`/login${verified.value ? `?verified=${encodeURIComponent(verified.value)}` : ''}`)
})
</script>

<style scoped src="./AuthCompleteView.css"></style>
