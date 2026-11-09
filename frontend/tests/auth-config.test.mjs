import assert from "node:assert/strict";
import test from "node:test";

import { getNeonAuthConfig } from "../src/lib/auth/config.mjs";

const validEnv = {
  NODE_ENV: "production",
  NEON_AUTH_BASE_URL: "https://auth.example.invalid/project",
  NEON_AUTH_COOKIE_SECRET: "a".repeat(32),
};

test("Neon Auth config names missing runtime variables without exposing values", () => {
  assert.throws(
    () => getNeonAuthConfig({ NODE_ENV: "production" }),
    /NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET/,
  );
});

test("missing runtime configuration also fails in isolated test mode", () => {
  assert.throws(
    () => getNeonAuthConfig({ NODE_ENV: "test" }),
    /NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET/,
  );
});

test("Neon Auth cookie secret must meet the SDK minimum", () => {
  assert.throws(
    () => getNeonAuthConfig({ ...validEnv, NEON_AUTH_COOKIE_SECRET: "short" }),
    /at least 32 characters/,
  );
});

test("production Neon Auth URLs must use HTTPS", () => {
  assert.throws(
    () => getNeonAuthConfig({ ...validEnv, NEON_AUTH_BASE_URL: "http://auth.example.invalid" }),
    /must use HTTPS in production/,
  );
});

test("Neon Auth config uses the supported baseUrl and cookies.secret shape", () => {
  assert.deepEqual(getNeonAuthConfig(validEnv), {
    baseUrl: "https://auth.example.invalid/project",
    cookies: { secret: "a".repeat(32) },
  });
});

test("Auth test mode accepts only the local test fixture", () => {
  assert.deepEqual(
    getNeonAuthConfig({
      NODE_ENV: "test",
      NEON_AUTH_BASE_URL: "http://127.0.0.1:8765",
      NEON_AUTH_COOKIE_SECRET: "t".repeat(32),
    }),
    {
      baseUrl: "http://127.0.0.1:8765",
      cookies: { secret: "t".repeat(32) },
    },
  );
  assert.throws(
    () =>
      getNeonAuthConfig({
        NODE_ENV: "development",
        QUBIRA_AUTH_TEST_MODE: "1",
        NEON_AUTH_BASE_URL: "https://auth.example.invalid",
        NEON_AUTH_COOKIE_SECRET: "t".repeat(32),
      }),
    /loopback NEON_AUTH_BASE_URL/,
  );
});
