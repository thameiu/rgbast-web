<template>
  <div class="hg-wrap">
    <div class="hg-inner" :style="{ height: totalHeight + 'px' }">
      <!-- SVG graph lines and dots -->
      <svg
        class="hg-svg"
        :width="svgWidth"
        :height="totalHeight"
        :style="{ minWidth: svgWidth + 'px' }"
      >
        <path
          v-for="(line, i) in lines"
          :key="'l' + i"
          :d="line.d"
          :stroke="line.color"
          stroke-width="1.8"
          fill="none"
          stroke-linecap="round"
          opacity="0.75"
        />
        <circle
          v-for="node in nodes"
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
        v-for="node in nodes"
        :key="'info' + node.id"
        class="commit-info"
        :class="{ selected: node.id === selectedId }"
        :style="{ top: (node.rowIndex * ROW_H) + 'px', left: svgWidth + 'px' }"
        @click="$emit('selectSnapshot', node.id)"
      >
        <div class="commit-top">
          <span
            class="change-dot"
            :class="changeDotClass(node)"
            :title="changeDotLabel(node)"
          ></span>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Git-style history graph. Renders lane lines and commit dots in SVG,
 *  with commit info panels (color cubes, message, date) positioned alongside.
 *  All branches visually diverge from the main lane regardless of true parent chain. */
import { computed } from 'vue'
import type { PaletteHistoryGraphResponse, PaletteCommitResponse } from '@/api/types'
import { getLaneColor } from '@/utils/branchColors'
import ColorCube from './ColorCube.vue'

const props = defineProps<{
  history: PaletteHistoryGraphResponse
  selectedId?: number | null
}>()

const emit = defineEmits<{ selectSnapshot: [id: number] }>()

const ROW_H  = 80
const LANE_W = 28
const PAD    = 18
const DOT_R  = 6

function laneX(lane: number) { return PAD + lane * LANE_W }
function rowY(row: number)   { return row * ROW_H + ROW_H / 2 }

interface CommitNode extends PaletteCommitResponse {
  lane: number
  rowIndex: number
  isMerge: boolean
  branchTitle?: string
}

const nodes = computed<CommitNode[]>(() => {
  const all: CommitNode[] = []

  props.history.main.forEach(c => {
    all.push({
      ...c,
      lane: 0,
      rowIndex: -1,
      isMerge: (c.comment ?? '').startsWith('Merge branch'),
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
      })
    })
  })

  all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  all.forEach((n, i) => { n.rowIndex = i })
  return all
})

const nodeById = computed(() => {
  const m = new Map<number, CommitNode>()
  nodes.value.forEach(n => m.set(n.id, n))
  return m
})

// IDs that are the chronologically FIRST commit of each branch (the fork point)
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
const totalHeight = computed(() => Math.max(1, nodes.value.length) * ROW_H)

interface Line { d: string; color: string }

const lines = computed<Line[]>(() => {
  const result: Line[] = []

  for (const node of nodes.value) {
    if (node.parent_snapshot_id == null) continue
    const parent = nodeById.value.get(node.parent_snapshot_id)
    if (!parent) continue

    // If this is a branch's fork commit and its parent is NOT on main,
    // visually connect it to the nearest main commit instead so all
    // branches appear to diverge from the main lane.
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
    result.push({ d, color })
  }

  // Merge convergence: from merge commit → branch tip
  props.history.branches.forEach((branch, bi) => {
    if (!branch.is_merged || branch.snapshots.length === 0) return
    const tip = branch.snapshots[0]
    if (!tip) return
    const branchTip  = nodeById.value.get(tip.id)
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
    })
  })

  return result
})

function changeDotClass(node: CommitNode) {
  if (node.colors_added === 0 && node.colors_deleted === 0 && node.colors_modified === 0)
    return 'dot-init'
  if (node.colors_modified > 0 || (node.colors_added > 0 && node.colors_deleted > 0))
    return 'dot-edit'
  if (node.colors_added > 0)   return 'dot-add'
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
}
.hg-inner { position: relative; }
.hg-svg   { position: absolute; top: 0; left: 0; }

.commit-info {
  position: absolute; right: 0; height: 80px;
  display: flex; flex-direction: column; justify-content: center; gap: 3px;
  padding: 0 16px 0 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.12s;
}
.commit-info:hover { background: rgba(255,255,255,0.04); }
.commit-info.selected { background: rgba(180,16,204,0.12); box-shadow: inset 0 0 0 1px rgba(180,16,204,0.3); }

.commit-top {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}

.change-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.dot-init { background: rgba(255,255,255,0.2); }
.dot-add  { background: #2faa45; box-shadow: 0 0 0 2px rgba(47,170,69,0.25); }
.dot-del  { background: #e04444; box-shadow: 0 0 0 2px rgba(224,68,68,0.25); }
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
