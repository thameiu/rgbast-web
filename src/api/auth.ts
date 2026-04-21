import { ApiClient } from './client';
import type { Login, LoginResponse } from './types';

/** Authentication endpoints: login and session verification. */
export const authApi = {
  /** Exchange credentials for a JWT access token. */
  login: (data: Login): Promise<LoginResponse> => {
    return ApiClient.request<LoginResponse>('/login', 'POST', data);
  },

  /** Verify the stored token and return the current user's profile. */
  checkAuth: (): Promise<any> => {
    return ApiClient.request<any>('/check-auth', 'POST');
  }
};
