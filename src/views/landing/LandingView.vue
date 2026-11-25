<template>
  <main class="landing">
    <RgbBackground />
    <div ref="demoColumns" class="demo-columns" aria-hidden="true"><div v-for="(hex,i) in demoColors" :key="i" :style="{background: '#'+hex}" /></div>
    <SiteHeader brand-meta="v1.3 · 2026" />

    <section class="hero">
      <div class="hero-left">


        <h1 class="headline font-display">
          <span class="headline-intro">{{ t('landing.headline') }}</span>
          <span class="headline-line rainbow-title">{{ t('landing.headlineLine') }}</span><span>{{ t('landing.headlineEnd') }}</span>
        </h1>

        <p class="lede">
          {{ t('landing.lead') }}
        </p>

        <div class="cta-row">
          <RouterLink :to="{ name: 'palette', params: { username: 'local', pathMatch: 'new' } }" class="btn-primary">
            <AppIcon name="palette" :size="16" />
            {{ t('landing.createPalette') }}
          </RouterLink>
          <RouterLink to="/color/B410CC" class="btn-ghost btn-ghost--color">
            <AppIcon name="paint-palette" :size="16" /> {{ t('landing.colorExplorer') }}
          </RouterLink>
        </div>
      </div>

      <aside class="hero-right" aria-label="Sample palette history">
        <div class="graph-card">
          <div class="graph-topbar font-mono">
            <span class="graph-path">~/palettes/<strong>RGBAST</strong></span>
            <span class="graph-pill">main</span>
          </div>
          <div class="graph-body">
            <HistoryGraph :history="dummyHistory" @selectSnapshot="selectDemoSnapshot" />
          </div>

        </div>
      </aside>
    </section>

    <section id="features" class="features">
      <div class="features-stack">
        <article class="feat feat--atelier" :ref="registerFeatureEl">
          <div class="feat-copy">
            <h2 class="feat-title font-display"><span>{{ t('landing.featureAtelierTitleFirst') }}</span> <strong>{{ t('landing.featureAtelierTitleLast') }}</strong></h2>
            <p class="feat-body">{{ t('landing.featureAtelierBody') }}</p>
          </div>
          <div class="feat-art folder-scene">
            <div ref="folderDemo" class="folder-demo" role="button" tabindex="0"
              :aria-label="t('landing.featureAtelierTitleFirst') + ' ' + t('landing.featureAtelierTitleLast')"
              :aria-expanded="folderOpen"
              @pointerenter="$event.pointerType === 'mouse' && setFolderOpen(true)"
              @pointerleave="$event.pointerType === 'mouse' && setFolderOpen(false)"
              @focus="setFolderOpen(true)" @blur="setFolderOpen(false)"
              @keydown.enter.prevent="setFolderOpen(!folderOpen)" @keydown.space.prevent="setFolderOpen(!folderOpen)"
              @pointerdown="onFolderPointerDown">
              <div class="folder-demo-back" aria-hidden="true"></div>
              <div v-for="palette in samplePalettes" :key="palette.name" class="pc folder-demo-card" aria-hidden="true">
                <div class="pc-strip"><span v-for="hex in palette.colors" :key="hex" class="pc-col" :style="{ background: `#${hex}` }"></span></div>
                <div class="pc-foot"><span class="pc-name">{{ palette.name }}</span></div>
              </div>
              <div class="folder-demo-shape">
                <span>My palettes</span>
                <p class="folder-count font-mono">
                  <AppIcon name="palette" :size="14" /> {{ samplePalettes.length }} · <AppIcon name="folder" :size="14" /> 0
                </p>
              </div>
            </div>
          </div>
        </article>
        <article class="feat feat--generator" :ref="registerFeatureEl">
          <div class="feat-copy"><h2 class="feat-title font-display"><span>{{ t('landing.featureGeneratorTitleFirst') }}</span> <strong>{{ t('landing.featureGeneratorTitleLast') }}</strong></h2><p class="feat-body">{{ t('landing.featureGeneratorBody') }}</p></div>
          <div class="feat-art generator-scene" aria-hidden="true">
            <div v-for="harmony in harmonyExamples" :key="harmony.name" class="harmony-demo">
              <div class="harmony-swatches"><span v-for="(color, index) in harmony.colors" :key="index" :style="{ background: color }"></span></div>
              <strong class="harmony-name">{{ t(`palette.harmonies.${harmony.name}`) }}</strong>
            </div>
          </div>
        </article>
        <article class="feat feat--color" :ref="registerFeatureEl">
          <div class="feat-copy"><h2 class="feat-title font-display"><span>{{ t('landing.featureExplorerTitleFirst') }}</span> <strong>{{ t('landing.featureExplorerTitleLast') }}</strong></h2><p class="feat-body">{{ t('landing.featureExplorerBody') }}</p></div>
          <div class="feat-art color-scene" aria-hidden="true"><div class="color-sample"><span>MAGENTA</span><strong>#B410CC</strong></div><div class="color-detail color-detail--rgb"><div class="color-detail-content"><span>RGB</span><strong>180 · 16 · 204</strong></div></div><div class="color-detail color-detail--hsl"><div class="color-detail-content"><span>HSL</span><strong>292° · 85% · 43%</strong></div></div><div class="color-detail color-detail--bast"><div class="color-detail-content"><span>BAST INDEX</span><strong>☥ 15.9</strong></div></div></div>
        </article>
        <article class="feat feat--history" :ref="registerFeatureEl">
          <div class="feat-copy"><h2 class="feat-title font-display"><span>{{ t('landing.featureHistoryTitleFirst') }}</span> <strong>{{ t('landing.featureHistoryTitleLast') }}</strong></h2><p class="feat-body">{{ t('landing.featureHistoryBody') }}</p></div>
          <div class="feat-art project-demo-scene">
            <LandingProjectDemo v-for="project in demoProjects" :key="project.title" :title="project.title" :palettes="project.palettes" :bookmark="project.bookmark" />
          </div>
        </article>
      </div>
    </section>


  </main>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import gsap from 'gsap'
import LandingProjectDemo from './components/LandingProjectDemo.vue'
import { createLandingCardReveal } from '@/utils/landingCardReveal'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RouterLink } from 'vue-router'
import RgbBackground from '@/components/layout/RgbBackground.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import HistoryGraph from '@/components/palette/HistoryGraph.vue'
import type { PaletteHistoryGraphResponse } from '@/api/types'
import { setPageSeo } from '@/utils/seo'
import { useI18n } from '@/i18n'

gsap.registerPlugin(ScrollTrigger)

// LandingView component: marketing home page with a demo history graph.
const { t } = useI18n()

onMounted(() => {
  setPageSeo({
    title: 'RGBAST - version control for color',
    description: 'Generate advanced color palettes with harmony, image and SVG extraction, then version every change with branches and snapshots.',
    keywords: ['palette versioning', 'color workflow', 'palette history', 'color accessibility', 'color explorer'],
  })
})

const featureEls: HTMLElement[] = []
let featureObserver: IntersectionObserver | null = null

function registerFeatureEl(el: Element | ComponentPublicInstance | null): void {
  if (!el || !(el instanceof HTMLElement)) return
  const htmlEl = el
  if (!featureEls.includes(htmlEl)) featureEls.push(htmlEl)
}

onMounted(() => {
  featureObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          ;(entry.target as HTMLElement).classList.add('is-visible')
          featureObserver?.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
  )
  for (const el of featureEls) featureObserver.observe(el)
})

onBeforeUnmount(() => {
  featureObserver?.disconnect()
  featureObserver = null
})

const demoColors = ref(['B410CC','D56A88','F6C343','82C58C','0EC6D4','616BD0'])
const harmonyExamples = [
  { name: 'analogous', colors: ['#8830D0', '#B410CC', '#D030AA'] },
  { name: 'complementary', colors: ['#B410CC', '#2FCC10'] },
  { name: 'triadic', colors: ['#B410CC', '#CCB410', '#10CCB4'] },
  { name: 'split', colors: ['#B410CC', '#87CC10', '#10CC55'] },
  { name: 'tetradic', colors: ['#B410CC', '#CC5510', '#2FCC10', '#1087CC'] },
  { name: 'shades', colors: ['#560861', '#88109A', '#B410CC', '#D77DE4'] },
]
const samplePalettes = [
  { name: 'Kwester', colors: ['FFA62B', '16697B', '001C3E'] },
  { name: 'ErgoSix', colors: ['FBFFFB', 'D3FCB6', '339936', '3C3C9C', '1F1F3F'] },
  { name: 'PlanMyAsso', colors: ['FFFFFF', 'D2D6CE', 'A9B299', '627356'] },
]
const demoProjects = [
  { title: 'ergosix', palettes: [samplePalettes[1]!, { name: 'Forest', colors: ['F5FFF0', 'D3FCB6', '339936', '17451D'] }], bookmark: { name: 'Leaf', hex: 'D3FCB6', ink: '#0E0E10' } },
  { title: 'Bubblegum', palettes: [{ name: 'Bubblegum', colors: ['FFF0F7', 'FFD0E5', 'FF92C2', 'F45197', 'BA225D'] }, { name: 'Pink hour', colors: ['FFE5F0', 'FFB8D4', 'E86CA6', 'B73576', '721540'] }], bookmark: { name: 'Candy', hex: 'FF92C2', ink: '#0E0E10' } },
]
const demoColumns = ref<HTMLElement | null>(null)
const folderDemo = ref<HTMLElement | null>(null)
const folderOpen = ref(false)
let columnMedia: gsap.MatchMedia | undefined
let illustrationMedia: gsap.MatchMedia | undefined
let folderAnimation: gsap.core.Timeline | undefined

function setFolderOpen(open: boolean): void {
  folderOpen.value = open
  if (open) folderAnimation?.play()
  else folderAnimation?.reverse()
}

function onFolderPointerDown(event: PointerEvent): void {
  if (event.pointerType !== 'mouse') {
    // Prevent the synthetic focus/hover sequence from immediately undoing a tap.
    event.preventDefault()
    setFolderOpen(!folderOpen.value)
  }
}

function animateColumns(): void {
  columnMedia?.revert()
  if (!demoColumns.value) return
  columnMedia = gsap.matchMedia()
  columnMedia.add({ all: 'all', mobile: '(max-width: 768px)', reduced: '(prefers-reduced-motion: reduce)' }, (context) => {
    const columns = Array.from(demoColumns.value!.children)
    if (context.conditions?.reduced) return
    const mobile = context.conditions?.mobile
    gsap.to(mobile ? columns.reverse() : columns, {
      ...(mobile ? { xPercent: -105 } : { yPercent: -105 }),
      duration: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: {
        trigger: demoColumns.value,
        start: 'top 68px',
        end: () => `+=${window.innerHeight * 1.4}`,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    })
  })
}

onMounted(() => {
  animateColumns()
  illustrationMedia = gsap.matchMedia()
  illustrationMedia.add({ reduced: '(prefers-reduced-motion: reduce)', animated: '(prefers-reduced-motion: no-preference)' }, (context) => {
    const reduced = context.conditions?.reduced
    const cards = folderDemo.value!.querySelectorAll<HTMLElement>('.folder-demo-card')
    folderAnimation = createLandingCardReveal(cards, !!reduced)
    if (folderOpen.value) folderAnimation.progress(1)
  })
})

// Demo snapshots can change the number of columns; rebuild only their scroll tween.
watch(() => demoColors.value.length, animateColumns, { flush: 'post' })
onBeforeUnmount(() => {
  columnMedia?.revert()
  illustrationMedia?.revert()
})
function snapshot(id:number,parent:number|null,branch:number|null,hexes:string[],comment:string){return {id,palette_id:1,parent_snapshot_id:parent,branch_id:branch,comment,created_at:new Date(1700000000000+id*3600000).toISOString(),palette_colors:hexes.map(hex=>({hex})),colors_added:hexes.length,colors_deleted:0,colors_modified:0}}
const first=snapshot(1,null,null,['B410CC'],'01')
const second=snapshot(2,1,null,['B410CC','CCB410','10CCB4'],'02')
const abandoned=snapshot(3,2,1,['746C18','9D756B','497456'],'03')
const merged=snapshot(4,2,2,demoColors.value,'04')
const final=snapshot(5,4,null,demoColors.value,'RGBAST')
const dummyHistory:PaletteHistoryGraphResponse={palette_id:1,owner_username:'thameiu',title:'RGBAST',folder_path:[],main:[final,second,first],branches:[{id:1,title:'experiment',is_merged:false,merged_at:null,snapshots:[abandoned]},{id:2,title:'RGBAST',is_merged:true,merged_at:final.created_at,snapshots:[merged]}]}
function selectDemoSnapshot(id:number){const snap=[first,second,abandoned,merged,final].find(s=>s.id===id);if(snap)demoColors.value=snap.palette_colors.map(c=>c.hex)}

</script>

<style src="./LandingView.css" scoped></style>
