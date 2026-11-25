<template>
  <main class="about">
    <SiteHeader />
    <div class="about-content">
      <header class="about-intro">
        <h1 class="font-display">{{ t('about.title') }}</h1>
        <p>{{ t('about.intro') }} <span class="about-author"><a href="https://mathieu-hernandez.fr" target="_blank" rel="noopener noreferrer">thameiu</a><img :src="thameiuBadge" alt="" width="88" height="31" /></span></p>
      </header>
      <section class="about-sources">
        <h2 class="font-display">{{ t('about.sources') }}</h2>
        <ul>
          <li><a :href="bastFormulaUrl" target="_blank" rel="noopener noreferrer">{{ t('about.bastFormula') }} ↗</a></li>
          <li><a href="https://github.com/briangonzalez/rgbaster.js" target="_blank" rel="noopener noreferrer">rgbaster.js ↗</a><span>{{ locale === 'fr' ? 'Extraction des couleurs d’une image' : 'Image color extraction' }}</span></li>
          <li><a href="https://pypi.org/project/pycolornames/" target="_blank" rel="noopener noreferrer">pycolornames ↗</a><span>{{ locale === 'fr' ? 'Noms de couleurs' : 'Color names' }}</span></li>
          <li><a href="https://blog.xkcd.com/2010/05/03/color-survey-results/" target="_blank" rel="noopener noreferrer">XKCD Color Survey ↗</a><span>{{ locale === 'fr' ? 'Références de l’indice Bast' : 'Bast index references' }}</span></li>
        </ul>
      </section>
      <figure class="roger-quote">
        <div class="roger-portrait"><img :src="rogerImage" alt="Roger Bastard" /></div>
        <blockquote><p>“I swear, you people see cyan and magenta and think, ‘oh, that's blue and pink!’ What the fuck is wrong with you people?!”</p><figcaption>{{ t('about.fiction') }}</figcaption></blockquote>
      </figure>
    </div>
  </main>
</template>
<script setup lang="ts">
import SiteHeader from '@/components/layout/SiteHeader.vue'
import { useI18n } from '@/i18n'
import rogerImage from '../../roger.jpg'
import thameiuBadge from '@/assets/images/thameiu_88x31.webp'
const {t,locale}=useI18n()
const bastFormulaUrl = `${import.meta.env.BASE_URL}documents/bast_index_2_1.pdf`
</script>
<style scoped>
.about{padding:clamp(120px,12vw,180px) clamp(24px,5vw,72px) 100px;background:radial-gradient(circle at 1px 1px,rgba(14,14,16,.055) 1px,transparent 0) 0 0/28px 28px,var(--paper);min-height:100vh}
.about-content{max-width:1160px;margin:auto}
.about-intro{max-width:770px}
h1,h2{font-weight:800;line-height:.95}
h1{font-size:clamp(44px,5.2vw,68px)}
h2{font-size:clamp(44px,6vw,68px)}
.about-intro p{font-size:17px;line-height:1.4;margin-top:24px;max-width:56ch}
.about-author{display:inline-flex;align-items:center;gap:10px;vertical-align:middle;white-space:nowrap}
.about-author img{display:block;flex-shrink:0}
.about-sources{border-top:2px solid var(--ink);padding-top:30px;margin-top:60px}
a{color:var(--magenta,#B410CC);font-weight:700;text-decoration:underline;text-decoration-color:transparent;text-underline-offset:3px;transition:text-decoration-color .2s ease-in-out}
a:hover,a:focus-visible{text-decoration-color:currentColor}
.about-sources ul{list-style:none;padding:0;margin:36px 0 0;display:grid;gap:28px}
.about-sources li{display:flex;flex-direction:column;gap:6px;font-size:17px;line-height:1.4}
.about-sources li a{font-size:20px}
.about-sources li span{color:var(--ink-2)}
.roger-quote{display:grid;grid-template-columns:minmax(120px,220px) minmax(0,1fr);gap:clamp(30px,5vw,80px);align-items:stretch;margin:110px 0 0;padding:0}
.roger-portrait{position:relative;overflow:hidden;border-radius:16px}
.roger-portrait img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.roger-quote blockquote{margin:0}
.roger-quote blockquote p{font:700 clamp(32px,4.2vw,62px)/1.08 var(--font-display);letter-spacing:-.02em}
.roger-quote figcaption{font-size:15px;font-weight:700;margin-top:30px;color:var(--ink-2)}
@media(max-width:700px){.roger-quote{grid-template-columns:1fr;margin-top:80px}.roger-portrait{width:min(45%,180px);aspect-ratio:120 / 149}}
@media(prefers-reduced-motion:reduce){a{transition:none}}
</style>
