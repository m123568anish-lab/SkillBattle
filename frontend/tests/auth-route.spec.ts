import { expect, test } from "@playwright/test";

test("Auth route uses the local fixture for anonymous and authenticated sessions", async ({ request }) => {
  const anonymousResponse = await request.get("/api/auth/get-session");
  expect(anonymousResponse.ok()).toBeTruthy();
  expect(await anonymousResponse.json()).toMatchObject({ session: null, user: null });

  const authenticatedResponse = await request.get("/api/auth/get-session", {
    headers: { cookie: "__Secure-neon-auth.session_token=e2e-session-token" },
  });
  expect(authenticatedResponse.ok()).toBeTruthy();
  expect(await authenticatedResponse.json()).toMatchObject({
    session: { id: "e2e-session", userId: "e2e-neon-user" },
    user: { id: "e2e-neon-user", email: "student@example.com" },
  });
});
