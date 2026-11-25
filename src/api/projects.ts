import { ApiClient } from './client'
import type { ColleagueUserItem } from './types'
import type { FolderResponse, FolderCreate, FolderUpdate, PaletteCache, PaletteUpdate } from './types'
export interface ProjectPalette extends PaletteCache { user_id: number; owner_username: string; project_id: number }

export const projectPermissions = ['read', 'add_palettes', 'edit_palettes', 'remove_palettes', 'add_bookmarks', 'edit_bookmarks', 'remove_bookmarks', 'manage_folders', 'manage_access', 'edit_project'] as const
export type ProjectPermission = typeof projectPermissions[number]
export interface Project {
  palette_count?: number; bookmark_count?: number; member_count?: number
  id: number; title: string; slug: string; description: string | null; private: boolean
  creator_id: number; creator_username: string; permissions: ProjectPermission[]; created_at: string
}
export interface ProjectInput { title: string; slug?: string; description: string | null; private: boolean }
export interface ProjectMember extends ColleagueUserItem { creator: boolean; pending?: boolean; permissions: ProjectPermission[] }
export interface ProjectInvitation { id: number; title: string; project_id: number; permissions: ProjectPermission[]; inviter: ColleagueUserItem }
export const projectUrl = (p: Project) => `/projects/${encodeURIComponent(p.creator_username)}/${encodeURIComponent(p.slug)}`
export const projectsApi = {
  folders: (id: number) => ApiClient.get<FolderResponse[]>(`/projects/${id}/folders`),
  createFolder: (id: number, data: FolderCreate) => ApiClient.post<FolderResponse>(`/projects/${id}/folders`, data),
  updateFolder: (id: number, folder: number, data: FolderUpdate) => ApiClient.put<FolderResponse>(`/projects/${id}/folders/${folder}`, data),
  deleteFolder: (id: number, folder: number, strategy: 'move_root' | 'delete') => ApiClient.delete(`/projects/${id}/folders/${folder}?palette_strategy=${strategy}`),
  palettes: (id: number) => ApiClient.get<ProjectPalette[]>(`/projects/${id}/palettes`),
  importPalette: (id: number, palette: number, data: PaletteUpdate) => ApiClient.post(`/projects/${id}/palettes/${palette}`, data),
  removePalette: (id: number, palette: number, strategy: 'make_public' | 'delete' = 'make_public') => ApiClient.delete(`/projects/${id}/palettes/${palette}?strategy=${strategy}`),
  mine: () => ApiClient.get<Project[]>('/projects/me'),
  byUser: (username: string) => ApiClient.get<Project[]>(`/users/${encodeURIComponent(username)}/projects`),
  byPath: (username: string, slug: string) => ApiClient.get<Project>(`/projects/by-path/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`),
  create: (data: ProjectInput) => ApiClient.post<Project>('/projects', data),
  update: (id: number, data: ProjectInput) => ApiClient.put<Project>(`/projects/${id}`, data),
  remove: (id: number, title: string) => ApiClient.request<void>(`/projects/${id}`, 'DELETE', { confirm_title: title }),
  members: (id: number) => ApiClient.get<ProjectMember[]>(`/projects/${id}/members`),
  invite: (id: number, username: string, permissions: ProjectPermission[]) => ApiClient.post(`/projects/${id}/invitations`, { username, permissions }),
  setMember: (id: number, username: string, permissions: ProjectPermission[]) => ApiClient.put(`/projects/${id}/members`, { username, permissions }),
  removeMember: (id: number, username: string) => ApiClient.delete(`/projects/${id}/members/${encodeURIComponent(username)}`),
  leave: (id: number) => ApiClient.post<void>(`/projects/${id}/leave`),
  invitations: () => ApiClient.get<ProjectInvitation[]>('/projects/invitations'),
  accept: (id: number) => ApiClient.post<void>(`/projects/invitations/${id}/accept`),
  decline: (id: number) => ApiClient.delete<void>(`/projects/invitations/${id}`),
}
