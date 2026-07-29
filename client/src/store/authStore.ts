import { create } from "zustand";
import type { AuthUser } from "@flowengine/shared";
import { getCurrentUser, loginUser, registerUser } from "@/lib/api";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/authToken";

interface AuthState {
  user: AuthUser | null;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const applyAuthResponse = (response: Awaited<ReturnType<typeof loginUser>>): AuthUser => {
  setAuthToken(response.token);
  return response.user;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isReady: false,
  isLoading: false,
  error: null,
  bootstrap: async () => {
    const token = getAuthToken();

    if (!token) {
      set({ user: null, isReady: true, error: null });
      return;
    }

    try {
      const { user } = await getCurrentUser();
      set({ user, isReady: true, error: null });
    } catch {
      clearAuthToken();
      set({ user: null, isReady: true, error: null });
    }
  },
  login: async (username, password) => {
    set({ isLoading: true, error: null });

    try {
      const user = applyAuthResponse(await loginUser(username, password));
      set({ user, isReady: true, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unable to log in.",
        isLoading: false
      });
    }
  },
  register: async (username, password) => {
    set({ isLoading: true, error: null });

    try {
      const user = applyAuthResponse(await registerUser(username, password));
      set({ user, isReady: true, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unable to register.",
        isLoading: false
      });
    }
  },
  logout: () => {
    clearAuthToken();
    set({ user: null, error: null, isReady: true, isLoading: false });
  }
}));
