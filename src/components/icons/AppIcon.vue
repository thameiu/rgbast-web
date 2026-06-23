<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <template v-if="name === 'arrow-left'">
      <path d="M5 12h14" />
      <path d="m11 18-6-6 6-6" />
    </template>
    <template v-else-if="name === 'arrow-right'">
      <path d="M19 12H5" />
      <path d="m13 18 6-6-6-6" />
    </template>
    <template v-else-if="name === 'external-link'">
      <path d="M14 5h5v5" />
      <path d="M10 14 19 5" />
      <path d="M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
    </template>
    <template v-else-if="name === 'bookmark'">
      <path d="M7 4h10a2 2 0 0 1 2 2v14l-7-4-7 4V6a2 2 0 0 1 2-2Z" />
    </template>
    <template v-else-if="name === 'git-branch'">
      <circle cx="7" cy="6" r="2.5" />
      <circle cx="17" cy="6" r="2.5" />
      <circle cx="17" cy="18" r="2.5" />
      <path d="M7 8.5v6a3.5 3.5 0 0 0 3.5 3.5H14.5" />
      <path d="M9.5 6h4A3.5 3.5 0 0 0 17 9.5" />
    </template>
    <template v-else-if="name === 'bell'">
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7 2.5 7h-17S6 15 6 9" />
      <path d="M10.5 19a2.5 2.5 0 0 0 5 0" />
    </template>
    <path v-else-if="name === 'chevron-down'" d="m6 9 6 6 6-6" />
    <path v-else-if="name === 'chevron-right'" d="m9 6 6 6-6 6" />
    <path v-else-if="name === 'chevron-left'" d="m15 6-6 6 6 6" />
    <path v-else-if="name === 'check'" d="m5 12.5 4.2 4.2L19 7" />
    <template v-else-if="name === 'copy'">
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </template>
    <template v-else-if="name === 'clipboard'">
      <path d="M9 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
    </template>
    <template v-else-if="name === 'sliders'">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="7" cy="18" r="2" />
    </template>
    <template v-else-if="name === 'undo'">
      <path d="m9 7-5 5 5 5" />
      <path d="M20 19a8 8 0 0 0-8-8H4" />
    </template>
    <template v-else-if="name === 'redo'">
      <path d="m15 7 5 5-5 5" />
      <path d="M4 19a8 8 0 0 1 8-8h8" />
    </template>
    <template v-else-if="name === 'sparkles'">
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="m18.5 16 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </template>
    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="m4.9 4.9 2.1 2.1" />
      <path d="m17 17 2.1 2.1" />
      <path d="m19.1 4.9-2.1 2.1" />
      <path d="M7 17 4.9 19.1" />
    </template>
    <template v-else-if="name === 'image'">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m5.5 16 4.5-4 3 2.5 2.5-2 3 3.5" />
    </template>
    <template v-else-if="name === 'folder'">
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-10Z" />
    </template>
    <template v-else-if="name === 'folder-open'">
      <path d="M3 8a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 1.9 2.6l-1.6 5.4A2 2 0 0 1 16.4 20H6a2 2 0 0 1-1.9-1.4L2.2 12A2 2 0 0 1 4.1 9.5H21" />
    </template>
    <template v-else-if="name === 'home'">
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 9.5V20h11V9.5" />
    </template>
    <template v-else-if="name === 'share'">
      <circle cx="6" cy="12" r="2" />
      <circle cx="17.5" cy="6" r="2" />
      <circle cx="17.5" cy="18" r="2" />
      <path d="m7.8 11 7.8-4" />
      <path d="m7.8 13 7.8 4" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="m8 7 1 12h6l1-12" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </template>
    <template v-else-if="name === 'history'">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 8v4l3 2" />
    </template>
    <template v-else-if="name === 'edit'">
      <path d="m4 20 4.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9L4 20Z" />
      <path d="m13 8 3 3" />
    </template>
    <template v-else-if="name === 'download'">
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M4 19h16" />
    </template>
    <template v-else-if="name === 'clone'">
      <rect x="4" y="7" width="11" height="13" rx="2" />
      <path d="M9 4h8a2 2 0 0 1 2 2v10" />
    </template>
    <template v-else-if="name === 'logout'">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </template>
    <template v-else-if="name === 'menu'">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </template>
    <template v-else-if="name === 'x'">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </template>
    <template v-else-if="name === 'upload'">
      <path d="M12 20V9" />
      <path d="m8 13 4-4 4 4" />
      <path d="M4 4h16v4" />
    </template>
    <template v-else-if="name === 'eye'">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </template>
    <template v-else-if="name === 'eye-off'">
      <path d="M3 3 21 21" />
      <path d="M10.6 10.7a3 3 0 0 0 4.2 4.2" />
      <path d="M6.6 6.7C4.3 8.1 2.8 10.5 2 12c1 2 4.1 6 10 6 1.7 0 3.2-.3 4.5-.9" />
      <path d="M9.1 4.5A13 13 0 0 1 12 4c5.9 0 9 4 10 6-.4.8-1.1 1.9-2.1 3" />
    </template>
    <path v-else-if="name === 'plus'" d="M12 5v14M5 12h14" />
    <path v-else-if="name === 'minus'" d="M5 12h14" />
    <template v-else-if="name === 'help-circle'">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.5a2.6 2.6 0 1 1 4.3 2c-.9.8-1.7 1.3-1.7 2.5" />
      <path d="M12 17h.01" />
    </template>
    <template v-else-if="name === 'link'">
      <path d="M10 14 8 16a3 3 0 1 1-4-4l2-2" />
      <path d="m14 10 2-2a3 3 0 1 1 4 4l-2 2" />
      <path d="M9 15 15 9" />
    </template>
    <template v-else-if="name === 'clear'">
      <path d="M5 5 19 19" />
      <path d="M19 5 5 19" />
      <path d="M4 12h1" />
    </template>
    <template v-else-if="name === 'users'">
      <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
      <circle cx="9.5" cy="7" r="3.5" />
      <path d="M20 20v-1a4 4 0 0 0-3-3.85" />
      <path d="M15.5 3.4a3.5 3.5 0 0 1 0 6.2" />
    </template>
    <template v-else-if="name === 'clock-3'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5h4" />
    </template>
    <template v-else-if="name === 'mail'">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 8 7.8 5a2.2 2.2 0 0 0 2.4 0L21 8" />
    </template>
    <template v-else-if="name === 'heart'">
      <path d="m12 20-1.2-1.1C5.3 13.8 2 10.9 2 7.3A4.3 4.3 0 0 1 6.3 3a4.7 4.7 0 0 1 3.7 1.8A4.7 4.7 0 0 1 13.7 3 4.3 4.3 0 0 1 18 7.3c0 3.6-3.3 6.5-8.8 11.6L12 20Z" />
    </template>
    <template v-else-if="name === 'file-text'">
      <path d="M8 3h7l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M15 3v5h5" />
      <path d="M10 13h6" />
      <path d="M10 17h6" />
      <path d="M10 9h2" />
    </template>
    <template v-else-if="name === 'toolbox'">
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </template>
    <template v-else-if="name === 'leaf'">
      <path d="M19 3c-7 0-12 4.8-12 11a7 7 0 0 0 7 7c6.2 0 8-6 8-12V3h-3Z" />
      <path d="M8 16c2.5-2.5 5.2-4.3 10-6" />
    </template>
    <template v-else-if="name === 'alert-circle'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </template>
    <template v-else-if="name === 'info-circle'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11.5v4" />
      <path d="M12 8h.01" />
    </template>
    <path v-else-if="name === 'palette'" d="M12 4a8 8 0 1 0 0 16h1.5a2.5 2.5 0 0 0 0-5H12a2 2 0 0 1 0-4h6.2A2.8 2.8 0 0 0 21 8.2 8.2 8.2 0 0 0 12 4Z" />
  </svg>
</template>

<script setup lang="ts">
export type AppIconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'external-link'
  | 'bookmark'
  | 'git-branch'
  | 'chevron-down'
  | 'chevron-left'
  | 'check'
  | 'copy'
  | 'clipboard'
  | 'sliders'
  | 'undo'
  | 'redo'
  | 'sparkles'
  | 'settings'
  | 'image'
  | 'share'
  | 'bell'
  | 'folder'
  | 'folder-open'
  | 'home'
  | 'search'
  | 'trash'
  | 'history'
  | 'edit'
  | 'download'
  | 'clone'
  | 'logout'
  | 'menu'
  | 'x'
  | 'upload'
  | 'eye'
  | 'eye-off'
  | 'plus'
  | 'minus'
  | 'help-circle'
  | 'link'
  | 'clear'
  | 'chevron-right'
  | 'users'
  | 'clock-3'
  | 'mail'
  | 'heart'
  | 'file-text'
  | 'toolbox'
  | 'leaf'
  | 'alert-circle'
  | 'info-circle'
  | 'palette'

withDefaults(defineProps<{
  name: AppIconName
  size?: number | string
}>(), {
  size: 16,
})
</script>

<style scoped>
svg {
  display: block;
  vector-effect: non-scaling-stroke;
}

path,
circle,
rect {
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
