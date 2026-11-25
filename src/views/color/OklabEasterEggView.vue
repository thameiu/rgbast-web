<template>
  <main class="oklab-easter-egg">
    <h1>OKLab 3D</h1>
    <Oklab3DPicker :hex="hex" @pick="hex = $event" />
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Oklab3DPicker from '@/components/color/Oklab3DPicker.vue'
import { setPageSeo } from '@/utils/seo'

const hex = ref('B410CC')
const previousRobots = document.head.querySelector('meta[name="robots"]')?.getAttribute('content')
onMounted(() => setPageSeo({ title: 'OKLab 3D - RGBAST', noindex: true }))
onBeforeUnmount(() => {
  document.head.querySelector('meta[name="robots"]')?.setAttribute('content', previousRobots ?? 'index, follow')
})
</script>

<style scoped>
.oklab-easter-egg{width:100%;max-width:1280px;margin:0 auto;padding:clamp(20px,4vw,48px);min-height:100dvh;color:var(--ink)}
h1{font:700 clamp(36px,5vw,56px)/1 var(--font-display);margin:0 0 24px}
.oklab-easter-egg :deep(.cube-canvas-shell){height:clamp(300px,60dvh,720px)}
.oklab-easter-egg :deep(.cube-actions){flex-wrap:wrap}
</style>
