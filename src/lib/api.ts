import axios from "axios";

const normalizeBaseUrl = (value: string | undefined) => {
  if (!value) {
    return "http://localhost:8000";
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const apiBaseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);

export const api = axios.create({
  baseURL: `${apiBaseUrl}/api/v1`,
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});