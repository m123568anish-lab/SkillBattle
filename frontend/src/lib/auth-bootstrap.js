/**
 * Keep the initial auth screen finite even when a third-party session SDK
 * cannot finish loading (for example, after a blocked Clerk asset request).
 */
export const AUTH_BOOTSTRAP_TIMEOUT_MS = 5_000;

export function getAuthBootstrapDecision({ clerkLoaded, isSignedIn, hasLegacyToken, timedOut }) {
  if (!clerkLoaded && !hasLegacyToken && !timedOut) return "pending";
  if (isSignedIn || hasLegacyToken) return "resolve-session";
  if (!clerkLoaded && timedOut) return "unavailable";
  return "anonymous";
}
