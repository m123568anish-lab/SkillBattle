export interface LeaderboardPlayer {
  id: number;
  rank: number;
  name: string;
  country: string;
  xp: number;
  streak: number;
  online: boolean;
  change: "up" | "down" | "same";
}

export const leaderboard: LeaderboardPlayer[] = [
  {
    id: 1,
    rank: 1,
    name: "Rahul Sharma",
    country: "🇮🇳",
    xp: 28450,
    streak: 41,
    online: true,
    change: "same",
  },
  {
    id: 2,
    rank: 2,
    name: "Manish Gupta",
    country: "🇮🇳",
    xp: 27120,
    streak: 32,
    online: true,
    change: "up",
  },
  {
    id: 3,
    rank: 3,
    name: "Alex Johnson",
    country: "🇺🇸",
    xp: 26610,
    streak: 29,
    online: false,
    change: "down",
  },
  {
    id: 4,
    rank: 4,
    name: "Priya Singh",
    country: "🇮🇳",
    xp: 25100,
    streak: 21,
    online: true,
    change: "up",
  },
  {
    id: 5,
    rank: 5,
    name: "David Kim",
    country: "🇰🇷",
    xp: 24320,
    streak: 18,
    online: false,
    change: "same",
  },
];