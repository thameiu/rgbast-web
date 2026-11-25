<template>
  <div ref="host" class="demo-project" :class="{ 'is-open': open }" role="button" tabindex="0" :aria-label="title" :aria-expanded="open"
    @pointerenter="$event.pointerType === 'mouse' && setOpen(true)" @pointerleave="$event.pointerType === 'mouse' && setOpen(false)"
    @focus="setOpen(true)" @blur="setOpen(false)" @keydown.enter.prevent="setOpen(!open)" @keydown.space.prevent="setOpen(!open)" @pointerdown="onPointerDown">
    <div class="demo-project-back" aria-hidden="true" />
    <div v-for="palette in palettes" :key="palette.name" class="demo-project-reveal demo-project-palette" aria-hidden="true">
      <div class="demo-project-swatches"><span v-for="(hex, index) in palette.colors" :key="index" :style="{ background: '#' + hex }" /></div>
      <strong>{{ palette.name }}</strong>
    </div>
    <div class="demo-project-reveal demo-project-bookmark" :style="{ background: '#' + bookmark.hex, color: bookmark.ink }" aria-hidden="true">
      <AppIcon name="bookmark" :size="16" /><strong>{{ bookmark.name }}</strong><small>#{{ bookmark.hex }}</small>
    </div>
    <div class="demo-project-face">
      <div class="demo-project-art" aria-hidden="true"><AppIcon name="project" :size="280" /></div>
      <h3>{{ title }}</h3>
      <div class="demo-project-counts" aria-hidden="true"><span>2 <AppIcon name="palette" :size="14" /></span><i /><span>1 <AppIcon name="bookmark" :size="14" /></span><i /><span>3 <AppIcon name="users" :size="14" /></span></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import AppIcon from '@/components/icons/AppIcon.vue'
import { createLandingCardReveal } from '@/utils/landingCardReveal'
defineProps<{ title: string; palettes: Array<{ name: string; colors: string[] }>; bookmark: { hex: string; name: string; ink: string } }>()
const host = ref<HTMLElement | null>(null), open = ref(false)
let media: gsap.MatchMedia | undefined, animation: gsap.core.Timeline | undefined
function setOpen(value: boolean) { open.value = value; if (value) animation?.play(); else animation?.reverse() }
function onPointerDown(event: PointerEvent) { if (event.pointerType !== 'mouse') { event.preventDefault(); setOpen(!open.value) } }
onMounted(() => {
  media = gsap.matchMedia()
  media.add({ reduced: '(prefers-reduced-motion: reduce)', animated: '(prefers-reduced-motion: no-preference)' }, context => {
    animation = createLandingCardReveal(host.value!.querySelectorAll<HTMLElement>('.demo-project-reveal'), !!context.conditions?.reduced)
    if (open.value) animation.progress(1)
  })
})
onBeforeUnmount(() => media?.revert())
</script>
<style scoped>
.demo-project{position:relative;width:68%;max-width:320px;height:170px;cursor:pointer;isolation:isolate;outline:none}
.demo-project.is-open,.demo-project:focus-visible{z-index:5}
.demo-project-back,.demo-project-face{position:absolute;inset:0;border-radius:12px;background:var(--ink);color:#fff}
.demo-project-back{z-index:0}
.demo-project-face{z-index:3;display:flex;flex-direction:column;justify-content:flex-end;gap:14px;padding:24px;overflow:hidden;box-shadow:0 8px 28px rgba(14,14,16,.12)}
.demo-project:focus-visible .demo-project-face{outline:2px solid var(--magenta);outline-offset:4px}
.demo-project-art{position:absolute;inset:0;overflow:hidden;color:#303033;pointer-events:none}
.demo-project-art :deep(.project-icon){position:absolute;left:0;top:-25%;width:100%!important;height:150%!important}
.demo-project h3{position:relative;font:700 clamp(32px,4vw,44px)/1 var(--font-display);margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.demo-project-counts{position:relative;display:flex;align-items:center;gap:10px;font:500 11px var(--font-mono);color:rgba(255,255,255,.75)}
.demo-project-counts>span{display:flex;align-items:center;gap:6px}.demo-project-counts i{width:3px;height:3px;background:currentColor;opacity:.6}
.demo-project-reveal{position:absolute;z-index:1;left:50%;top:18%;width:62%;opacity:0;visibility:hidden;pointer-events:none;border-radius:10px;overflow:hidden;box-shadow:0 4px 18px rgba(14,14,16,.18)}
.demo-project-palette{background:#fff}.demo-project-swatches{display:flex;height:58px}.demo-project-swatches>span{flex:1;min-width:0}.demo-project-palette>strong{display:block;padding:8px 10px;font:700 22px/1 var(--font-display);color:var(--ink)}
.demo-project-bookmark{height:92px;padding:12px;display:flex;flex-direction:column;gap:4px}.demo-project-bookmark strong{font:700 22px/1 var(--font-display)}.demo-project-bookmark small{font:600 10px var(--font-mono)}
@media(max-width:600px){.demo-project{width:70%;height:150px}.demo-project-face{padding:18px}.demo-project-counts{gap:7px;font-size:10px}.demo-project-swatches{height:46px}.demo-project-bookmark{height:80px}.demo-project-palette>strong,.demo-project-bookmark strong{font-size:19px}}
</style>
