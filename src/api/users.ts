import { ApiClient } from './client';
import type { UserCreate, UserCreateResponse } from './types';

export const usersApi = {
  create: (data: UserCreate): Promise<UserCreateResponse> => {
    return ApiClient.post<UserCreateResponse>('/users', data);
  },

  getByUsername: (username: string): Promise<any> => {
    return ApiClient.get<any>(`/users?username=${encodeURIComponent(username)}`);
  }
};
