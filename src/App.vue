<template>
  <div class="app-root">
    <RouterView />
    <SiteFooter v-if="route.name !== 'palette'" />
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import SiteFooter from '@/components/layout/SiteFooter.vue'
const route=useRoute()
</script>

<style scoped>
.app-root {
  position: relative;
  min-height: 100vh;
}
</style>
