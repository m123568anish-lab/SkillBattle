export interface RoadmapWeek {
  week: number;
  title: string;
  topics: string[];
  xp: number;
}

export const roadmap: RoadmapWeek[] = [
  {
    week: 1,
    title: "Programming Foundations",
    topics: [
      "Programming Revision",
      "Complexity Analysis",
      "Problem Solving"
    ],
    xp: 500,
  },
  {
    week: 2,
    title: "Arrays & Strings",
    topics: [
      "Arrays",
      "Strings",
      "Sliding Window"
    ],
    xp: 650,
  },
  {
    week: 3,
    title: "Searching & Sorting",
    topics: [
      "Binary Search",
      "Sorting",
      "Recursion"
    ],
    xp: 700,
  },
  {
    week: 4,
    title: "Linked Lists & Stacks",
    topics: [
      "Linked List",
      "Stack",
      "Queue"
    ],
    xp: 800,
  },
  {
    week: 5,
    title: "Trees",
    topics: [
      "Binary Tree",
      "BST",
      "Traversal"
    ],
    xp: 900,
  },
  {
    week: 6,
    title: "Graphs",
    topics: [
      "BFS",
      "DFS",
      "Shortest Path"
    ],
    xp: 1000,
  },
  {
    week: 7,
    title: "Interview Preparation",
    topics: [
      "Core CS",
      "SQL",
      "System Design Basics"
    ],
    xp: 1200,
  },
  {
    week: 8,
    title: "Mock Interviews",
    topics: [
      "Company Questions",
      "Behavioral",
      "Final Revision"
    ],
    xp: 1500,
  },
];