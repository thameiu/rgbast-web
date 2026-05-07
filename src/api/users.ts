import { ApiClient } from './client';
import type { UserCreate, UserCreateResponse, UserGetResponse } from './types';

export const usersApi = {
  create: (data: UserCreate): Promise<UserCreateResponse> => {
    return ApiClient.request<UserCreateResponse>('/users', 'POST', data);
  },

  getByUsername: (username: string): Promise<UserGetResponse> => {
    return ApiClient.request<UserGetResponse>(`/users/${encodeURIComponent(username)}`, 'GET');
  },
};
