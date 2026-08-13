// API Configuration and Constants
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: "/api/v1/auth/register",
    LOGIN: "/api/v1/auth/login",
    LOGOUT: "/api/v1/auth/logout",
    REFRESH: "/api/v1/auth/refresh",
    ME: "/api/v1/auth/me",
  },

  // Profile
  PROFILE: {
    GET: (userId: string) => `/api/v1/profile/${userId}`,
    ME: "/api/v1/profile/me",
    UPDATE: (userId: string) => `/api/v1/profile/${userId}`,
    STATS: (userId: string) => `/api/v1/profile/${userId}/stats`,
    AVATAR: (userId: string) => `/api/v1/profile/${userId}/avatar`,
  },

  // Dashboard
  DASHBOARD: {
    GET: "/api/v1/dashboard",
    STATS: "/api/v1/dashboard/stats",
    ACTIVITY: (userId: string) => `/api/v1/dashboard/${userId}/activity`,
    BATTLES: "/api/v1/dashboard/battles",
    LEADERBOARD: "/api/v1/dashboard/leaderboard",
  },

  // Battle
  BATTLE: {
    CREATE: "/api/v1/battle",
    GET: (battleId: string) => `/api/v1/battle/${battleId}`,
    UPDATE: (battleId: string) => `/api/v1/battle/${battleId}`,
    JOIN: (battleId: string) => `/api/v1/battle/${battleId}/join`,
    LEAVE: (battleId: string) => `/api/v1/battle/${battleId}/leave`,
    SUBMIT: (battleId: string) => `/api/v1/battle/${battleId}/submit`,
    RESULT: (battleId: string) => `/api/v1/battle/${battleId}/result`,
    USER_BATTLES: (userId: string) => `/api/v1/battle/user/${userId}`,
    ACTIVE: "/api/v1/battle/active",
    END: (battleId: string) => `/api/v1/battle/${battleId}/end`,
  },

  // Tournament
  TOURNAMENT: {
    CREATE: "/api/v1/tournament",
    GET: (tournamentId: string) =>
      `/api/v1/tournament/${tournamentId}`,
    UPDATE: (tournamentId: string) =>
      `/api/v1/tournament/${tournamentId}`,
    REGISTER: (tournamentId: string) =>
      `/api/v1/tournament/${tournamentId}/register`,
    UNREGISTER: (tournamentId: string) =>
      `/api/v1/tournament/${tournamentId}/unregister`,
    BRACKET: (tournamentId: string) =>
      `/api/v1/tournament/${tournamentId}/bracket`,
    PARTICIPANTS: (tournamentId: string) =>
      `/api/v1/tournament/${tournamentId}/participants`,
    UPCOMING: "/api/v1/tournament/upcoming",
    ACTIVE: "/api/v1/tournament/active",
    START: (tournamentId: string) =>
      `/api/v1/tournament/${tournamentId}/start`,
    END: (tournamentId: string) =>
      `/api/v1/tournament/${tournamentId}/end`,
  },

  // Challenge/Problem Generator
  CHALLENGE: {
    CREATE: "/api/v1/problem-generator",
    GET: (challengeId: string) =>
      `/api/v1/problem-generator/${challengeId}`,
    UPDATE: (challengeId: string) =>
      `/api/v1/problem-generator/${challengeId}`,
    LIST: "/api/v1/problem-generator",
    SUBMIT: (challengeId: string) =>
      `/api/v1/problem-generator/${challengeId}/submit`,
    GENERATE: "/api/v1/problem-generator/generate",
    TEST_CASES: (challengeId: string) =>
      `/api/v1/problem-generator/${challengeId}/test-cases`,
  },

  // AI
  AI: {
    GENERATE_PROBLEM: "/api/v1/ai/generate-problem",
    ANALYZE_CODE: "/api/v1/ai/analyze-code",
    GENERATE_FEEDBACK: "/api/v1/ai/generate-feedback",
    SUGGEST_IMPROVEMENT: "/api/v1/ai/suggest-improvement",
    RECOMMENDATIONS: (userId: string) =>
      `/api/v1/ai/recommendations/${userId}`,
    GENERATE_PATH: (userId: string) =>
      `/api/v1/ai/generate-path/${userId}`,
  },

  // Interview
  INTERVIEW: {
    CREATE: "/api/v1/interview",
    GET: (interviewId: string) => `/api/v1/interview/${interviewId}`,
    UPDATE: (interviewId: string) =>
      `/api/v1/interview/${interviewId}`,
    START: (interviewId: string) =>
      `/api/v1/interview/${interviewId}/start`,
    SUBMIT_ANSWER: (interviewId: string) =>
      `/api/v1/interview/${interviewId}/submit-answer`,
    QUESTIONS: (interviewId: string) =>
      `/api/v1/interview/${interviewId}/questions`,
    RESULT: (interviewId: string) =>
      `/api/v1/interview/${interviewId}/result`,
    END: (interviewId: string) => `/api/v1/interview/${interviewId}/end`,
  },

  // Code Review
  CODE_REVIEW: {
    CREATE: "/api/v1/code-review",
    GET: (reviewId: string) => `/api/v1/code-review/${reviewId}`,
    SUBMIT: "/api/v1/code-review/submit",
    COMMENT: (reviewId: string) =>
      `/api/v1/code-review/${reviewId}/comment`,
    COMMENTS: (reviewId: string) =>
      `/api/v1/code-review/${reviewId}/comments`,
    COMPLETE: (reviewId: string) =>
      `/api/v1/code-review/${reviewId}/complete`,
    USER_REVIEWS: (userId: string) =>
      `/api/v1/code-review/user/${userId}`,
  },

  // Roadmap
  ROADMAP: {
    GET: (userId: string) => `/api/v1/roadmap/${userId}`,
    CREATE: "/api/v1/roadmap",
    UPDATE: (roadmapId: string) => `/api/v1/roadmap/${roadmapId}`,
    COMPLETE_TASK: (roadmapId: string, taskId: string) =>
      `/api/v1/roadmap/${roadmapId}/task/${taskId}/complete`,
    TASKS: (roadmapId: string) =>
      `/api/v1/roadmap/${roadmapId}/tasks`,
    RECOMMENDED: (userId: string) =>
      `/api/v1/roadmap/recommended/${userId}`,
    PROGRESS: (userId: string) =>
      `/api/v1/roadmap/${userId}/progress`,
  },

  // Learning Engine
  LEARNING_ENGINE: {
    PLAN: (userId: string) =>
      `/api/v1/learning-engine/${userId}/plan`,
    GENERATE: "/api/v1/learning-engine/generate",
    RECENT: (userId: string) =>
      `/api/v1/learning-engine/${userId}/recent`,
    PROGRESS: (userId: string) =>
      `/api/v1/learning-engine/${userId}/progress`,
    COMPLETE: (userId: string) =>
      `/api/v1/learning-engine/${userId}/complete`,
    RECOMMENDED: (userId: string) =>
      `/api/v1/learning-engine/${userId}/recommended`,
  },

  // Battle Coach
  BATTLE_COACH: {
    RECOMMENDATIONS: (userId: string) =>
      `/api/v1/battle-coach/${userId}/recommendations`,
    ANALYSIS: (battleId: string) =>
      `/api/v1/battle-coach/battle/${battleId}/analysis`,
    SESSION: (sessionId: string) =>
      `/api/v1/battle-coach/session/${sessionId}`,
    START_SESSION: (userId: string) =>
      `/api/v1/battle-coach/${userId}/session`,
    FEEDBACK: (userId: string, challengeId: string) =>
      `/api/v1/battle-coach/${userId}/feedback/${challengeId}`,
    PRACTICE: (userId: string) =>
      `/api/v1/battle-coach/${userId}/practice`,
  },

  // Streak
  STREAK: {
    GET: (userId: string) => `/api/v1/streak/${userId}`,
    RECORD: (userId: string) =>
      `/api/v1/streak/${userId}/record`,
    HISTORY: (userId: string) =>
      `/api/v1/streak/${userId}/history`,
    LEADERBOARD: "/api/v1/streak/leaderboard",
    RESET: (userId: string) =>
      `/api/v1/streak/${userId}/reset`,
    MILESTONES: (userId: string) =>
      `/api/v1/streak/${userId}/milestones`,
  },

  // Achievements
  ACHIEVEMENTS: {
    LIST: "/api/v1/achievements",
    GET: (achievementId: string) =>
      `/api/v1/achievements/${achievementId}`,
    USER: (userId: string) =>
      `/api/v1/achievements/${userId}`,
    UNLOCK: (userId: string) =>
      `/api/v1/achievements/${userId}/unlock`,
    RECENT: (userId: string) =>
      `/api/v1/achievements/${userId}/recent`,
    PROGRESS: (userId: string) =>
      `/api/v1/achievements/${userId}/progress`,
  },

  // Career
  CAREER: {
    GET: (userId: string) => `/api/v1/career/${userId}`,
    GOALS: (userId: string) =>
      `/api/v1/career/${userId}/goals`,
    PATH: (userId: string) => `/api/v1/career/${userId}/path`,
    MENTORS: (userId: string) =>
      `/api/v1/career/${userId}/mentors`,
    OPPORTUNITIES: (userId: string) =>
      `/api/v1/career/${userId}/opportunities`,
    RESUME: (userId: string) =>
      `/api/v1/career/${userId}/resume`,
    ANALYTICS: (userId: string) =>
      `/api/v1/career/${userId}/analytics`,
  },

  // Health
  HEALTH: {
    LIVE: "/health",
    READY: "/ready",
    DETAILED: "/health/detailed",
  },
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// API Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "Unauthorized. Please log in again.",
  FORBIDDEN: "You do not have permission to access this resource.",
  NOT_FOUND: "Resource not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  INVALID_REQUEST: "Invalid request. Please check your input.",
  CONFLICT: "This resource already exists.",
};
