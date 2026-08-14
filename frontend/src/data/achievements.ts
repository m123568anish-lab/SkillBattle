export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export const achievements: Achievement[] = [
  {
    id: 1,
    title: "First Blood",
    description: "Solve your first coding problem.",
    icon: "🥉",
    unlocked: true,
  },
  {
    id: 2,
    title: "7-Day Streak",
    description: "Practice for 7 consecutive days.",
    icon: "🔥",
    unlocked: true,
  },
  {
    id: 3,
    title: "100 Problems",
    description: "Solve 100 coding questions.",
    icon: "💯",
    unlocked: true,
  },
  {
    id: 4,
    title: "AI Explorer",
    description: "Complete your AI roadmap.",
    icon: "🤖",
    unlocked: false,
  },
  {
    id: 5,
    title: "Battle Champion",
    description: "Win 10 Battle Arena matches.",
    icon: "⚔️",
    unlocked: false,
  },
];