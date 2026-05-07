import type { FolderResponse, PaletteCache } from '@/api/types'

export interface FolderTreeState {
  openFolders: Set<number>
  rootOpen: boolean
  dragTargetId: number | 'root' | null
  theme: 'light' | 'dark'
  mode: 'navigation' | 'picker'
  allowFolderEditing: boolean
  activeFolderKey: 'all' | 'root' | number | null
  paletteCounts: Record<number, number>
  childFolderCounts: Record<number, number>
  rootChildFolderCount: number
  palettes: PaletteCache[]
  inlineCreate: { parentId: number | null } | null
  inlineRename: { folderId: number } | null
  inlineValue: string
  getChildren: (parentId: number | null) => FolderResponse[]
  toggle: (id: number) => void
  toggleRoot: () => void
  select: (key: 'all' | 'root' | number | null) => void
  selectPalette: (p: PaletteCache) => void
  startInlineCreate: (parentId: number | null) => void
  startInlineRename: (folder: FolderResponse) => void
  commitInlineCreate: (parentId: number | null) => void
  commitInlineRename: (folderId: number) => void
  cancelInline: () => void
  updateInlineValue: (value: string) => void
  onDeleteFolder: (folder: FolderResponse) => void
  onDragover: (event: DragEvent, targetId: number | 'root' | null) => void
  onDragleave: (targetId: number | 'root' | null) => void
  onDrop: (event: DragEvent, targetFolderId: number | null) => void
  isNameTaken: (name: string, parentId: number | null, excludeId?: number) => boolean
  draggingPaletteId: number | null
  startPaletteDrag: (id: number, event: DragEvent) => void
  endPaletteDrag: () => void
}
