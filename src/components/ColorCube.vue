<template>
  <span class="cube" :style="{ '--c': `#${hex}`, width: size + 'px', height: size + 'px' }"></span>
</template>

<script setup lang="ts">
/** Tiny color swatch square. hex = 6-char hex without #. size defaults to 18px. */
withDefaults(defineProps<{ hex: string; size?: number }>(), { size: 18 })
</script>

<style scoped>
.cube {
  display: inline-block;
  border-radius: 3px;
  background: var(--c);
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
}
</style>
