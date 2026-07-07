import API from "@/lib/api";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "@/types/auth";

class AuthService {
  async register(data: RegisterRequest): Promise<User> {
    const response = await API.post("/auth/register", data);
    return response.data;
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await API.post("/auth/login", data);

    const result = response.data;

    localStorage.setItem(
      "access_token",
      result.tokens.access_token
    );

    localStorage.setItem(
      "refresh_token",
      result.tokens.refresh_token
    );

    return result;
  }

  async logout(): Promise<void> {
    const refresh_token = localStorage.getItem("refresh_token");

    if (refresh_token) {
      try {
        await API.post("/auth/logout", {
          refresh_token,
        });
      } catch {
        // Ignore logout API errors
      }
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  async getCurrentUser(): Promise<User> {
    const response = await API.get("/auth/me");
    return response.data;
  }

  async refreshToken(): Promise<string | null> {
    const refresh_token = localStorage.getItem("refresh_token");

    if (!refresh_token) {
      return null;
    }

    try {
      const response = await API.post("/auth/refresh", {
        refresh_token,
      });

      const accessToken = response.data.access_token;

      localStorage.setItem(
        "access_token",
        accessToken
      );

      return accessToken;
    } catch {
      await this.logout();
      return null;
    }
  }

  async changePassword(
    current_password: string,
    new_password: string,
  ) {
    return API.post("/auth/change-password", {
      current_password,
      new_password,
    });
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("access_token");
  }
}

export const authService = new AuthService();