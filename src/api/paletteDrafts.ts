import type { PaletteColorSave } from './types'

const DRAFTS_KEY = 'rgbast_palette_drafts'

export interface PaletteDraftHistorySnapshot {
  colors: PaletteColorSave[]
  selectedSnapshotId: number | null
  currentBranchId: number | null
  savedColorsSig: string
}

export interface PaletteDraftEntry {
  key: string
  mode: 'existing' | 'new'
  paletteId: number | null
  ownerUsername: string
  palettePath: string
  paletteTitle: string
  description: string
  folderPath: string[]
  pendingTitle: string
  pendingDescription: string
  pendingFolderId: number | null
  linkPath: string
  colors: PaletteColorSave[]
  selectedSnapshotId: number | null
  currentBranchId: number | null
  savedColorsSig: string
  undoPast: PaletteDraftHistorySnapshot[]
  undoFuture: PaletteDraftHistorySnapshot[]
  updatedAt: string
}

type DraftMap = Record<string, PaletteDraftEntry>

function readDraftMap(): DraftMap {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as DraftMap
  } catch {
    return {}
  }
}

function writeDraftMap(map: DraftMap): void {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(map))
}

export const paletteDraftsApi = {
  makeDraftKey(ownerUsername: string, palettePath: string): string {
    return `${ownerUsername.trim()}::${palettePath.trim()}`
  },

  getDraft(key: string): PaletteDraftEntry | null {
    return readDraftMap()[key] ?? null
  },

  saveDraft(draft: PaletteDraftEntry): void {
    const map = readDraftMap()
    map[draft.key] = draft
    writeDraftMap(map)
  },

  removeDraft(key: string): void {
    const map = readDraftMap()
    if (!(key in map)) return
    delete map[key]
    writeDraftMap(map)
  },

  removeByPaletteId(paletteId: number): void {
    const map = readDraftMap()
    let changed = false
    for (const [key, draft] of Object.entries(map)) {
      if (draft.paletteId === paletteId) {
        delete map[key]
        changed = true
      }
    }
    if (changed) writeDraftMap(map)
  },

  listByOwner(ownerUsername: string): PaletteDraftEntry[] {
    return Object.values(readDraftMap())
      .filter(d => d.ownerUsername === ownerUsername)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  },
}
