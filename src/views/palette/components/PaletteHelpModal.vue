<template>
  <Teleport to="body">
    <div v-if="open" class="help-modal-overlay" @click.self="$emit('close')">
      <div class="help-modal">
        <div class="help-modal-top">
          <h3 class="help-modal-title font-display">{{ mode === 'generation' ? 'Generation Guide' : 'Shortcut Cheat Sheet' }}</h3>
          <button class="help-close-btn" @click="$emit('close')">x</button>
        </div>

        <div v-if="mode === 'generation'" class="help-modal-body">
          <p class="help-paragraph">
            Palette generation samples hue positions using the selected harmony, then adjusts saturation/value and contrast to produce balanced sets.
            Base colors are always prioritized first and the remaining slots are built around them.
          </p>

          <div class="help-illustration-grid">
            <article class="help-ill-card">
              <div class="help-ill-title">Random</div>
              <div class="help-swatches">
                <span style="--c:#C537FF"></span>
                <span style="--c:#3BD8FF"></span>
                <span style="--c:#FFD447"></span>
                <span style="--c:#4AE36D"></span>
              </div>
            </article>
            <article class="help-ill-card">
              <div class="help-ill-title">Analogous</div>
              <div class="help-swatches">
                <span style="--c:#7E3DFF"></span>
                <span style="--c:#9653FF"></span>
                <span style="--c:#AF6EFF"></span>
                <span style="--c:#C688FF"></span>
              </div>
            </article>
            <article class="help-ill-card">
              <div class="help-ill-title">Complementary</div>
              <div class="help-swatches">
                <span style="--c:#2E76FF"></span>
                <span style="--c:#FF9D2E"></span>
                <span style="--c:#72A5FF"></span>
                <span style="--c:#FFC272"></span>
              </div>
            </article>
            <article class="help-ill-card">
              <div class="help-ill-title">Triadic</div>
              <div class="help-swatches">
                <span style="--c:#FF4F7D"></span>
                <span style="--c:#5AC86A"></span>
                <span style="--c:#5B8DFF"></span>
                <span style="--c:#FFD45C"></span>
              </div>
            </article>
            <article class="help-ill-card">
              <div class="help-ill-title">Split Complementary</div>
              <div class="help-swatches">
                <span style="--c:#4665FF"></span>
                <span style="--c:#FF6C58"></span>
                <span style="--c:#FFB34D"></span>
                <span style="--c:#90A2FF"></span>
              </div>
            </article>
            <article class="help-ill-card">
              <div class="help-ill-title">Tetradic / Shades</div>
              <div class="help-swatches">
                <span style="--c:#5EE4DA"></span>
                <span style="--c:#F6C343"></span>
                <span style="--c:#B061FF"></span>
                <span style="--c:#F47B8D"></span>
              </div>
            </article>
          </div>

          <ul class="help-bullets">
            <li><strong>Contrast:</strong> higher values increase luminance distance between outputs.</li>
            <li><strong>Base colors:</strong> 1-3 seed colors used as anchors for generated results.</li>
          </ul>
        </div>

        <div v-else class="help-modal-body">
          <ul class="shortcut-list">
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Z</kbd></span><span>Undo last palette change</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Y</kbd><span class="shortcut-sep">/</span><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Shift</kbd><span class="shortcut-plus">+</span><kbd>Z</kbd></span><span>Redo</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>S</kbd></span><span>Save snapshot</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Shift</kbd><span class="shortcut-plus">+</span><kbd>S</kbd></span><span>Edit palette</span></li>
            <li><span class="shortcut-keys"><kbd>Space</kbd></span><span>Generate palette instantly</span></li>
            <li><span class="shortcut-keys"><kbd>Alt</kbd><span class="shortcut-plus">+</span><kbd>Space</kbd></span><span>Open generation settings</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>I</kbd></span><span>Extract palette from image</span></li>
            <li><span class="shortcut-keys"><kbd>S</kbd></span><span>Open share/export modal</span></li>
            <li><span class="shortcut-keys"><kbd>D</kbd></span><span>Toggle display settings panel</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>C</kbd></span><span>Copy all palette colors</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>V</kbd></span><span>Paste colors and add to palette</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Shift</kbd><span class="shortcut-plus">+</span><kbd>V</kbd></span><span>Paste colors and replace palette</span></li>
            <li><span class="shortcut-keys"><kbd>Delete</kbd></span><span>Delete last color</span></li>
            <li><span class="shortcut-keys"><kbd>Shift</kbd><span class="shortcut-plus">+</span><kbd>Delete</kbd></span><span>Delete first color</span></li>
            <li><span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Delete</kbd></span><span>Open delete palette modal</span></li>
            <li><span class="shortcut-keys"><kbd>←</kbd><span class="shortcut-sep">/</span><kbd>→</kbd></span><span>Toggle history sidebar</span></li>
            <li><span class="shortcut-keys"><kbd>H</kbd></span><span>Open this cheat sheet</span></li>
          </ul>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  mode: 'generation' | 'cheatsheet'
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'openHistory'): void
}>()
</script>

<style scoped src="./PaletteHelpModal.css"></style>
