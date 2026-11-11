<template>
  <main class="about">
    <SiteHeader />
    <div class="about-content">
      <header class="about-intro"><h1 class="font-display">{{ t('about.title') }}</h1><p>{{ t('about.intro') }}</p></header>
      <section class="about-maker"><h2 class="font-display">thameiu</h2><p>{{ t('about.note') }}</p><a href="https://mathieu-hernandez.fr" target="_blank" rel="noopener noreferrer">mathieu-hernandez.fr ↗</a></section>
      <section class="about-sources">
        <h2 class="font-display">{{ t('about.sources') }}</h2>
        <ul>
          <li><a href="https://github.com/briangonzalez/rgbaster" target="_blank" rel="noopener noreferrer">rgbaster.js ↗</a><span>{{ locale === 'fr' ? 'Extraction des couleurs d’une image' : 'Image color extraction' }}</span></li>
          <li><a href="https://pypi.org/project/pycolornames/" target="_blank" rel="noopener noreferrer">pycolornames ↗</a><span>{{ locale === 'fr' ? 'Noms de couleurs' : 'Color names' }}</span></li>
          <li><a href="https://xkcd.com/color/rgb/" target="_blank" rel="noopener noreferrer">XKCD Color Survey ↗</a><span>{{ locale === 'fr' ? 'Références de l’indice Bast' : 'Bast index references' }}</span></li>
        </ul>
      </section>
      <figure class="roger-quote">
        <img :src="rogerImage" alt="Roger Bastard" />
        <blockquote><p>“I swear, you people see cyan and magenta and think, ‘oh, that's blue and pink!’ What the fuck is wrong with you people?!”</p><figcaption>{{ t('about.fiction') }}</figcaption></blockquote>
      </figure>
    </div>
  </main>
</template>
<script setup lang="ts">
import SiteHeader from '@/components/layout/SiteHeader.vue'
import { useI18n } from '@/i18n'
import rogerImage from '../../roger.jpg'
const {t,locale}=useI18n()
</script>
<style scoped>
.about{padding:clamp(120px,12vw,180px) clamp(24px,5vw,72px) 100px;background:radial-gradient(circle at 1px 1px,rgba(14,14,16,.055) 1px,transparent 0) 0 0/28px 28px,var(--paper);min-height:100vh}
.about-content{max-width:1160px;margin:auto}
.about-intro{max-width:770px}
h1,h2{font-weight:800;line-height:.95}
h1{font-size:clamp(76px,11vw,140px)}
h2{font-size:clamp(44px,6vw,68px)}
.about-intro p{font-size:clamp(20px,2.1vw,28px);line-height:1.35;margin-top:24px;max-width:56ch}
.about-maker,.about-sources{border-top:2px solid var(--ink);padding-top:30px;margin-top:90px}
.about-maker p{font-size:19px;line-height:1.55;margin:18px 0 10px}
a{color:var(--magenta,#B410CC);font-weight:700;text-decoration:none}
a:hover{text-decoration:underline}
.about-sources ul{list-style:none;padding:0;margin:36px 0 0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.about-sources li{display:flex;flex-direction:column;gap:12px;min-height:135px;padding:22px;border:1px solid var(--rule);border-radius:12px;background:#fff;font-size:17px;line-height:1.4}
.about-sources li a{font-size:20px}
.about-sources li span{color:var(--ink-2)}
.roger-quote{display:grid;grid-template-columns:minmax(220px,.75fr) minmax(0,1.25fr);gap:clamp(30px,5vw,80px);align-items:center;margin:110px 0 0;padding:0}
.roger-quote img{width:100%;height:100%;max-height:560px;object-fit:cover;border-radius:16px}
.roger-quote blockquote{margin:0}
.roger-quote blockquote p{font:700 clamp(32px,4.2vw,62px)/1.08 var(--font-display);letter-spacing:-.02em}
.roger-quote figcaption{font-size:15px;font-weight:700;margin-top:30px;color:var(--ink-2)}
@media(max-width:700px){.about-sources ul{grid-template-columns:1fr}.about-sources li{min-height:0}.roger-quote{grid-template-columns:1fr;margin-top:80px}.roger-quote img{max-height:420px}.about-maker,.about-sources{margin-top:70px}}
</style>
