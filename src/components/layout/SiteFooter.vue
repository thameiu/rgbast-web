<template>
  <footer class="site-footer">
    <RouterLink to="/" class="footer-brand"><span class="footer-logo-hit" @mouseenter="setFast(true)" @mouseleave="setFast(false)" @pointerdown="setFast(true)" @pointerup="setFast(false)" @pointercancel="setFast(false)"><span ref="logo" class="footer-logo"><RgbastLogo size="100%" /></span></span><span><span v-for="(letter,i) in 'RGBAST'" :key="i" :style="{color: colors[i]}">{{ letter }}</span></span></RouterLink>
    <div class="footer-links"><RouterLink to="/about">{{ t('about.title') }}</RouterLink>
      <div class="language-menu" ref="menu"><button :aria-expanded="open" @click="open=!open">{{ locale === 'fr' ? 'Français' : 'English' }} <AppIcon name="chevron-down" :size="12" /></button>
        <div v-if="open" class="language-options"><button v-for="language in languages" :key="language.code" @click="setLocale(language.code);open=false">{{ language.label }}</button></div>
      </div>
    </div>
  </footer>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import RgbastLogo from '../ui/RgbastLogo.vue'
import AppIcon from '../icons/AppIcon.vue'
import gsap from 'gsap'
import { useI18n } from '@/i18n'
const { t, locale, setLocale } = useI18n()
const logo=ref<HTMLElement|null>(null)
let rotation:gsap.core.Tween|undefined
function setFast(fast:boolean){if(rotation)gsap.to(rotation,{timeScale:fast?16:1,duration:.8,ease:'power2.inOut',overwrite:true})}
onMounted(()=>{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)rotation=gsap.to(logo.value,{rotation:360,duration:24,repeat:-1,ease:'none'}).timeScale(1)})
onBeforeUnmount(()=>{if(rotation){gsap.killTweensOf(rotation);rotation.kill()}})
const colors=['#B410CC','#D56A88','#F6C343','#82C58C','#0EC6D4','#616BD0']
const languages=[{code:'fr',label:'Français'},{code:'en',label:'English'}] as const
const open=ref(false), menu=ref<HTMLElement|null>(null)
function close(e:PointerEvent){if(!menu.value?.contains(e.target as Node))open.value=false}
function escape(e:KeyboardEvent){if(e.key==='Escape')open.value=false}
onMounted(()=>{document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape)})
onBeforeUnmount(()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape)})
</script>
<style scoped>
.site-footer{position:relative;padding:42px clamp(24px,5vw,80px);background:#f5f5f3;color:#0e0e10;border-top:1px solid #ddd;display:flex;flex-direction:column;gap:18px}
.footer-brand{display:flex;gap:12px;align-items:center;font-family:var(--font-display);font-size:38px;text-decoration:none;width:fit-content}
.footer-logo{display:flex}
.footer-links{display:flex;gap:24px;align-items:center}.footer-links a{color:inherit}.language-menu{position:relative}button{display:flex;align-items:center;gap:12px;cursor:pointer;border:0;background:none;color:inherit;padding:8px;font:inherit}.language-options{position:absolute;bottom:100%;left:0;min-width:140px;background:#fff;border:1px solid #ddd;border-radius:8px;padding:6px;z-index:250}.language-options button{width:100%}.language-options button:hover{background:#eee}@keyframes rotate{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.footer-logo{animation:none}}
.site-footer{align-items:center;text-align:center;padding:60px 20px}.footer-brand{font-size:clamp(32px,8vw,110px);font-weight:900;line-height:1;gap:clamp(6px,1.5vw,20px)}.footer-links{justify-content:center}
.footer-logo-hit{display:grid;place-items:center;width:clamp(40px,7vw,102px);aspect-ratio:1;flex:none}.footer-logo{width:100%;height:100%;display:grid;place-items:center;transform-origin:50% 50%}.footer-logo :deep(svg){display:block;transform:translateY(-5.88%)}
.site-footer{background:rgba(233,233,233,.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
.site-footer{border-top:1px solid rgba(14,14,16,.35)}
</style>
