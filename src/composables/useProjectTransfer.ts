import { shallowRef } from 'vue'
import type { PaletteColorSave } from '@/api/types'

export interface ProjectTransferItem {
  kind: 'palette' | 'bookmark'
  id?: number
  title: string
  description?: string
  colors?: PaletteColorSave[]
  hex?: string
  canMove?: boolean
  clone?: boolean
  onMoved?: (path: string) => void
}
export const projectTransfer = shallowRef<ProjectTransferItem | null>(null)
export function openProjectTransfer(item: ProjectTransferItem) { projectTransfer.value = item }
