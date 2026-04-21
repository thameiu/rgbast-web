<template>
  <div class="app-root">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style scoped>
.app-root {
  position: relative;
  min-height: 100vh;
}
</style>
