// Integration guide for using frontend-backend services

/**
 * FRONTEND-BACKEND INTEGRATION GUIDE
 * ===================================
 * 
 * This file documents how to use the integrated services in your React components.
 */

// 1. Using Service Classes directly
// ===================================
import {
  AuthService,
  ProfileService,
  DashboardService,
  BattleService,
  TournamentService,
} from "@/services";

// Example: Direct service usage
async function exampleDirectService() {
  try {
    // Get user profile
    const profile = await ProfileService.getCurrentUserProfile();
    console.log("Profile:", profile);

    // Get dashboard data
    const dashboard = await DashboardService.getDashboard();
    console.log("Dashboard:", dashboard);
  } catch (error) {
    console.error("Error:", error);
  }
}

// 2. Using React Query Hooks
// ===========================
import {
  useCurrentUserProfile,
  useDashboard,
  useActiveBattles,
  useUpcomingTournaments,
} from "@/hooks";

// Example: Component using hooks
export function DashboardComponent() {
  // These hooks handle loading, error, and data states automatically
  const { data: profile, isLoading: profileLoading } =
    useCurrentUserProfile();
  const { data: dashboard, isLoading: dashboardLoading } =
    useDashboard();
  const { data: battles } = useActiveBattles();
  const { data: tournaments } =
    useUpcomingTournaments();

  if (profileLoading || dashboardLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome {profile?.full_name}</h1>
      <p>You have {battles?.length} active battles</p>
      <p>
        Upcoming tournaments: {tournaments?.length}
      </p>
    </div>
  );
}

// 3. Using Mutations for API calls
// ==================================
import { useCreateBattle, useJoinBattle } from "@/hooks";

// Example: Component with mutations
export function BattleCreationComponent() {
  const createBattleMutation = useCreateBattle();
  const joinBattleMutation = useJoinBattle();

  const handleCreateBattle = async () => {
    try {
      const battle = await createBattleMutation.mutateAsync(
        {
          title: "Daily Challenge",
          problem_id: "123",
          language: "javascript",
          difficulty: "medium",
          duration: 60,
        }
      );
      console.log("Battle created:", battle);
    } catch (error) {
      console.error("Failed to create battle:", error);
    }
  };

  const handleJoinBattle = async (battleId: string) => {
    try {
      await joinBattleMutation.mutateAsync(battleId);
      console.log("Joined battle successfully");
    } catch (error) {
      console.error("Failed to join battle:", error);
    }
  };

  return (
    <div>
      <button onClick={handleCreateBattle}>
        Create Battle
      </button>
      {createBattleMutation.isPending && (
        <p>Creating battle...</p>
      )}
      {createBattleMutation.isError && (
        <p>Error: {createBattleMutation.error?.message}</p>
      )}
    </div>
  );
}

// 4. Type Safety with TypeScript
// ================================
import {
  Battle,
  Tournament,
  Challenge,
  UserProfile,
} from "@/types";

// All services are fully typed with your domain types
interface DashboardProps {
  battles: Battle[];
  tournaments: Tournament[];
  profile: UserProfile;
}

export function TypedDashboard({
  battles,
  tournaments,
  profile,
}: DashboardProps) {
  return (
    <div>
      <h1>{profile.full_name}</h1>
      <p>{battles.length} battles</p>
    </div>
  );
}

// 5. API Constants for custom requests
// ======================================
import { API_ENDPOINTS, API } from "@/lib";

// Example: Custom axios request using API constants
async function customRequest() {
  try {
    const response = await API.get(
      API_ENDPOINTS.PROFILE.ME
    );
    console.log("Profile:", response.data);
  } catch (error) {
    console.error("Error:", error);
  }
}

// 6. Error Handling
// ==================
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib";

async function handleErrors() {
  try {
    await ProfileService.getCurrentUserProfile();
  } catch (error: any) {
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      console.log(ERROR_MESSAGES.UNAUTHORIZED);
      // Redirect to login
    } else if (
      error.response?.status === HTTP_STATUS.NOT_FOUND
    ) {
      console.log(ERROR_MESSAGES.NOT_FOUND);
    } else {
      console.log(ERROR_MESSAGES.SERVER_ERROR);
    }
  }
}

// BEST PRACTICES
// ==============
/*
1. Use React Query hooks in components for automatic caching and state management
2. Use services directly for non-component code (utilities, helpers)
3. Always handle loading and error states in your components
4. Use TypeScript types for type safety
5. Let React Query handle invalidation after mutations
6. Use the API constants for custom requests to ensure consistency
7. Handle authentication errors (401) by redirecting to login
8. Cache queries appropriately using staleTime and cacheTime options
*/

export {};
