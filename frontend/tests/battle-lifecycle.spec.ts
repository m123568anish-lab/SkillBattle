import { expect, test, type Browser, type Page, type APIRequestContext } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const API_ORIGIN = "http://127.0.0.1:8000";

interface BattleAccount {
  id: string;
  token: string;
}

async function createAccount(request: APIRequestContext, label: string): Promise<BattleAccount> {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
  const email = `${label}_${suffix}@example.com`;
  const password = "StrongPass#123";
  const registered = await request.post(`${API_ORIGIN}/api/v1/auth/register`, {
    data: {
      username: `${label}_${suffix}`.slice(0, 30),
      email,
      full_name: `Battle ${label}`,
      password,
    },
  });
  expect(registered.status(), await registered.text()).toBe(201);
  const login = await request.post(`${API_ORIGIN}/api/v1/auth/login`, {
    data: { email, password },
  });
  expect(login.status(), await login.text()).toBe(200);
  const payload = await login.json();
  const account = { id: payload.user.id, token: payload.tokens.access_token };
  const onboarding = await request.post(`${API_ORIGIN}/api/v1/profile/onboarding/complete`, {
    headers: { authorization: `Bearer ${account.token}` },
  });
  expect(onboarding.status(), await onboarding.text()).toBe(200);
  return account;
}

async function assertBattleHistory(
  request: APIRequestContext,
  account: BattleAccount,
  battleId: string,
) {
  const response = await request.get(`${API_ORIGIN}/api/v1/battle/history`, {
    headers: { authorization: `Bearer ${account.token}` },
  });
  expect(response.status(), await response.text()).toBe(200);
  expect((await response.json()).history.some(
    (record: { battle_id: string }) => record.battle_id === battleId,
  )).toBe(true);
}

async function openAuthenticatedPage(browser: Browser, account: BattleAccount): Promise<{
  page: Page;
  diagnostics: string[];
  close: () => Promise<void>;
}> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  await context.addCookies([{
    name: "__Secure-neon-auth.session_token",
    value: "e2e-cookie-session",
    url: "https://127.0.0.1:3001",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  }]);
  const page = await context.newPage();
  const diagnostics: string[] = [];
  page.on("pageerror", (error) => diagnostics.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") diagnostics.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    diagnostics.push(
      `requestfailed: ${request.method()} ${request.url()} (${request.failure()?.errorText ?? "unknown error"})`,
    );
  });
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const headers = await route.request().allHeaders();
    headers.authorization = `Bearer ${account.token}`;
    await route.fetch({
      url: `${API_ORIGIN}${url.pathname}${url.search}`,
      headers,
    }).then((response) => route.fulfill({ response }));
  });
  return {
    page,
    diagnostics,
    close: async () => {
      await context.close();
    },
  };
}

async function attachDiagnostics(
  testInfo: { attach: (name: string, options: { body: string; contentType: string }) => Promise<unknown> },
  name: string,
  diagnostics: string[],
) {
  const body = JSON.stringify(diagnostics, null, 2);
  const artifactDirectory = resolve(process.cwd(), "artifacts", "battle-lifecycle");
  mkdirSync(artifactDirectory, { recursive: true });
  writeFileSync(resolve(artifactDirectory, `${name}.json`), body);
  await testInfo.attach(name, {
    body,
    contentType: "application/json",
  });
}

async function attachScreenshot(testInfo: {
  attach: (name: string, options: { body: Buffer; contentType: string }) => Promise<unknown>;
}, name: string, page: Page, diagnostics: string[]) {
  const screenshotDirectory = resolve(process.cwd(), "artifacts", "battle-lifecycle");
  try {
    const session = await page.context().newCDPSession(page);
    const { data } = await session.send("Page.captureScreenshot", {
      format: "jpeg",
      quality: 50,
      fromSurface: true,
    });
    const screenshot = Buffer.from(data, "base64");
    mkdirSync(screenshotDirectory, { recursive: true });
    writeFileSync(resolve(screenshotDirectory, `${name}.jpg`), screenshot);
    await testInfo.attach(name, { body: screenshot, contentType: "image/jpeg" });
    await session.detach();
  } catch (error) {
    diagnostics.push(`screenshot: ${error instanceof Error ? error.message : "capture failed"}`);
  }
}

async function startRoom(page: Page) {
  const start = page.getByRole("button", { name: "Start Battle" });
  await expect(start).toBeVisible({ timeout: 15_000 });
  await start.click();
}

async function submitAllMcq(page: Page, count: number) {
  for (let index = 0; index < count; index += 1) {
    const answer = page.getByRole("radio").first();
    await expect(answer).toBeVisible({ timeout: 15_000 });
    await answer.check();
    await page.getByRole("button", { name: "Submit to Battle" }).click();
  }
  await expect(page.getByText("All your assigned questions are submitted.")).toBeVisible({ timeout: 15_000 });
}

async function finalize(page: Page) {
  await page.getByRole("button", { name: "Finalize Results" }).click();
  await expect(page.getByText("Battle results are saved.")).toBeVisible({ timeout: 15_000 });
}

async function createInviteRoom(page: Page, questionType: "mcq" | "coding"): Promise<string> {
  await page.goto("/battle/lobby");
  await page.getByRole("button", { name: questionType, exact: true }).click();
  const responsePromise = page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/battle/create"),
  );
  await page.getByRole("button", { name: "Create Battle Room" }).click();
  const response = await responsePromise;
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()).id as string;
}

async function joinInviteRoom(page: Page, battleId: string) {
  await page.goto("/battle/lobby");
  await page.getByPlaceholder("Paste battle ID").fill(battleId);
  await page.getByRole("button", { name: "Join Room" }).click();
  await expect(page).toHaveURL(new RegExp(`/battle/${battleId}`));
}

test("solo MCQ completes from assigned database questions through persisted results", async ({ browser, request }, testInfo) => {
  const account = await createAccount(request, "solo_mcq");
  const { page, diagnostics, close } = await openAuthenticatedPage(browser, account);
  await page.goto("/battle/solo?mode=mcq");
  await page.getByRole("button", { name: /Start MCQ Practice/ }).click();
  await expect(page).toHaveURL(/\/battle\/[^/]+$/, { timeout: 30_000 });
  await startRoom(page);
  await expect(page.getByText("Select one answer")).toBeVisible();
  await submitAllMcq(page, 10);
  await finalize(page);
  const battleId = new URL(page.url()).pathname.split("/").pop();
  await assertBattleHistory(request, account, battleId!);
  await attachScreenshot(testInfo, "solo-mcq-completed", page, diagnostics);
  await attachDiagnostics(testInfo, "solo-mcq-browser-diagnostics", diagnostics);
  await close();
});

test("solo coding runs a public sample and records the real hidden-test verdict", async ({ browser, request }, testInfo) => {
  const account = await createAccount(request, "solo_coding");
  const { page, diagnostics, close } = await openAuthenticatedPage(browser, account);
  await page.goto("/battle/solo?mode=coding");
  await page.getByRole("button", { name: /Launch Coding IDE/ }).click();
  await expect(page).toHaveURL(/\/battle\/[^?]+/, { timeout: 30_000 });
  await startRoom(page);
  const editor = page.locator(".monaco-editor").first();
  await expect(editor).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "javascript", exact: true }).click();
  await page.getByRole("button", { name: "python", exact: true }).click();
  await expect(page.getByRole("button", { name: "python", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Run public samples" }).click();
  await expect(page.getByText("1", { exact: true }).last()).toBeVisible({ timeout: 30_000 });
  const submissionResponse = page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/battle/submit-answer"),
  );
  await page.getByRole("button", { name: "Submit to Battle" }).click();
  const submission = await (await submissionResponse).json();
  expect(submission.verdict.toLowerCase()).toBe("accepted");
  expect(submission.passed_tests).toBe(submission.total_tests);
  await expect(page.getByText(/Last verdict: Accepted/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Finalize Results" }).click();
  await expect(page.getByText("Battle results are saved.")).toBeVisible({ timeout: 15_000 });
  const battleId = new URL(page.url()).pathname.split("/").pop();
  await assertBattleHistory(request, account, battleId!);
  await attachScreenshot(testInfo, "solo-coding-completed", page, diagnostics);
  await attachDiagnostics(testInfo, "solo-coding-browser-diagnostics", diagnostics);
  await close();
});

test("two users complete a multiplayer MCQ room and see persisted results", async ({ browser, request }, testInfo) => {
  const hostAccount = await createAccount(request, "duo_mcq_host");
  const peerAccount = await createAccount(request, "duo_mcq_peer");
  const host = await openAuthenticatedPage(browser, hostAccount);
  const peer = await openAuthenticatedPage(browser, peerAccount);
  const battleId = await createInviteRoom(host.page, "mcq");
  await host.page.getByRole("button", { name: "Enter Room" }).click();
  await joinInviteRoom(peer.page, battleId);
  await expect(host.page.getByText("2 / 2 Players")).toBeVisible({ timeout: 15_000 });
  await startRoom(host.page);
  await expect(host.page.getByRole("radio").first()).toBeVisible();
  await expect(peer.page.getByRole("radio").first()).toBeVisible();
  await host.page.getByRole("radio").first().check();
  await host.page.getByRole("button", { name: "Submit to Battle" }).click();
  await peer.page.getByRole("radio").first().check();
  await peer.page.getByRole("button", { name: "Submit to Battle" }).click();
  await finalize(peer.page);
  await expect(host.page.getByText("Battle results are saved.")).toBeVisible({ timeout: 15_000 });
  await assertBattleHistory(request, hostAccount, battleId);
  await assertBattleHistory(request, peerAccount, battleId);
  await attachScreenshot(testInfo, "multiplayer-mcq-completed", host.page, host.diagnostics);
  await attachDiagnostics(testInfo, "multiplayer-mcq-host-diagnostics", host.diagnostics);
  await attachDiagnostics(testInfo, "multiplayer-mcq-peer-diagnostics", peer.diagnostics);
  await host.close();
  await peer.close();
});

test("two users complete a multiplayer coding room with independent judged submissions", async ({ browser, request }, testInfo) => {
  const hostAccount = await createAccount(request, "duo_code_host");
  const peerAccount = await createAccount(request, "duo_code_peer");
  const host = await openAuthenticatedPage(browser, hostAccount);
  const peer = await openAuthenticatedPage(browser, peerAccount);
  const battleId = await createInviteRoom(host.page, "coding");
  await host.page.getByRole("button", { name: "Enter Room" }).click();
  await joinInviteRoom(peer.page, battleId);
  await expect(host.page.getByText("2 / 2 Players")).toBeVisible({ timeout: 15_000 });
  await startRoom(host.page);
  await expect(host.page.getByRole("button", { name: "Submit to Battle" })).toBeVisible();
  await expect(peer.page.getByRole("button", { name: "Submit to Battle" })).toBeVisible({ timeout: 15_000 });
  const hostSubmissionResponse = host.page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/battle/submit-answer"),
  );
  await host.page.getByRole("button", { name: "Submit to Battle" }).click();
  const peerSubmissionResponse = peer.page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/battle/submit-answer"),
  );
  await peer.page.getByRole("button", { name: "Submit to Battle" }).click();
  const hostSubmission = await (await hostSubmissionResponse).json();
  const peerSubmission = await (await peerSubmissionResponse).json();
  expect(hostSubmission.verdict.toLowerCase()).toBe("accepted");
  expect(peerSubmission.verdict.toLowerCase()).toBe("accepted");
  expect(hostSubmission.user_id).toBe(hostAccount.id);
  expect(peerSubmission.user_id).toBe(peerAccount.id);
  expect(hostSubmission.question_id).toBe(peerSubmission.question_id);
  expect(hostSubmission.id).not.toBe(peerSubmission.id);
  await finalize(peer.page);
  await expect(host.page.getByText("Battle results are saved.")).toBeVisible({ timeout: 15_000 });
  await assertBattleHistory(request, hostAccount, battleId);
  await assertBattleHistory(request, peerAccount, battleId);
  await attachScreenshot(testInfo, "multiplayer-coding-completed", host.page, host.diagnostics);
  await attachDiagnostics(testInfo, "multiplayer-coding-host-diagnostics", host.diagnostics);
  await attachDiagnostics(testInfo, "multiplayer-coding-peer-diagnostics", peer.diagnostics);
  await host.close();
  await peer.close();
});
