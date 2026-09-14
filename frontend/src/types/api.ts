/**
 * Shared TypeScript interfaces for all FastAPI API responses.
 * Every service layer should import from here — never use `any`.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Base response envelope
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  detail?: string | ApiValidationError[];
  path?: string;
}

export interface ApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth types
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  username: string;
  email: string;
  full_name: string;
  password: string;
  avatar_url?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts a human-readable error message from an ApiResponse or Axios error.
 */
export function formatApiError(err: unknown): string {
  if (!err || typeof err !== "object") return "An unexpected error occurred.";
  const e = err as Record<string, unknown>;

  const detail =
    (e?.response as Record<string, unknown>)?.data !== undefined
      ? ((e.response as Record<string, unknown>).data as Record<string, unknown>)?.detail
      : e?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((d) =>
        typeof d === "object" && d !== null ? (d as ApiValidationError).msg : String(d)
      )
      .join(", ");
  }

  return (e?.message as string) || "An unexpected error occurred.";
}
