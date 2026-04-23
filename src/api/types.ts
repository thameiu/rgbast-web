// ── Auth ──────────────────────────────────────────────────────────────────────

export interface Login {
  username: string;
  password?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserCreate {
  username: string;
  email: string;
  firstname?: string | null;
  lastname?: string | null;
  password: string;
  birthdate?: string | null;
}

export interface UserCreateResponse {
  response: string;
  username: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  birthdate?: string | null;
}

export interface UserGetResponse {
  id: number;
  username: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  birthdate?: string | null;
}

// ── Palettes ──────────────────────────────────────────────────────────────────

/** A single color entry within a palette (hex without #, optional label). */
export interface PaletteColorSave {
  hex: string;
  label?: string | null;
}

export interface PaletteCreate {
  title: string;
  description: string;
  palette_colors?: PaletteColorSave[];
}

export interface PaletteCreateResponse {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

/** Payload for saving a new snapshot. Pass branch_id for an existing branch,
 *  or create_branch=true + branch_title to fork a new one. */
export interface PaletteSnapshotSave {
  parent_snapshot_id?: number | null;
  branch_id?: number | null;
  create_branch?: boolean;
  branch_title?: string | null;
  palette_colors?: PaletteColorSave[];
  comment: string;
}

export interface PaletteSnapshotSaveResponse {
  palette_id: number;
  palette_snapshot_id: number;
  parent_snapshot_id: number | null;
  branch_id: number | null;
  palette_colors: PaletteColorSave[];
  comment: string;
  created_at: string;
  colors_added: number;
  colors_deleted: number;
  colors_modified: number;
}

/** A single commit node as returned by the history graph endpoint. */
export interface PaletteCommitResponse {
  id: number;
  palette_id: number;
  parent_snapshot_id: number | null;
  branch_id: number | null;
  comment: string | null;
  created_at: string;
  palette_colors: PaletteColorSave[];
  colors_added: number;
  colors_deleted: number;
  colors_modified: number;
}

/** All snapshots belonging to one branch, newest first. */
export interface PaletteBranchHistoryResponse {
  id: number;
  title: string;
  merged_at: string | null;
  is_merged: boolean;
  snapshots: PaletteCommitResponse[];
}

/** Full history graph: main-branch commits + per-branch commit lists. */
export interface PaletteHistoryGraphResponse {
  owner_username: string;
  main: PaletteCommitResponse[];
  branches: PaletteBranchHistoryResponse[];
}

export interface PaletteBranchMergeResponse {
  palette_id: number;
  branch_id: number;
  merged_at: string;
  palette_snapshot_id: number;
  parent_snapshot_id: number | null;
  comment: string | null;
  created_at: string;
  palette_colors: PaletteColorSave[];
  colors_added: number;
  colors_deleted: number;
  colors_modified: number;
}

export interface PaletteDeleteResponse {
  palette_id: number;
  deleted_branches: number;
  deleted_snapshots: number;
  deleted_colors: number;
  deleted_changes: number;
}

export interface PaletteBranchDeleteResponse {
  palette_id: number;
  branch_id: number;
  deleted_snapshots: number;
  deleted_colors: number;
  deleted_changes: number;
}

export interface PaletteBranchRevertResponse {
  palette_id: number;
  branch_id: number;
  target_snapshot_id: number;
  latest_snapshot_id: number;
  deleted_snapshots: number;
  deleted_colors: number;
  deleted_changes: number;
}

export interface PaletteMainRevertResponse {
  palette_id: number;
  target_snapshot_id: number;
  latest_snapshot_id: number;
  deleted_snapshots: number;
  deleted_branches: number;
  deleted_colors: number;
  deleted_changes: number;
}

/** Summary item returned by GET /users/{username}/palettes. */
export interface PaletteByUsernameItemResponse {
  id: number;
  title: string;
  description?: string;
  created_at: string;
  latest_main_snapshot: PaletteCommitResponse | null;
}

export interface PaletteByUsernameResponse {
  username: string;
  palettes: PaletteByUsernameItemResponse[];
}

// ── Local cache (localStorage) ────────────────────────────────────────────────

/** Minimal palette shape stored in localStorage for offline title/color preview. */
export interface PaletteCache {
  id: number;
  title: string;
  description?: string;
  created_at: string;
  palette_colors: PaletteColorSave[];
}
