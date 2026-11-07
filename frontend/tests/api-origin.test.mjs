import assert from "node:assert/strict";
import test from "node:test";

import { normalizeApiOrigin, resolveApiOrigin } from "../src/lib/api-origin.mjs";

test("normalizes the API origin and removes the version path", () => {
  assert.equal(
    normalizeApiOrigin("https://api.example.test/api/v1/"),
    "https://api.example.test",
  );
});

test("rejects URL credentials and unsupported path prefixes", () => {
  assert.throws(
    () => normalizeApiOrigin("https://user:pass@api.example.test"),
    /without credentials/,
  );
  assert.throws(
    () => normalizeApiOrigin("https://api.example.test/backend"),
    /optionally followed by \/api\/v1/,
  );
});

test("local and test environments have one localhost default", () => {
  assert.equal(resolveApiOrigin({ environment: "development" }), "http://localhost:8000");
  assert.equal(resolveApiOrigin({ environment: "test" }), "http://localhost:8000");
});

test("production has no silent fallback", () => {
  assert.throws(
    () => resolveApiOrigin({ environment: "production" }),
    /NEXT_PUBLIC_API_URL is required/,
  );
});
