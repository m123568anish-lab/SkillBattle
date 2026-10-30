"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  DifficultyBadge,
  Timer,
  EmptyState,
} from "@/components/arena";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Play,
  Award,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Bookmark,
  Share2,
  X,
  LayoutGrid,
} from "lucide-react";
import toast from "react-hot-toast";

interface PracticeQuestion {
  id: number;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  whyIncorrect: string[];
  concept: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

const SAMPLE_SESSION_QUESTIONS: PracticeQuestion[] = [
  {
    id: 1,
    question: "What is the average and worst-case time complexity of searching for an element in a balanced Hash Table?",
    codeSnippet: "// Average vs Worst Case Lookup\nhashTable.get(key);",
    options: [
      "Average: O(1), Worst Case: O(N)",
      "Average: O(log N), Worst Case: O(N)",
      "Average: O(1), Worst Case: O(log N)",
      "Average: O(N), Worst Case: O(N^2)",
    ],
    correctIndex: 0,
    explanation: "In a balanced hash table, the average search complexity is O(1) assuming a uniform hash distribution. However, if all keys collide into the same bucket (worst case), search degrades to O(N) linear scan of that bucket.",
    whyIncorrect: [
      "O(log N) is typical for self-balancing binary search trees (e.g., Red-Black Tree), not standard hash tables.",
      "O(log N) worst case only occurs if bucket collisions are stored as balanced trees (like Java 8 HashMap), but standard chaining is O(N).",
      "O(N^2) would require quadratic comparison overhead, which does not apply to simple bucket traversal.",
    ],
    concept: "Hash Collisions & Amortized Complexity",
    difficulty: "Easy",
  },
  {
    id: 2,
    question: "In Python, what is the underlying data structure used to implement the built-in dictionary (dict) type?",
    codeSnippet: "user_scores = {'alice': 95, 'bob': 88}",
    options: [
      "A red-black balanced binary search tree",
      "An open-addressed compact array hash table with perturb pseudo-random probing",
      "A linked list of key-value pairs sorted alphabetically",
      "A skip list with probabilistic balancing layers",
    ],
    correctIndex: 1,
    explanation: "Since Python 3.6+, Python dicts use a compact array layout combining an indices array and an entries table to preserve insertion order while using open addressing with a perturbation factor to resolve collisions.",
    whyIncorrect: [
      "Red-black trees are used by C++ std::map, but Python dict does not use tree hierarchies.",
      "Linked lists without index arrays would incur O(N) search and lose fast hash lookup.",
      "Skip lists are used in Redis sorted sets, not core Python dictionary implementations.",
    ],
    concept: "Python Internals & Memory Optimization",
    difficulty: "Medium",
  },
  {
    id: 3,
    question: "When applying the Two Pointers technique to solve the Two Sum problem on a sorted array, what invariant guarantees that you never miss the solution?",
    codeSnippet: "while left < right:\n    current_sum = arr[left] + arr[right]\n    if current_sum < target: left += 1\n    elif current_sum > target: right -= 1\n    else: return [left, right]",
    options: [
      "Moving 'left' rightward strictly increases the sum because the array is sorted in ascending order.",
      "Moving 'right' leftward randomly samples intermediate values.",
      "The array elements are always guaranteed to be distinct non-zero integers.",
      "The search space is partitioned using modular arithmetic bounds.",
    ],
    correctIndex: 0,
    explanation: "Because the array is monotonically non-decreasing, arr[left] + arr[right] strictly increases when advancing 'left' and strictly decreases when decrementing 'right'. This eliminates entire rows/columns of invalid pairs safely.",
    whyIncorrect: [
      "Two pointers is deterministic, not random sampling.",
      "Elements do not have to be distinct non-zero values for two-pointer convergence to hold.",
      "Modular arithmetic is not involved in two-pointer monotonic reduction.",
    ],
    concept: "Monotonicity & Invariants",
    difficulty: "Medium",
  },
  {
    id: 4,
    question: "Which of the following operations takes O(1) time in a doubly linked list if a direct pointer to the target node is already provided?",
    codeSnippet: "node.prev.next = node.next;\nnode.next.prev = node.prev;",
    options: [
      "Deleting the given node from the list",
      "Finding the middle node of the list",
      "Reversing the entire list in place",
      "Sorting all nodes using merge sort",
    ],
    correctIndex: 0,
    explanation: "Because a doubly linked list holds references to both next and prev nodes, updating adjacent pointers to bypass the target node executes in strict O(1) constant time without needing to scan from the head.",
    whyIncorrect: [
      "Finding the middle node requires O(N/2) traversal using fast & slow pointers.",
      "Reversing the list requires updating every node pointer, which is O(N).",
      "Merge sorting a linked list requires O(N log N) time.",
    ],
    concept: "Doubly Linked List Mutation",
    difficulty: "Easy",
  },
  {
    id: 5,
    question: "In the Sliding Window pattern, when should you prefer a dynamically sized window over a fixed-size window?",
    codeSnippet: "// Fixed vs Dynamic Window\nwhile (right < n) {\n  add(arr[right]);\n  while (!isValid()) remove(arr[left++]);\n  right++;\n}",
    options: [
      "When the problem asks to find the shortest or longest subarray meeting a certain condition (e.g., sum >= K).",
      "When the problem asks for the maximum sum of exactly K consecutive elements.",
      "When the input array contains only negative numbers.",
      "When the array is already sorted and has no duplicates.",
    ],
    correctIndex: 0,
    explanation: "Dynamic sliding windows expand the right pointer to satisfy conditions and shrink the left pointer to optimize metrics (like finding minimum length or maximum length). Fixed windows are used when window length K is given upfront.",
    whyIncorrect: [
      "Finding max sum of exactly K elements is the classic textbook definition of a fixed-size window.",
      "Dynamic windows are not restricted by negative elements, though negative elements can invalidate monotonicity.",
      "Sorted arrays are often solved with binary search or two pointers, not strictly dynamic windows.",
    ],
    concept: "Sliding Window Architecture",
    difficulty: "Medium",
  },
];

function PracticeSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic") || "Arrays & Hashing";
  const modeParam = searchParams.get("mode") || "learn";

  // Session state: "configure" | "active" | "results"
  const [sessionState, setSessionState] = useState<"configure" | "active" | "results">(
    modeParam === "quick" || modeParam === "learn" ? "active" : "configure"
  );

  // Configuration options
  const [configQuestionsCount, setConfigQuestionsCount] = useState(5);
  const [configDifficulty, setConfigDifficulty] = useState("Any");
  const [configMode, setConfigMode] = useState<"practice" | "assessment">("practice");

  // Active quiz state
  const [questions, setQuestions] = useState<PracticeQuestion[]>(SAMPLE_SESSION_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Keyboard navigation for options (A, B, C, D / 1, 2, 3, 4)
  useEffect(() => {
    if (sessionState !== "active") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      const optionMap: Record<string, number> = {
        "1": 0, "a": 0,
        "2": 1, "b": 1,
        "3": 2, "c": 2,
        "4": 3, "d": 3,
      };

      if (key in optionMap) {
        const optIdx = optionMap[key];
        const currentQ = questions[currentIndex];
        if (currentQ && optIdx < currentQ.options.length) {
          handleSelectOption(optIdx);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, sessionState, questions, submittedAnswers]);

  const currentQ = questions[currentIndex];
  const isAnswered = selectedAnswers[currentQ?.id] !== undefined;
  const isSubmitted = submittedAnswers[currentQ?.id] === true;
  const selectedOpt = selectedAnswers[currentQ?.id];

  const handleSelectOption = (index: number) => {
    if (isSubmitted && configMode === "practice") return; // locked after submission in practice mode
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: index }));
  };

  const handleSubmitCurrent = () => {
    if (!isAnswered) {
      toast.error("Please select an option first.");
      return;
    }
    setSubmittedAnswers((prev) => ({ ...prev, [currentQ.id]: true }));
    const isCorrect = selectedOpt === currentQ.correctIndex;
    if (isCorrect) {
      toast.success("Correct answer! +25 XP", { duration: 1500 });
    } else {
      toast.error("Not quite. Review the explanation below.", { duration: 2000 });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setSessionState("results");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const toggleBookmark = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
    toast(markedForReview[currentQ.id] ? "Removed from review" : "Marked for review", { icon: "🔖" });
  };

  const handleStartSession = () => {
    setSessionState("active");
    setCurrentIndex(0);
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setMarkedForReview({});
  };

  const handleRetryMistakes = () => {
    const incorrectQuestions = questions.filter((q) => selectedAnswers[q.id] !== q.correctIndex);
    if (incorrectQuestions.length === 0) {
      toast.success("You got 100% correct! Great job.");
      return;
    }
    setQuestions(incorrectQuestions);
    setSessionState("active");
    setCurrentIndex(0);
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setMarkedForReview({});
  };

  // Calculate results
  const correctCount = questions.filter((q) => selectedAnswers[q.id] === q.correctIndex).length;
  const incorrectCount = questions.filter(
    (q) => selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== q.correctIndex
  ).length;
  const unansweredCount = questions.length - Object.keys(selectedAnswers).length;
  const accuracyPct = Math.round((correctCount / questions.length) * 100);

  // 1. CONFIGURATION VIEW
  if (sessionState === "configure") {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6 py-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white">Configure Practice Session</h1>
            <p className="text-sm text-slate-400">
              Customize your learning mode, topic focus, and question difficulty before starting.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-6 backdrop-blur-md">
            {/* Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Learning Experience
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfigMode("practice")}
                  className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                    configMode === "practice"
                      ? "border-indigo-500 bg-indigo-500/10 text-white shadow-md shadow-indigo-500/20"
                      : "border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-white mb-1">
                    <BookOpen className="h-4 w-4 text-indigo-400" />
                    <span>Practice Mode</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Instant step-by-step explanations, why options are wrong, and zero time pressure.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setConfigMode("assessment")}
                  className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                    configMode === "assessment"
                      ? "border-amber-500 bg-amber-500/10 text-white shadow-md shadow-amber-500/20"
                      : "border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-white mb-1">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span>Assessment Mode</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Timed exam simulation. Answers and detailed report are presented upon final completion.
                  </p>
                </button>
              </div>
            </div>

            {/* Question Count Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Question Count
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setConfigQuestionsCount(num)}
                    className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      configQuestionsCount === num
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Target Difficulty
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {["Any", "Easy", "Medium", "Hard"].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setConfigDifficulty(diff)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      configDifficulty === diff
                        ? "bg-white/20 text-white border border-white/30"
                        : "border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <Link
                href="/practice"
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleStartSession}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Begin Practice Session</span>
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 2. RESULTS VIEW
  if (sessionState === "results") {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8 py-6 pb-12">
          {/* Results Hero Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-300">
              <Award className="h-4 w-4 text-emerald-400" />
              <span>Session Complete</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Performance Summary</h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Review your accuracy, conceptual retention, and full explanations for every challenge.
            </p>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-center space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">Accuracy</p>
              <div className="text-3xl font-black font-mono text-indigo-400">{accuracyPct}%</div>
              <p className="text-[11px] text-slate-500">First-attempt accuracy</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-5 text-center space-y-1">
              <p className="text-xs font-bold text-emerald-400 uppercase">Correct</p>
              <div className="text-3xl font-black font-mono text-emerald-300">{correctCount}</div>
              <p className="text-[11px] text-emerald-500">+{correctCount * 25} XP earned</p>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-5 text-center space-y-1">
              <p className="text-xs font-bold text-rose-400 uppercase">Incorrect</p>
              <div className="text-3xl font-black font-mono text-rose-300">{incorrectCount}</div>
              <p className="text-[11px] text-rose-500">Flagged for revision</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-center space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">Unanswered</p>
              <div className="text-3xl font-black font-mono text-slate-300">{unansweredCount}</div>
              <p className="text-[11px] text-slate-500">Skipped items</p>
            </div>
          </div>

          {/* Post-Session Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {incorrectCount > 0 && (
              <button
                type="button"
                onClick={handleRetryMistakes}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Retry {incorrectCount} Mistakes Only</span>
              </button>
            )}
            <Link
              href="/practice"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
            >
              <span>Back to Practice Arena</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-4 pt-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span>Full Question Review & Solutions</span>
            </h3>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${
                      isCorrect
                        ? "border-emerald-500/20 bg-emerald-950/10"
                        : "border-rose-500/20 bg-rose-950/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Question {idx + 1}</span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Correct</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400">
                          <XCircle className="h-4 w-4" />
                          <span>Incorrect</span>
                        </span>
                      )}
                    </div>

                    <p className="text-sm sm:text-base font-bold text-white">{q.question}</p>

                    {q.codeSnippet && (
                      <pre className="rounded-xl border border-white/10 bg-black/50 p-3 text-xs font-mono text-emerald-300 overflow-x-auto">
                        <code>{q.codeSnippet}</code>
                      </pre>
                    )}

                    {/* Options Breakdown */}
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isThisCorrect = optIdx === q.correctIndex;
                        const isThisUser = optIdx === userAns;

                        return (
                          <div
                            key={optIdx}
                            className={`rounded-xl border p-3 text-xs flex items-center justify-between ${
                              isThisCorrect
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 font-semibold"
                                : isThisUser
                                ? "border-rose-500/40 bg-rose-500/10 text-rose-300 font-medium"
                                : "border-white/5 bg-white/[0.01] text-slate-400"
                            }`}
                          >
                            <span>{opt}</span>
                            {isThisCorrect && <span className="text-[11px] font-bold text-emerald-400">Correct Choice</span>}
                            {isThisUser && !isThisCorrect && (
                              <span className="text-[11px] font-bold text-rose-400">Your Selection</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2 text-xs text-slate-300">
                      <strong className="text-white block">Explanation:</strong>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 3. ACTIVE PRACTICE QUESTION INTERFACE
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-4 pb-12">
        {/* Distraction-Free Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md px-2.5 py-1">
              Practice
            </span>
            <span className="text-sm font-bold text-white hidden sm:inline">{topicParam}</span>
          </div>

          <div className="flex items-center gap-3">
            <Timer initialSeconds={600} />

            <button
              type="button"
              onClick={toggleBookmark}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                markedForReview[currentQ?.id]
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-white/[0.04] text-slate-400 border-white/10 hover:text-white"
              }`}
              title="Bookmark for review"
            >
              <Bookmark className="h-4 w-4" />
            </button>

            {/* Mobile Navigator Drawer Toggle */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"
              title="Question Palette"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Session Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>
              Question <strong className="text-white">{currentIndex + 1}</strong> of {questions.length}
            </span>
            <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-2">
          {/* Main Question & Options Area (3 Columns) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 space-y-6 backdrop-blur-md shadow-xl">
              {/* Question Meta */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-400">
                  Concept: {currentQ?.concept}
                </span>
                <DifficultyBadge difficulty={currentQ?.difficulty || "Medium"} size="sm" />
              </div>

              {/* Question Statement */}
              <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                {currentQ?.question}
              </h2>

              {/* Optional Code Snippet */}
              {currentQ?.codeSnippet && (
                <div className="rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs sm:text-sm text-emerald-300 overflow-x-auto shadow-inner">
                  <pre>
                    <code>{currentQ.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {/* MCQ Options with Keyboard Shortcuts */}
              <div className="space-y-3 pt-2">
                {currentQ?.options.map((opt, idx) => {
                  const isSelected = selectedOpt === idx;
                  const isCorrect = idx === currentQ.correctIndex;
                  const showResult = isSubmitted && configMode === "practice";

                  let optStyles = "border-white/10 bg-white/[0.02] text-slate-300 hover:border-indigo-500/40 hover:bg-white/[0.04]";
                  if (isSelected && !showResult) {
                    optStyles = "border-indigo-500 bg-indigo-500/10 text-white shadow-md shadow-indigo-500/20";
                  } else if (showResult) {
                    if (isCorrect) {
                      optStyles = "border-emerald-500 bg-emerald-500/10 text-emerald-200 font-semibold";
                    } else if (isSelected && !isCorrect) {
                      optStyles = "border-rose-500 bg-rose-500/10 text-rose-200 font-medium";
                    }
                  }

                  const shortcutKey = String.fromCharCode(65 + idx); // A, B, C, D

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      disabled={isSubmitted && configMode === "practice"}
                      className={`w-full rounded-xl border p-4 text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${optStyles}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-black/40 text-xs font-mono font-bold text-slate-300 shrink-0">
                          {shortcutKey}
                        </span>
                        <span className="text-sm leading-relaxed">{opt}</span>
                      </div>

                      {showResult && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Conceptual Feedback (Practice Mode) */}
              {isSubmitted && configMode === "practice" && (
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5 space-y-3 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <Sparkles className="h-4 w-4" />
                    <span>Conceptual Breakdown</span>
                  </div>
                  <p className="text-slate-200">{currentQ.explanation}</p>

                  {currentQ.whyIncorrect.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-indigo-500/20">
                      <strong className="text-indigo-300 block">Why other options are incorrect:</strong>
                      <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                        {currentQ.whyIncorrect.map((why, i) => (
                          <li key={i}>{why}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/[0.08] cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                {!isSubmitted && configMode === "practice" ? (
                  <button
                    type="button"
                    onClick={handleSubmitCurrent}
                    disabled={!isAnswered}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Check Answer</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 cursor-pointer"
                  >
                    <span>{currentIndex === questions.length - 1 ? "Finish Session" : "Next Question"}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Right Panel: Question Navigator Palette */}
          <div className="hidden lg:block lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4 backdrop-blur-md sticky top-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Question Palette
              </h3>

              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnsweredQ = selectedAnswers[q.id] !== undefined;
                  const isMarked = markedForReview[q.id];

                  let btnStyle = "border-white/10 bg-white/[0.02] text-slate-400";
                  if (isCurrent) {
                    btnStyle = "border-indigo-500 bg-indigo-600 text-white font-bold ring-2 ring-indigo-500/30";
                  } else if (isMarked) {
                    btnStyle = "border-amber-500/50 bg-amber-500/20 text-amber-300 font-semibold";
                  } else if (isAnsweredQ) {
                    btnStyle = "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 w-full rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center justify-center ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-1.5 pt-4 border-t border-white/[0.06] text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>Marked for review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span>Current question</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Question Palette Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm lg:hidden">
            <div className="w-full rounded-t-2xl border-t border-white/10 bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Question Palette</h3>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnsweredQ = selectedAnswers[q.id] !== undefined;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setMobileDrawerOpen(false);
                      }}
                      className={`h-10 rounded-lg border text-xs font-mono font-bold ${
                        isCurrent
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : isAnsweredQ
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                          : "bg-white/5 border-white/10 text-slate-400"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Exit Practice?</h3>
                  <p className="text-xs text-slate-400">Your current answers will not be scored.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.08]"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/practice")}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
                >
                  Exit Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Practice Session...</div>}>
      <PracticeSessionContent />
    </Suspense>
  );
}
