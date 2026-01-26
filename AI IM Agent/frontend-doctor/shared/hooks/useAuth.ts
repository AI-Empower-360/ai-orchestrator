"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  authApi,
  getAuthToken,
  clearAuthToken,
  subscribeAuthToken,
  LoginRequest,
  LoginResponse,
} from "@/lib/api-client";
import { resetWebSocketClient } from "@/lib/websocket";

interface Doctor {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  doctor: Doctor | null;
  isLoading: boolean;
}

/**
 * Authentication hook
 * Manages doctor authentication state (HIPAA compliant - no localStorage)
 */
export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>(() => {
    const token = getAuthToken();
    return {
      isAuthenticated: !!token,
      doctor: null,
      isLoading: false,
    };
  });

  useEffect(() => {
    // Keep auth state in sync if token changes (e.g., API 401 clears token)
    const unsubscribe = subscribeAuthToken((nextToken) => {
      if (!nextToken) {
        setState({
          isAuthenticated: false,
          doctor: null,
          isLoading: false,
        });
        router.push("/login");
      } else {
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<LoginResponse> => {
      try {
        const response = await authApi.login(credentials);
        setState({
          isAuthenticated: true,
          doctor: response.doctor,
          isLoading: false,
        });
        return response;
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    authApi.logout();
    clearAuthToken();
    resetWebSocketClient();
    setState({
      isAuthenticated: false,
      doctor: null,
      isLoading: false,
    });
    router.push("/login");
  }, [router]);

  return {
    ...state,
    login,
    logout,
  };
}
