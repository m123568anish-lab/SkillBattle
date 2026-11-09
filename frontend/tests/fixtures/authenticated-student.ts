import type { Page } from "@playwright/test";

export const testStudent = {
  id: "e2e-app-user",
  email: "student@example.com",
  username: "e2e_student",
  full_name: "E2E Student",
  role: "student",
  is_verified: true,
  onboarding_completed: true,
};

const emptyDashboard = {
  user: testStudent,
  stats: {
    xp: 0,
    level: 1,
    next_level_xp: 100,
    xp_to_next_level: 100,
    level_progress_percent: 0,
    streak: 0,
    longest_streak: 0,
    rating: 0,
    battles_played: 0,
    battles_completed: 0,
    battles_won: 0,
    battles_lost: 0,
    practice_attempted: 0,
    practice_completed: 0,
    practice_tasks_completed: 0,
    daily_challenge_completed: false,
  },
  weekly_activity: [],
  achievements: [],
  ai_recommendation: null,
  daily_challenge: null,
};

export async function authenticateStudent(page: Page) {
  await page.context().addCookies([{
    name: "__Secure-neon-auth.session_token",
    value: "e2e-cookie-session",
    url: "https://127.0.0.1:3000",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const requestUrl = new URL(route.request().url());
    const path = requestUrl.pathname;
    if (path.endsWith("/auth/me")) {
      return route.fulfill({ json: testStudent });
    }
    if (path.endsWith("/dashboard")) {
      return route.fulfill({ json: emptyDashboard });
    }
    if (path.endsWith("/practice/problems")) {
      return route.fulfill({
        json: {
          items: [],
          total: 0,
          page: Number(requestUrl.searchParams.get("page") || 1),
          page_size: Number(requestUrl.searchParams.get("page_size") || 20),
          categories: [],
          topics: [],
          available_total: 0,
          needs_repair_total: 0,
        },
      });
    }
    if (path.endsWith("/practice/summary")) {
      return route.fulfill({ json: { solved: 0, attempted: 0, accuracy: null } });
    }
    if (path.endsWith("/practice/mcq/questions")) {
      return route.fulfill({ json: { questions: [] } });
    }
    if (path.endsWith("/campaign/status")) {
      return route.fulfill({
        json: {
          rank: "Bronze",
          points: 0,
          tracks: ["DSA", "OS", "DBMS"].map((track) => ({
            track,
            current_level: 1,
            levels: [],
          })),
        },
      });
    }
    if (path.endsWith("/leaderboard/me")) {
      return route.fulfill({ json: { rank: null, total_users: 0, xp: 0, level: 1 } });
    }
    if (path.endsWith("/leaderboard")) {
      return route.fulfill({ json: { leaderboard: [] } });
    }
    if (path.endsWith("/battle/history")) {
      return route.fulfill({ json: { history: [], total: 0 } });
    }
    if (path.endsWith("/tournament")) {
      return route.fulfill({ json: [] });
    }
    return route.fulfill({ json: {} });
  });
}
