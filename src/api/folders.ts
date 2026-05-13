import { ApiClient } from './client';
import type { FolderCreate, FolderDeleteResponse, FolderResponse, FolderUpdate } from './types';

/** Folder management API calls. */
export const foldersApi = {
  /** Fetch all folders for a username. */
  getByUsername: (username: string): Promise<FolderResponse[]> => {
    return ApiClient.request<FolderResponse[]>(`/users/${username}/folders`, 'GET');
  },

  /** Create a new folder for the current user. */
  create: (data: FolderCreate): Promise<FolderResponse> => {
    return ApiClient.request<FolderResponse>('/folders', 'POST', data);
  },

  /** Update an existing folder. */
  update: (folderId: number, data: FolderUpdate): Promise<FolderResponse> => {
    return ApiClient.request<FolderResponse>(`/folders/${folderId}`, 'PUT', data);
  },

  /** Delete a folder by id. */
  delete: (folderId: number, paletteStrategy: 'move_root' | 'delete' = 'move_root'): Promise<FolderDeleteResponse> => {
    return ApiClient.request<FolderDeleteResponse>(
      `/folders/${folderId}?palette_strategy=${encodeURIComponent(paletteStrategy)}`,
      'DELETE',
    );
  },
};
