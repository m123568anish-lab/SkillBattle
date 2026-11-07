const LOCAL_API_ORIGIN = "http://localhost:8000";

/**
 * @param {string} value
 */
export function normalizeApiOrigin(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL must be an absolute HTTP(S) URL.");
  }

  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("NEXT_PUBLIC_API_URL must be an HTTP(S) origin without credentials.");
  }
  if (url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_API_URL cannot include a query string or fragment.");
  }

  const path = url.pathname.replace(/\/+$/, "");
  if (path && path !== "/api/v1") {
    throw new Error("NEXT_PUBLIC_API_URL must be an origin, optionally followed by /api/v1.");
  }

  return url.origin;
}

/**
 * @param {{ environment?: string; configuredUrl?: string }} [options]
 */
export function resolveApiOrigin(options = {}) {
  const environment = options.environment ?? process.env.NODE_ENV ?? "development";
  const configuredUrl = options.configuredUrl ?? process.env.NEXT_PUBLIC_API_URL;
  if (configuredUrl?.trim()) return normalizeApiOrigin(configuredUrl);
  if (environment === "development" || environment === "test") return LOCAL_API_ORIGIN;

  throw new Error(
    "NEXT_PUBLIC_API_URL is required outside development and test environments.",
  );
}

export const API_ORIGIN = resolveApiOrigin();
