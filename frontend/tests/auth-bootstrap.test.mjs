import assert from "node:assert/strict";
import test from "node:test";

import {
  AUTH_BOOTSTRAP_TIMEOUT_MS,
  getAuthBootstrapDecision,
} from "../src/lib/auth-bootstrap.js";

test("an unloaded Clerk client settles to a recoverable state instead of loading forever", () => {
  assert.equal(AUTH_BOOTSTRAP_TIMEOUT_MS, 5_000);
  assert.equal(
    getAuthBootstrapDecision({
      clerkLoaded: false,
      isSignedIn: false,
      hasLegacyToken: false,
      timedOut: true,
    }),
    "unavailable",
  );
});

test("a valid legacy token can resolve without waiting for Clerk", () => {
  assert.equal(
    getAuthBootstrapDecision({
      clerkLoaded: false,
      isSignedIn: false,
      hasLegacyToken: true,
      timedOut: false,
    }),
    "resolve-session",
  );
});
