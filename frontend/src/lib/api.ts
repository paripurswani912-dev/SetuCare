import { toast } from './toast';
import { getSimulatedOffline, enqueueOfflineRequest } from './offlineQueue';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  detail: any;

  constructor(status: number, detail: any) {
    const message = typeof detail === 'string' ? detail : detail?.message || `HTTP Error ${status}`;
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export class OfflineQueuedError extends Error {
  constructor(endpoint: string) {
    super(`Action queued offline for ${endpoint}`);
  }
}

export function getCurrentRole(): string {
  if (typeof window === 'undefined') return 'ADMIN';
  return localStorage.getItem('setucare_role') || 'ADMIN';
}

export function setCurrentRole(role: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('setucare_role', role);
}

export function getCurrentUser(): string {
  if (typeof window === 'undefined') return 'Pari / Admin';
  return localStorage.getItem('setucare_user') || 'Pari / Admin';
}

export function setCurrentUser(user: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('setucare_user', user);
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const role = getCurrentRole();
  const user = getCurrentUser();
  const method = (options.method || 'GET').toUpperCase();
  const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
  const isOffline = typeof window !== 'undefined' && (!navigator.onLine || getSimulatedOffline());

  // Handle Offline Queue for mutations
  if (isOffline && isMutation) {
    let parsedBody;
    if (options.body && typeof options.body === 'string') {
      try {
        parsedBody = JSON.parse(options.body);
      } catch {
        parsedBody = options.body;
      }
    } else {
      parsedBody = options.body;
    }

    enqueueOfflineRequest(endpoint, method, parsedBody);
    throw new OfflineQueuedError(endpoint);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Role': role,
    'X-User': user,
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let detail: any = 'An unknown error occurred';
      try {
        const errJson = await response.json();
        detail = errJson.detail || errJson.message || errJson;
      } catch {
        detail = await response.text();
      }

      if (response.status === 403) {
        const errorMsg = typeof detail === 'string' && detail ? detail : `Your role (${role}) is not allowed to do this`;
        toast.error('Permission Denied', errorMsg);
        throw new ApiError(403, detail);
      }

      // Format duplicate error 409 or standard error
      if (response.status === 409) {
        // Do not auto-toast 409 if caller wants to render custom card, but set error
        throw new ApiError(409, detail);
      }

      // Format 422 validation errors with field names & detailed messages
      if (response.status === 422 && Array.isArray(detail)) {
        const formattedErrors = detail
          .map((err: any) => {
            const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : 'field';
            const msg = err.msg || 'invalid value';
            return `${field}: ${msg}`;
          })
          .join('; ');
        toast.error('Validation Error (422)', formattedErrors || 'Invalid request payload');
        throw new ApiError(422, detail);
      }

      const toastMessage = typeof detail === 'string' ? detail : detail?.message || `Request failed with status ${response.status}`;
      toast.error(`Error (${response.status})`, toastMessage);

      throw new ApiError(response.status, detail);
    }

    if (response.status === 204) return {} as T;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  } catch (error: any) {
    if (error instanceof ApiError || error instanceof OfflineQueuedError) {
      throw error;
    }
    toast.error('Network Error', error.message || `Could not connect to SetuCare backend server at ${BASE_URL}.`);
    throw error;
  }
}

