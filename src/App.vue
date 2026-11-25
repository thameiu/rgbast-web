<template>
  <div class="app-root">
    <RouterView />
    <AddToProjectModal />
    <SiteFooter v-if="route.name !== 'palette' && !route.meta.paletteView && !route.meta.hideFooter" />
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import AddToProjectModal from '@/components/project/AddToProjectModal.vue'
const route=useRoute()
</script>

<style scoped>
.app-root {
  position: relative;
  min-height: 100vh;
}
</style>
