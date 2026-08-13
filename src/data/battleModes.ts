import {
  Brain,
  Code2,
  Database,
  Coffee,
  Bot,
  Target,
} from "lucide-react";

export interface BattleMode {
  id: number;
  title: string;
  description: string;
  players: number;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  xp: number;
  duration: string;
  icon: typeof Brain;
  gradient: string;
}

export const battleModes: BattleMode[] = [
  {
    id: 1,
    title: "DSA Arena",
    description: "Master Data Structures & Algorithms through real-time battles.",
    players: 2340,
    difficulty: "Hard",
    xp: 120,
    duration: "20 min",
    icon: Brain,
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    id: 2,
    title: "Python Clash",
    description: "Solve Python coding challenges against real players.",
    players: 1894,
    difficulty: "Medium",
    xp: 90,
    duration: "15 min",
    icon: Code2,
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    id: 3,
    title: "SQL Duel",
    description: "Write optimized SQL queries under time pressure.",
    players: 982,
    difficulty: "Medium",
    xp: 80,
    duration: "15 min",
    icon: Database,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: 4,
    title: "Java League",
    description: "Battle object-oriented programming challenges.",
    players: 1540,
    difficulty: "Hard",
    xp: 110,
    duration: "25 min",
    icon: Coffee,
    gradient: "from-red-500 to-orange-600",
  },
  {
    id: 5,
    title: "AI Challenge",
    description: "Machine Learning, GenAI and Prompt Engineering battles.",
    players: 714,
    difficulty: "Expert",
    xp: 150,
    duration: "30 min",
    icon: Bot,
    gradient: "from-pink-500 to-violet-600",
  },
  {
    id: 6,
    title: "Aptitude Rush",
    description: "Logical reasoning, quantitative aptitude and puzzles.",
    players: 3215,
    difficulty: "Easy",
    xp: 60,
    duration: "10 min",
    icon: Target,
    gradient: "from-indigo-500 to-cyan-500",
  },
];