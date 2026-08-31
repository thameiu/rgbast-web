<template>
  <Teleport to="body">
    <div v-if="open" class="help-modal-overlay" @click.self="$emit('close')">
      <div class="help-modal">
        <div class="help-modal-top">
          <h3 class="help-modal-title font-display">{{ mode === 'generation' ? t('paletteHelp.generationTitle') : t('paletteHelp.cheatSheetTitle') }}</h3>
          <button class="help-close-btn" type="button" :aria-label="t('header.close')" @click="$emit('close')">
            <AppIcon name="x" :size="16" />
          </button>
        </div>

        <div v-if="mode === 'generation'" class="help-modal-body">
          <p class="help-paragraph">
            {{ t('paletteHelp.generationIntro') }}
          </p>

          <div class="help-illustration-grid">
            <article class="help-ill-card">
              <div class="help-ill-title">{{ t('palette.harmonies.analogous') }}</div>
              <div class="help-swatches">
                <span style="--c:#7E3DFF"></span>
                <span style="--c:#9653FF"></span>
                <span style="--c:#AF6EFF"></span>
                <span style="--c:#C688FF"></span>
              </div>
            </article>
            <article class="help-ill-card">
              <div class="help-ill-title">{{ t('palette.harmonies.complementary') }}</div>
              <div class="help-swatches">
                <span style="--c:#2E76FF"></span>
                <span style="--c:#FF9D2E"></span>
                <span style="--c:#72A5FF"></span>
                <span style="--c:#FFC272"></span>
              </div>
            </article>
            <article class="help-ill-card">
              <div class="help-ill-title">{{ t('palette.harmonies.triadic') }}</div>
              <div class="help-swatches">
                <span style="--c:#FF4F7D"></span>
                <span style="--c:#5AC86A"></span>
                <span style="--c:#5B8DFF"></span>
                <span style="--c:#FFD45C"></span>
              </div>
            </article>
            <article class="help-ill-card">
              <div class="help-ill-title">{{ t('palette.harmonies.split') }}</div>
              <div class="help-swatches">
                <span style="--c:#4665FF"></span>
                <span style="--c:#FF6C58"></span>
                <span style="--c:#FFB34D"></span>
                <span style="--c:#90A2FF"></span>
              </div>
            </article>
            <article class="help-ill-card">
              <div class="help-ill-title">{{ t('paletteHelp.tetradicShades') }}</div>
              <div class="help-swatches">
                <span style="--c:#5EE4DA"></span>
                <span style="--c:#F6C343"></span>
                <span style="--c:#B061FF"></span>
                <span style="--c:#F47B8D"></span>
              </div>
            </article>
          </div>

          <ul class="help-bullets">
            <li><strong>{{ t('paletteHelp.baseColorsTitle') }}</strong> {{ t('paletteHelp.baseColorsBody') }}</li>
          </ul>
        </div>

        <div v-else class="help-modal-body">
          <ul class="shortcut-list">
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Z</kbd></span><span>{{ t('paletteHelp.shortcuts.undo') }}</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Y</kbd><span class="shortcut-sep">/</span><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Shift</kbd><span class="shortcut-plus">+</span><kbd>Z</kbd></span><span>{{ t('paletteHelp.shortcuts.redo') }}</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>S</kbd></span><span>{{ t('paletteHelp.shortcuts.save') }}</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Shift</kbd><span class="shortcut-plus">+</span><kbd>S</kbd></span><span>{{ t('paletteHelp.shortcuts.edit') }}</span></li>
            <li><span class="shortcut-keys"><kbd>{{ t('paletteHelp.keys.space') }}</kbd></span><span>{{ t('paletteHelp.shortcuts.generate') }}</span></li>
            <li><span class="shortcut-keys"><kbd>Alt</kbd><span class="shortcut-plus">+</span><kbd>{{ t('paletteHelp.keys.space') }}</kbd></span><span>{{ t('paletteHelp.shortcuts.generationSettings') }}</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>I</kbd></span><span>{{ t('paletteHelp.shortcuts.image') }}</span></li>
            <li><span class="shortcut-keys"><kbd>S</kbd></span><span>{{ t('paletteHelp.shortcuts.share') }}</span></li>
            <li><span class="shortcut-keys"><kbd>A</kbd></span><span>{{ t('paletteHelp.shortcuts.accessibility') }}</span></li>
            <li><span class="shortcut-keys"><kbd>D</kbd></span><span>{{ t('paletteHelp.shortcuts.display') }}</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>C</kbd></span><span>{{ t('paletteHelp.shortcuts.copy') }}</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>V</kbd></span><span>{{ t('paletteHelp.shortcuts.pasteAdd') }}</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Shift</kbd><span class="shortcut-plus">+</span><kbd>V</kbd></span><span>{{ t('paletteHelp.shortcuts.pasteReplace') }}</span></li>
            <li><span class="shortcut-keys"><kbd>{{ t('paletteHelp.keys.delete') }}</kbd></span><span>{{ t('paletteHelp.shortcuts.deleteLast') }}</span></li>
            <li><span class="shortcut-keys"><kbd>Shift</kbd><span class="shortcut-plus">+</span><kbd>{{ t('paletteHelp.keys.delete') }}</kbd></span><span>{{ t('paletteHelp.shortcuts.deleteFirst') }}</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>{{ t('paletteHelp.keys.delete') }}</kbd></span><span>{{ t('paletteHelp.shortcuts.deletePalette') }}</span></li>
            <li><span class="shortcut-keys"><kbd>←</kbd><span class="shortcut-sep">/</span><kbd>→</kbd></span><span>{{ t('paletteHelp.shortcuts.history') }}</span></li>
            <li><span class="shortcut-keys"><kbd>H</kbd></span><span>{{ t('paletteHelp.shortcuts.cheatSheet') }}</span></li>
          </ul>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue'
import { useI18n } from '@/i18n'

defineProps<{
  open: boolean
  mode: 'generation' | 'cheatsheet'
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'openHistory'): void
}>()

const { t } = useI18n()
</script>

<style scoped src="./PaletteHelpModal.css"></style>
