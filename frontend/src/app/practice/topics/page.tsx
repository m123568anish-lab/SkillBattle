"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PracticeNav from "@/components/practice/PracticeNav";
import {
  PageHeader,
  DifficultyBadge,
  TopicBadge,
  EmptyState,
} from "@/components/arena";
import {
  Search,
  Filter,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  List,
  Grid3X3,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface TopicItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  totalQuestions: number;
  completedQuestions: number;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedHours: number;
  tags: string[];
  interviewRelevance: "High" | "Medium" | "Essential";
}

const ALL_TOPICS: TopicItem[] = [
  {
    id: "arrays-hashing",
    slug: "arrays-and-hashing",
    name: "Arrays & Hashing",
    category: "Data Structures",
    description: "Hash maps, prefix sums, frequency counting, and amortized constant-time lookups.",
    totalQuestions: 24,
    completedQuestions: 18,
    difficulty: "Easy",
    estimatedHours: 4,
    tags: ["Arrays", "Hash Table", "Prefix Sum"],
    interviewRelevance: "Essential",
  },
  {
    id: "two-pointers",
    slug: "two-pointers",
    name: "Two Pointers Technique",
    category: "Algorithms",
    description: "Converging pointers, fast & slow pointers, palindrome verification, and partition schemes.",
    totalQuestions: 18,
    completedQuestions: 12,
    difficulty: "Easy",
    estimatedHours: 3,
    tags: ["Two Pointers", "Sorting", "Strings"],
    interviewRelevance: "High",
  },
  {
    id: "sliding-window",
    slug: "sliding-window",
    name: "Sliding Window",
    category: "Algorithms",
    description: "Fixed and dynamic window patterns, substring search, and subarray sum optimizations.",
    totalQuestions: 16,
    completedQuestions: 7,
    difficulty: "Medium",
    estimatedHours: 4,
    tags: ["Sliding Window", "Subarrays", "Optimization"],
    interviewRelevance: "High",
  },
  {
    id: "linked-lists",
    slug: "linked-lists",
    name: "Linked Lists & Pointers",
    category: "Data Structures",
    description: "Singly, doubly, and circular linked lists, fast-slow cycle detection, and list reversals.",
    totalQuestions: 20,
    completedQuestions: 15,
    difficulty: "Medium",
    estimatedHours: 4,
    tags: ["Linked List", "Recursion", "Pointers"],
    interviewRelevance: "Essential",
  },
  {
    id: "binary-search",
    slug: "binary-search",
    name: "Binary Search",
    category: "Algorithms",
    description: "Logarithmic search on sorted collections, predicate bounds, and rotated arrays.",
    totalQuestions: 22,
    completedQuestions: 14,
    difficulty: "Medium",
    estimatedHours: 5,
    tags: ["Binary Search", "Divide & Conquer"],
    interviewRelevance: "Essential",
  },
  {
    id: "trees-graphs",
    slug: "trees-and-graphs",
    name: "Binary Trees & BST",
    category: "Data Structures",
    description: "DFS, BFS, level-order traversal, LCA, BST validation, and diameter calculations.",
    totalQuestions: 32,
    completedQuestions: 8,
    difficulty: "Medium",
    estimatedHours: 8,
    tags: ["Trees", "DFS", "BFS", "Recursion"],
    interviewRelevance: "Essential",
  },
  {
    id: "graph-algorithms",
    slug: "graph-algorithms",
    name: "Graph Traversal & Shortest Path",
    category: "Algorithms",
    description: "Dijkstra, topological sort, union-find (disjoint sets), and connected components.",
    totalQuestions: 28,
    completedQuestions: 6,
    difficulty: "Hard",
    estimatedHours: 10,
    tags: ["Graphs", "Dijkstra", "Topological Sort"],
    interviewRelevance: "High",
  },
  {
    id: "dynamic-programming",
    slug: "dynamic-programming",
    name: "Dynamic Programming (1D & 2D)",
    category: "Algorithms",
    description: "Memoization, bottom-up tabulation, knapsack, LCS, LIS, and state-machine transitions.",
    totalQuestions: 36,
    completedQuestions: 5,
    difficulty: "Hard",
    estimatedHours: 12,
    tags: ["DP", "Memoization", "Tabulation"],
    interviewRelevance: "High",
  },
  {
    id: "system-design-caching",
    slug: "system-design-caching",
    name: "Distributed Caching & Redis",
    category: "System Design",
    description: "Cache eviction policies (LRU/LFU), write-through/write-back, and thundering herd mitigation.",
    totalQuestions: 14,
    completedQuestions: 4,
    difficulty: "Medium",
    estimatedHours: 4,
    tags: ["Caching", "Redis", "Distributed Systems"],
    interviewRelevance: "High",
  },
  {
    id: "sql-indexing",
    slug: "sql-indexing-transactions",
    name: "SQL, B-Trees & ACID",
    category: "Databases",
    description: "Index scan optimization, isolation levels, transactions, locks, and query planning.",
    totalQuestions: 16,
    completedQuestions: 9,
    difficulty: "Medium",
    estimatedHours: 4,
    tags: ["PostgreSQL", "Indexes", "ACID", "Transactions"],
    interviewRelevance: "Essential",
  },
  {
    id: "react-concurrency",
    slug: "react-internals-concurrency",
    name: "React Internals & Concurrency",
    category: "Full-Stack",
    description: "Virtual DOM reconciliation, fibers, hooks lifecycle, memoization, and server components.",
    totalQuestions: 15,
    completedQuestions: 11,
    difficulty: "Medium",
    estimatedHours: 3,
    tags: ["React", "JavaScript", "Fiber"],
    interviewRelevance: "High",
  },
];

export default function ExploreTopicsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"progress" | "questions" | "name">("progress");

  const categories = ["All", "Algorithms", "Data Structures", "System Design", "Databases", "Full-Stack"];
  const difficulties = ["All", "Easy", "Medium", "Hard"];

  const filteredTopics = useMemo(() => {
    return ALL_TOPICS.filter((topic) => {
      const matchesSearch =
        topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "All" || topic.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === "All" || topic.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    }).sort((a, b) => {
      if (sortBy === "progress") {
        const progA = a.completedQuestions / a.totalQuestions;
        const progB = b.completedQuestions / b.totalQuestions;
        return progB - progA;
      }
      if (sortBy === "questions") return b.totalQuestions - a.totalQuestions;
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedDifficulty("All");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Explore Practice Topics"
          subtitle="Discover curated curriculum modules across algorithms, data structures, and production architecture."
          theme="practice"
          breadcrumbs={[
            { label: "Qubira Learn", href: "/practice" },
            { label: "Explore Topics", href: "/practice/topics", current: true },
          ]}
        />

        <PracticeNav />

        {/* Filter and Search Bar */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 space-y-4 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search topics, concepts, or tags (e.g., 'Dynamic Programming', 'Redis')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* View Mode & Sort Controls */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-semibold text-slate-300 focus:border-indigo-500 focus:outline-none"
              >
                <option value="progress">Sort: Completion Rate</option>
                <option value="questions">Sort: Question Count</option>
                <option value="name">Sort: Alphabetical</option>
              </select>

              <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "list" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" />
                <span>Track:</span>
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Difficulty Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">Difficulty:</span>
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    selectedDifficulty === diff
                      ? "bg-white/20 text-white border border-white/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Showing <strong className="text-white">{filteredTopics.length}</strong> topics
          </span>
          {(searchQuery || selectedCategory !== "All" || selectedDifficulty !== "All") && (
            <button
              onClick={resetFilters}
              className="text-indigo-400 hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Topics Display */}
        {filteredTopics.length === 0 ? (
          <EmptyState
            title="No topics match your filters"
            description="Try adjusting your search query, difficulty level, or category filter to discover available practice topics."
            actionLabel="Reset Filters"
            onAction={resetFilters}
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTopics.map((topic) => {
              const progressPct = Math.round((topic.completedQuestions / topic.totalQuestions) * 100);

              return (
                <div
                  key={topic.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">{topic.category}</span>
                      <DifficultyBadge difficulty={topic.difficulty} size="sm" />
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition-colors">
                      {topic.name}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {topic.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {topic.tags.map((tag) => (
                        <TopicBadge key={tag} label={tag} variant="practice" size="sm" />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {topic.completedQuestions} of {topic.totalQuestions} questions
                        </span>
                        <span className="font-mono font-semibold text-white">{progressPct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>~{topic.estimatedHours} hrs</span>
                      </div>

                      <Link
                        href={`/practice/topics/${topic.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20"
                      >
                        <span>{progressPct > 0 ? "Continue" : "Start Topic"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTopics.map((topic) => {
              const progressPct = Math.round((topic.completedQuestions / topic.totalQuestions) * 100);

              return (
                <div
                  key={topic.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all"
                >
                  <div className="space-y-1 sm:max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">{topic.category}</span>
                      <DifficultyBadge difficulty={topic.difficulty} size="sm" />
                      <span className="text-xs text-indigo-300 font-medium">Relevance: {topic.interviewRelevance}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{topic.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{topic.description}</p>
                  </div>

                  <div className="flex items-center gap-6 justify-between sm:justify-end">
                    <div className="text-right min-w-[120px]">
                      <div className="text-xs font-mono font-bold text-white">
                        {topic.completedQuestions} / {topic.totalQuestions} Solved
                      </div>
                      <div className="text-[11px] text-slate-400">~{topic.estimatedHours} hours total</div>
                    </div>

                    <Link
                      href={`/practice/topics/${topic.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20 shrink-0"
                    >
                      <span>{progressPct > 0 ? "Continue" : "Start"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
