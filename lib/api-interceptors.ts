/**
 * API Request/Response Interceptor Utilities
 * Provides helper functions for common request/response scenarios
 */

import API from "./api";
import API_CONFIG from "./api-config";
import { APIErrorHandler } from "./api-error";

/**
 * Setup API interceptors for authentication and error handling
 */
export function setupAPIInterceptors(
  onAuthFailed?: () => void
) {
  // Request interceptor
  API.interceptors.request.use(
    (config) => {
      // Add auth token if available
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(
          API_CONFIG.AUTH.TOKEN_KEY
        );
        if (token) {
          config.headers[API_CONFIG.AUTH.HEADER] =
            `${API_CONFIG.AUTH.SCHEME} ${token}`;
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  API.interceptors.response.use(
    (response) => response,
    async (error) => {
      const apiError = APIErrorHandler.handle(error);

      // Handle 401 Unauthorized
      if (
        APIErrorHandler.isUnauthorized(apiError)
      ) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(
            API_CONFIG.AUTH.TOKEN_KEY
          );
          localStorage.removeItem(
            API_CONFIG.AUTH.REFRESH_TOKEN_KEY
          );
        }
        onAuthFailed?.();
      }

      // Handle 403 Forbidden
      if (APIErrorHandler.isForbidden(apiError)) {
        console.error("Access forbidden:", apiError);
      }

      // Handle 5xx Server Errors
      if (APIErrorHandler.isServerError(apiError)) {
        console.error("Server error:", apiError);
      }

      return Promise.reject(apiError);
    }
  );
}

/**
 * Add request logging in development
 */
export function enableRequestLogging() {
  if (API_CONFIG.ENVIRONMENT === "development") {
    API.interceptors.request.use((config) => {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    API.interceptors.response.use(
      (response) => {
        console.log(`📥 ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(
          `❌ ${error.response?.status || "ERR"} ${error.config?.url}`
        );
        return Promise.reject(error);
      }
    );
  }
}

/**
 * Retry configuration for failed requests
 */
export function configureRetryStrategy() {
  API.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;

      // Don't retry if already retried
      if (!config || !error.response) {
        return Promise.reject(error);
      }

      config.retryCount = config.retryCount || 0;

      // Only retry on specific status codes
      const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

      if (
        config.retryCount < API_CONFIG.RETRY.MAX_ATTEMPTS &&
        retryableStatusCodes.includes(
          error.response.status
        )
      ) {
        config.retryCount += 1;

        // Exponential backoff
        const delay =
          API_CONFIG.RETRY.DELAY *
          Math.pow(2, config.retryCount - 1);

        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );

        return API(config);
      }

      return Promise.reject(error);
    }
  );
}
