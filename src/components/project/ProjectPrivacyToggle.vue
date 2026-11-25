<template>
  <button type="button" class="project-privacy-toggle" role="switch" :aria-checked="modelValue" :aria-label="t('projects.private')" :disabled="disabled" @click="emit('update:modelValue', !modelValue)">
    <span class="project-privacy-toggle-icon"><AppIcon :name="modelValue ? 'lock' : 'lock-open'" :size="20" /></span>
    <span>{{ t(modelValue ? 'projects.private' : 'projects.public') }}</span>
  </button>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue'
import { useI18n } from '@/i18n'
defineProps<{ modelValue: boolean; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const { t } = useI18n()
</script>

<style scoped>
.project-privacy-toggle,
.project-modal .project-privacy-toggle,
.project-settings .project-privacy-toggle{display:inline-flex;align-items:center;align-self:flex-start;gap:10px;padding:0;margin:0 0 16px;border:0;border-radius:7px;background:transparent;color:var(--ink);font:600 13px var(--font-sans);text-align:left;cursor:pointer}
.project-privacy-toggle-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:1px solid var(--rule);border-radius:7px;background:rgba(128,128,128,.05);transition:background .18s ease-in-out,border-color .18s ease-in-out}
.project-privacy-toggle[aria-checked=true] .project-privacy-toggle-icon{border-color:currentColor;background:rgba(128,128,128,.12)}
.project-privacy-toggle:hover:not(:disabled) .project-privacy-toggle-icon{background:rgba(128,128,128,.18)}
.project-privacy-toggle:focus-visible{outline:2px solid var(--magenta);outline-offset:4px}
.project-privacy-toggle:disabled{opacity:.45;cursor:not-allowed}
</style>
