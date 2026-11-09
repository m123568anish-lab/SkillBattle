export function getNeonAuthConfig(env = process.env) {
  const baseUrl = env.NEON_AUTH_BASE_URL?.trim();
  const cookieSecret = env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !cookieSecret) {
    const missing = [
      !baseUrl && "NEON_AUTH_BASE_URL",
      !cookieSecret && "NEON_AUTH_COOKIE_SECRET",
    ].filter(Boolean);
    throw new Error(`Neon Auth is not configured. Set ${missing.join(" and ")}.`);
  }
  if (cookieSecret.length < 32) {
    throw new Error("NEON_AUTH_COOKIE_SECRET must contain at least 32 characters.");
  }

  let parsedBaseUrl;
  try {
    parsedBaseUrl = new URL(baseUrl);
  } catch {
    throw new Error("NEON_AUTH_BASE_URL must be an absolute HTTP(S) URL.");
  }
  if (
    !["http:", "https:"].includes(parsedBaseUrl.protocol) ||
    parsedBaseUrl.username ||
    parsedBaseUrl.password
  ) {
    throw new Error("NEON_AUTH_BASE_URL must be an HTTP(S) URL without credentials.");
  }
  const testMode = env.NODE_ENV === "test" || env.QUBIRA_AUTH_TEST_MODE === "1";
  if (
    testMode &&
    !["localhost", "127.0.0.1", "::1"].includes(parsedBaseUrl.hostname.toLowerCase())
  ) {
    throw new Error("Test Auth configuration must use a loopback NEON_AUTH_BASE_URL.");
  }
  if (env.NODE_ENV === "production" && parsedBaseUrl.protocol !== "https:") {
    throw new Error("NEON_AUTH_BASE_URL must use HTTPS in production.");
  }

  return {
    baseUrl: parsedBaseUrl.toString().replace(/\/+$/, ""),
    cookies: { secret: cookieSecret },
  };
}
