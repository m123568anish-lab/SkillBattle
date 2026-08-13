// API Configuration and Constants (src/lib)
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
  },

  // Profile
  PROFILE: {
    GET: (userId: string) => `/profile/${userId}`,
    ME: "/profile/me",
    UPDATE: "/profile",
    STATS: (userId: string) => `/profile/${userId}/stats`,
    AVATAR: (userId: string) => `/profile/${userId}/avatar`,
  },

  // Dashboard
  DASHBOARD: {
    GET: "/dashboard",
    STATS: "/dashboard/stats",
    ACTIVITY: (userId: string) => `/dashboard/${userId}/activity`,
    BATTLES: "/dashboard/battles",
    LEADERBOARD: "/dashboard/leaderboard",
  },

  // Battle
  BATTLE: {
    CREATE: "/battle/create",
    GET: (battleId: string) => `/battle/${battleId}`,
    UPDATE: (battleId: string) => `/battle/${battleId}`,
    JOIN: "/battle/join",
    LEAVE: "/battle/leave",
    SUBMIT: (battleId: string) => `/battle/${battleId}/submit`,
    RESULT: (battleId: string) => `/battle/${battleId}/result`,
    USER_BATTLES: (userId: string) => `/battle/user/${userId}`,
    ACTIVE: "/battle/active",
    WAITING: "/battle/waiting",
    QUEUE_JOIN: "/battle/queue/join",
    QUEUE_LEAVE: "/battle/queue/leave",
    QUEUE_STATUS: "/battle/queue/status",
  },

  // Friend
  FRIEND: {
    LIST: "/friend/",
    ADD: "/friend/",
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

export default API_ENDPOINTS;
