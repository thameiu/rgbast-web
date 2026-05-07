import { ApiClient } from './client';
import type {
  Login,
  LoginResponse,
  MessageResponse,
  PasswordResetConfirm,
  PasswordResetRequest,
  UserGetResponse,
} from './types';

/** Authentication endpoints: login and session verification. */
export const authApi = {
  /** Exchange credentials for a JWT access token. */
  login: (data: Login): Promise<LoginResponse> => {
    return ApiClient.request<LoginResponse>('/login', 'POST', data);
  },

  /** Verify the stored token and return the current user's profile. */
  checkAuth: (): Promise<UserGetResponse> => {
    return ApiClient.request<UserGetResponse>('/check-auth', 'POST');
  },

  requestPasswordReset: (data: PasswordResetRequest): Promise<MessageResponse> => {
    return ApiClient.request<MessageResponse>('/password-reset/request', 'POST', data);
  },

  confirmPasswordReset: (data: PasswordResetConfirm): Promise<MessageResponse> => {
    return ApiClient.request<MessageResponse>('/password-reset/confirm', 'POST', data);
  },
};
