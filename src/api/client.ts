import { translate } from '@/i18n'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Base URL for all API requests. Prefer VITE_BACKEND_URL in Vite builds. */
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.BACKEND_URL ||
  'http://localhost:8000';

/** Thin fetch wrapper that attaches the JWT bearer token and handles error responses. */
export class ApiClient {
  /** Builds Authorization header if a token is stored. */
  private static getAuthHeaders() {
    const headers: Record<string, string> = {};

    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /** Builds JSON headers with Content-Type and Authorization. */
  private static getJsonHeaders() {
    return {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
    };
  }

  /** Generic request with explicit HTTP method. */
  static async request<T>(endpoint: string, method: HttpMethod, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: this.getJsonHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse(response);
  }

  /** GET request. */
  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'GET');
  }

  /** POST request with optional JSON body. */
  static async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, 'POST', body);
  }

  /** POST multipart/form-data body (used for file uploads). */
  static async postForm<T>(endpoint: string, body: FormData): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body,
    });
    return this.handleResponse(response);
  }

  /** PUT request with optional JSON body. */
  static async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, 'PUT', body);
  }

  /** DELETE request. */
  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'DELETE');
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      let message: string;
      if (Array.isArray(error.detail)) {
        message = error.detail
          .map((e: any) => (e.msg ?? 'Validation error').replace(/^Value error,\s*/i, ''))
          .join('\n');
      } else {
        message = error.detail || `HTTP error ${response.status}`;
      }
      throw new Error(this.translateError(message, response.status));
    }
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private static translateError(message: string, statusCode: number): string {
    const normalized = String(message || '').trim()
    const lower = normalized.toLowerCase()
    const rules: Array<[RegExp, string]> = [
      [/^invalid credentials$/i, 'apiErrors.invalidCredentials'],
      [/email not verified/i, 'apiErrors.emailNotVerified'],
      [/^user not found\.?$/i, 'apiErrors.userNotFound'],
      [/^palette not found\.?$/i, 'apiErrors.paletteNotFound'],
      [/^folder not found\.?$/i, 'apiErrors.folderNotFound'],
      [/^bookmark not found\.?$/i, 'apiErrors.bookmarkNotFound'],
      [/username.*already taken/i, 'apiErrors.usernameTaken'],
      [/email.*already taken/i, 'apiErrors.emailTaken'],
      [/duplicate record/i, 'apiErrors.duplicateRecord'],
      [/folder name already exists/i, 'apiErrors.folderNameExists'],
      [/palette name already exists/i, 'apiErrors.paletteNameExists'],
      [/^title is invalid\.?$/i, 'apiErrors.titleInvalid'],
      [/folder name is invalid/i, 'apiErrors.folderNameInvalid'],
      [/username is invalid/i, 'apiErrors.usernameInvalid'],
      [/password is too weak/i, 'apiErrors.passwordWeak'],
      [/permission to modify this palette/i, 'apiErrors.permissionPalette'],
      [/permission to modify this folder/i, 'apiErrors.permissionFolder'],
      [/permission to use this folder/i, 'apiErrors.permissionUseFolder'],
      [/token has expired|reset token has expired|verification token has expired/i, 'apiErrors.tokenExpired'],
      [/invalid token|invalid reset token|invalid verification token|signature verification failed/i, 'apiErrors.invalidToken'],
      [/^validation error$/i, 'apiErrors.validation'],
    ]
    for (const [pattern, key] of rules) {
      if (pattern.test(normalized)) return translate(key)
    }
    if (statusCode === 401) return translate('apiErrors.unauthorized')
    if (statusCode === 403) return translate('apiErrors.forbidden')
    if (statusCode === 404 || lower.includes('not found')) return translate('apiErrors.notFound')
    return normalized || translate('apiErrors.generic')
  }
}
