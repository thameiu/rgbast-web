<template>
  <main class="landing">
    <RgbBackground />
    <SiteHeader brand-meta="v1.3 · 2026" />

    <section class="hero">
      <div class="hero-left">
        <p class="eyebrow font-mono">
          <RgbastLogo size="13px" :mono="true" class="eyebrow-logo" />
          Palette generation · version controlled
        </p>

        <h1 class="headline font-display">
          Generate, commit, branch
          <span class="headline-line">your <em>colors.</em></span>
        </h1>

        <p class="lede">
          Generate palettes first, then shape them like code.
          Tune harmony and contrast, commit with a message, branch experiments,
          and walk back through every&nbsp;change.
        </p>

        <div class="cta-row">
          <RouterLink :to="{ name: 'palette', params: { username: 'local', pathMatch: 'new' } }" class="btn-primary">
            Create a palette
            <span class="btn-arrow" aria-hidden="true">→</span>
          </RouterLink>
          <RouterLink to="/login" class="btn-ghost">
            <span class="font-mono">→</span> Sign in
          </RouterLink>
          <RouterLink to="/color/B410CC" class="btn-ghost btn-ghost--color">
            <span class="color-dot" aria-hidden="true"></span> Color Explorer
          </RouterLink>
        </div>

        <dl class="stats">
          <div class="stat">
            <dt class="font-mono">01</dt>
            <dd>Generate from harmony rules, image extraction, or base colors.</dd>
          </div>
          <div class="stat">
            <dt class="font-mono">02</dt>
            <dd>Commit every iteration - nothing lost, ever.</dd>
          </div>
          <div class="stat">
            <dt class="font-mono">03</dt>
            <dd>Branch palette experiments without touching your main version.</dd>
          </div>
        </dl>
      </div>

      <aside class="hero-right" aria-label="Sample palette history">
        <div class="graph-card">
          <div class="graph-topbar font-mono">
            <span class="graph-path">~/palettes/<strong>dusk</strong></span>
            <span class="graph-pill"><span class="pill-dot"></span>main</span>
          </div>
          <div class="graph-body">
            <HistoryGraph :history="dummyHistory" />
          </div>
          <div class="annotation font-mono" aria-hidden="true">
            <span class="ann-arrow">↱</span>
            every change,<br />diffed by color.
          </div>
        </div>
      </aside>
    </section>

    <section id="features" class="features">
      <div class="features-stack">
        <article class="feat feat--wide feat--generator" :ref="registerFeatureEl">
          <span class="feat-num font-mono">F.01</span>
          <h3 class="feat-title font-display">Advanced&nbsp;<span class="feat-key feat-key--generator">Generator</span></h3>
          <p class="feat-body">
            Generate palettes with harmony strategies, contrast tuning,
            curated base colors, and image or SVG extraction.
            then refine and commit what works.
          </p>
        </article>
        <article class="feat feat--wide feat--atelier" :ref="registerFeatureEl">
          <span class="feat-num font-mono">F.02</span>
          <h3 class="feat-title font-display">Palette&nbsp;<span class="feat-key feat-key--atelier">Atelier</span></h3>
          <p class="feat-body">
            Generate a base, then craft named swatches with labels and structure.
            Every color gets a role in your system.
          </p>
        </article>
        <article class="feat feat--wide feat--history" :ref="registerFeatureEl">
          <span class="feat-num font-mono">F.03</span>
          <h3 class="feat-title font-display">Versioned&nbsp;<span class="feat-key feat-key--history">History</span></h3>
          <p class="feat-body">
            Generate new variants, commit every change with a message, branch from any
            snapshot, and merge back when ready. Traverse the timeline and
            safely roll back without losing work.
          </p>
        </article>
        <article class="feat feat--wide feat--color" :ref="registerFeatureEl">
          <span class="feat-num font-mono">F.04</span>
          <h3 class="feat-title font-display">Color&nbsp;<span class="feat-key feat-key--explorer">Explorer</span></h3>
          <p class="feat-body">
            Generate a palette, then inspect any hex: color spaces, accessibility ratings, contrast checker,
            color blindness simulations, and toy around with the 3D Color Picker.
          </p>
          <RouterLink to="/color/B410CC" class="feat-link font-mono">Try it →</RouterLink>
        </article>
      </div>
    </section>

    <footer class="foot">
      <span class="foot-copy font-mono">RGBAST · Version control for colors</span>
      <div class="foot-mark">
        <RgbastLogo size="28px" />
        <a
          class="foot-badge-link"
          href="https://mathieu-hernandez.fr"
          target="_blank"
          rel="noreferrer"
          aria-label="Projet by thameiu"
        >
          <img class="foot-badge" :src="thameiuBadge" alt="thameiu 88x31 badge" />
        </a>
      </div>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { RouterLink } from 'vue-router'
import RgbastLogo from '@/components/ui/RgbastLogo.vue'
import RgbBackground from '@/components/layout/RgbBackground.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import HistoryGraph from '@/components/palette/HistoryGraph.vue'
import type { PaletteHistoryGraphResponse } from '@/api/types'
import { setPageSeo } from '@/utils/seo'
import thameiuBadge from '@/assets/images/thameiu_88x31.webp'

// LandingView component: marketing home page with a demo history graph.
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

const now = Date.now()
const dummyHistory: PaletteHistoryGraphResponse = {
  palette_id: 0,
  owner_username: 'demo-user',
  title: 'dusk',
  folder_path: [],
  main: [
    {
      id: 4,
      palette_id: 1,
      parent_snapshot_id: 3,
      branch_id: null,
      comment: "Merge branch 'experiment/neon'",
      created_at: new Date(now - 14 * 60_000).toISOString(),
      palette_colors: [
        { hex: '0e0e10' },
        { hex: '2b2035' },
        { hex: 'd61fee' },
        { hex: '0ec6d4' },
        { hex: 'f4efe6' },
      ],
      colors_added: 0,
      colors_deleted: 0,
      colors_modified: 2,
    },
    {
      id: 3,
      palette_id: 1,
      parent_snapshot_id: 1,
      branch_id: null,
      comment: 'Warm the shadow, cool the highlight',
      created_at: new Date(now - 2 * 3_600_000).toISOString(),
      palette_colors: [
        { hex: '0e0e10' },
        { hex: '2b2035' },
        { hex: 'b410cc' },
        { hex: 'f6c343' },
        { hex: 'f4efe6' },
      ],
      colors_added: 1,
      colors_deleted: 0,
      colors_modified: 1,
    },
    {
      id: 1,
      palette_id: 1,
      parent_snapshot_id: null,
      branch_id: null,
      comment: 'Initial commit - dusk palette',
      created_at: new Date(now - 3 * 86_400_000).toISOString(),
      palette_colors: [
        { hex: '1b1b1f' },
        { hex: '4b3a55' },
        { hex: '9c19ad' },
        { hex: 'f0eadd' },
      ],
      colors_added: 0,
      colors_deleted: 0,
      colors_modified: 0,
    },
  ],
  branches: [
    {
      id: 1,
      title: 'experiment/neon',
      merged_at: new Date(now - 14 * 60_000).toISOString(),
      is_merged: true,
      snapshots: [
        {
          id: 6,
          palette_id: 1,
          parent_snapshot_id: 5,
          branch_id: 1,
          comment: 'Pop the neon - max saturation',
          created_at: new Date(now - 45 * 60_000).toISOString(),
          palette_colors: [
            { hex: '0e0e10' },
            { hex: '3c1a4e' },
            { hex: 'd61fee' },
            { hex: '0ec6d4' },
            { hex: 'f4efe6' },
          ],
          colors_added: 0,
          colors_deleted: 0,
          colors_modified: 1,
        },
        {
          id: 5,
          palette_id: 1,
          parent_snapshot_id: 1,
          branch_id: 1,
          comment: 'Fork neon experiment',
          created_at: new Date(now - 86_400_000).toISOString(),
          palette_colors: [
            { hex: '0e0e10' },
            { hex: '3c1a4e' },
            { hex: 'd61fee' },
            { hex: '0ec6d4' },
            { hex: 'f4efe6' },
          ],
          colors_added: 2,
          colors_deleted: 0,
          colors_modified: 1,
        },
      ],
    },
  ],
}
</script>

<style src="./LandingView.css" scoped></style>
