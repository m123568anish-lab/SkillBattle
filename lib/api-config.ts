/**
 * API Configuration
 * Centralizes all API-related configuration
 */

const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",

  // API version
  VERSION: "v1",

  // Request timeout (ms)
  TIMEOUT: 30000,

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // ms
  },

  // Cache configuration
  CACHE: {
    QUERIES: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    MUTATIONS: {
      retry: 0,
    },
  },

  // Authentication
  AUTH: {
    TOKEN_KEY: "access_token",
    REFRESH_TOKEN_KEY: "refresh_token",
    EXPIRES_IN_KEY: "expires_in",
    HEADER: "Authorization",
    SCHEME: "Bearer",
  },

  // Environment
  ENVIRONMENT: process.env.NODE_ENV || "development",
};

export default API_CONFIG;
