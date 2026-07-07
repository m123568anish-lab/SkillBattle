import { create } from "zustand";
import { authService } from "@/services/auth.service";
import { LoginRequest, User } from "@/types/auth";

interface AuthState {
  user: User | null;

  loading: boolean;

  isAuthenticated: boolean;

  login: (data: LoginRequest) => Promise<void>;

  logout: () => Promise<void>;

  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  loading: false,

  isAuthenticated: false,

  login: async (data) => {
    set({ loading: true });

    try {
      await authService.login(data);

      const user = await authService.getCurrentUser();

      set({
        user,
        loading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      set({
        loading: false,
      });

      throw error;
    }
  },

  logout: async () => {
    await authService.logout();

    set({
      user: null,
      isAuthenticated: false,
    });
  },

  loadUser: async () => {
    try {
      const user = await authService.getCurrentUser();

      set({
        user,
        isAuthenticated: true,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },
}));