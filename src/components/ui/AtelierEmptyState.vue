<template>
  <div class="atelier-empty-state">
    <AppIcon class="atelier-empty-icon" :name="icon" :size="36" />
    <p>{{ message }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import AppIcon, { type AppIconName } from '@/components/icons/AppIcon.vue'
defineProps<{ icon: AppIconName; message: string }>()
</script>

<style scoped>
.atelier-empty-state{min-height:200px;padding:48px 24px;border:1px dashed var(--rule);border-radius:18px;text-align:center;color:var(--ink-3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
.atelier-empty-icon{opacity:.4;flex-shrink:0}
.atelier-empty-state p{margin:0;font-size:20px;line-height:1.5;overflow-wrap:anywhere}
</style>
