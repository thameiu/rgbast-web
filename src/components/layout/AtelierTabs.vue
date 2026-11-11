<template><nav class="atelier-tabs"><RouterLink :to="palettesTo ?? '/atelier/palettes'" :class="{active:route.path.startsWith('/atelier/palettes')}">{{ t('searchPage.palettes') }}</RouterLink><RouterLink to="/atelier/bookmarks" :class="{active:route.path==='/atelier/bookmarks'}">{{ t('common.bookmarks') }}</RouterLink></nav></template>
<script setup lang="ts">import { RouterLink,useRoute } from 'vue-router';import {useI18n} from '@/i18n';defineProps<{palettesTo?: string}>();const route=useRoute();const {t}=useI18n()</script>
<style scoped>
.atelier-tabs{display:inline-flex;gap:0;margin:16px 0;border:1px solid var(--rule);border-radius:8px;overflow:hidden;background:transparent}
.atelier-tabs a{padding:0 18px;height:44px;display:flex;align-items:center;font-family:var(--font-display);font-size:32px;font-weight:700;line-height:1;color:var(--ink);text-decoration:none;transition:background .18s,color .18s}
.atelier-tabs a.active,.atelier-tabs a:hover{background:var(--ink);color:#fff}
</style>
