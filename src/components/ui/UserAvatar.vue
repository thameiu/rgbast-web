<template>
  <span :style="avatarStyle" aria-hidden="true">{{ username.charAt(0).toUpperCase() }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ username: string; color?: string | null }>()
const avatarStyle = computed(() => {
  const hex = /^[0-9a-f]{6}$/i.test(props.color ?? '') ? props.color! : '0E0E10'
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map(i => {
    const value = parseInt(hex.slice(i, i + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return {
    background: `#${hex}`,
    color: luminance > 0.179 ? 'var(--ink)' : '#fff',
    boxShadow: luminance > 0.75 ? 'inset 0 0 0 1px var(--ink)' : 'none',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
  }
})
</script>
