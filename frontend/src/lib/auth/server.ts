import { createNeonAuth } from "@neon/auth/next/server";
import type { NeonAuth } from "@neon/auth/next/server";
import { getNeonAuthConfig } from "./config.mjs";

let auth: NeonAuth | undefined;

export function getAuth(): NeonAuth {
  auth ??= createNeonAuth(getNeonAuthConfig());
  return auth;
}
