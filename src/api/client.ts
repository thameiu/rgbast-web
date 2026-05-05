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
      throw new Error(message);
    }
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }
}
