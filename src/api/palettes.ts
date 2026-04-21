import { ApiClient } from './client';
import type {
  PaletteByUsernameResponse,
  PaletteCache,
  PaletteCreate,
  PaletteCreateResponse,
  PaletteBranchMergeResponse,
  PaletteSnapshotSave,
  PaletteSnapshotSaveResponse,
  PaletteHistoryGraphResponse,
} from './types';

const CACHE_KEY = 'rgbast_palettes';

/** All palette-related API calls plus a localStorage cache for offline-friendly title resolution. */
export const palettesApi = {
  /** Create a new palette (with an optional initial set of colors). */
  create: (data: PaletteCreate): Promise<PaletteCreateResponse> => {
    return ApiClient.post<PaletteCreateResponse>('/palettes', data);
  },

  /** Save a new snapshot on the given branch (or create a new branch if create_branch is true). */
  saveSnapshot: (paletteId: number, data: PaletteSnapshotSave): Promise<PaletteSnapshotSaveResponse> => {
    return ApiClient.put<PaletteSnapshotSaveResponse>(`/palettes/${paletteId}/snapshots`, data);
  },

  /** Fetch the full commit + branch history for the history graph. */
  getHistory: (paletteId: number): Promise<PaletteHistoryGraphResponse> => {
    return ApiClient.get<PaletteHistoryGraphResponse>(`/palettes/${paletteId}/history`);
  },

  /** Merge a branch into main, creating a merge commit on main. */
  mergeBranch: (paletteId: number, branchId: number): Promise<PaletteBranchMergeResponse> => {
    return ApiClient.post<PaletteBranchMergeResponse>(`/palettes/${paletteId}/branches/${branchId}/merge`);
  },

  /** Fetch all palettes (with their latest main snapshot) for a given username. */
  getByUsername: (username: string): Promise<PaletteByUsernameResponse> => {
    return ApiClient.get<PaletteByUsernameResponse>(`/users/${username}/palettes`);
  },

  // ── Local cache (localStorage) ─────────────────────────────────────────────

  /** Return all cached palettes, or [] if storage is empty / corrupt. */
  getCachedPalettes(): PaletteCache[] {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /** Upsert a palette entry in the local cache (used to preserve titles across navigation). */
  cachePalette(palette: PaletteCache): void {
    const list = palettesApi.getCachedPalettes();
    const idx = list.findIndex(p => p.id === palette.id);
    if (idx >= 0) {
      list[idx] = palette;
    } else {
      list.unshift(palette);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  },

  /** Update only the color array of a cached palette entry (called after each snapshot save). */
  updateCacheColors(paletteId: number, colors: PaletteCache['palette_colors']): void {
    const list = palettesApi.getCachedPalettes();
    const item = list.find(p => p.id === paletteId);
    if (item) {
      item.palette_colors = colors;
      localStorage.setItem(CACHE_KEY, JSON.stringify(list));
    }
  },

  /** Look up a single palette by id from the local cache. Returns null if not found. */
  getCachedPalette(paletteId: number): PaletteCache | null {
    return palettesApi.getCachedPalettes().find(p => p.id === paletteId) ?? null;
  },
};
