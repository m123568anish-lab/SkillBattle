import { createServer } from "node:http";

const sessionCookie = "__Secure-neon-auth.session_token=e2e-session-token";
const now = new Date();
const session = {
  id: "e2e-session",
  token: "e2e-session-token",
  userId: "e2e-neon-user",
  expiresAt: new Date("2030-01-01T00:00:00.000Z").toISOString(),
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
};
const user = {
  id: "e2e-neon-user",
  email: "student@example.com",
  name: "E2E Student",
  emailVerified: true,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
};

const server = createServer((request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.url === "/health") {
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (request.url === "/get-session") {
    const authenticated = request.headers.cookie?.includes(sessionCookie) ?? false;
    response.end(JSON.stringify(
      authenticated ? { session, user } : { session: null, user: null },
    ));
    return;
  }

  if (request.url === "/get-access-token") {
    const authenticated = request.headers.cookie?.includes(sessionCookie) ?? false;
    response.end(JSON.stringify(
      authenticated ? { token: "e2e-access-token" } : { token: null },
    ));
    return;
  }

  response.statusCode = 404;
  response.end(JSON.stringify({ message: "Not found" }));
});

server.listen(8765, "127.0.0.1");
