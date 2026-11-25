import { ApiClient } from './client';
import { cacheProfileColor } from '@/utils/profileColorCache';
import type {
  MessageResponse,
  UserCreate,
  UserCreateResponse,
  UserGetResponse,
  UserUpdateMe,
  UserUpdateMeResponse,
} from './types';

export const usersApi = {
  create: (data: UserCreate): Promise<UserCreateResponse> => {
    return ApiClient.request<UserCreateResponse>('/users', 'POST', data);
  },

  getByUsername: (username: string): Promise<UserGetResponse> => {
    return ApiClient.request<UserGetResponse>(`/users/${encodeURIComponent(username)}`, 'GET');
  },

  updateMe: async (data: UserUpdateMe): Promise<UserUpdateMeResponse> => {
    const user = await ApiClient.request<UserUpdateMeResponse>('/users/me', 'PATCH', data);
    cacheProfileColor(user);
    return user;
  },

  deleteMe: (): Promise<MessageResponse> => {
    return ApiClient.request<MessageResponse>('/users/me', 'DELETE');
  },
};
