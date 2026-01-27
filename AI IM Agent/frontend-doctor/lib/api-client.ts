/**
 * API Client for Doctor Dashboard
 * Handles all REST API calls with automatic authentication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

// In-memory token storage (HIPAA compliant - no localStorage)
let authToken: string | null = null;
let authTokenListeners: Set<(token: string | null) => void> = new Set();

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  doctor: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SOAPNotes {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface SOAPNotesResponse {
  sessionId: string;
  soap: SOAPNotes;
  updatedAt: string;
}

export interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface AlertsResponse {
  alerts: Alert[];
}

/**
 * Set authentication token (stored in memory only)
 */
export function setAuthToken(token: string | null): void {
  authToken = token;
  authTokenListeners.forEach((cb) => {
    try {
      cb(authToken);
    } catch {
      // ignore listener errors
    }
  });
}

/**
 * Get current authentication token
 */
export function getAuthToken(): string | null {
  return authToken;
}

/**
 * Clear authentication token
 */
export function clearAuthToken(): void {
  authToken = null;
  authTokenListeners.forEach((cb) => {
    try {
      cb(authToken);
    } catch {
      // ignore listener errors
    }
  });
}

/**
 * Subscribe to auth token changes (in-memory only).
 * Useful for keeping UI in sync without localStorage.
 */
export function subscribeAuthToken(
  cb: (token: string | null) => void
): () => void {
  authTokenListeners.add(cb);
  return () => {
    authTokenListeners.delete(cb);
  };
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Base fetch wrapper with authentication and error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers);
  // Default to JSON unless caller explicitly set something else
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Add auth token if available
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorCode: string | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      errorCode = errorData.code;
    } catch {
      // If response is not JSON, use default message
    }

    // If unauthorized, clear in-memory token so the UI can redirect to login
    if (response.status === 401) {
      clearAuthToken();
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return {} as T;
  }

  return response.json();
}

/**
 * Authentication API
 */
export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    
    // Store token in memory
    setAuthToken(response.token);
    
    return response;
  },

  /**
   * Logout (clears in-memory token)
   */
  logout(): void {
    clearAuthToken();
  },
};

/**
 * Notes API
 */
export const notesApi = {
  /**
   * Get SOAP notes for a session
   */
  async getNotes(sessionId: string): Promise<SOAPNotesResponse> {
    return apiRequest<SOAPNotesResponse>(`/api/notes/${sessionId}`);
  },

  /**
   * Update SOAP notes for a session
   */
  async updateNotes(
    sessionId: string,
    soap: Partial<SOAPNotes>
  ): Promise<SOAPNotesResponse> {
    return apiRequest<SOAPNotesResponse>(`/api/notes/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({ soap }),
    });
  },
};

/**
 * Alerts API
 */
export const alertsApi = {
  /**
   * Get all alerts
   */
  async getAlerts(): Promise<AlertsResponse> {
    return apiRequest<AlertsResponse>("/api/alerts");
  },

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(
      `/api/alerts/${alertId}/acknowledge`,
      {
        method: "POST",
      }
    );
  },
};
