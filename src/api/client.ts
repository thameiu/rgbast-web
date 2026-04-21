type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Base URL for all API requests. Prefer VITE_BACKEND_URL in Vite builds. */
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.BACKEND_URL ||
  'http://localhost:8000';

/** Thin fetch wrapper that attaches the JWT bearer token and handles error responses. */
export class ApiClient {
  /** Builds headers with Content-Type and Authorization if a token is stored. */
  private static getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Example: retrieve token from localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /** Generic request with explicit HTTP method. */
  static async request<T>(endpoint: string, method: HttpMethod, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: this.getHeaders(),
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
      throw new Error(error.detail || `HTTP error ${response.status}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }
}
