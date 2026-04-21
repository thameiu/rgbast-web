import { ApiClient } from './client';
import type { UserCreate, UserCreateResponse } from './types';

export const usersApi = {
  create: (data: UserCreate): Promise<UserCreateResponse> => {
    return ApiClient.request<UserCreateResponse>('/users', 'POST', data);
  },

  getByUsername: (username: string): Promise<any> => {
    return ApiClient.request<any>(`/users?username=${encodeURIComponent(username)}`, 'GET');
  }
};
