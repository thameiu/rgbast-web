<template>
  <div class="hg-wrap">
    <!-- Branch filter pill -->
    <div v-if="activeBranchId !== null" class="branch-filter-bar">
      <span class="filter-label">Branch: <strong>{{ activeBranchTitle }}</strong></span>
      <div class="filter-actions">
        <button
          v-if="!activeBranchIsMerged"
          class="filter-delete"
          title="Delete branch (Del)"
          @click="emit('deleteBranch', activeBranchId!)"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 3h9M4.5 3V1.5h3V3M3.5 3l.5 7.5M6 3v7.5M8.5 3l-.5 7.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="filter-clear" @click="activeBranchId = null">× clear</button>
      </div>
    </div>

    <div class="hg-inner" :style="{ minHeight: totalHeight + 'px' }">
      <!-- SVG graph lines and dots -->
      <svg
        class="hg-svg"
        :width="svgWidth"
        :height="totalHeight"
        :style="{ minWidth: svgWidth + 'px' }"
      >
        <!-- Visible lines -->
        <path
          v-for="(line, i) in lines"
          :key="'l' + i"
          :d="line.d"
          :stroke="line.color"
          :stroke-width="line.branchId !== null && (hoveredBranchId === line.branchId || activeBranchId === line.branchId) ? 3.5 : 1.8"
          :opacity="line.branchId !== null && (hoveredBranchId === line.branchId || activeBranchId === line.branchId) ? 1 : 0.75"
          fill="none"
          stroke-linecap="round"
          style="transition: stroke-width 0.15s, opacity 0.15s"
        />
        <!-- Invisible wider hit areas for branch lines -->
        <path
          v-for="(line, i) in lines.filter(l => l.branchId !== null)"
          :key="'hit' + i"
          :d="line.d"
          stroke="transparent"
          stroke-width="18"
          fill="none"
          stroke-linecap="round"
          style="cursor: pointer"
          @mouseenter="hoveredBranchId = line.branchId"
          @mouseleave="hoveredBranchId = null"
          @click.stop="onClickBranchLine(line.branchId!)"
        />
        <!-- Commit dots -->
        <circle
          v-for="node in displayNodes"
          :key="'d' + node.id"
          :cx="laneX(node.lane)"
          :cy="rowY(node.rowIndex)"
          :r="DOT_R"
          :fill="getLaneColor(node.lane)"
          :stroke="node.isMerge ? 'rgba(255,255,255,0.6)' : getLaneColor(node.lane)"
          :stroke-width="node.isMerge ? 2 : 0"
        />
      </svg>

      <!-- Commit info panels -->
      <div
        v-for="node in displayNodes"
        :key="'info' + node.id"
        class="commit-info"
        :class="{
          selected: node.id === selectedId,
          dimmed: activeBranchId !== null && node.lane !== 0 && node.branchId !== activeBranchId,
          'branch-hovered': hoveredBranchId !== null && node.branchId === hoveredBranchId,
        }"
        :style="{ top: (node.rowIndex * ROW_H) + 'px', left: svgWidth + 'px' }"
        @click="$emit('selectSnapshot', node.id)"
      >
        <div class="commit-top">
          <div class="cubes-row">
            <ColorCube
              v-for="(col, ci) in node.palette_colors.slice(0, 8)"
              :key="ci"
              :hex="col.hex"
              :size="16"
            />
            <span v-if="node.palette_colors.length > 8" class="more-cubes">
              +{{ node.palette_colors.length - 8 }}
            </span>
          </div>
          <span v-if="node.isMerge" class="badge merge-badge">merge</span>
          <span
            v-else-if="node.branchTitle"
            class="badge branch-badge"
            :style="{ borderColor: getLaneColor(node.lane), color: getLaneColor(node.lane) }"
          >{{ node.branchTitle }}</span>
        </div>
        <p class="commit-msg">{{ node.comment || 'Initial palette creation' }}</p>
        <time class="commit-time">{{ fmtDate(node.created_at) }}</time>

        <!-- Change indicator: top-right corner -->
        <div class="change-corner">
          <span class="change-summary" v-if="hasChanges(node)">
            <span v-if="node.colors_added   > 0" class="cs-add">+{{ node.colors_added }}</span>
            <span v-if="node.colors_deleted > 0" class="cs-del">-{{ node.colors_deleted }}</span>
            <span v-if="node.colors_modified > 0" class="cs-mod">~{{ node.colors_modified }}</span>
          </span>
          <span class="change-badge" :class="changeDotClass(node)" :title="changeDotLabel(node)"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import type { PaletteHistoryGraphResponse, PaletteCommitResponse } from '@/api/types'
import { getLaneColor } from '@/utils/branchColors'
import ColorCube from './ColorCube.vue'

const props = defineProps<{
  history: PaletteHistoryGraphResponse
  selectedId?: number | null
}>()

const emit = defineEmits<{
  selectSnapshot: [id: number]
  selectBranch: [id: number]
  deleteBranch: [id: number]
}>()

const ROW_H  = 80
const LANE_W = 28
const PAD    = 18
const DOT_R  = 6

function laneX(lane: number) { return PAD + lane * LANE_W }
function rowY(row: number)   { return row * ROW_H + ROW_H / 2 }

// Branch interaction state
const activeBranchId  = ref<number | null>(null)
const hoveredBranchId = ref<number | null>(null)

const activeBranchTitle = computed(() => {
  if (activeBranchId.value === null) return ''
  return props.history.branches.find(b => b.id === activeBranchId.value)?.title ?? ''
})

const activeBranchIsMerged = computed(() => {
  if (activeBranchId.value === null) return false
  return props.history.branches.find(b => b.id === activeBranchId.value)?.is_merged ?? false
})

// Clear active branch if it no longer exists (e.g. after deletion)
watch(() => props.history, () => {
  if (activeBranchId.value !== null) {
    const exists = props.history.branches.some(b => b.id === activeBranchId.value)
    if (!exists) activeBranchId.value = null
  }
})

// Delete key shortcut when a deletable branch is selected
function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Delete' && e.key !== 'Backspace') return
  if (activeBranchId.value === null || activeBranchIsMerged.value) return
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  e.preventDefault()
  emit('deleteBranch', activeBranchId.value)
}
onMounted(() => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => document.removeEventListener('keydown', onKeyDown))

function onClickBranchLine(branchId: number) {
  if (activeBranchId.value === branchId) {
    activeBranchId.value = null
  } else {
    activeBranchId.value = branchId
    emit('selectBranch', branchId)
  }
}

interface CommitNode extends PaletteCommitResponse {
  lane: number
  rowIndex: number
  isMerge: boolean
  branchTitle?: string
  branchId: number | null
}

const nodes = computed<CommitNode[]>(() => {
  const all: CommitNode[] = []

  props.history.main.forEach(c => {
    all.push({
      ...c,
      lane: 0,
      rowIndex: -1,
      isMerge: (c.comment ?? '').startsWith('Merge branch'),
      branchId: null,
    })
  })

  props.history.branches.forEach((branch, bi) => {
    branch.snapshots.forEach(c => {
      all.push({
        ...c,
        lane: bi + 1,
        rowIndex: -1,
        isMerge: false,
        branchTitle: branch.title,
        branchId: branch.id,
      })
    })
  })

  all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  all.forEach((n, i) => { n.rowIndex = i })
  return all
})

// Always show all nodes; active branch is highlighted, others dimmed
const displayNodes = computed<CommitNode[]>(() => nodes.value)

const nodeById = computed(() => {
  const m = new Map<number, CommitNode>()
  nodes.value.forEach(n => m.set(n.id, n))
  return m
})

const branchFirstIds = computed(() => {
  const s = new Set<number>()
  props.history.branches.forEach(branch => {
    const oldest = branch.snapshots[branch.snapshots.length - 1]
    if (oldest) s.add(oldest.id)
  })
  return s
})

const maxLane     = computed(() => Math.max(0, ...nodes.value.map(n => n.lane)))
const svgWidth    = computed(() => PAD + (maxLane.value + 1) * LANE_W + PAD)
const totalHeight = computed(() => Math.max(1, displayNodes.value.length) * ROW_H)

interface Line { d: string; color: string; branchId: number | null }

const lines = computed<Line[]>(() => {
  const result: Line[] = []

  for (const node of nodes.value) {
    if (node.parent_snapshot_id == null) continue
    const parent = nodeById.value.get(node.parent_snapshot_id)
    if (!parent) continue

    let visualParent = parent
    if (branchFirstIds.value.has(node.id) && parent.lane !== 0) {
      const nearestMain = nodes.value
        .filter(n => n.lane === 0 && n.rowIndex > node.rowIndex)
        .sort((a, b) => a.rowIndex - b.rowIndex)[0]
      if (nearestMain) visualParent = nearestMain
    }

    const x1 = laneX(node.lane)
    const y1 = rowY(node.rowIndex)
    const x2 = laneX(visualParent.lane)
    const y2 = rowY(visualParent.rowIndex)
    const color = getLaneColor(node.lane)

    let d: string
    if (node.lane === visualParent.lane) {
      d = `M ${x1} ${y1} L ${x2} ${y2}`
    } else {
      const dy = y2 - y1
      d = `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.6}, ${x2} ${y2 - dy * 0.6}, ${x2} ${y2}`
    }
    result.push({ d, color, branchId: node.branchId })
  }

  // Merge convergence lines
  props.history.branches.forEach((branch, bi) => {
    if (!branch.is_merged || branch.snapshots.length === 0) return
    const tip = branch.snapshots[0]
    if (!tip) return
    const branchTip   = nodeById.value.get(tip.id)
    const mergeCommit = nodes.value.find(
      n => n.lane === 0 && (n.comment ?? '') === `Merge branch '${branch.title}'`
    )
    if (!branchTip || !mergeCommit) return

    const x1 = laneX(mergeCommit.lane)
    const y1 = rowY(mergeCommit.rowIndex)
    const x2 = laneX(branchTip.lane)
    const y2 = rowY(branchTip.rowIndex)
    const dy = y2 - y1
    result.push({
      d: `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.6}, ${x2} ${y2 - dy * 0.6}, ${x2} ${y2}`,
      color: getLaneColor(bi + 1),
      branchId: branch.id,
    })
  })

  return result
})

function hasChanges(node: CommitNode) {
  return node.colors_added > 0 || node.colors_deleted > 0 || node.colors_modified > 0
}

function changeDotClass(node: CommitNode) {
  if (!hasChanges(node)) return 'dot-init'
  if (node.colors_modified > 0 || (node.colors_added > 0 && node.colors_deleted > 0))
    return 'dot-edit'
  if (node.colors_added > 0) return 'dot-add'
  return 'dot-del'
}

function changeDotLabel(node: CommitNode) {
  const parts = []
  if (node.colors_added   > 0) parts.push(`+${node.colors_added}`)
  if (node.colors_deleted > 0) parts.push(`-${node.colors_deleted}`)
  if (node.colors_modified > 0) parts.push(`~${node.colors_modified}`)
  return parts.join(' ') || 'initial'
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const mins = (Date.now() - d.getTime()) / 60000
  if (mins < 1)    return 'just now'
  if (mins < 60)   return `${Math.floor(mins)}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  if (mins < 10080) return `${Math.floor(mins / 1440)}d ago`
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.hg-wrap {
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
  display: flex;
  flex-direction: column;
}

/* Branch filter bar */
.branch-filter-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  background: rgba(255,255,255,0.04);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  font-size: 11px;
  color: rgba(255,255,255,0.5);
}
.branch-filter-bar strong { color: rgba(255,255,255,0.85); }
.filter-actions { display: flex; align-items: center; gap: 6px; }
.filter-delete {
  background: transparent;
  border: 1px solid rgba(255,80,80,0.2);
  border-radius: 5px;
  color: rgba(255,100,100,0.55);
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px;
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s, background 0.12s;
}
.filter-delete:hover { color: rgba(255,120,120,0.9); border-color: rgba(255,80,80,0.5); background: rgba(255,80,80,0.08); }
.filter-clear {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 5px;
  color: rgba(255,255,255,0.45);
  font-size: 10px;
  padding: 2px 7px;
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s;
}
.filter-clear:hover { color: rgba(255,255,255,0.8); border-color: rgba(255,255,255,0.3); }

.hg-inner { position: relative; }
.hg-svg   { position: absolute; top: 0; left: 0; }

.commit-info {
  position: absolute; right: 0; height: 80px;
  display: flex; flex-direction: column; justify-content: center; gap: 3px;
  padding: 0 80px 0 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.12s, opacity 0.15s;
}
.commit-info:hover { background: rgba(255,255,255,0.04); }
.commit-info.selected { background: rgba(180,16,204,0.12); box-shadow: inset 0 0 0 1px rgba(180,16,204,0.3); }
.commit-info.dimmed { opacity: 0.25; }
.commit-info.branch-hovered { background: rgba(255,255,255,0.035); }

.commit-top {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}

/* Change indicator — top-right of each commit row */
.change-corner {
  position: absolute;
  top: 10px; right: 12px;
  display: flex; align-items: center; gap: 5px;
}
.change-summary {
  display: flex; gap: 4px;
  font-family: var(--font-mono, monospace);
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em;
}
.cs-add  { color: #2faa45; }
.cs-del  { color: #e04444; }
.cs-mod  { color: #4d96ff; }

.change-badge {
  width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0;
}
.dot-init { background: rgba(255,255,255,0.18); }
.dot-add  { background: #2faa45; box-shadow: 0 0 0 2px rgba(47,170,69,0.25); }
.dot-del  {
  background: #e04444;
  box-shadow: 0 0 0 2px rgba(224,68,68,0.25);
  position: relative; overflow: hidden;
}
.dot-del::after {
  content: '';
  position: absolute; inset: -1px;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(255,255,255,0.75) 40%, rgba(255,255,255,0.75) 60%,
    transparent 60%
  );
}
.dot-edit { background: #4d96ff; box-shadow: 0 0 0 2px rgba(77,150,255,0.25); }

.cubes-row { display: flex; align-items: center; gap: 3px; flex-wrap: wrap; }
.more-cubes { font-size: 10px; color: rgba(255,255,255,0.4); }

.badge {
  font-size: 9px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; padding: 2px 6px; border-radius: 4px; border: 1px solid;
}
.merge-badge  { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.45); }
.branch-badge { border-color: currentColor; }

.commit-msg  { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
.commit-time { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 0.03em; }
</style>
