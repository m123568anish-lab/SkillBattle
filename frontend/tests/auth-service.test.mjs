import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import typescript from "typescript";

const servicePath = fileURLToPath(new URL("../src/services/auth.service.ts", import.meta.url));
const serviceRequire = createRequire(servicePath);
const source = await import("node:fs/promises").then((fs) => fs.readFile(servicePath, "utf8"));
const compiled = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
}).outputText;

const apiCalls = [];
let postHandler;
let deleteHandler;
const api = {
  post: (...args) => {
    apiCalls.push({ method: "post", args });
    return postHandler(...args);
  },
  delete: (...args) => {
    apiCalls.push({ method: "delete", args });
    return deleteHandler(...args);
  },
};

const serviceModule = new Module(servicePath);
serviceModule.filename = servicePath;
serviceModule.paths = Module._nodeModulePaths(path.dirname(servicePath));
serviceModule.require = (specifier) =>
  specifier === "@/lib/api" ? { api } : serviceRequire(specifier);
serviceModule._compile(compiled, servicePath);
const { authService } = serviceModule.exports;

const storage = new Map();
const localStorage = {
  getItem(key) {
    return storage.get(key) ?? null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
};

function resetTestState() {
  storage.clear();
  apiCalls.length = 0;
  postHandler = async () => ({ data: {} });
  deleteHandler = async () => ({ data: { message: "Account deleted." } });
  globalThis.window = {};
  globalThis.localStorage = localStorage;
}

function makeAxiosError(status, detail) {
  return Object.assign(new Error("Request failed"), {
    isAxiosError: true,
    response: { status, data: { detail } },
  });
}

test("identity-link 401 string detail returns false without clearing application data", async () => {
  resetTestState();
  storage.set("access_token", "active-access");
  storage.set("refresh_token", "active-refresh");
  storage.set("profile-cache", "keep-me");
  postHandler = async () => {
    throw makeAxiosError(401, "Unable to link this Neon account with the supplied Qubira credentials.");
  };

  assert.equal(await authService.linkNeonIdentity("legacy-password"), false);
  assert.deepEqual([...storage.entries()], [
    ["access_token", "active-access"],
    ["refresh_token", "active-refresh"],
    ["profile-cache", "keep-me"],
  ]);
  assert.deepEqual(apiCalls.map(({ args }) => args[0]), ["/auth/neon/link"]);
});

test("identity-link 401 array detail supports string and msg entries", async () => {
  resetTestState();
  postHandler = async () => {
    throw makeAxiosError(401, [
      { loc: ["body", "password"], msg: "Invalid password." },
      "Unable to link this Neon account with the supplied Qubira credentials.",
    ]);
  };

  assert.equal(await authService.linkNeonIdentity("legacy-password"), false);
});

test("identity-link 401 nested object detail returns false", async () => {
  resetTestState();
  postHandler = async () => {
    throw makeAxiosError(401, {
      msg: "Unable to link this Neon account with the supplied Qubira credentials.",
    });
  };

  assert.equal(await authService.linkNeonIdentity("legacy-password"), false);
});

test("identity-link does not suppress unrelated authorization or server errors", async () => {
  for (const error of [
    makeAxiosError(403, "Unable to link this Neon account with the supplied Qubira credentials."),
    makeAxiosError(401, "Invalid Neon Auth session."),
    makeAxiosError(503, "Identity service unavailable."),
    new Error("Network failure"),
  ]) {
    resetTestState();
    postHandler = async () => {
      throw error;
    };

    await assert.rejects(authService.linkNeonIdentity("legacy-password"), error);
  }
});

test("successful login stores the returned access and refresh tokens", async () => {
  resetTestState();
  const user = { id: "user-1", email: "student@example.test" };
  postHandler = async () => ({
    data: {
      user,
      tokens: { access_token: "login-access", refresh_token: "login-refresh" },
    },
  });

  assert.deepEqual(await authService.login({ email: user.email, password: "password" }), user);
  assert.equal(localStorage.getItem("access_token"), "login-access");
  assert.equal(localStorage.getItem("refresh_token"), "login-refresh");
  assert.equal(apiCalls[0].args[0], "/auth/login");
});

test("successful refresh sends the stored refresh token and replaces both tokens", async () => {
  resetTestState();
  storage.set("access_token", "old-access");
  storage.set("refresh_token", "old-refresh");
  postHandler = async () => ({
    data: {
      access_token: "new-access",
      refresh_token: "new-refresh",
      expires_in: 3600,
    },
  });

  const result = await authService.refreshToken();
  assert.deepEqual(result, {
    access_token: "new-access",
    refresh_token: "new-refresh",
    expires_in: 3600,
  });
  assert.equal(localStorage.getItem("access_token"), "new-access");
  assert.equal(localStorage.getItem("refresh_token"), "new-refresh");
  assert.deepEqual(apiCalls[0].args, ["/auth/refresh", { refresh_token: "old-refresh" }]);
});

test("failed refresh rejects without overwriting existing auth or unrelated storage", async () => {
  resetTestState();
  storage.set("access_token", "current-access");
  storage.set("refresh_token", "expired-refresh");
  storage.set("dashboard-cache", "keep-me");
  const error = makeAxiosError(401, "Invalid refresh token.");
  postHandler = async () => {
    throw error;
  };

  await assert.rejects(authService.refreshToken(), error);
  assert.equal(localStorage.getItem("access_token"), "current-access");
  assert.equal(localStorage.getItem("refresh_token"), "expired-refresh");
  assert.equal(localStorage.getItem("dashboard-cache"), "keep-me");
});

test("logout clears both auth tokens even when revocation fails and preserves unrelated data", async () => {
  resetTestState();
  storage.set("access_token", "active-access");
  storage.set("refresh_token", "active-refresh");
  storage.set("dashboard-cache", "keep-me");
  postHandler = async () => {
    throw new Error("Revocation unavailable");
  };

  await authService.logout();
  assert.equal(localStorage.getItem("access_token"), null);
  assert.equal(localStorage.getItem("refresh_token"), null);
  assert.equal(localStorage.getItem("dashboard-cache"), "keep-me");
  assert.deepEqual(apiCalls[0].args, ["/auth/logout", { refresh_token: "active-refresh" }]);
});

test("account deletion clears both auth tokens only after the backend succeeds", async () => {
  resetTestState();
  storage.set("access_token", "active-access");
  storage.set("refresh_token", "active-refresh");
  storage.set("dashboard-cache", "keep-me");

  await authService.deleteAccount("DELETE", "password");
  assert.equal(localStorage.getItem("access_token"), null);
  assert.equal(localStorage.getItem("refresh_token"), null);
  assert.equal(localStorage.getItem("dashboard-cache"), "keep-me");
  assert.deepEqual(apiCalls[0].args, [
    "/auth/account",
    { data: { confirmation: "DELETE", password: "password" } },
  ]);

  resetTestState();
  storage.set("access_token", "still-active");
  storage.set("refresh_token", "still-refreshable");
  const error = makeAxiosError(403, "Account deletion denied.");
  deleteHandler = async () => {
    throw error;
  };

  await assert.rejects(authService.deleteAccount("DELETE"), error);
  assert.equal(localStorage.getItem("access_token"), "still-active");
  assert.equal(localStorage.getItem("refresh_token"), "still-refreshable");
});
