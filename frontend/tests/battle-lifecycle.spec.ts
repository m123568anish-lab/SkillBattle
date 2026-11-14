import { expect, test, type Browser, type Page, type APIRequestContext } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const APP_ORIGIN = process.env.QUBIRA_PLAYWRIGHT_BASE_URL ?? "https://127.0.0.1:3001";
const ARTIFACT_DIRECTORY = process.env.QUBIRA_BATTLE_ARTIFACT_DIR ?? resolve(process.cwd(), "artifacts", "battle-lifecycle");

interface BattleAccount {
  id: string;
  token: string;
  email: string;
  password: string;
}

interface AuthenticatedBattlePage {
  page: Page;
  diagnostics: string[];
  socketEvents: string[];
  close: () => Promise<void>;
}

async function createAccount(request: APIRequestContext, label: string): Promise<BattleAccount> {
  const readiness = await request.get(`${API_ORIGIN}/ready`);
  const readinessData = await readiness.json();
  expect(readinessData.database).toBe("connected");
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
  const account = { id: payload.user.id, token: payload.tokens.access_token, email, password };
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
): Promise<Record<string, unknown>> {
  const response = await request.get(`${API_ORIGIN}/api/v1/battle/history`, {
    headers: { authorization: `Bearer ${account.token}` },
  });
  expect(response.status(), await response.text()).toBe(200);
  const payload = await response.json();
  const record = payload.history.find(
    (item: { battle_id: string }) => item.battle_id === battleId,
  ) as Record<string, unknown> | undefined;
  expect(record, JSON.stringify(payload)).toBeDefined();
  return record!;
}

async function loadBattleProgress(
  request: APIRequestContext,
  account: BattleAccount,
  battleId: string,
) {
  const headers = { authorization: `Bearer ${account.token}` };
  const [xpResponse, historyResponse, dashboardResponse] = await Promise.all([
    request.get(`${API_ORIGIN}/api/v1/xp`, { headers }),
    request.get(`${API_ORIGIN}/api/v1/xp/history`, { headers }),
    request.get(`${API_ORIGIN}/api/v1/dashboard`, { headers }),
  ]);
  expect(xpResponse.status(), await xpResponse.text()).toBe(200);
  expect(historyResponse.status(), await historyResponse.text()).toBe(200);
  expect(dashboardResponse.status(), await dashboardResponse.text()).toBe(200);
  const xp = await xpResponse.json();
  const history = await historyResponse.json();
  const dashboard = await dashboardResponse.json();
  return {
    totalXp: xp.total_xp as number,
    level: xp.level as number,
    rating: dashboard.stats.rating as number,
    battleAwards: history.filter(
      (entry: { source: string; reference_id: string | null }) =>
        entry.source === "battle" && entry.reference_id === battleId,
    ).length as number,
  };
}

async function openAuthenticatedPage(
  browser: Browser,
  account: BattleAccount,
): Promise<AuthenticatedBattlePage> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  await context.addCookies([{
    name: "__Secure-neon-auth.session_token",
    value: "e2e-cookie-session",
    url: APP_ORIGIN,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  }]);
  const page = await context.newPage();
  const diagnostics: string[] = [];
  const socketEvents: string[] = [];
  const authRequestStartedAt = new WeakMap<object, number>();
  page.on("pageerror", (error) => diagnostics.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") diagnostics.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    const requestUrl = new URL(request.url());
    if (requestUrl.pathname.startsWith("/api/auth/")) {
      diagnostics.push(`Auth ${request.method()} ${requestUrl.pathname} failed: ${request.failure()?.errorText ?? "unknown error"}`);
    }
    diagnostics.push(
      `requestfailed: ${request.method()} ${request.url()} (${request.failure()?.errorText ?? "unknown error"})`,
    );
  });
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/auth/")) {
      authRequestStartedAt.set(request, Date.now());
    }
  });
  page.on("response", (response) => {
    const responseUrl = new URL(response.url());
    if (responseUrl.pathname.startsWith("/api/auth/")) {
      const startedAt = authRequestStartedAt.get(response.request());
      const elapsedMs = startedAt === undefined ? "unknown" : String(Date.now() - startedAt);
      void response.json().then((body: unknown) => {
        const payload = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
        const session = typeof payload.session === "object" && payload.session !== null
          ? payload.session as Record<string, unknown>
          : {};
        const sessionToken = typeof session.token === "string" ? session.token : null;
        const responseToken = typeof payload.token === "string" ? payload.token : null;
        const tokenShape = sessionToken ?? responseToken;
        diagnostics.push(
          `Auth ${response.request().method()} ${responseUrl.pathname} HTTP ${response.status()} in ${elapsedMs}ms; session=${Boolean(payload.session)}; tokenSegments=${tokenShape?.split(".").length ?? 0}`,
        );
      }).catch(() => {
        diagnostics.push(`Auth ${response.request().method()} ${responseUrl.pathname} HTTP ${response.status()} in ${elapsedMs}ms; body=non-json`);
      });
    }
  });
  page.on("websocket", (socket) => {
    socket.on("framereceived", ({ payload }) => {
      if (typeof payload !== "string") return;
      try {
        const message = JSON.parse(payload) as { event?: unknown };
        if (typeof message.event === "string") socketEvents.push(message.event);
      } catch {
        diagnostics.push("websocket: received a malformed JSON frame");
      }
    });
  });
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const headers = await route.request().allHeaders();
    headers.authorization = `Bearer ${account.token}`;
    const fetchOptions = {
      url: `${API_ORIGIN}${url.pathname}${url.search}`,
      headers,
      ...(route.request().method() === "GET" ? { maxRetries: 1 } : {}),
    };
    await route.fetch(fetchOptions).then((response) => route.fulfill({ response }));
  });
  const authenticatedUserResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "GET" && response.url().endsWith("/api/v1/auth/me"),
  );
  const dashboardResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "GET" && response.url().endsWith("/api/v1/dashboard"),
  );
  await page.goto("/dashboard");
  const [authenticatedUserResponse, dashboardResponse] = await Promise.all([
    authenticatedUserResponsePromise,
    dashboardResponsePromise,
  ]);
  expect(authenticatedUserResponse.status(), await authenticatedUserResponse.text()).toBe(200);
  expect(dashboardResponse.status(), await dashboardResponse.text()).toBe(200);
  diagnostics.push("Auth readiness: Neon session resolved and backend /auth/me and /dashboard both returned HTTP 200");
  return {
    page,
    diagnostics,
    socketEvents,
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
  const artifactDirectory = ARTIFACT_DIRECTORY;
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
  const screenshotDirectory = ARTIFACT_DIRECTORY;
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
  const startResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "POST" && /\/battle\/[^/]+\/start$/.test(response.url()),
  );
  await start.click();
  const startResponse = await startResponsePromise;
  expect(startResponse.status(), await startResponse.text()).toBe(200);
  await expect(page.getByText(/Status: running/)).toBeVisible({ timeout: 30_000 });
}

async function submitAllMcq(
  page: Page,
  count: number,
  diagnostics: string[],
  request: APIRequestContext,
  account: BattleAccount,
  battleId: string,
) {
  for (let index = 0; index < count; index += 1) {
    const title = await page.locator("article h3").innerText();
    const answer = page.getByRole("radio").first();
    await expect(answer).toBeVisible({ timeout: 15_000 });
    await answer.check();
    await expect(answer).toBeChecked();
    const submit = page.getByRole("button", { name: "Submit to Battle" });
    await expect(submit).toBeEnabled();
    const responsePromise = page.waitForResponse((response) =>
      response.request().method() === "POST" && response.url().endsWith("/battle/submit-answer"),
    );
    await submit.click();
    const response = await responsePromise;
    const submission = await response.json();
    expect(response.status(), JSON.stringify(submission)).toBe(200);
    expect(typeof submission.verdict).toBe("string");
    diagnostics.push(`MCQ submission HTTP ${response.status()}: ${submission.verdict}`);
    await expect(page.getByText(`Last verdict: ${submission.verdict}`, { exact: false })).toBeVisible();

    if (index === 0) {
      const scoreBeforeDuplicateResponse = await request.get(
        `${API_ORIGIN}/api/v1/battle/${encodeURIComponent(battleId)}/participants`,
        { headers: { authorization: `Bearer ${account.token}` } },
      );
      expect(scoreBeforeDuplicateResponse.status(), await scoreBeforeDuplicateResponse.text()).toBe(200);
      const scoreBeforeDuplicate = (await scoreBeforeDuplicateResponse.json()).find(
        (participant: { user_id: string }) => participant.user_id === account.id,
      ).score as number;
      const duplicate = await request.post(`${API_ORIGIN}/api/v1/battle/submit-answer`, {
        headers: { authorization: `Bearer ${account.token}` },
        data: response.request().postDataJSON(),
      });
      const duplicateBody = await duplicate.json();
      expect(duplicate.status(), JSON.stringify(duplicateBody)).toBe(400);
      expect(duplicateBody.detail).toBe("This question has already been submitted.");
      const conflictingPayload = response.request().postDataJSON();
      conflictingPayload.mcq_option = conflictingPayload.mcq_option === "A" ? "B" : "A";
      const conflicting = await request.post(`${API_ORIGIN}/api/v1/battle/submit-answer`, {
        headers: { authorization: `Bearer ${account.token}` },
        data: conflictingPayload,
      });
      const conflictBody = await conflicting.json();
      expect(conflicting.status(), JSON.stringify(conflictBody)).toBe(400);
      expect(conflictBody.detail).toBe("This question has already been submitted.");
      const scoreAfterDuplicateResponse = await request.get(
        `${API_ORIGIN}/api/v1/battle/${encodeURIComponent(battleId)}/participants`,
        { headers: { authorization: `Bearer ${account.token}` } },
      );
      expect(scoreAfterDuplicateResponse.status(), await scoreAfterDuplicateResponse.text()).toBe(200);
      const scoreAfterDuplicate = (await scoreAfterDuplicateResponse.json()).find(
        (participant: { user_id: string }) => participant.user_id === account.id,
      ).score as number;
      expect(scoreAfterDuplicate).toBe(scoreBeforeDuplicate);
      diagnostics.push(`Duplicate replay HTTP ${duplicate.status()}; conflicting answer HTTP ${conflicting.status()}; score unchanged at ${scoreAfterDuplicate}`);
    }

    if (index < count - 1) {
      const nextQuestion = page.locator("article h3");
      await expect(nextQuestion).not.toHaveText(title);
      if (index === 0) {
        const submittedQuestionId = response.request().postDataJSON().question_id as number;
        const refreshedBattlePromise = page.waitForResponse((refreshedResponse) =>
          refreshedResponse.request().method() === "GET" &&
          refreshedResponse.url().endsWith(`/battle/${encodeURIComponent(battleId)}`),
        );
        await page.reload();
        const refreshedBattleResponse = await refreshedBattlePromise;
        expect(refreshedBattleResponse.status()).toBe(200);
        const refreshedBattle = await refreshedBattleResponse.json();
        expect(refreshedBattle.submitted_question_ids).toContain(submittedQuestionId);
        const expectedQuestion = refreshedBattle.questions_data[0].questions.find(
          (question: { id: number }) => !refreshedBattle.submitted_question_ids.includes(question.id),
        );
        expect(expectedQuestion).toBeDefined();
        diagnostics.push(`Refresh GET HTTP 200: submitted IDs ${JSON.stringify(refreshedBattle.submitted_question_ids)}; next question ${expectedQuestion.id}`);
        await expect(page.locator("article h3")).toHaveText(expectedQuestion.title, { timeout: 15_000 });
      }
    }
  }
  await expect(page.getByText("All your assigned questions are submitted.")).toBeVisible({ timeout: 15_000 });
}

async function finalize(page: Page) {
  const finishResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "POST" && /\/battle\/[^/]+\/finish$/.test(response.url()),
  );
  await page.getByRole("button", { name: "Finalize Results" }).click();
  const finishResponse = await finishResponsePromise;
  expect(finishResponse.status(), await finishResponse.text()).toBe(200);
  await page.reload();
  await expect(page.getByText("Battle results are saved.")).toBeVisible({ timeout: 15_000 });
}

async function createInviteRoom(
  page: Page,
  questionType: "mcq" | "coding",
  diagnostics: string[] = [],
): Promise<string> {
  try {
    await page.goto("/battle/lobby");
    await expect(page.getByRole("button", { name: questionType, exact: true })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: questionType, exact: true }).click();
    const responsePromise = page.waitForResponse((response) =>
      response.request().method() === "POST" && response.url().endsWith("/battle/create"),
    );
    await page.getByRole("button", { name: "Create Battle Room" }).click();
    const response = await responsePromise;
    expect(response.status(), await response.text()).toBe(200);
    const battleId = (await response.json()).id as string | undefined;
    expect(typeof battleId).toBe("string");
    expect(battleId?.trim()).not.toBe("");
    return battleId!.trim();
  } catch (error) {
    diagnostics.push(`Room creation failed: URL=${page.url()}, body=${(await page.locator("body").innerText().catch(() => "unavailable")).slice(0, 1200)}`);
    throw error;
  }
}

async function enterInviteRoom(page: Page, battleId: string) {
  await page.getByRole("button", { name: "Enter Room" }).click();
  const expectedRoomPath = `/battle/${encodeURIComponent(battleId)}`;
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 15_000 }).toBe(expectedRoomPath);
  expect(new URL(page.url()).pathname).toBe(expectedRoomPath);
  await expect(page.getByText("Live Duel Room", { exact: true })).toBeVisible();
}

async function joinInviteRoom(page: Page, battleId: string, diagnostics?: string[]) {
  await page.goto("/battle/lobby");
  await page.getByPlaceholder("Paste battle ID").fill(battleId);
  const joinRequestPromise = page.waitForRequest((request) =>
    request.method() === "POST" && request.url().endsWith("/battle/join"),
  );
  const joinResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/battle/join"),
  );
  const joinStartedAt = Date.now();
  await page.getByRole("button", { name: "Join Room" }).click();
  const [joinRequest, joinResponse] = await Promise.all([joinRequestPromise, joinResponsePromise]);
  const joinBody = await joinResponse.text();
  let joinedBattle: { id?: string; status?: string } = {};
  try {
    joinedBattle = JSON.parse(joinBody) as typeof joinedBattle;
  } catch {
    joinedBattle = {};
  }
  const requestedBattleId = joinRequest.postDataJSON()?.battle_id;
  diagnostics?.push(
    `Join POST HTTP ${joinResponse.status()} in ${Date.now() - joinStartedAt}ms: requested=${requestedBattleId ?? "missing"}, returned=${joinedBattle.id ?? "missing"}, status=${joinedBattle.status ?? "missing"}`,
  );
  expect(requestedBattleId).toBe(battleId);
  expect(joinResponse.status(), joinBody).toBe(200);
  expect(joinedBattle.id, joinBody).toBe(battleId);
  const expectedRoomPath = `/battle/${encodeURIComponent(battleId)}`;
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 15_000 }).toBe(expectedRoomPath);
  expect(new URL(page.url()).pathname).toBe(expectedRoomPath);
  await expect(page.getByText("Live Duel Room", { exact: true })).toBeVisible();
}

test("solo MCQ completes from assigned database questions through persisted results", async ({ browser, request }, testInfo) => {
  const account = await createAccount(request, "solo_mcq");
  const { page, diagnostics, close } = await openAuthenticatedPage(browser, account);
  let createRequestCount = 0;
  page.on("request", (browserRequest) => {
    if (browserRequest.method() === "POST" && browserRequest.url().endsWith("/battle/create")) {
      createRequestCount += 1;
    }
  });
  await page.goto("/battle/solo?mode=mcq");
  await page.locator("select").nth(1).selectOption("5");
  const createResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/battle/create"),
  );
  await page.getByRole("button", { name: /Start MCQ Practice/ }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status(), await createResponse.text()).toBe(200);
  const createdBattle = await createResponse.json() as { id?: unknown; title?: unknown };
  expect(typeof createdBattle.id).toBe("string");
  const battleId = (createdBattle.id as string).trim();
  expect(battleId).not.toBe("");
  expect(typeof createdBattle.title).toBe("string");
  diagnostics.push(`Battle create HTTP ${createResponse.status()}: ${battleId}`);
  const expectedRoomPath = `/battle/${encodeURIComponent(battleId)}`;
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 30_000 }).toBe(expectedRoomPath);
  expect(new URL(page.url()).pathname).toBe(expectedRoomPath);
  expect(createRequestCount).toBe(1);
  await expect(page.getByRole("heading", { level: 1, name: createdBattle.title as string })).toBeVisible();
  const canonicalBattle = await request.get(`${API_ORIGIN}/api/v1/battle/${encodeURIComponent(battleId)}`, {
    headers: { authorization: `Bearer ${account.token}` },
  });
  expect(canonicalBattle.status(), await canonicalBattle.text()).toBe(200);
  expect((await canonicalBattle.json()).id).toBe(battleId);
  const beforeBattle = await loadBattleProgress(request, account, battleId);
  await startRoom(page);
  await expect(page.getByText("Select one answer")).toBeVisible();
  await submitAllMcq(page, 5, diagnostics, request, account, battleId);
  await finalize(page);
  await page.reload();
  await expect(page.getByText("Battle results are saved.")).toBeVisible({ timeout: 15_000 });
  const persistedBattle = await request.get(`${API_ORIGIN}/api/v1/battle/${battleId}`, {
    headers: { authorization: `Bearer ${account.token}` },
  });
  expect(persistedBattle.status(), `battle=${battleId} ${await persistedBattle.text()}`).toBe(200);
  const result = await request.get(`${API_ORIGIN}/api/v1/battle/${battleId}/result`, {
    headers: { authorization: `Bearer ${account.token}` },
  });
  expect(result.status(), `battle=${battleId} ${await result.text()}`).toBe(200);
  const resultData = await result.json();
  expect(resultData.battle_id).toBe(battleId);
  diagnostics.push(`Result GET HTTP ${result.status()}: ${JSON.stringify({ battle_id: resultData.battle_id, winner_id: resultData.winner_id, winner_score: resultData.winner_score, is_draw: resultData.is_draw, total_players: resultData.total_players })}`);
  const historyRecord = await assertBattleHistory(request, account, battleId);
  diagnostics.push(`History GET HTTP 200: ${JSON.stringify(historyRecord)}`);
  const reauthenticated = await request.post(`${API_ORIGIN}/api/v1/auth/login`, {
    data: { email: account.email, password: account.password },
  });
  expect(reauthenticated.status(), await reauthenticated.text()).toBe(200);
  const newSessionToken = (await reauthenticated.json()).tokens.access_token as string;
  const newSessionHistory = await request.get(`${API_ORIGIN}/api/v1/battle/history`, {
    headers: { authorization: `Bearer ${newSessionToken}` },
  });
  expect(newSessionHistory.status(), await newSessionHistory.text()).toBe(200);
  expect((await newSessionHistory.json()).history.some(
    (record: { battle_id: string }) => record.battle_id === battleId,
  )).toBe(true);
  diagnostics.push(`New session history GET HTTP ${newSessionHistory.status()}: battle ${battleId}`);
  const afterBattle = await loadBattleProgress(request, account, battleId);
  expect(afterBattle.totalXp).toBeGreaterThan(beforeBattle.totalXp);
  expect(afterBattle.level).toBeGreaterThanOrEqual(beforeBattle.level);
  expect(afterBattle.rating).not.toBe(beforeBattle.rating);
  expect(afterBattle.battleAwards).toBe(1);
  const repeatedFinish = await request.post(`${API_ORIGIN}/api/v1/battle/${battleId}/finish`, {
    headers: { authorization: `Bearer ${account.token}` },
  });
  expect(repeatedFinish.status(), await repeatedFinish.text()).toBe(200);
  expect(await loadBattleProgress(request, account, battleId)).toEqual(afterBattle);
  diagnostics.push("Repeated finish HTTP 200; XP, level, rating, and battle award count unchanged");
  await attachScreenshot(testInfo, "solo-mcq-completed", page, diagnostics);
  await attachDiagnostics(testInfo, "solo-mcq-browser-diagnostics", diagnostics);
  await close();
});

test("accepted submission recovers after its response is lost and retried", async ({ browser, request }, testInfo) => {
  const account = await createAccount(request, "retry_mcq");
  const { page, diagnostics, close } = await openAuthenticatedPage(browser, account);
  let loseFirstResponse = true;
  let acceptedSubmission: { question_id: number; score_earned: number } | null = null;
  await page.route("**/api/v1/battle/submit-answer", async (route) => {
    const requestUrl = new URL(route.request().url());
    const headers = await route.request().allHeaders();
    headers.authorization = `Bearer ${account.token}`;
    const response = await route.fetch({
      url: `${API_ORIGIN}${requestUrl.pathname}${requestUrl.search}`,
      headers,
    });
    if (loseFirstResponse) {
      loseFirstResponse = false;
      acceptedSubmission = await response.json();
      await response.dispose();
      await route.abort("failed");
      return;
    }
    await route.fulfill({ response });
  });

  const createResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/battle/create"),
  );
  await page.goto("/battle/solo/mcq?topic=Algorithms&count=5");
  const createResponse = await createResponsePromise;
  expect(createResponse.status(), await createResponse.text()).toBe(200);
  const createdBattle = await createResponse.json() as { id?: unknown };
  expect(typeof createdBattle.id).toBe("string");
  const battleId = (createdBattle.id as string).trim();
  expect(battleId).not.toBe("");
  diagnostics.push(`Battle create HTTP ${createResponse.status()}: ${battleId}`);
  const expectedRoomPath = `/battle/${encodeURIComponent(battleId)}`;
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 30_000 }).toBe(expectedRoomPath);
  await startRoom(page);
  await page.getByRole("radio").first().check();
  const submittedQuestionTitle = await page.locator("article h3").innerText();
  const submit = page.getByRole("button", { name: "Submit to Battle" });
  const retryResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "POST" &&
    response.url().endsWith("/battle/submit-answer") &&
    response.status() === 400,
  );
  const failedRequest = page.waitForEvent("requestfailed", (browserRequest) =>
    browserRequest.url().endsWith("/battle/submit-answer"),
  );
  await submit.click();
  await failedRequest;
  const retryResponse = await retryResponsePromise;
  expect(acceptedSubmission?.score_earned).toEqual(expect.any(Number));
  diagnostics.push("First submit reached backend and was accepted; browser response intentionally dropped");

  expect(retryResponse.status()).toBe(400);
  expect((await retryResponse.json()).detail).toBe("This question has already been submitted.");
  const persistedAfterRetry = await request.get(`${API_ORIGIN}/api/v1/battle/${battleId}`, {
    headers: { authorization: `Bearer ${account.token}` },
  });
  expect(persistedAfterRetry.status(), await persistedAfterRetry.text()).toBe(200);
  expect((await persistedAfterRetry.json()).submitted_question_ids).toContain(acceptedSubmission?.question_id);
  await expect(page.locator("article h3")).not.toHaveText(submittedQuestionTitle, { timeout: 15_000 });
  await expect(page.getByText(/previous submission was accepted/)).toBeVisible();

  const participants = await request.get(`${API_ORIGIN}/api/v1/battle/${battleId}/participants`, {
    headers: { authorization: `Bearer ${account.token}` },
  });
  expect(participants.status(), await participants.text()).toBe(200);
  const participantScore = (await participants.json())[0].score as number;
  expect(participantScore).toBe(Math.trunc(acceptedSubmission!.score_earned));
  diagnostics.push(`Retry POST HTTP ${retryResponse.status()}; recovered persisted score ${participantScore}`);

  await submitAllMcq(page, 4, diagnostics, request, account, battleId);
  await finalize(page);
  const result = await request.get(`${API_ORIGIN}/api/v1/battle/${battleId}/result`, {
    headers: { authorization: `Bearer ${account.token}` },
  });
  expect(result.status(), await result.text()).toBe(200);
  const resultData = await result.json();
  expect(resultData.battle_id).toBe(battleId);
  diagnostics.push(`Result GET HTTP ${result.status()}: ${JSON.stringify({ battle_id: resultData.battle_id, winner_id: resultData.winner_id, winner_score: resultData.winner_score, is_draw: resultData.is_draw, total_players: resultData.total_players })}`);
  const historyRecord = await assertBattleHistory(request, account, battleId);
  diagnostics.push(`History GET HTTP 200: ${JSON.stringify(historyRecord)}`);
  await attachDiagnostics(testInfo, "submission-retry-browser-diagnostics", diagnostics);
  await close();
});

test("solo coding runs a public sample and records the real hidden-test verdict", async ({ browser, request }, testInfo) => {
  const account = await createAccount(request, "solo_coding");
  const { page, diagnostics, close } = await openAuthenticatedPage(browser, account);
  await page.goto("/battle/solo?mode=coding");
  const createResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/battle/create"),
  );
  await page.getByRole("button", { name: /Launch Coding IDE/ }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status(), await createResponse.text()).toBe(200);
  const createdBattle = await createResponse.json() as { id?: unknown; title?: unknown };
  expect(typeof createdBattle.id).toBe("string");
  const battleId = (createdBattle.id as string).trim();
  expect(battleId).not.toBe("");
  expect(typeof createdBattle.title).toBe("string");
  const expectedRoomPath = `/battle/${encodeURIComponent(battleId)}`;
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 30_000 }).toBe(expectedRoomPath);
  expect(new URL(page.url()).pathname).toBe(expectedRoomPath);
  await expect(page.getByRole("heading", { level: 1, name: createdBattle.title as string })).toBeVisible();
  diagnostics.push(`Battle create HTTP ${createResponse.status()}: ${battleId}`);
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
  const submittedResponse = await submissionResponse;
  expect(submittedResponse.status()).toBe(200);
  const submission = await submittedResponse.json();
  expect(submission.verdict.toLowerCase()).toBe("accepted");
  expect(submission.passed_tests).toBe(submission.total_tests);
  diagnostics.push(`Coding submission HTTP 200: ${submission.verdict}; question ${submission.question_id}`);
  await expect(page.getByText(/Last verdict: Accepted/)).toBeVisible({ timeout: 30_000 });
  await finalize(page);
  const result = await request.get(`${API_ORIGIN}/api/v1/battle/${battleId}/result`, {
    headers: { authorization: `Bearer ${account.token}` },
  });
  expect(result.status(), await result.text()).toBe(200);
  const resultData = await result.json();
  expect(resultData.battle_id).toBe(battleId);
  diagnostics.push(`Result GET HTTP ${result.status()}: ${JSON.stringify({ battle_id: resultData.battle_id, winner_id: resultData.winner_id, winner_score: resultData.winner_score, is_draw: resultData.is_draw, total_players: resultData.total_players })}`);
  const historyRecord = await assertBattleHistory(request, account, battleId);
  diagnostics.push(`History GET HTTP 200: ${JSON.stringify(historyRecord)}`);
  await attachScreenshot(testInfo, "solo-coding-completed", page, diagnostics);
  await attachDiagnostics(testInfo, "solo-coding-browser-diagnostics", diagnostics);
  await close();
});

test("two users complete a multiplayer MCQ room and see persisted results", async ({ browser, request }, testInfo) => {
  const hostAccount = await createAccount(request, "duo_mcq_host");
  const peerAccount = await createAccount(request, "duo_mcq_peer");
  const host = await openAuthenticatedPage(browser, hostAccount);
  const peer = await openAuthenticatedPage(browser, peerAccount);
  const battleId = await createInviteRoom(host.page, "mcq", host.diagnostics);
  host.diagnostics.push(`Battle create HTTP 200: ${battleId}`);
  await enterInviteRoom(host.page, battleId);
  await joinInviteRoom(peer.page, battleId, peer.diagnostics);
  await expect(host.page.getByText("2 / 2 Players")).toBeVisible({ timeout: 15_000 });
  await startRoom(host.page);
  await expect(host.page.getByRole("radio").first()).toBeVisible();
  await expect(peer.page.getByRole("radio").first()).toBeVisible();
  await expect.poll(() => host.socketEvents).toContain("state_sync");
  await expect.poll(() => peer.socketEvents).toContain("state_sync");
  const hostSubmissionResponse = host.page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/battle/submit-answer"),
  );
  await host.page.getByRole("radio").first().check();
  await host.page.getByRole("button", { name: "Submit to Battle" }).click();
  const peerSubmissionResponse = peer.page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/battle/submit-answer"),
  );
  await peer.page.getByRole("radio").first().check();
  await peer.page.getByRole("button", { name: "Submit to Battle" }).click();
  const [hostSubmissionResult, peerSubmissionResult] = await Promise.all([
    hostSubmissionResponse,
    peerSubmissionResponse,
  ]);
  expect(hostSubmissionResult.status()).toBe(200);
  expect(peerSubmissionResult.status()).toBe(200);
  const [hostSubmission, peerSubmission] = await Promise.all([
    hostSubmissionResult.json(),
    peerSubmissionResult.json(),
  ]);
  host.diagnostics.push(`Host MCQ submit HTTP 200: ${hostSubmission.verdict}; question ${hostSubmission.question_id}`);
  peer.diagnostics.push(`Peer MCQ submit HTTP 200: ${peerSubmission.verdict}; question ${peerSubmission.question_id}`);
  await expect.poll(() => host.socketEvents).toContain("score_updated");
  await expect.poll(() => peer.socketEvents).toContain("score_updated");
  await finalize(peer.page);
  await host.page.reload();
  await expect(host.page.getByText("Battle results are saved.")).toBeVisible({ timeout: 15_000 });
  const [hostResult, peerResult] = await Promise.all([
    request.get(`${API_ORIGIN}/api/v1/battle/${battleId}/result`, { headers: { authorization: `Bearer ${hostAccount.token}` } }),
    request.get(`${API_ORIGIN}/api/v1/battle/${battleId}/result`, { headers: { authorization: `Bearer ${peerAccount.token}` } }),
  ]);
  expect(hostResult.status()).toBe(200);
  expect(peerResult.status()).toBe(200);
  expect((await hostResult.json()).battle_id).toBe(battleId);
  expect((await peerResult.json()).battle_id).toBe(battleId);
  host.diagnostics.push(`Participant results GET HTTP 200 each: ${battleId}`);
  const [hostHistory, peerHistory] = await Promise.all([
    assertBattleHistory(request, hostAccount, battleId),
    assertBattleHistory(request, peerAccount, battleId),
  ]);
  host.diagnostics.push(`Host history HTTP 200: ${JSON.stringify(hostHistory)}`);
  peer.diagnostics.push(`Peer history HTTP 200: ${JSON.stringify(peerHistory)}`);
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
  const battleId = await createInviteRoom(host.page, "coding", host.diagnostics);
  host.diagnostics.push(`Battle create HTTP 200: ${battleId}`);
  await enterInviteRoom(host.page, battleId);
  try {
    await joinInviteRoom(peer.page, battleId, peer.diagnostics);
  } catch (error) {
    await attachDiagnostics(testInfo, "multiplayer-coding-peer-join-failure", peer.diagnostics);
    throw error;
  }
  await expect(host.page.getByText("2 / 2 Players")).toBeVisible({ timeout: 15_000 });
  await startRoom(host.page);
  await expect(host.page.getByRole("button", { name: "Submit to Battle" })).toBeVisible();
  try {
    await expect(peer.page.getByRole("button", { name: "Submit to Battle" })).toBeVisible({ timeout: 15_000 });
  } catch (error) {
    await attachDiagnostics(testInfo, "multiplayer-coding-peer-before-submit", peer.diagnostics);
    throw error;
  }
  await expect.poll(() => host.socketEvents).toContain("state_sync");
  await expect.poll(() => peer.socketEvents).toContain("state_sync");
  const hostSubmissionResponse = host.page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/battle/submit-answer"),
  );
  await host.page.getByRole("button", { name: "Submit to Battle" }).click();
  const peerSubmissionResponse = peer.page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/battle/submit-answer"),
  );
  await peer.page.getByRole("button", { name: "Submit to Battle" }).click();
  const [hostSubmissionResult, peerSubmissionResult] = await Promise.all([
    hostSubmissionResponse,
    peerSubmissionResponse,
  ]);
  expect(hostSubmissionResult.status()).toBe(200);
  expect(peerSubmissionResult.status()).toBe(200);
  const [hostSubmission, peerSubmission] = await Promise.all([
    hostSubmissionResult.json(),
    peerSubmissionResult.json(),
  ]);
  await expect.poll(() => host.socketEvents).toContain("score_updated");
  await expect.poll(() => peer.socketEvents).toContain("score_updated");
  expect(hostSubmission.verdict.toLowerCase()).toBe("accepted");
  expect(peerSubmission.verdict.toLowerCase()).toBe("accepted");
  expect(hostSubmission.user_id).toBe(hostAccount.id);
  expect(peerSubmission.user_id).toBe(peerAccount.id);
  expect(hostSubmission.question_id).toBe(peerSubmission.question_id);
  expect(hostSubmission.id).not.toBe(peerSubmission.id);
  host.diagnostics.push(`Host coding submit HTTP 200: ${hostSubmission.verdict}; question ${hostSubmission.question_id}`);
  peer.diagnostics.push(`Peer coding submit HTTP 200: ${peerSubmission.verdict}; question ${peerSubmission.question_id}`);
  await finalize(peer.page);
  await host.page.reload();
  await expect(host.page.getByText("Battle results are saved.")).toBeVisible({ timeout: 15_000 });
  const [hostResult, peerResult] = await Promise.all([
    request.get(`${API_ORIGIN}/api/v1/battle/${battleId}/result`, { headers: { authorization: `Bearer ${hostAccount.token}` } }),
    request.get(`${API_ORIGIN}/api/v1/battle/${battleId}/result`, { headers: { authorization: `Bearer ${peerAccount.token}` } }),
  ]);
  expect(hostResult.status()).toBe(200);
  expect(peerResult.status()).toBe(200);
  expect((await hostResult.json()).battle_id).toBe(battleId);
  expect((await peerResult.json()).battle_id).toBe(battleId);
  host.diagnostics.push(`Participant results GET HTTP 200 each: ${battleId}`);
  const [hostHistory, peerHistory] = await Promise.all([
    assertBattleHistory(request, hostAccount, battleId),
    assertBattleHistory(request, peerAccount, battleId),
  ]);
  host.diagnostics.push(`Host history HTTP 200: ${JSON.stringify(hostHistory)}`);
  peer.diagnostics.push(`Peer history HTTP 200: ${JSON.stringify(peerHistory)}`);
  await attachScreenshot(testInfo, "multiplayer-coding-completed", host.page, host.diagnostics);
  await attachDiagnostics(testInfo, "multiplayer-coding-host-diagnostics", host.diagnostics);
  await attachDiagnostics(testInfo, "multiplayer-coding-peer-diagnostics", peer.diagnostics);
  await host.close();
  await peer.close();
});

test("reconnecting multiplayer client receives state sync and restores persisted room state", async ({ browser, request }) => {
  const hostAccount = await createAccount(request, "reconnect_host");
  const peerAccount = await createAccount(request, "reconnect_peer");
  const host = await openAuthenticatedPage(browser, hostAccount);
  const peer = await openAuthenticatedPage(browser, peerAccount);
  let connectionAttempts = 0;
  let firstConnectionClosed = false;

  await host.page.routeWebSocket(/\/api\/v1\/battle\/ws\//, async (socket) => {
    connectionAttempts += 1;
    if (connectionAttempts === 1) {
      await socket.close({ code: 1000, reason: "exercise reconnect flow" });
      firstConnectionClosed = true;
      return;
    }
    socket.connectToServer();
  });

  const battleId = await createInviteRoom(host.page, "mcq", host.diagnostics);
  await enterInviteRoom(host.page, battleId);
  await expect(host.page.getByText("1 / 2 Players")).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => firstConnectionClosed).toBe(true);
  await joinInviteRoom(peer.page, battleId, peer.diagnostics);

  await expect.poll(() => host.socketEvents).toContain("state_sync");
  await expect(host.page.getByText("2 / 2 Players")).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => connectionAttempts).toBeGreaterThanOrEqual(2);
  const participants = await request.get(`${API_ORIGIN}/api/v1/battle/${battleId}/participants`, {
    headers: { authorization: `Bearer ${hostAccount.token}` },
  });
  expect(participants.status(), await participants.text()).toBe(200);
  const participantRows = await participants.json();
  expect(participantRows).toHaveLength(2);
  expect(new Set(participantRows.map((participant: { user_id: string }) => participant.user_id)).size).toBe(2);

  await host.close();
  await peer.close();
});

test("battle room polling updates persisted participants when WebSocket events are unavailable", async ({ browser, request }) => {
  const hostAccount = await createAccount(request, "poll_host");
  const peerAccount = await createAccount(request, "poll_peer");
  const host = await openAuthenticatedPage(browser, hostAccount);
  const peer = await openAuthenticatedPage(browser, peerAccount);
  await host.page.routeWebSocket(/\/api\/v1\/battle\/ws\//, () => undefined);
  const battleId = await createInviteRoom(host.page, "mcq", host.diagnostics);
  await enterInviteRoom(host.page, battleId);
  await expect(host.page.getByText("1 / 2 Players")).toBeVisible({ timeout: 15_000 });
  await joinInviteRoom(peer.page, battleId, peer.diagnostics);

  await expect(host.page.getByText("2 / 2 Players")).toBeVisible({ timeout: 10_000 });
  expect(host.socketEvents).toEqual([]);

  await host.close();
  await peer.close();
});
