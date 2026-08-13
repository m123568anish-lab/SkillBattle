export interface Goal {
  id: number;
  title: string;
  description: string;
  recommended: boolean;
}

export const goals: Goal[] = [
  {
    id: 1,
    title: "Data Structures & Algorithms",
    description: "Coding interviews and problem solving.",
    recommended: true,
  },
  {
    id: 2,
    title: "System Design",
    description: "Scalable applications and architecture.",
    recommended: true,
  },
  {
    id: 3,
    title: "Web Development",
    description: "Frontend + Backend development.",
    recommended: false,
  },
  {
    id: 4,
    title: "AI / Machine Learning",
    description: "Deep learning and modern AI.",
    recommended: true,
  },
  {
    id: 5,
    title: "Core Computer Science",
    description: "OS, DBMS, CN, OOPs.",
    recommended: true,
  },
  {
    id: 6,
    title: "Aptitude",
    description: "Quantitative and logical reasoning.",
    recommended: false,
  },
  {
    id: 7,
    title: "DevOps",
    description: "CI/CD workflows, automation, and deployment practices.",
    recommended: false,
  },
  {
    id: 8,
    title: "Cyber Security",
    description: "Network and application security.",
    recommended: false,
  },
];