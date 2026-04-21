<template>
  <!-- Centering wrapper — no transforms so GSAP can freely rotate the SVG -->
  <div class="rgb-wrap" aria-hidden="true">
    <svg
      ref="svgRef"
      class="rgb-svg"
      viewBox="-320 -320 640 640"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!--
        3 circles in equilateral-triangle arrangement (classic RGB Venn).
        All purple (#B410CC), outline only.
        r = 200, center-offset d = 120:
          Top:          (  0,  -120)
          Bottom-left:  (-103.92,  60)
          Bottom-right: ( 103.92,  60)
      -->
      <circle cx="0"       cy="-120" r="200" fill="none" stroke="#B410CC" stroke-width="1.5"/>
      <circle cx="-103.92" cy="60"   r="200" fill="none" stroke="#B410CC" stroke-width="1.5"/>
      <circle cx="103.92"  cy="60"   r="200" fill="none" stroke="#B410CC" stroke-width="1.5"/>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const svgRef = ref<SVGSVGElement | null>(null)
let ctx: gsap.Context | null = null

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.to(svgRef.value, {
      rotation: 360,
      transformOrigin: '50% 50%',
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2,
      },
    })
  })
})

onUnmounted(() => {
  ctx?.revert()
  ScrollTrigger.getAll().forEach(t => t.kill())
})
</script>

<style scoped>
.rgb-wrap {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.rgb-svg {
  width: 92vmin;
  height: 92vmin;
  flex-shrink: 0;
  opacity: 0.15;
  will-change: transform;
}
</style>
