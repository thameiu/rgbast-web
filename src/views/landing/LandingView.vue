<template>
  <main class="landing">
    <RgbBackground />
    <div class="demo-columns" aria-hidden="true"><div v-for="(hex,i) in demoColors" :key="i" :style="{background: '#'+hex, '--exit': Math.min(1,Math.max(0,scrollProgress-i*.24))}" /></div>
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
          <div class="feat-art folder-scene" aria-hidden="true">
            <div class="folder-demo">
              <div v-for="palette in samplePalettes" :key="palette.name" class="pc folder-demo-card" :class="{ 'pc--big': palette.name === 'Kwester', 'pc--med': palette.name === 'ErgoSix' }">
                <div class="pc-strip"><span v-for="hex in palette.colors" :key="hex" class="pc-col" :style="{ background: `#${hex}` }"></span></div>
                <div class="pc-foot"><span class="pc-name">{{ palette.name }}</span></div>
              </div>
              <div class="folder-demo-shape"><span>My palettes</span><span class="folder-count">03 palettes</span></div>
            </div>
          </div>
        </article>
        <article class="feat feat--generator" :ref="registerFeatureEl">
          <div class="feat-copy"><h2 class="feat-title font-display"><span>{{ t('landing.featureGeneratorTitleFirst') }}</span> <strong>{{ t('landing.featureGeneratorTitleLast') }}</strong></h2><p class="feat-body">{{ t('landing.featureGeneratorBody') }}</p></div>
          <div class="feat-art generator-scene" aria-hidden="true"><div class="generator-card"><span class="art-label">COLOR HARMONY / ANALOGOUS</span><div class="generator-wheel"><span></span><span></span><span></span></div><div class="generator-swatches"><span v-for="hex in generatorColors" :key="hex" :style="{ background: `#${hex}` }"></span></div><span class="art-label">6 COLORS GENERATED</span></div></div>
        </article>
        <article class="feat feat--color" :ref="registerFeatureEl">
          <div class="feat-copy"><h2 class="feat-title font-display"><span>{{ t('landing.featureExplorerTitleFirst') }}</span> <strong>{{ t('landing.featureExplorerTitleLast') }}</strong></h2><p class="feat-body">{{ t('landing.featureExplorerBody') }}</p></div>
          <div class="feat-art color-scene" aria-hidden="true"><div class="color-sample"><span>MAGENTA</span><strong>#B410CC</strong></div><div class="color-detail color-detail--rgb"><div class="color-detail-content"><span>RGB</span><strong>180 · 16 · 204</strong></div></div><div class="color-detail color-detail--hsl"><div class="color-detail-content"><span>HSL</span><strong>292° · 85% · 43%</strong></div></div><div class="color-detail color-detail--bast"><div class="color-detail-content"><span>BAST INDEX</span><strong>☥ 15.9</strong></div></div></div>
        </article>
        <article class="feat feat--history" :ref="registerFeatureEl">
          <div class="feat-copy"><h2 class="feat-title font-display"><span>{{ t('landing.featureHistoryTitleFirst') }}</span> <strong>{{ t('landing.featureHistoryTitleLast') }}</strong></h2><p class="feat-body">{{ t('landing.featureHistoryBody') }}</p></div>
          <div class="feat-art community-scene" aria-hidden="true">
            <div v-for="palette in colleaguePalettes" :key="palette.name" class="pc community-palette-card" :class="{ 'pc--med': palette.name === 'Kwester' }">
              <div class="pc-strip"><span v-for="hex in palette.colors" :key="hex" class="pc-col" :style="{ background: `#${hex}` }"></span></div>
              <div class="pc-foot"><span class="pc-name">{{ palette.name }}</span></div>
            </div>
          </div>
        </article>
      </div>
    </section>


  </main>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import {ref} from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { RouterLink } from 'vue-router'
import RgbastLogo from '@/components/ui/RgbastLogo.vue'
import RgbBackground from '@/components/layout/RgbBackground.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import HistoryGraph from '@/components/palette/HistoryGraph.vue'
import type { PaletteHistoryGraphResponse } from '@/api/types'
import { setPageSeo } from '@/utils/seo'
import { useI18n } from '@/i18n'
import thameiuBadge from '@/assets/images/thameiu_88x31.webp'

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
const generatorColors = ['7D28C8', '9630D0', 'B410CC', 'C72CB9', 'D742AB', 'E0569E']
const samplePalettes = [
  { name: 'Kwester', colors: ['FFA62B', '16697B', '001C3E'] },
  { name: 'ErgoSix', colors: ['FBFFFB', 'D3FCB6', '339936', '3C3C9C', '1F1F3F'] },
  { name: 'PlanMyAsso', colors: ['FFFFFF', 'D2D6CE', 'A9B299', '627356'] },
]
const colleaguePalettes = [
  samplePalettes[0]!,
  { name: 'GGPS', colors: ['BD0000', '393938', '030303'] },
  samplePalettes[2]!,
  samplePalettes[1]!,
  { name: 'Roadica', colors: ['002232', '1F2937', 'FFFFFF'] },
]
const scrollProgress=ref(0)
let scrollFrame=0
function updateDemoScroll(){cancelAnimationFrame(scrollFrame);scrollFrame=requestAnimationFrame(()=>{scrollProgress.value=window.scrollY/Math.max(1,window.innerHeight*.7)})}
onMounted(()=>window.addEventListener('scroll',updateDemoScroll,{passive:true}))
onBeforeUnmount(()=>{window.removeEventListener('scroll',updateDemoScroll);cancelAnimationFrame(scrollFrame)})
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
