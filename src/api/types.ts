// ── Auth ──────────────────────────────────────────────────────────────────────

export interface Login {
  username: string;
  password?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface VerifyEmailCodeRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResendRequest {
  identifier: string;
}

export interface MessageResponse {
  response: string;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserCreate {
  username: string;
  email: string;
  firstname?: string | null;
  lastname?: string | null;
  password: string;
  birthdate?: string | null;
  verify_type?: 'link' | 'code';
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
  firstname: string | null;
  lastname: string | null;
  birthdate?: string | null;
  colleagues_count?: number;
}

export interface UserMeResponse extends UserGetResponse {
  email: string;
}

export interface UserUpdateMe {
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
}

export interface UserUpdateMeResponse {
  id: number;
  username: string;
  firstname: string | null;
  lastname: string | null;
  birthdate?: string | null;
  access_token?: string | null;
}

// ── Folders ───────────────────────────────────────────────────────────────────

export interface FolderCreate {
  name: string;
  parent_folder_id?: number | null;
}

export interface FolderUpdate {
  name?: string | null;
  parent_folder_id?: number | null;
}

export interface FolderResponse {
  id: number;
  user_id: number;
  parent_folder_id: number | null;
  name: string;
  created_at: string;
}

export interface FolderDeleteResponse {
  folder_id: number;
  palette_strategy: 'move_root' | 'delete';
  deleted_folder_ids: number[];
  deleted_palette_ids: number[];
  moved_palette_ids: number[];
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
  folder_id?: number | null;
  folder_path?: string[] | null;
  palette_colors?: PaletteColorSave[];
}

export interface PaletteCreateResponse {
  id: number;
  title: string;
  description: string;
  folder_id: number | null;
  folder_path: string[];
  created_at: string;
}

export interface PaletteUpdate {
  title?: string | null;
  description?: string | null;
  folder_id?: number | null;
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
  palette_id: number;
  owner_username: string;
  title: string;
  description?: string | null;
  folder_path: string[];
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
  folder_id?: number | null;
  folder_path?: string[];
  created_at: string;
  latest_main_snapshot: PaletteCommitResponse | null;
}

export interface PaletteByUsernameResponse {
  username: string;
  palettes: PaletteByUsernameItemResponse[];
}

// ── Palette generator ─────────────────────────────────────────────────────────

export type PaletteHarmony =
  | 'random' | 'analogous' | 'complementary'
  | 'triadic' | 'split_complementary' | 'tetradic'

export interface PaletteGenerateRequest {
  count?: number          // 2–8, default 5
  base_colors?: string[]  // 0–3 hex values (without #)
  contrast?: number       // 1–10, default 5
  include_shades?: boolean
  harmony?: PaletteHarmony
}

export interface GeneratedColor { hex: string }

export interface PaletteGenerateResponse {
  colors: GeneratedColor[]
}

// ── Color contrast check ──────────────────────────────────────────────────────

export interface ColorContrastCheckResponse {
  hex1: string
  hex2: string
  ratio: number
  aa_normal: boolean
  aa_large: boolean
  aaa_normal: boolean
  aaa_large: boolean
}

// ── Color info ────────────────────────────────────────────────────────────────

export interface ColorInfoRGB { r: number; g: number; b: number }

export interface ColorInfoResponse {
  input_hex: string
  normalized_hex: string
  closest_name: string | null
  label_is_approximate: boolean
  rgb: ColorInfoRGB
  hsl: { h: number; s: number; l: number }
  cmyk: { c: number; m: number; y: number; k: number }
  hsb: { h: number; s: number; b: number }
  lab: { l: number; a: number; b: number }
  xyz: { x: number; y: number; z: number }
  lch: { l: number; c: number; h: number }
  luv: { l: number; u: number; v: number }
  hwb: { h: number; w: number; b: number }
  accessibility: {
    color_blindness: {
      protanopia:   { rgb: ColorInfoRGB; hex: string }
      deuteranopia: { rgb: ColorInfoRGB; hex: string }
      tritanopia:   { rgb: ColorInfoRGB; hex: string }
    }
    contrast: {
      on_white: number
      on_black: number
      aa_on_white_normal_text: boolean
      aa_on_black_normal_text: boolean
      aaa_on_white_normal_text: boolean
      aaa_on_black_normal_text: boolean
    }
  }
  bast_score: number
}

// ── Local cache (localStorage) ────────────────────────────────────────────────

/** Minimal palette shape stored in localStorage for offline title/color preview. */
export interface PaletteCache {
  id: number;
  title: string;
  description?: string;
  folder_id?: number | null;
  folder_path?: string[];
  created_at: string;
  last_snapshot_at?: string;
  palette_colors: PaletteColorSave[];
}

// ── Search ───────────────────────────────────────────────────────────────────

export interface UserSearchItem {
  id: number;
  username: string;
  firstname: string | null;
  lastname: string | null;
}

export interface UserSearchResponse {
  query: string;
  total: number;
  results: UserSearchItem[];
}

export interface PaletteSearchItem {
  id: number;
  owner_username: string;
  title: string;
  description?: string | null;
  folder_path: string[];
  created_at: string;
  latest_main_snapshot_created_at?: string | null;
  palette_colors: PaletteColorSave[];
}

export interface PaletteSearchResponse {
  query?: string | null;
  colors: string[];
  color_mode: 'exact' | 'similar';
  total: number;
  results: PaletteSearchItem[];
}

// ── Colleagues ──────────────────────────────────────────────────────────────

export type ColleagueRelationStatus =
  | 'self'
  | 'none'
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'accepted'

export interface ColleagueUserItem {
  id: number
  username: string
  firstname: string | null
  lastname: string | null
}

export interface ColleagueListResponse {
  colleagues: ColleagueUserItem[]
  outgoing_pending: ColleagueUserItem[]
  incoming_pending: ColleagueUserItem[]
  incoming_count: number
}

export interface ColleagueActionResponse {
  status: 'pending' | 'accepted' | 'removed'
  user: ColleagueUserItem
  response: string
}

export interface ColleagueStatusResponse {
  status: ColleagueRelationStatus
}

export interface ColleagueCountResponse {
  username: string
  colleagues_count: number
}

export interface ColleaguePublicListResponse {
  username: string
  colleagues: ColleagueUserItem[]
  total: number
}
