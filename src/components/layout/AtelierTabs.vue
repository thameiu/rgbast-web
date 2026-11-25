<template>
  <nav class="atelier-tabs">
    <template v-for="tab in tabs" :key="tab">
      <button v-if="modelValue !== undefined" type="button" class="atelier-tab" :class="{ active: modelValue === tab }" :aria-pressed="modelValue === tab" @click="emit('update:modelValue', tab)">
        {{ t(labels[tab]) }}
      </button>
      <RouterLink v-else :to="tab === 'palettes' ? (palettesTo ?? '/atelier/palettes') : `/atelier/${tab}`" class="atelier-tab" :class="{ active: isActive(tab) }">
        {{ t(labels[tab]) }}
      </RouterLink>
    </template>
  </nav>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from '@/i18n'

type ContentTab = 'palettes' | 'bookmarks' | 'projects'
const props = defineProps<{ palettesTo?: string; modelValue?: ContentTab; visibleTabs?: readonly ContentTab[] }>()
const emit = defineEmits<{ 'update:modelValue': [tab: ContentTab] }>()
const route = useRoute()
const { t } = useI18n()
const tabs = computed(() => props.visibleTabs ?? ['palettes', 'bookmarks', 'projects'] as const)
const labels = { palettes: 'searchPage.palettes', bookmarks: 'common.bookmarks', projects: 'projects.titlePlural' }

function isActive(tab: ContentTab): boolean {
  if (tab === 'palettes') return route.path.startsWith('/atelier/palettes')
  if (tab === 'bookmarks') return route.path === '/atelier/bookmarks'
  return route.name === 'projects'
}
</script>
<style scoped>
.atelier-tabs{display:inline-flex;gap:0;margin:16px 0;border:1px solid var(--rule);border-radius:8px;overflow:hidden;background:transparent}
.atelier-tab{box-sizing:border-box;padding:0 18px;height:44px;display:flex;align-items:center;justify-content:center;border:0;border-radius:0;background:transparent;font-family:var(--font-display);font-size:32px;font-weight:700;line-height:1;letter-spacing:normal;text-transform:none;color:var(--ink);text-decoration:none;cursor:pointer;transition:background .18s ease-in-out,color .18s ease-in-out}
.atelier-tab + .atelier-tab{border-inline-start:1px solid var(--rule)}
.atelier-tab.active,.atelier-tab:hover{background:var(--ink);color:#fff}
.atelier-tab:focus-visible{outline:2px solid var(--magenta);outline-offset:-3px}
@media(max-width:600px){.atelier-tabs{max-width:100%;display:flex}.atelier-tab{min-width:0;font-size:clamp(23px,6.2vw,32px);padding-inline:10px;flex:1}}
</style>
