/**
 * API Integration Checklist and Documentation
 */

# Frontend-Backend Integration Checklist

## ✅ Service Layer Setup

- [x] **Auth Service** - Authentication and token management
  - register(), login(), logout(), getCurrentUser()
  - Token refresh and storage
  - Password change functionality

- [x] **Profile Service** - User profile management
  - get/update user profile
  - Upload avatar
  - Get profile statistics

- [x] **Dashboard Service** - Dashboard data
  - Get dashboard overview
  - Get statistics
  - Recent battles and activity
  - Leaderboard

- [x] **Battle Service** - Battle operations
  - Create, join, leave battles
  - Submit solutions
  - Get battle results
  - View active/user battles

- [x] **Tournament Service** - Tournament management
  - Create and manage tournaments
  - Register/unregister participants
  - View brackets and participants

- [x] **Challenge Service** - Problem generation and solving
  - Get challenges by difficulty
  - Submit solutions
  - Get test cases
  - Generate new challenges

- [x] **AI Service** - AI-powered features
  - Generate problems
  - Analyze code
  - Generate feedback
  - Suggest improvements

- [x] **Interview Service** - Interview management
  - Create and manage interviews
  - Submit answers
  - Get results

- [x] **Code Review Service** - Code review functionality
  - Submit code for review
  - Add comments
  - Complete reviews

- [x] **Roadmap Service** - Learning roadmaps
  - Get user roadmaps
  - Track progress
  - Complete tasks

- [x] **Learning Engine Service** - Personalized learning
  - Get learning plans
  - Track progress
  - Get recommendations

- [x] **Battle Coach Service** - Coaching and mentoring
  - Get recommendations
  - Analyze performance
  - Practice suggestions

- [x] **Streak Service** - Streak tracking
  - Track user streaks
  - Record activities
  - Get milestones

- [x] **Achievements Service** - Achievement system
  - Get user achievements
  - Unlock achievements
  - Track progress

- [x] **Career Service** - Career development
  - Get career profile
  - Manage career goals
  - View opportunities

## ✅ Type Definitions

- [x] Auth types (User, LoginResponse, etc.)
- [x] Profile types (UserProfile, ProfileUpdate, etc.)
- [x] Dashboard types (DashboardData, DashboardStats, etc.)
- [x] Battle types (Battle, BattleParticipant, etc.)
- [x] Tournament types (Tournament, TournamentParticipant, etc.)
- [x] Challenge types (Challenge, TestCase, etc.)
- [x] Interview types (Interview, InterviewQuestion, etc.)
- [x] Code Review types (CodeReview, ReviewComment, etc.)
- [x] Roadmap types (Roadmap, RoadmapTask, etc.)
- [x] Streak types (Streak, StreakActivity, etc.)
- [x] Achievement types (Achievement, UserAchievement, etc.)

## ✅ React Query Hooks

- [x] Dashboard hooks (useDashboard, useDashboardStats, etc.)
- [x] Battle hooks (useBattle, useActiveBattles, etc.)
- [x] Profile hooks (useUserProfile, useUpdateProfile, etc.)
- [x] Tournament hooks (useTournament, useUpcomingTournaments, etc.)
- [x] Challenge hooks (useChallenge, useChallenges, etc.)
- [x] Streak hooks (useUserStreak, useRecordActivity, etc.)
- [x] Achievement hooks (useUserAchievements, useUnlockAchievement, etc.)
- [x] Roadmap hooks (useUserRoadmap, useCompleteRoadmapTask, etc.)

## ✅ API Configuration

- [x] API_ENDPOINTS - All endpoint paths
- [x] HTTP_STATUS - Standard HTTP status codes
- [x] ERROR_MESSAGES - Standardized error messages
- [x] API_CONFIG - Configuration settings
- [x] Query cache configuration
- [x] Mutation retry strategy

## ✅ Error Handling

- [x] APIErrorHandler - Centralized error handling
- [x] Error interceptors
- [x] Retry logic
- [x] Authentication failure handling

## Usage Instructions

### 1. Direct Service Usage (for utilities/helpers)
```typescript
import { ProfileService, BattleService } from "@/services";

const profile = await ProfileService.getCurrentUserProfile();
const battles = await BattleService.getActiveBattles();
```

### 2. React Query Hooks (in components)
```typescript
import { useCurrentUserProfile, useActiveBattles } from "@/hooks";

export function MyComponent() {
  const { data: profile } = useCurrentUserProfile();
  const { data: battles } = useActiveBattles();
  // ...
}
```

### 3. Mutations (API calls that modify data)
```typescript
import { useCreateBattle } from "@/hooks";

export function CreateBattleComponent() {
  const createBattle = useCreateBattle();
  
  const handleCreate = async () => {
    const battle = await createBattle.mutateAsync({
      title: "My Battle",
      // ... other fields
    });
  };
}
```

### 4. Custom API Requests
```typescript
import { API } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";

const response = await API.get(API_ENDPOINTS.PROFILE.ME);
```

## Next Steps

1. **Setup Interceptors** - Call setupAPIInterceptors() in your app root
2. **Enable Logging** - Call enableRequestLogging() for development
3. **Update Components** - Replace direct fetch calls with hooks
4. **Add Error Boundaries** - Handle error states in components
5. **Test Integration** - Run tests to verify API calls work correctly

## Configuration Files

- `lib/api.ts` - Axios instance with interceptors
- `lib/api-constants.ts` - API endpoints and constants
- `lib/api-config.ts` - Configuration settings
- `lib/api-error.ts` - Error handling utilities
- `lib/react-query-config.ts` - React Query configuration
- `lib/api-interceptors.ts` - Interceptor setup utilities
- `lib/INTEGRATION_GUIDE.md` - Detailed integration guide

## Environment Variables

Required `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```
