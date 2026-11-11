<template>
  <div class="vision-grid" :class="{'vision-grid--dark': dark}">
    <div v-for="entry in entries" :key="entry.name">
      <div class="derived-swatch vision-swatch" :class="{'vision-swatch--active': activeHex === entry.hex}" :style="{background:'#'+entry.hex}" @click="activeHex=activeHex===entry.hex?'':entry.hex">
        <div class="derived-swatch-actions">
          <RouterLink class="derived-action-btn" :to="'/color/'+entry.hex" :style="{color:textColor(entry.hex)}" :aria-label="'#'+entry.hex"><AppIcon name="external-link" :size="14" /></RouterLink>
          <button class="derived-action-btn" :style="{color:textColor(entry.hex)}" :title="t('colorPage.copyHex')" @click.stop="copy(entry.hex)"><AppIcon :name="copied===entry.hex?'check':'copy'" :size="14" /></button>
        </div>
        <span class="derived-inline-hex" :style="{color:textColor(entry.hex)}">#{{ entry.hex.toUpperCase() }}</span>
      </div>
      <span class="vision-label">{{ entry.name }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import {ref,onBeforeUnmount} from 'vue'
import {RouterLink} from 'vue-router'
import AppIcon from '@/components/icons/AppIcon.vue'
import {useI18n} from '@/i18n'
withDefaults(defineProps<{entries:Array<{name:string;hex:string}>;dark?:boolean}>(),{dark:false})
const {t}=useI18n(),copied=ref(''),activeHex=ref('')
let timer:ReturnType<typeof setTimeout>|undefined
function textColor(hex:string){const h=hex.replace('#','');const [r,g,b]=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));return (.299*r!+.587*g!+.114*b!)/255>.5?'rgba(0,0,0,.78)':'rgba(255,255,255,.92)'}
async function copy(hex:string){try{await navigator.clipboard.writeText('#'+hex.toUpperCase());copied.value=hex;clearTimeout(timer);timer=setTimeout(()=>copied.value='',1400)}catch{copied.value=''}}
onBeforeUnmount(()=>clearTimeout(timer))
</script>
<style src="./DerivedColorSwatches.css"></style>
