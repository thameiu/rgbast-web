<template>
  <div class="project-skeleton" :class="{ 'project-skeleton--content': contentOnly }" role="status" :aria-label="t('common.loading')">
    <span class="project-skeleton-sr">{{ t('common.loading') }}</span>
    <div aria-hidden="true">
      <template v-if="!contentOnly">
        <div class="sk-heading"><span class="sk sk-icon" /><span class="sk sk-title" /><span class="sk sk-author" /></div>
        <div class="sk sk-description" />
      </template>
      <div class="sk-content">
        <template v-if="!contentOnly">
          <div class="sk sk-tabs" />
          <div class="sk-tools"><span class="sk sk-search" /><span class="sk sk-button" /></div>
        </template>
        <div class="sk-layout">
          <aside class="sk-folders"><span v-for="n in 5" :key="n" class="sk sk-folder" /></aside>
          <div><div class="sk sk-path" /><div class="sk-grid"><div v-for="n in 6" :key="n" class="sk sk-card" /></div></div>
        </div>
      </div>
      <div v-if="!contentOnly" class="sk-management"><div v-for="n in 2" :key="n" class="sk-section"><div class="sk sk-section-title" /><div v-for="row in 3" :key="row" class="sk sk-member" /></div></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/i18n'
defineProps<{ contentOnly?: boolean }>()
const { t } = useI18n()
</script>

<style scoped>
.project-skeleton{margin-top:24px;pointer-events:none}
.project-skeleton--content{margin-top:0}
.project-skeleton--content .sk-content{padding-top:0;border-top:0}
.project-skeleton-sr{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.sk{display:block;background:rgba(14,14,16,.08);border-radius:7px;animation:project-skeleton-pulse 1.6s ease-in-out infinite}
.sk-heading{display:flex;gap:16px;align-items:center;margin-bottom:20px}
.sk-icon{width:42px;height:42px;flex-shrink:0}.sk-title{width:min(320px,50%);height:clamp(44px,5.2vw,68px)}.sk-author{width:100px;height:14px}
.sk-description{width:min(560px,85%);height:16px;margin-bottom:32px}
.sk-content{padding-top:24px;border-top:1px solid var(--rule)}.sk-tabs{width:260px;max-width:100%;height:44px;margin-bottom:28px}
.sk-tools{display:flex;justify-content:space-between;gap:16px;margin-bottom:24px}.sk-search{width:min(380px,75%);height:42px}.sk-button{width:96px;height:42px}
.sk-layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:clamp(24px,3vw,40px)}.sk-folders{display:flex;flex-direction:column;gap:12px}.sk-folder{height:24px;width:85%}.sk-folder:nth-child(even){width:65%;margin-left:20px}
.sk-path{width:180px;height:18px;margin-bottom:30px;max-width:80%}.sk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:16px}.sk-card{height:190px;border-radius:12px}
.sk-management{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:40px;margin-top:56px}.sk-section{border-top:1px solid var(--rule);padding-top:24px}.sk-section-title{width:140px;height:30px;margin-bottom:22px}.sk-member{height:48px;margin-bottom:10px}
@keyframes project-skeleton-pulse{0%,100%{opacity:.55}50%{opacity:1}}
@media(max-width:900px){.sk-management{grid-template-columns:minmax(0,1fr);gap:32px}}
@media(max-width:800px){.sk-layout{grid-template-columns:minmax(0,1fr)}.sk-folders{max-width:300px}}
@media(max-width:600px){.sk-heading{gap:10px}.sk-author{width:60px}.sk-management{margin-top:36px}.sk-tools{flex-wrap:wrap}.sk-search{width:100%}.sk-button{margin-left:auto}.sk-grid{grid-template-columns:minmax(0,1fr)}}
@media(prefers-reduced-motion:reduce){.sk{animation:none;opacity:.75}}
</style>
