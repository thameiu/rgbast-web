<template>
  <Teleport to="body"><Transition name="project-fade">
    <div v-if="conflict" class="project-overlay" @keydown.esc.stop="$emit('close')">
      <section class="project-modal project-modal--dark conflict-modal" role="dialog" aria-modal="true" :aria-label="t('conflicts.title')">
        <button class="project-close" @click="$emit('close')" :aria-label="t('common.cancel')"><AppIcon name="x" :size="18" /></button>
        <h2>{{ t('conflicts.title') }}</h2>
        <p class="conflict-hint">{{ t('conflicts.paletteHint') }}</p>
        <section v-for="version in versions" :key="version" class="conflict-version" :class="{ 'conflict-version--result': version === 'result' }">
          <header class="conflict-version-head">
            <h3>{{ t(`conflicts.${version}`) }}</h3>
            <span v-if="version === 'result'" class="conflict-count" :class="{ invalid: result.length > 15 }">{{ result.length }}/15</span>
            <button v-else class="conflict-keep" @click="chooseAll(version)">{{ t(version === 'mine' ? 'conflicts.allMine' : 'conflicts.allLatest') }}</button>
          </header>
          <template v-if="version === 'result'">
            <div :ref="setResultAreaEl" class="conflict-result-scroll">
              <TransitionGroup tag="div" class="conflict-result-columns" move-class="col-move" :style="{ '--palette-count': Math.max(workingResult.length, 1) }" @enter="enterPaletteColumn" @leave="leavePaletteColumn">
                <ColorColumn v-for="(color, i) in workingResult" :key="color._key" :model-value="color" :col-key="color._key" compact fit hide-accessibility hide-generation-lock
                  :display-settings="hexDisplay" :is-dragging="interactions.draggedIdx.value === i" :drag-style="interactions.getColStyle(i)"
                  @drag-start="event => interactions.onDragStart(i, event)" @update:hex="hex => interactions.updateHex(i, hex)"
                  @update:label="label => interactions.updateLabel(i, label)" @remove="interactions.removeColor(i)" />
              </TransitionGroup>
              <span v-if="!workingResult.length" class="conflict-empty">{{ t('common.noColors') }}</span>
            </div>
            <div class="conflict-result-status">
              <span v-if="unresolved" role="status">{{ t('conflicts.remaining', { count: unresolved }) }}</span>
              <button v-if="focusedRow && focusedRow.mine.length && focusedRow.latest.length" :aria-pressed="focusedRow.choice === 'both'" @click="choose(focusedRow, 'both')">{{ t('conflicts.both') }}</button>
            </div>
            <p v-if="result.length > 15" class="project-error" role="alert">{{ t('conflicts.tooManyColors') }}</p>
          </template>
          <div v-else class="conflict-strip" :style="{ '--palette-count': Math.max(sourceEntries(version).length, 1) }">
            <div v-for="entry in sourceEntries(version)" :key="entry.key" class="conflict-source-entry" :class="{ unresolved: entry.row.choice === null, 'conflict-source-entry--selected': entry.row.choice === version || entry.row.choice === 'both' }"
              role="button" tabindex="0" :title="entry.deleted ? t('conflicts.deleted') : entry.color.label || '#' + entry.color.hex"
              :aria-pressed="entry.row.choice === version || entry.row.choice === 'both'" @click="choose(entry.row, version)"
              @keydown.enter.self.prevent="choose(entry.row, version)" @keydown.space.self.prevent="choose(entry.row, version)">
              <ColorColumn :model-value="{ hex: entry.color.hex, label: entry.color.label ?? null }" :display-settings="hexDisplay" compact fit read-only hide-accessibility hide-generation-lock :deleted="entry.deleted" />
              <span v-if="entry.row.choice === version || entry.row.choice === 'both'" class="conflict-check"><AppIcon name="check" :size="28" /></span>
            </div>
          </div>
        </section>
        <div class="conflict-actions">
          <button @click="$emit('resolve', conflict.mine, true)">{{ t('conflicts.branch') }}</button>
          <button class="project-primary" :disabled="!canSave" @click="$emit('resolve', result, false)">{{ t('common.save') }}</button>
        </div>
      </section>
    </div>
  </Transition></Teleport>
</template>
<script lang="ts">
import type { PaletteColorSave } from '@/api/types'
export interface ConflictState { id: number; branch_id: number | null; palette_colors: PaletteColorSave[] }
export interface PaletteConflict {
  code: 'palette_conflict'; reason: string; base: ConflictState | null; latest: ConflictState | null; mine: PaletteColorSave[]
  mine_changes: ColorMatch[] | null; latest_changes: ColorMatch[] | null
}
interface ColorMatch { old_index: number | null; new_index: number | null; fields: string[] }
</script>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import ColorColumn from '@/components/palette/ColorColumn.vue'
import { usePaletteInteractions } from '@/views/palette/composables/usePaletteInteractions'
import type { WorkingColor } from '@/views/palette/composables/usePaletteContext'
import { enterPaletteColumn, leavePaletteColumn } from '@/utils/paletteColumnTransitions'
import { useI18n } from '@/i18n'
const props = defineProps<{ conflict: PaletteConflict | null }>()
defineEmits<{ close: []; resolve: [colors: PaletteColorSave[], branch: boolean] }>()
const { t } = useI18n()
type Choice = 'mine' | 'latest' | 'both'
const rows = ref<Array<{ base: PaletteColorSave | null; baseIndex: number | null; mine: PaletteColorSave[]; latest: PaletteColorSave[]; choice: Choice | null }>>([])
const wholeChoice = ref<'mine' | 'latest' | null>(null)
const workingResult = ref<WorkingColor[]>([])
let nextColorKey = 0
const mkKey = () => `conflict-${++nextColorKey}`
const hexDisplay = { hex: true, rgb: false, hsl: false, cmyk: false }
const interactions = usePaletteInteractions({ colors: workingResult, mkKey, isOwned: computed(() => true), autoScroll: true }, { captureForUndo: () => {} })
function setResultAreaEl(el: Element | ComponentPublicInstance | null) {
  interactions.colsAreaEl.value = el instanceof HTMLElement ? el : null
}
const versions = ['mine', 'result', 'latest'] as const
const focusedRow = ref<typeof rows.value[number] | null>(null)
const same = (a: PaletteColorSave[], b: PaletteColorSave[]) => JSON.stringify(a) === JSON.stringify(b)
watch(() => props.conflict, c => {
  interactions.cancelDrag()
  if (!c) { rows.value = []; workingResult.value = []; focusedRow.value = null; return }
  wholeChoice.value = null; focusedRow.value = null
  if (!c.base || !c.mine_changes || !c.latest_changes) { rows.value = [{ base: null, baseIndex: null, mine: c.mine, latest: c.latest?.palette_colors ?? [], choice: null }]; return }
  rows.value = c.base.palette_colors.map((base, i) => {
    const m = c.mine_changes!.find(v => v.old_index === i), l = c.latest_changes!.find(v => v.old_index === i)
    const mine = m?.new_index != null ? [c.mine[m.new_index]!] : []
    const latest = l?.new_index != null ? [c.latest!.palette_colors[l.new_index]!] : []
    const choice: Choice | null = same(mine, latest) ? 'latest' : same(mine, [base]) ? 'latest' : same(latest, [base]) ? 'mine' : null
    return { base, baseIndex: i, mine, latest, choice }
  })
  function insertions(changes: ColorMatch[], colors: PaletteColorSave[]) {
    const slots = new Map<number, PaletteColorSave[]>()
    for (const change of changes) {
      if (change.old_index !== null || change.new_index === null) continue
      const next = changes.filter(v => v.new_index !== null && v.new_index > change.new_index! && v.old_index !== null).sort((a,b) => a.new_index! - b.new_index!)[0]
      const slot = next?.old_index ?? c!.base!.palette_colors.length
      slots.set(slot, [...(slots.get(slot) ?? []), colors[change.new_index]!])
    }
    return slots
  }
  const mineSlots = insertions(c.mine_changes, c.mine), latestSlots = insertions(c.latest_changes, c.latest!.palette_colors)
  for (let slot = rows.value.length; slot >= 0; slot--) {
    const mine = mineSlots.get(slot) ?? [], latest = latestSlots.get(slot) ?? []
    if (mine.length || latest.length) rows.value.splice(slot, 0, { base: null, baseIndex: null, mine, latest, choice: mine.length && latest.length && !same(mine, latest) ? null : mine.length ? 'mine' : 'latest' })
  }
}, { immediate: true })
const selectedColors = computed(() => wholeChoice.value === 'mine' ? props.conflict?.mine ?? [] : wholeChoice.value === 'latest' ? props.conflict?.latest?.palette_colors ?? [] : rows.value.flatMap(row => row.choice === 'both' ? [...row.mine, ...row.latest] : row.choice ? row[row.choice] : []))
function syncResult() {
  const available = [...workingResult.value]
  workingResult.value = selectedColors.value.map(color => {
    const index = available.findIndex(previous => previous.hex === color.hex && previous.label === (color.label ?? null))
    const previous = index >= 0 ? available.splice(index, 1)[0] : undefined
    return { ...color, label: color.label ?? null, _key: previous?._key ?? mkKey() }
  })
}
watch(selectedColors, syncResult, { immediate: true, flush: 'sync' })
const result = computed<PaletteColorSave[]>(() => workingResult.value.map(({ hex, label }) => ({ hex, label })))
const unresolved = computed(() => rows.value.filter(row => row.choice === null).length)
const canSave = computed(() => unresolved.value === 0 && result.value.length > 0 && result.value.length <= 15 && !!props.conflict?.latest && !['branch_merged', 'branch_deleted'].includes(props.conflict?.reason ?? ''))
function sourceEntries(side: 'mine' | 'latest') {
  const colors = side === 'mine' ? props.conflict?.mine ?? [] : props.conflict?.latest?.palette_colors ?? []
  const entries: Array<{ key: string; color: PaletteColorSave; deleted: boolean; row: typeof rows.value[number] }> = []
  for (const [index, color] of colors.entries()) {
    const row = rows.value.find(row => row[side].includes(color))
    if (row) entries.push({ key: `${side}-${index}`, color, row, deleted: false })
  }
  // Anchor a deletion after its nearest original predecessor, before new insertions.
  for (const row of rows.value.filter(row => row.base && !row[side].length).sort((a, b) => a.baseIndex! - b.baseIndex!)) {
    const predecessor = entries.filter(entry => entry.row.baseIndex !== null && entry.row.baseIndex < row.baseIndex!).sort((a, b) => b.row.baseIndex! - a.row.baseIndex!)[0]
    const index = predecessor ? entries.indexOf(predecessor) + 1 : 0
    entries.splice(index, 0, { key: `${side}-deleted-${row.baseIndex}`, color: row.base!, row, deleted: true })
  }
  return entries
}
function choose(row: typeof rows.value[number], choice: Choice) { interactions.cancelDrag(); wholeChoice.value = null; row.choice = choice; focusedRow.value = row; syncResult() }
function chooseAll(choice: 'mine' | 'latest') { interactions.cancelDrag(); wholeChoice.value = choice; focusedRow.value = null; rows.value.forEach(row => { row.choice = choice }); syncResult() }
</script>
<style scoped>
.conflict-modal{width:min(1040px,100%);max-width:1040px;padding:28px;border-radius:14px;animation:atelier-modal-pop .2s ease-in-out}
.conflict-modal h2{font:700 32px/1.05 var(--font-display);margin:0 32px 10px 0}
.conflict-hint{font-size:13px;line-height:1.5;color:var(--ink-2);margin-bottom:24px}
.conflict-version{margin-block:20px}
.conflict-version--result{padding:16px;border:1px solid var(--rule);border-radius:10px;background:rgba(255,255,255,.02)}
.conflict-version-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.conflict-version-head h3{font:700 23px/1 var(--font-display);margin:0}
.conflict-version-head .conflict-keep{margin-left:auto;padding:6px 9px;font-size:11px}
.conflict-count{font:11px var(--font-mono);color:var(--ink-2)}.conflict-count.invalid{color:#ffa6ae}
.conflict-strip,.conflict-result-scroll{overflow:auto;border-radius:7px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent}
.conflict-strip,.conflict-result-columns{--column-size:calc(100% / var(--palette-count,1));display:flex;min-height:150px}
.conflict-source-entry{position:relative;flex:0 0 var(--column-size);min-width:0;cursor:pointer}
.conflict-source-entry :deep(.col){width:100%}
.conflict-source-entry.unresolved::after{content:"";position:absolute;inset:0;pointer-events:none;border:2px solid var(--magenta)}
.conflict-source-entry--selected::after{content:"";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 2px #fff;mix-blend-mode:difference;z-index:3}
.conflict-source-entry:focus-visible{outline:2px solid #fff;outline-offset:-4px}
.conflict-check{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;mix-blend-mode:difference;pointer-events:none;z-index:3}
.conflict-result-status{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;color:var(--ink-2);font-size:11px;margin-top:10px}
.conflict-result-status button{padding:5px 8px;font-size:11px}
.conflict-empty{align-self:center;padding:16px;color:var(--ink-3);font-size:13px}
.conflict-actions{display:flex;justify-content:space-between;gap:12px;margin-top:24px;padding-top:18px;border-top:1px solid var(--rule)}
@media(min-width:769px){.conflict-modal{width:90vw;max-width:90vw}.conflict-strip,.conflict-result-scroll{overflow-x:clip}.conflict-source-entry{overflow:hidden}}
@media(max-width:768px){.conflict-strip,.conflict-result-columns{flex-direction:column;min-height:100px}.conflict-strip,.conflict-result-scroll{max-height:300px}.conflict-source-entry{flex:none}.conflict-modal{padding:20px}.conflict-version--result{padding:10px}.conflict-actions{flex-direction:column}.conflict-version-head .conflict-keep{max-width:55%}.conflict-hint{margin-bottom:16px}}
</style>
