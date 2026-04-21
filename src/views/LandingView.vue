<template>
  <main class="landing">
    <RgbBackground />
    <!-- Top bar -->
    <header class="topbar">
      <div class="brand">
        <RgbastLogo size="34px" />
        <span class="brand-name">RGBAST</span>
        <span class="brand-meta font-mono">v0.1 · 2026</span>
      </div>

      <nav class="topnav">
        <a href="#features" class="topnav-link">Features</a>
        <a href="#log" class="topnav-link">History</a>
        <RouterLink to="/login" class="topnav-link">Log in</RouterLink>
        <RouterLink to="/register" class="topnav-cta">
          Start designing
          <span aria-hidden="true">→</span>
        </RouterLink>
      </nav>
    </header>

    <!-- Hero: editorial 12-col, spans full width -->
    <section class="hero">
      <div class="hero-left">
        <p class="eyebrow font-mono">
          <span class="eyebrow-bullet"></span>
          Color design · version controlled
        </p>

        <h1 class="headline font-display">
          Color, <em>committed.</em>
          <span class="headline-line">Branch, merge, revert</span>
          <span class="headline-line">your palette&nbsp;like code.</span>
        </h1>

        <p class="lede">
          RGBAST is a workspace for designers who think in&nbsp;systems.
          Draft a palette, commit it with a message, branch experiments,
          and walk back through every&nbsp;change.
        </p>

        <div class="cta-row">
          <RouterLink to="/register" class="btn-primary">
            Create a palette
          </RouterLink>
          <RouterLink to="/login" class="btn-ghost">
            <span class="font-mono">→</span> Sign in
          </RouterLink>
        </div>

        <dl class="stats">
          <div class="stat">
            <dt class="font-mono">01</dt>
            <dd>Named swatches with hex &amp; contrast metadata.</dd>
          </div>
          <div class="stat">
            <dt class="font-mono">02</dt>
            <dd>Commit every change &mdash; nothing lost, ever.</dd>
          </div>
          <div class="stat">
            <dt class="font-mono">03</dt>
            <dd>Branch experiments without touching production.</dd>
          </div>
        </dl>
      </div>

      <!-- Right side: live history graph with dummy data -->
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

    <!-- Feature strip -->
    <section id="features" class="features">
      <div class="features-row">
        <article class="feat">
          <span class="feat-num font-mono">F.01</span>
          <h3 class="feat-title font-display">Palette&nbsp;Atelier</h3>
          <p class="feat-body">
            Compose named swatches, annotate roles, attach intent. A palette
            is a document, not a grid of squares.
          </p>
        </article>
        <article class="feat">
          <span class="feat-num font-mono">F.02</span>
          <h3 class="feat-title font-display">Commit&nbsp;&amp;&nbsp;diff</h3>
          <p class="feat-body">
            Every edit becomes a commit with a message. Diffs show exactly
            which swatches shifted, by how many deltas.
          </p>
        </article>
        <article class="feat">
          <span class="feat-num font-mono">F.03</span>
          <h3 class="feat-title font-display">Branch&nbsp;&amp;&nbsp;merge</h3>
          <p class="feat-body">
            Try a neon variant without risking the main palette. Merge
            back when it earns its place.
          </p>
        </article>
        <article class="feat">
          <span class="feat-num font-mono">F.04</span>
          <h3 class="feat-title font-display">Time&nbsp;travel</h3>
          <p class="feat-body">
            Scrub the full history of a palette. Revert any swatch, any
            commit, any moment — pixel-perfect.
          </p>
        </article>
      </div>
    </section>

    <!-- Footer mark -->
    <footer class="foot">
      <span class="font-mono">RGBAST · an atelier for color systems</span>
      <RgbastLogo size="28px" />
    </footer>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import RgbastLogo from '@/components/RgbastLogo.vue'
import RgbBackground from '@/components/RgbBackground.vue'
import HistoryGraph from '@/components/HistoryGraph.vue'
import type { PaletteHistoryGraphResponse } from '@/api/types'

const now = Date.now()
const dummyHistory: PaletteHistoryGraphResponse = {
  main: [
    {
      id: 4, palette_id: 1, parent_snapshot_id: 3, branch_id: null,
      comment: "Merge branch 'experiment/neon'",
      created_at: new Date(now - 14 * 60_000).toISOString(),
      palette_colors: [{ hex: '0e0e10' }, { hex: '2b2035' }, { hex: 'd61fee' }, { hex: '0ec6d4' }, { hex: 'f4efe6' }],
      colors_added: 0, colors_deleted: 0, colors_modified: 2,
    },
    {
      id: 3, palette_id: 1, parent_snapshot_id: 1, branch_id: null,
      comment: 'Warm the shadow, cool the highlight',
      created_at: new Date(now - 2 * 3_600_000).toISOString(),
      palette_colors: [{ hex: '0e0e10' }, { hex: '2b2035' }, { hex: 'b410cc' }, { hex: 'f6c343' }, { hex: 'f4efe6' }],
      colors_added: 1, colors_deleted: 0, colors_modified: 1,
    },
    {
      id: 1, palette_id: 1, parent_snapshot_id: null, branch_id: null,
      comment: 'Initial commit — dusk palette',
      created_at: new Date(now - 3 * 86_400_000).toISOString(),
      palette_colors: [{ hex: '1b1b1f' }, { hex: '4b3a55' }, { hex: '9c19ad' }, { hex: 'f0eadd' }],
      colors_added: 0, colors_deleted: 0, colors_modified: 0,
    },
  ],
  branches: [
    {
      id: 1, title: 'experiment/neon',
      merged_at: new Date(now - 14 * 60_000).toISOString(),
      is_merged: true,
      snapshots: [
        {
          id: 6, palette_id: 1, parent_snapshot_id: 5, branch_id: 1,
          comment: 'Pop the neon — max saturation',
          created_at: new Date(now - 45 * 60_000).toISOString(),
          palette_colors: [{ hex: '0e0e10' }, { hex: '3c1a4e' }, { hex: 'd61fee' }, { hex: '0ec6d4' }, { hex: 'f4efe6' }],
          colors_added: 0, colors_deleted: 0, colors_modified: 1,
        },
        {
          id: 5, palette_id: 1, parent_snapshot_id: 1, branch_id: 1,
          comment: 'Fork neon experiment',
          created_at: new Date(now - 86_400_000).toISOString(),
          palette_colors: [{ hex: '0e0e10' }, { hex: '3c1a4e' }, { hex: 'd61fee' }, { hex: '0ec6d4' }, { hex: 'f4efe6' }],
          colors_added: 2, colors_deleted: 0, colors_modified: 1,
        },
      ],
    },
  ],
}
</script>

<style scoped>
.landing {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  color: var(--ink);
}

/* ============ Topbar ============ */
.topbar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px clamp(24px, 4vw, 56px);
  border-bottom: 1px solid var(--rule);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -0.03em;
  font-variation-settings: "opsz" 144, "SOFT" 0, "WONK" 0;
}
.brand-meta {
  padding-left: 12px;
  margin-left: 4px;
  border-left: 1px solid var(--rule);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.topnav {
  display: flex;
  align-items: center;
  gap: 28px;
}
.topnav-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  text-decoration: none;
  transition: color .2s;
}
.topnav-link:hover { color: var(--magenta); }
.topnav-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--ink);
  color: var(--paper);
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  text-decoration: none;
  transition: transform .2s, background .2s;
}
.topnav-cta:hover {
  background: var(--magenta);
  transform: translateY(-1px);
}

/* ============ Hero ============ */
.hero {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: clamp(32px, 5vw, 80px);
  padding: clamp(48px, 7vw, 96px) clamp(24px, 4vw, 56px) clamp(64px, 8vw, 120px);
  align-items: start;
}
@media (max-width: 1024px) {
  .hero { grid-template-columns: 1fr; }
}

/* Left column */
.hero-left { max-width: 640px; }

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-2);
  animation: riseIn .7s cubic-bezier(.2,.9,.2,1) .05s backwards;
}
.eyebrow-bullet {
  display: inline-block;
  width: 8px; height: 8px;
  background: var(--magenta);
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(180, 16, 204, 0.15);
}

.headline {
  margin-top: 24px;
  font-weight: 900;
  font-size: clamp(52px, 8vw, 112px);
  line-height: 0.92;
  letter-spacing: -0.02em;
  color: var(--ink);
  animation: riseIn .9s cubic-bezier(.2,.9,.2,1) .12s backwards;
}
.headline em {
  font-style: italic;
  color: var(--magenta-ink);
}
.headline-line {
  display: block;
}

.lede {
  margin-top: 32px;
  font-size: clamp(17px, 1.25vw, 19px);
  line-height: 1.55;
  color: var(--ink-2);
  max-width: 54ch;
  animation: riseIn .9s cubic-bezier(.2,.9,.2,1) .25s backwards;
}

.cta-row {
  margin-top: 36px;
  display: flex;
  align-items: center;
  gap: 16px;
  animation: riseIn .9s cubic-bezier(.2,.9,.2,1) .35s backwards;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  background: var(--ink);
  color: var(--paper);
  font-size: 14px;
  font-weight: 600;
  border-radius: 999px;
  text-decoration: none;
  transition: background .2s, transform .2s;
}
.btn-primary::after {
  content: "→";
  transition: transform .2s;
}
.btn-primary:hover { background: var(--magenta); transform: translateY(-1px); }
.btn-primary:hover::after { transform: translateX(3px); }

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 22px;
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
  border-radius: 999px;
  text-decoration: none;
  border: 1px solid var(--rule);
  transition: border-color .2s, color .2s;
}
.btn-ghost:hover { color: var(--magenta); border-color: var(--magenta); }

.stats {
  margin-top: 64px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--rule);
  animation: riseIn 1s cubic-bezier(.2,.9,.2,1) .5s backwards;
}
@media (max-width: 640px) {
  .stats { grid-template-columns: 1fr; gap: 20px; }
}
.stat dt {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--ink-3);
  margin-bottom: 8px;
}
.stat dd {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink-2);
}

/* ============ Right: history graph ============ */
.hero-right {
  position: relative;
  animation: riseIn 1s cubic-bezier(.2,.9,.2,1) .4s backwards;
}

.graph-card {
  position: relative;
  background: #0e0e14;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 1px 0 rgba(0,0,0,0.2),
    0 24px 60px -20px rgba(0,0,0,0.45);
}

.graph-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  font-size: 12px;
  color: rgba(255,255,255,0.35);
}
.graph-topbar strong { color: rgba(255,255,255,0.75); font-weight: 600; }

.graph-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.45);
}
.pill-dot {
  width: 6px; height: 6px;
  background: rgba(255,255,255,0.7);
  border-radius: 50%;
}

.graph-body {
  height: 400px;
  overflow: hidden;
}

.annotation {
  position: absolute;
  bottom: 16px;
  right: 18px;
  max-width: 140px;
  font-size: 11px;
  line-height: 1.35;
  color: rgba(255,255,255,0.28);
  text-align: right;
  transform: rotate(-2deg);
  pointer-events: none;
}
.ann-arrow {
  display: block;
  font-size: 22px;
  color: var(--magenta);
  margin-right: 16px;
  margin-bottom: 2px;
}
@media (max-width: 1024px) {
  .annotation { display: none; }
}

/* ============ Features ============ */
.features {
  position: relative;
  z-index: 2;
  padding: 56px clamp(24px, 4vw, 56px);
  border-top: 1px solid var(--rule);
}
.features-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
}
@media (max-width: 960px) {
  .features-row { grid-template-columns: repeat(2, 1fr); gap: 32px; }
}
@media (max-width: 560px) {
  .features-row { grid-template-columns: 1fr; }
}
.feat {
  border-top: 2px solid var(--ink);
  padding-top: 16px;
}
.feat-num {
  font-size: 10.5px;
  letter-spacing: 0.14em;
  color: var(--ink-3);
  text-transform: uppercase;
}
.feat-title {
  margin-top: 10px;
  font-size: 24px;
  font-weight: 400;
  letter-spacing: -0.03em;
  color: var(--ink);
}
.feat-body {
  margin-top: 10px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink-2);
}

/* ============ Footer ============ */
.foot {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px clamp(24px, 4vw, 56px);
  border-top: 1px solid var(--rule);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
}
/* ============ Keyframes ============ */
@keyframes riseIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
