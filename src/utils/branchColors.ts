export const BRANCH_LANE_COLORS: string[] = [
  'rgba(255,255,255,0.85)', // lane 0 = main
  '#b410cc',                // lane 1
  '#0EC6D4',                // lane 2
  '#f6c343',                // lane 3
  '#ff6b6b',                // lane 4
  '#6bcb77',                // lane 5
  '#4d96ff',                // lane 6
  '#ff9f43',                // lane 7
]

/** Returns a deterministic color for a branch by its 0-based index in the branches list. */
export function getBranchColor(branchIndex: number): string {
  // index 0 = first branch => lane 1
  return BRANCH_LANE_COLORS[(branchIndex + 1) % BRANCH_LANE_COLORS.length] ?? '#b410cc'
}

/** Returns the lane color (main=0, branch at branchIndex goes to lane branchIndex+1). */
export function getLaneColor(lane: number): string {
  return BRANCH_LANE_COLORS[lane % BRANCH_LANE_COLORS.length] ?? 'rgba(255,255,255,0.85)'
}
