<template>
  <div class="hg-wrap">
    <!-- Branch filter pill -->
    <div v-if="activeBranchId !== null" class="branch-filter-bar">
      <span class="filter-label">Branch: <strong>{{ activeBranchTitle }}</strong></span>
      <div class="filter-actions">
        <button
          v-if="activeBranchId !== 0 && !activeBranchIsMerged"
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
          v-for="node in nodes"
          :key="'d' + node.id"
          :cx="laneX(node.lane)"
          :cy="nodeCenterY(node)"
          :r="DOT_R"
          :fill="getLaneColor(node.lane)"
          :stroke="node.isMerge ? 'rgba(255,255,255,0.6)' : getLaneColor(node.lane)"
          :stroke-width="node.isMerge ? 2 : 0"
        />
      </svg>

      <!-- Commit info panels -->
      <div
        v-for="node in visibleInfoNodes"
        :key="'info' + node.id"
        class="commit-info"
        :class="{
          selected: node.id === selectedId,
          dimmed: false,
          'branch-hovered': hoveredBranchId !== null && node.branchId === hoveredBranchId,
        }"
        :style="{ top: nodeTopY(node) + 'px', left: svgWidth + 'px', height: nodeHeight(node) + 'px' }"
        @click="$emit('selectSnapshot', node.id)"
      >
        <div class="commit-top">
          <span v-if="node.isMerge" class="badge merge-badge">merge</span>
          <span
            v-else-if="node.branchTitle"
            class="badge branch-badge"
            :style="{ borderColor: getLaneColor(node.lane), color: getLaneColor(node.lane) }"
          >{{ node.branchTitle }}</span>
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
        </div>
        <p class="commit-msg" :class="{ expanded: node.id === selectedId }">
          {{ node.comment || 'Initial palette creation' }}
        </p>
        <time class="commit-time">{{ fmtDate(node.created_at) }}</time>

        <button
          v-if="node.id === selectedId && showRevertButton"
          class="node-revert"
          @click.stop="emit('revertSnapshot', node.id)"
        >
          Revert
        </button>

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
/**
 * HistoryGraph - Git-like branching history visualization for a palette.
 * Renders an SVG graph of commit nodes (lanes) with cubic-bezier edges,
 * branch filter pill, color-cube swatches, and a revert button.
 * Props: history, selectedId, showRevertButton.
 * Emits: selectSnapshot, selectBranch, deleteBranch, revertSnapshot.
 * Used in: PaletteView history panel and mobile sidebar.
 */
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import type { PaletteHistoryGraphResponse, PaletteCommitResponse } from '@/api/types'
import { getLaneColor } from '@/utils/branchColors'
import ColorCube from './ColorCube.vue'

const props = defineProps<{
  /** Full history graph data from the API. */
  history: PaletteHistoryGraphResponse
  /** ID of the currently selected snapshot (highlighted row). */
  selectedId?: number | null
  /** Whether to show the Revert button on the selected node. */
  showRevertButton?: boolean
}>()

const emit = defineEmits<{
  selectSnapshot: [id: number]
  selectBranch: [id: number]
  deleteBranch: [id: number]
  revertSnapshot: [id: number]
}>()

/** Layout constants for the SVG graph. */
const BASE_ROW_H  = 92
const LANE_W = 28
const PAD    = 18
const DOT_R  = 6
const ROW_TOP_PAD = 20
const COMMENT_LINE_H = 16
const APPROX_COMMENT_CHARS_PER_LINE = 42
const EXPANDED_EXTRA_PAD = 12

/**
 * Returns the x-coordinate (pixels) of a given lane index.
 */
function laneX(lane: number) { return PAD + lane * LANE_W }

/** ID of the branch the user has clicked to filter by (null = all). */
const activeBranchId  = ref<number | null>(null)

/** ID of the branch line currently under the mouse pointer. */
const hoveredBranchId = ref<number | null>(null)

/** Display title for the currently active branch filter. */
const activeBranchTitle = computed(() => {
  if (activeBranchId.value === null) return ''
  if (activeBranchId.value === 0) return 'main'
  return props.history.branches.find(b => b.id === activeBranchId.value)?.title ?? ''
})

/** Whether the currently filtered branch has already been merged. */
const activeBranchIsMerged = computed(() => {
  if (activeBranchId.value === null) return false
  if (activeBranchId.value === 0) return false
  return props.history.branches.find(b => b.id === activeBranchId.value)?.is_merged ?? false
})

/** Clear the active branch filter if that branch no longer exists (e.g. after deletion). */
watch(() => props.history, () => {
  if (activeBranchId.value !== null && activeBranchId.value !== 0) {
    const exists = props.history.branches.some(b => b.id === activeBranchId.value)
    if (!exists) activeBranchId.value = null
  }
})

/**
 * Handles Delete/Backspace keypress to delete the currently filtered branch.
 */
function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Delete' && e.key !== 'Backspace') return
  if (activeBranchId.value === null || activeBranchId.value === 0 || activeBranchIsMerged.value) return
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  e.preventDefault()
  emit('deleteBranch', activeBranchId.value)
}
onMounted(() => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => document.removeEventListener('keydown', onKeyDown))

/**
 * Toggles the active branch filter when a branch line is clicked.
 */
function onClickBranchLine(branchId: number) {
  if (activeBranchId.value === branchId) {
    activeBranchId.value = null
  } else {
    activeBranchId.value = branchId
    emit('selectBranch', branchId)
  }
}

/** Extended commit node with layout metadata (lane, rowIndex, merge flag). */
interface CommitNode extends PaletteCommitResponse {
  lane: number
  rowIndex: number
  isMerge: boolean
  branchTitle?: string
  branchId: number | null
}

/**
 * All commits from main + branches merged and sorted newest-first,
 * with lane and rowIndex assigned.
 */
const nodes = computed<CommitNode[]>(() => {
  const all: CommitNode[] = []

  props.history.main.forEach(c => {
    all.push({
      ...c,
      lane: 0,
      rowIndex: -1,
      isMerge: (c.comment ?? '').startsWith('Merge branch'),
      branchId: 0,
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

/**
 * Subset of nodes to render as commit info panels, filtered by activeBranchId.
 */
const visibleInfoNodes = computed<CommitNode[]>(() => {
  let filtered = nodes.value
  if (activeBranchId.value === 0) {
    filtered = nodes.value.filter(n => n.branchId === 0)
  } else if (activeBranchId.value !== null) {
    filtered = nodes.value.filter(n => n.branchId === activeBranchId.value)
  }
  return filtered
})

/** Set of IDs visible in the filtered info panel (for height computations). */
const visibleInfoIdSet = computed(() => new Set(visibleInfoNodes.value.map(n => n.id)))

/**
 * Calculates the pixel height of a commit row.
 * Expanded rows (selected + multi-line comment) are taller.
 */
function nodeHeight(node: CommitNode): number {
  if (node.id !== props.selectedId || !visibleInfoIdSet.value.has(node.id)) return BASE_ROW_H
  const comment = (node.comment || 'Initial palette creation').trim()
  const lines = Math.max(1, Math.ceil(comment.length / APPROX_COMMENT_CHARS_PER_LINE))
  return BASE_ROW_H + Math.max(0, lines - 1) * COMMENT_LINE_H + EXPANDED_EXTRA_PAD
}

/** Map from node ID to the pixel top offset of its row. */
const rowTopById = computed(() => {
  const m = new Map<number, number>()
  let y = ROW_TOP_PAD
  for (const n of nodes.value) {
    m.set(n.id, y)
    y += nodeHeight(n)
  }
  return m
})

/** Returns the top pixel offset for a node. */
function nodeTopY(node: CommitNode): number {
  return rowTopById.value.get(node.id) ?? ROW_TOP_PAD
}

/** Returns the vertical center pixel of a node (for SVG line endpoints). */
function nodeCenterY(node: CommitNode): number {
  return nodeTopY(node) + nodeHeight(node) / 2
}

/** Map from node ID to CommitNode for O(1) parent lookups. */
const nodeById = computed(() => {
  const m = new Map<number, CommitNode>()
  nodes.value.forEach(n => m.set(n.id, n))
  return m
})

/** Set of snapshot IDs that are the oldest commit of each branch. */
const branchFirstIds = computed(() => {
  const s = new Set<number>()
  props.history.branches.forEach(branch => {
    const oldest = branch.snapshots[branch.snapshots.length - 1]
    if (oldest) s.add(oldest.id)
  })
  return s
})

/** Width of the SVG in pixels (based on max lane count). */
const maxLane     = computed(() => Math.max(0, ...nodes.value.map(n => n.lane)))
const svgWidth    = computed(() => PAD + (maxLane.value + 1) * LANE_W + PAD)

/** Total height of the SVG in pixels (sum of all row heights). */
const totalHeight = computed(() => {
  let sum = ROW_TOP_PAD
  for (const n of nodes.value) sum += nodeHeight(n)
  return sum
})

/** Shape descriptor for a single SVG path line. */
interface Line { d: string; color: string; branchId: number | null }

/**
 * Computes all SVG path descriptors for edges between commits,
 * including merge-convergence arcs.
 */
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
    const y1 = nodeCenterY(node)
    const x2 = laneX(visualParent.lane)
    const y2 = nodeCenterY(visualParent)
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
    const y1 = nodeCenterY(mergeCommit)
    const x2 = laneX(branchTip.lane)
    const y2 = nodeCenterY(branchTip)
    const dy = y2 - y1
    result.push({
      d: `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.6}, ${x2} ${y2 - dy * 0.6}, ${x2} ${y2}`,
      color: getLaneColor(bi + 1),
      branchId: branch.id,
    })
  })

  return result
})

/**
 * Returns true if the commit has any color additions, deletions, or modifications.
 */
function hasChanges(node: CommitNode) {
  return node.colors_added > 0 || node.colors_deleted > 0 || node.colors_modified > 0
}

/**
 * Returns the CSS class for the change-type dot badge on a commit row.
 */
function changeDotClass(node: CommitNode) {
  if (!hasChanges(node)) return 'dot-init'
  if (node.colors_modified > 0 || (node.colors_added > 0 && node.colors_deleted > 0))
    return 'dot-edit'
  if (node.colors_added > 0) return 'dot-add'
  return 'dot-del'
}

/**
 * Returns an accessible tooltip string summarising the changes for a commit.
 */
function changeDotLabel(node: CommitNode) {
  const parts = []
  if (node.colors_added   > 0) parts.push(`+${node.colors_added}`)
  if (node.colors_deleted > 0) parts.push(`-${node.colors_deleted}`)
  if (node.colors_modified > 0) parts.push(`~${node.colors_modified}`)
  return parts.join(' ') || 'initial'
}

/**
 * Formats an ISO date string as a relative time label (e.g. "3h ago").
 */
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

<style src="./HistoryGraph.css" scoped></style>
