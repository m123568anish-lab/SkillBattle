import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

const normalizeBaseUrl = (url?: string) => {
  if (!url) return "http://localhost:8000";
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL
);

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ----------------------------
// Request Interceptor
// ----------------------------

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("accessToken") ??
        localStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  }
);

// ----------------------------
// Response Interceptor
// ----------------------------

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("refresh_token");

        if (typeof window !== "undefined") {
          const PUBLIC_ROUTES = [
            "/",
            "/login",
            "/register",
            "/forgot-password",
            "/verify-email",
            "/reset-password",
          ];

          const pathname = window.location.pathname || "/";

          // Only redirect to login if we're not already on a public route
          if (!PUBLIC_ROUTES.includes(pathname)) {
            window.location.href = "/login";
          }
        }
    }

    return Promise.reject(error);
  }
);

export default api;