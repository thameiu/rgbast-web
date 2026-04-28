<template>
  <Transition name="banner-slide">
    <div v-if="show" class="snapshot-banner">
      <span class="banner-text">
        <template v-if="!isOwned">
          Viewing a past snapshot.
        </template>
        <template v-else-if="ctx?.isMain">
          <template v-if="!isSelectedLatestMainSnapshot">
            Viewing a past snapshot -- saving will create a <strong>new branch</strong> from this point.
          </template>
          <template v-else>
            Viewing the latest snapshot.
          </template>
        </template>
        <template v-else-if="ctx?.isMerged">
          Viewing a past snapshot from a merged branch -- saving will create a <strong>new branch</strong> from this point.
        </template>
        <template v-else>
          Viewing a past snapshot -- saving will create a new commit on branch <strong>{{ ctx?.branchTitle }}</strong>.
        </template>
      </span>
      <div class="banner-actions">
        <button
          v-if="isOwned && revertableSnapshotCount > 0"
          class="banner-revert"
          @click="$emit('revert')"
        >
          Revert branch here
        </button>
        <button class="banner-dismiss" @click="$emit('clear')">Deselect x</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { SnapshotContext } from '../composables/usePaletteContext'

// PaletteSnapshotBanner component: displays snapshot selection context and actions in PaletteView.
defineProps<{
  show: boolean
  isOwned: boolean
  ctx: SnapshotContext | null
  isSelectedLatestMainSnapshot: boolean
  revertableSnapshotCount: number
}>()

// Emits: revert (open revert modal), clear (clear snapshot selection).
defineEmits<{
  (e: 'revert'): void
  (e: 'clear'): void
}>()
</script>

<style scoped src="./PaletteSnapshotBanner.css"></style>
