"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { api } from "@/lib/api";
import { useDashboardStore } from "@/store/dashboardStore";
import {
  RefreshCw,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Play,
  RotateCcw,
  Timer,
  Zap,
  BookOpen,
  Code2,
  Terminal,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Flame,
  FileCode,
} from "lucide-react";
import toast from "react-hot-toast";

const QUESTION_ROTATION_SECONDS = 30 * 60;

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BANK (30 placement-grade MCQs, 10 picked randomly each session)
// ─────────────────────────────────────────────────────────────────────────────
interface MCQQuestion {
  id: number;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpReward: number;
}

const ALL_MCQ_QUESTIONS: MCQQuestion[] = [
  { id: 1,  category: "Algorithms", difficulty: "Medium", xpReward: 25,
    question: "What is the worst-case time complexity of Quick Sort?",
    options: ["O(N log N)", "O(N)", "O(N²)", "O(log N)"],
    correctIndex: 2,
    explanation: "QuickSort degrades to O(N²) when the pivot chosen is always an extreme element (e.g., sorted array with first element as pivot)." },

  { id: 2,  category: "Data Structures", difficulty: "Easy", xpReward: 20,
    question: "Which data structure is used to implement BFS in a graph?",
    options: ["Stack", "Queue", "Priority Queue", "Binary Search Tree"],
    correctIndex: 1,
    explanation: "BFS uses a FIFO Queue to explore nodes level by level." },

  { id: 3,  category: "Language", difficulty: "Easy", xpReward: 15,
    question: "In Python, which built-in data type is immutable?",
    options: ["List", "Dictionary", "Tuple", "Set"],
    correctIndex: 2,
    explanation: "Tuples cannot be modified after creation, making them immutable." },

  { id: 4,  category: "SQL", difficulty: "Easy", xpReward: 20,
    question: "What does 'GROUP BY' do in SQL?",
    options: ["Sorts rows in ascending order", "Groups rows sharing values into summary rows", "Filters rows before aggregation", "Joins two tables"],
    correctIndex: 1,
    explanation: "GROUP BY aggregates rows that have the same values in specified columns into summary rows." },

  { id: 5,  category: "Algorithms", difficulty: "Medium", xpReward: 25,
    question: "Which technique solves the 0/1 Knapsack problem optimally?",
    options: ["Greedy Algorithm", "Dynamic Programming", "Divide and Conquer", "Backtracking"],
    correctIndex: 1,
    explanation: "0/1 Knapsack has overlapping subproblems and optimal substructure, making Dynamic Programming the optimal solution." },

  { id: 6,  category: "System Design", difficulty: "Hard", xpReward: 35,
    question: "Which theorem states you can have at most 2 of: Consistency, Availability, Partition tolerance?",
    options: ["SOLID Principle", "CAP Theorem", "ACID Properties", "BASE Model"],
    correctIndex: 1,
    explanation: "CAP Theorem (Brewer's Theorem) proves distributed data stores can only guarantee at most 2 of the 3 properties simultaneously." },

  { id: 7,  category: "Data Structures", difficulty: "Medium", xpReward: 25,
    question: "What is the time complexity of searching in a balanced Binary Search Tree?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
    correctIndex: 1,
    explanation: "A balanced BST halves the search space at each comparison step, yielding O(log N) search time." },

  { id: 8,  category: "OOP", difficulty: "Easy", xpReward: 20,
    question: "Which OOP principle states that software entities should be open for extension, but closed for modification?",
    options: ["Single Responsibility", "Open/Closed Principle", "Liskov Substitution", "Interface Segregation"],
    correctIndex: 1,
    explanation: "The Open/Closed Principle (OCP) ensures existing tested code isn't modified when adding new functionality." },

  { id: 9,  category: "Algorithms", difficulty: "Medium", xpReward: 25,
    question: "Which sorting algorithm guarantees O(N log N) time in worst, best, and average cases?",
    options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Quick Sort"],
    correctIndex: 2,
    explanation: "Merge Sort consistently divides the array in half and merges sorted sublists in O(N log N) time in all cases." },

  { id: 10, category: "Networking", difficulty: "Easy", xpReward: 20,
    question: "Which layer of the OSI model does the TCP protocol operate on?",
    options: ["Network Layer", "Transport Layer", "Data Link Layer", "Application Layer"],
    correctIndex: 1,
    explanation: "TCP operates at the Transport Layer (Layer 4) providing reliable end-to-end communication." },

  { id: 11, category: "OS", difficulty: "Medium", xpReward: 25,
    question: "Which condition is NOT one of Coffman's four conditions for deadlock?",
    options: ["Mutual Exclusion", "Hold and Wait", "Preemption Allowed", "Circular Wait"],
    correctIndex: 2,
    explanation: "No Preemption is required for deadlock; if preemption is allowed, deadlock cannot occur." },

  { id: 12, category: "SQL", difficulty: "Medium", xpReward: 25,
    question: "What is the difference between HAVING and WHERE in SQL?",
    options: ["They are identical", "WHERE filters rows before aggregation, HAVING filters groups after aggregation", "HAVING filters rows, WHERE filters groups", "HAVING only works on primary keys"],
    correctIndex: 1,
    explanation: "WHERE filters individual rows prior to GROUP BY. HAVING filters aggregated result groups." },

  { id: 13, category: "Algorithms", difficulty: "Easy", xpReward: 20,
    question: "What is the space complexity of an in-place Bubble Sort?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N²)"],
    correctIndex: 0,
    explanation: "In-place Bubble Sort only uses a single auxiliary variable for swapping, making auxiliary space O(1)." },

  { id: 14, category: "Data Structures", difficulty: "Hard", xpReward: 35,
    question: "What is the amortized time complexity of inserting into a dynamic array (like std::vector or Python list)?",
    options: ["O(N)", "O(log N)", "O(1)", "O(N log N)"],
    correctIndex: 2,
    explanation: "While occasional resize takes O(N), the cost is spread out across N insertions, making amortized time O(1)." },

  { id: 15, category: "System Design", difficulty: "Medium", xpReward: 25,
    question: "Which caching strategy writes data to both cache and database simultaneously?",
    options: ["Write-Through", "Write-Back", "Write-Around", "Refresh-Ahead"],
    correctIndex: 0,
    explanation: "Write-Through writes directly to cache and primary storage at the same time, guaranteeing consistency." },
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

type CanonicalProblem = {
  id: number;
  title: string;
  difficulty: string;
  description: string;
  constraints: string;
  sample_input: string;
  sample_output: string;
  xp_reward: number;
  is_active?: boolean;
};

function toCodingProblem(problem: CanonicalProblem): CodingProblem {
  const template = CODING_PROBLEMS.find(
    (candidate) => candidate.title.trim().toLowerCase() === problem.title.trim().toLowerCase(),
  );
  const constraints = problem.constraints
    .split(/\r?\n/)
    .map((constraint) => constraint.trim())
    .filter(Boolean);

  return {
    ...(template ?? {
      examples: [],
      starterCode: { python: "", javascript: "", cpp: "", java: "" },
      testInput: problem.sample_input || "",
    }),
    id: problem.id,
    title: problem.title,
    difficulty: (problem.difficulty.toLowerCase() === "easy"
      ? "Easy"
      : problem.difficulty.toLowerCase() === "hard" ? "Hard" : "Medium"),
    description: problem.description,
    constraints,
    xpReward: problem.xp_reward,
    testInput: problem.sample_input || template?.testInput || "",
    examples: problem.sample_input || problem.sample_output
      ? [{ input: problem.sample_input, output: problem.sample_output }]
      : template?.examples ?? [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE CODING PROBLEMS (Aligned with database IDs 1 to 5)
// ─────────────────────────────────────────────────────────────────────────────
interface CodingProblem {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  xpReward: number;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCode: Record<string, string>;
  testInput: string;
  company?: string;
}

const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    xpReward: 100,
    company: "Amazon",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. Output indices separated by a space.",
    examples: [
      { input: "2 7 11 15\n9", output: "0 1", explanation: "nums[0] + nums[1] == 9, so indices 0 and 1 are returned." },
      { input: "3 2 4\n6",     output: "1 2", explanation: "nums[1] + nums[2] == 6, so indices 1 and 2 are returned." },
    ],
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9", "Only one valid answer exists."],
    testInput: "2 7 11 15\n9",
    starterCode: {
      python: `import sys

def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

# Read inputs from standard input
lines = sys.stdin.read().strip().splitlines()
if len(lines) >= 2:
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    res = two_sum(nums, target)
    print(f"{res[0]} {res[1]}")
else:
    print("0 1")
`,
      javascript: `const fs = require('fs');

function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) return [map.get(diff), i];
        map.set(nums[i], i);
    }
    return [];
}

const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length >= 2) {
    const nums = input[0].trim().split(/\\s+/).map(Number);
    const target = Number(input[1].trim());
    const res = twoSum(nums, target);
    console.log(\`\${res[0]} \${res[1]}\`);
} else {
    console.log("0 1");
}
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    int target;
    vector<int> nums;
    // Enter solution logic
    cout << "0 1" << endl;
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("0 1");
    }
}
`,
    },
  },
  {
    id: 2,
    title: "Reverse String",
    difficulty: "Easy",
    xpReward: 80,
    company: "Microsoft",
    description: "Write a function that reverses a string given as standard input. Return the reversed string to stdout.",
    examples: [
      { input: "hello", output: "olleh" },
      { input: "SkillBattle", output: "elttaBllikS" },
    ],
    constraints: ["1 <= s.length <= 10^5", "s consists of printable ASCII characters."],
    testInput: "hello",
    starterCode: {
      python: `import sys

def reverse_string(s):
    return s[::-1]

input_str = sys.stdin.read().strip()
if input_str:
    print(reverse_string(input_str))
else:
    print("olleh")
`,
      javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
console.log(input ? input.split('').reverse().join('') : 'olleh');
`,
      cpp: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    string s;
    if (cin >> s) {
        reverse(s.begin(), s.end());
        cout << s << endl;
    } else {
        cout << "olleh" << endl;
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String s = sc.next();
            System.out.println(new StringBuilder(s).reverse().toString());
        } else {
            System.out.println("olleh");
        }
    }
}
`,
    },
  },
  {
    id: 3,
    title: "Valid Parentheses",
    difficulty: "Easy",
    xpReward: 120,
    company: "Google",
    description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if open brackets are closed by the same type of brackets and closed in the correct order. Output 'True' or 'False'.",
    examples: [
      { input: "()", output: "True" },
      { input: "()[]{}", output: "True" },
      { input: "(]", output: "False" },
    ],
    constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
    testInput: "()[]{}",
    starterCode: {
      python: `import sys

def is_valid(s):
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for c in s.strip():
        if c in '({[':
            stack.append(c)
        elif not stack or stack[-1] != pairs.get(c):
            return False
        else:
            stack.pop()
    return len(stack) == 0

s = sys.stdin.read().strip()
if s:
    print(is_valid(s))
else:
    print(True)
`,
      javascript: `const fs = require('fs');

function isValid(s) {
    const stack = [];
    const pairs = {')':'(', '}':'{', ']':'['};
    for (const c of s.trim()) {
        if ('({['.includes(c)) stack.push(c);
        else if (stack.length === 0 || stack[stack.length-1] !== pairs[c]) return false;
        else stack.pop();
    }
    return stack.length === 0;
}

const input = fs.readFileSync(0, 'utf-8').trim();
console.log(isValid(input || '()'));
`,
      cpp: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

int main() {
    cout << "True" << endl;
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("True");
    }
}
`,
    },
  },
  {
    id: 4,
    title: "Binary Search",
    difficulty: "Medium",
    xpReward: 200,
    company: "Meta",
    description: "Given an array of integers `nums` sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, return its index; otherwise, return -1.\n\nInput line 1 has space-separated integers, line 2 has target integer.",
    examples: [
      { input: "-1 0 3 5 9 12\n9", output: "4", explanation: "9 exists in nums and its index is 4" },
      { input: "-1 0 3 5 9 12\n2", output: "-1", explanation: "2 does not exist in nums so return -1" },
    ],
    constraints: ["1 <= nums.length <= 10^4", "-10^4 < nums[i], target < 10^4", "All elements in nums are unique."],
    testInput: "-1 0 3 5 9 12\n9",
    starterCode: {
      python: `import sys

def binary_search(nums, target):
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

lines = sys.stdin.read().strip().splitlines()
if len(lines) >= 2:
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    print(binary_search(nums, target))
else:
    print(4)
`,
      javascript: `const fs = require('fs');

function binarySearch(nums, target) {
    let low = 0, high = nums.length - 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (lines.length >= 2) {
    const nums = lines[0].trim().split(/\\s+/).map(Number);
    const target = Number(lines[1].trim());
    console.log(binarySearch(nums, target));
} else {
    console.log(4);
}
`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    cout << 4 << endl;
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println(4);
    }
}
`,
    },
  },
  {
    id: 5,
    title: "Maximum Subarray",
    difficulty: "Hard",
    xpReward: 300,
    company: "Apple",
    description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum. Use Kadane's Algorithm for optimal O(N) performance.",
    examples: [
      { input: "-2 1 -3 4 -1 2 1 -5 4", output: "6", explanation: "Subarray [4, -1, 2, 1] has largest sum 6." },
      { input: "1", output: "1" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    testInput: "-2 1 -3 4 -1 2 1 -5 4",
    starterCode: {
      python: `import sys

def max_subarray(nums):
    max_sum = curr = nums[0]
    for n in nums[1:]:
        curr = max(n, curr + n)
        max_sum = max(max_sum, curr)
    return max_sum

data = sys.stdin.read().strip()
if data:
    nums = list(map(int, data.split()))
    print(max_subarray(nums))
else:
    print(6)
`,
      javascript: `const fs = require('fs');

function maxSubArray(nums) {
    let maxSum = nums[0], curr = nums[0];
    for (let i = 1; i < nums.length; i++) {
        curr = Math.max(nums[i], curr + nums[i]);
        maxSum = Math.max(maxSum, curr);
    }
    return maxSum;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const nums = input.split(/\\s+/).map(Number);
    console.log(maxSubArray(nums));
} else {
    console.log(6);
}
`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    cout << 6 << endl;
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println(6);
    }
}
`,
    },
  },
];

const UNAVAILABLE_CODING_PROBLEM: CodingProblem = {
  id: 0,
  title: "Coding problem unavailable",
  difficulty: "Easy",
  xpReward: 0,
  description: "A canonical problem could not be loaded. Refresh or try again later.",
  examples: [],
  constraints: [],
  starterCode: { python: "", javascript: "", cpp: "", java: "" },
  testInput: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// TIMERS
// ─────────────────────────────────────────────────────────────────────────────
function useTimer(active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return { elapsed, fmt };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN INNER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function SoloBattleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "coding" ? "coding" : "mcq";

  // Session state
  const [activeMode, setActiveMode] = useState<"mcq" | "coding">(initialMode);
  const [sessionQuestions, setSessionQuestions] = useState<MCQQuestion[]>([]);
  const [sessionProblem, setSessionProblem] = useState<CodingProblem>(CODING_PROBLEMS[0]);
  const [canonicalProblems, setCanonicalProblems] = useState<CanonicalProblem[]>([]);
  const [problemCatalogLoading, setProblemCatalogLoading] = useState(true);
  const [problemCatalogError, setProblemCatalogError] = useState<string | null>(null);
  const problemCatalogRequested = useRef(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // MCQ state
  const [mcqIndex, setMcqIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answeredMap, setAnsweredMap] = useState<Record<number, boolean | null>>({});

  // Coding state
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [output, setOutput] = useState("");
  const [codingSolved, setCodingSolved] = useState(false);
  const [codingXp, setCodingXp] = useState(0);
  const [submissionVerdict, setSubmissionVerdict] = useState<string | null>(null);
  const [passedTests, setPassedTests] = useState<number | null>(null);
  const [totalTests, setTotalTests] = useState<number | null>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<"testcase" | "result">("testcase");

  // Mobile navigation tab in coding mode: 'problem' | 'code' | 'results'
  const [mobileCodingTab, setMobileCodingTab] = useState<"problem" | "code" | "results">("problem");

  // Persisted progress upon session completion
  const [persistedProgress, setPersistedProgress] = useState<{ total_xp: number; level: number } | null>(null);

  // Timer
  const { elapsed, fmt } = useTimer(sessionStarted && !sessionComplete);

  // ── Session initialization ─────────────────────────────────────────────────
  const startSession = useCallback((availableProblems: CanonicalProblem[] = canonicalProblems) => {
    const qs = pickRandom(ALL_MCQ_QUESTIONS, 10);
    const canonicalProblem = availableProblems.length
      ? availableProblems[Math.floor(Math.random() * availableProblems.length)]
      : null;
    const prob = canonicalProblem
      ? toCodingProblem(canonicalProblem)
      : UNAVAILABLE_CODING_PROBLEM;

    setSessionQuestions(qs);
    setSessionProblem(prob);
    setSessionStarted(true);
    setSessionComplete(false);
    setMcqIndex(0);
    setSelectedOption(null);
    setAnsweredMap({});

    setLanguage("python");
    setCode(prob.starterCode.python);
    setCustomInput(prob.testInput);
    setUseCustomInput(false);
    setOutput("");
    setRunning(false);
    setSubmitting(false);
    setCodingSolved(false);
    setCodingXp(0);
    setSubmissionVerdict(null);
    setPassedTests(null);
    setTotalTests(null);
    setActiveConsoleTab("testcase");
    setMobileCodingTab("problem");
    setPersistedProgress(null);
  }, [canonicalProblems]);

  useEffect(() => {
    if (problemCatalogRequested.current) return;
    problemCatalogRequested.current = true;
    let active = true;
    api.get<CanonicalProblem[]>('/problems?limit=100')
      .then(({ data }) => {
        if (!active) return;
        const activeProblems = Array.isArray(data) ? data.filter((problem) => problem.is_active !== false) : [];
        setCanonicalProblems(activeProblems);
        setProblemCatalogError(null);
        startSession(activeProblems);
      })
      .catch((error: any) => {
        if (!active) return;
        setCanonicalProblems([]);
        setProblemCatalogError(error?.response?.data?.detail || 'The coding problem bank is temporarily unavailable.');
        startSession([]);
      })
      .finally(() => {
        if (active) {
          setProblemCatalogLoading(false);
        }
      });
    return () => { active = false; };
  }, [startSession]);

  // Update starter code when language changes
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(sessionProblem.starterCode[newLang] || sessionProblem.starterCode.python);
  };

  // ── MCQ Handlers ───────────────────────────────────────────────────────────
  const currentMcq = sessionQuestions[mcqIndex];
  const isCurrentAnswered = currentMcq ? answeredMap[currentMcq.id] !== undefined : false;
  const mcqDone = sessionQuestions.length > 0 && Object.keys(answeredMap).length >= sessionQuestions.length;
  const correctCount = Object.values(answeredMap).filter(Boolean).length;

  const handleSubmitMcq = () => {
    if (selectedOption === null || isCurrentAnswered || !currentMcq) return;
    const correct = selectedOption === currentMcq.correctIndex;
    setAnsweredMap((prev) => ({ ...prev, [currentMcq.id]: correct }));
  };

  // Auto-advance MCQ
  useEffect(() => {
    if (!isCurrentAnswered) return;
    const timerId = setTimeout(() => {
      if (mcqIndex < sessionQuestions.length - 1) {
        setMcqIndex((i) => i + 1);
        setSelectedOption(null);
      }
    }, 850);
    return () => clearTimeout(timerId);
  }, [isCurrentAnswered, mcqIndex, sessionQuestions.length]);

  // ── Coding Execution Handlers ──────────────────────────────────────────────
  const handleRunCode = async () => {
    setRunning(true);
    setActiveConsoleTab("result");
    setMobileCodingTab("results");
    setOutput("⏳ Running code in secure sandbox...");
    try {
      const res = await api.post("/compiler/run", {
        language,
        source_code: code,
        stdin: useCustomInput ? customInput : sessionProblem.testInput,
      });

      const out = res.data.stdout || "";
      const err = res.data.stderr || "";
      const status = res.data.status || "Execution complete";
      const runtime = res.data.execution_time ? ` (${res.data.execution_time}ms)` : "";

      if (err) {
        setOutput(`Status: ${status}${runtime}\n\nError Output:\n${err}`);
      } else {
        setOutput(`Status: ${status}${runtime}\n\nProgram Output:\n${out || "(No output printed)"}`);
      }
    } catch (err: any) {
      setOutput(`Error: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (codingSolved) return;
    if (canonicalProblems.length === 0) {
      const message = problemCatalogLoading
        ? "The coding problem bank is still loading. Please retry in a moment."
        : problemCatalogError || "No active coding problems are currently available.";
      setOutput(message);
      toast.error(message);
      return;
    }
    setSubmitting(true);
    setActiveConsoleTab("result");
    setMobileCodingTab("results");
    setOutput("⏳ Judging submission against authoritative test cases...");

    try {
      const res = await api.post("/compiler/submit", {
        problem_id: sessionProblem.id,
        language,
        source_code: code,
      });

      const verdict = res.data.verdict;
      const passed = verdict === "Accepted";
      const earned = Number(res.data.xp_earned || 0);
      const xpStatus = String(res.data.xp_status || (earned > 0 ? "granted" : "not_eligible"));

      setSubmissionVerdict(verdict);
      setPassedTests(res.data.passed_tests ?? 0);
      setTotalTests(res.data.total_tests ?? 0);

      if (passed) {
        setCodingSolved(true);
        const verifiedXp = xpStatus === "granted" ? earned : 0;
        setCodingXp(verifiedXp);
        if (xpStatus === "pending" && res.data.submission_id) {
          try {
            const retry = await api.post(`/compiler/submissions/${res.data.submission_id}/finalize-xp`);
            const retryStatus = String(retry.data?.xp_status || "pending");
            const retryXp = Number(retry.data?.xp_earned || 0);
            if (retryStatus === "granted") {
              setCodingXp(retryXp);
              setOutput(`Accepted by the evaluator. +${retryXp} verified XP was recorded in your ledger.`);
              toast.success(`Solution accepted! +${retryXp} verified XP`);
              void useDashboardStore.getState().refresh();
              return;
            }
          } catch {
            // Preserve the verified evaluation and explicitly show that XP is still pending.
          }
        }
        if (xpStatus !== "granted") {
          setOutput(xpStatus === "pending"
            ? `Accepted by the evaluator, but XP finalization is pending. No XP was recorded as awarded.`
            : `Accepted by the evaluator. This submission was not eligible for an XP award.`);
          if (xpStatus === "pending") toast.error("Accepted, but XP finalization is pending.");
          else toast.success("Solution accepted.");
          return;
        }
        setOutput(
          `✅ ACCEPTED — All ${res.data.passed_tests}/${res.data.total_tests} test cases passed!\n` +
          `Execution Time: ${res.data.execution_time}ms | Memory: ${res.data.memory_used}MB\n` +
          `🏆 +${earned} Verified XP Awarded to your ledger!`
        );
        toast.success(`Solution Accepted! +${earned} XP`);
        void useDashboardStore.getState().refresh();
      } else {
        setOutput(
          `❌ ${verdict} — ${res.data.passed_tests}/${res.data.total_tests} test cases passed.\n` +
          `Execution Time: ${res.data.execution_time}ms\n` +
          `Review your logic, boundary conditions, or constraints and retry.`
        );
      }
    } catch (error: any) {
      setCodingSolved(false);
      setCodingXp(0);
      const message = error?.response?.data?.detail || error?.message || "Submission evaluation failed.";
      setOutput(`Submission failed: ${message}`);
      toast.error(`Submission error: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Session Finish Handler ─────────────────────────────────────────────────
  const handleFinishSession = async () => {
    if (activeMode === "coding") {
      void useDashboardStore.getState().refresh();
      setPersistedProgress(null);
      setSessionComplete(true);
      return;
    }

    try {
      const response = await api.post("/battle/solo/finish", {
        mcq_results: sessionQuestions.map((q) => ({
          category: q.category,
          correct: answeredMap[q.id] === true,
        })),
        coding_solved: codingSolved,
      });

      const added = Number(response.data.xp_added || 0);
      setPersistedProgress({
        total_xp: Number(response.data.total_xp || 0),
        level: Number(response.data.level || 1),
      });

      if (added > 0) {
        toast.success(`Session saved! +${added} verified XP earned!`);
      } else {
        toast.success("Session saved successfully!");
      }

      await useDashboardStore.getState().refresh();
      setSessionComplete(true);
    } catch (e) {
      console.error(e);
      toast.error("Unable to save your session. Please retry.");
    }
  };

  const totalVerifiedXp = (correctCount * 15) + codingXp;

  // ── Session Complete Summary Screen ─────────────────────────────────────────
  if (sessionComplete) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[75vh] flex-col items-center justify-center gap-6 text-center px-4">
          <div className="text-6xl animate-bounce">🏆</div>
          <h1 className="text-3xl font-black text-white md:text-5xl">Battle Session Complete!</h1>
          <p className="max-w-md text-slate-300 text-sm md:text-base leading-relaxed">
            {activeMode === "coding"
              ? "Your code was evaluated by the server. Any eligible XP is recorded in your account ledger."
              : "Your session summary is ready. MCQ correctness is evaluated in this session."}
          </p>

          <div className="grid w-full max-w-lg gap-4 grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-2xl font-black text-cyan-300">{correctCount} / 10</p>
              <p className="mt-1 text-xs text-slate-400">MCQ Correct</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-2xl font-black text-yellow-300">+{totalVerifiedXp}</p>
              <p className="mt-1 text-xs text-slate-400">Verified XP</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-2xl font-black text-violet-300">{fmt(elapsed)}</p>
              <p className="mt-1 text-xs text-slate-400">Time Taken</p>
            </div>
          </div>

          {persistedProgress && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-200">
              Updated Profile: {persistedProgress.total_xp.toLocaleString()} Total XP • Level {persistedProgress.level}
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-2">
            <button
              onClick={() => startSession()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 transition"
            >
              <RotateCcw className="h-4 w-4" /> Start New Duel
            </button>
            <button
              onClick={() => router.push("/battle")}
              className="rounded-xl border border-white/15 bg-slate-800 px-6 py-3 font-bold text-slate-300 hover:text-white transition"
            >
              ← Battle Command Center
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Active Battle Arena Workspace ──────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-4 pb-8">
        {/* Header Bar */}
        <header className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_25%),linear-gradient(135deg,#070b14,#0e1628_40%,#070b14)] p-4 md:p-5 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/battle")}
                className="rounded-xl border border-white/10 bg-slate-800/80 p-2 text-slate-300 hover:text-white transition"
                title="Back to Command Center"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300">
                    {activeMode === "mcq" ? "MCQ Knowledge Sprint" : "DSA Coding Arena"}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    Server Authoritative
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-white">
                  {activeMode === "mcq" ? "Computer Science Fundamentals" : sessionProblem.title}
                </h1>
                {activeMode === "coding" && (problemCatalogLoading || canonicalProblems.length === 0) && (
                  <p role="status" className="mt-1 max-w-lg text-xs text-amber-200">
                    {problemCatalogLoading
                      ? "Loading the verified problem bank…"
                      : problemCatalogError || "No active coding problems are available. Submissions are disabled."}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-1.5 text-xs font-bold text-white">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {fmt(elapsed)}
              </div>

              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-bold text-yellow-300">
                ⚡ +{totalVerifiedXp} Verified XP
              </div>

              <button
                onClick={() => startSession()}
                title="Load fresh question set"
                className="rounded-xl border border-white/10 bg-slate-800/80 p-2 text-slate-300 hover:text-white transition"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* Mode Switcher Tabs */}
        <div className="flex gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-1.5 max-w-md">
          <button
            onClick={() => setActiveMode("mcq")}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition ${
              activeMode === "mcq"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen size={14} />
            MCQ Battle ({Object.keys(answeredMap).length}/10)
          </button>

          <button
            onClick={() => setActiveMode("coding")}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition ${
              activeMode === "coding"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Code2 size={14} />
            Coding Battle {codingSolved ? "✓" : ""}
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            MCQ BATTLE MODE
            ════════════════════════════════════════════════════════════════════ */}
        {activeMode === "mcq" && currentMcq && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Question Card */}
            <div className="lg:col-span-2 rounded-[28px] border border-white/10 bg-slate-900/90 p-6 md:p-8 flex flex-col gap-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-violet-500/20 border border-violet-500/30 px-3 py-1 text-xs font-bold text-violet-300">
                    {currentMcq.category}
                  </span>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                      currentMcq.difficulty === "Easy"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : currentMcq.difficulty === "Medium"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {currentMcq.difficulty}
                  </span>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                  Question {mcqIndex + 1} of {sessionQuestions.length}
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-slate-400">
                  <span>Sprint Progress</span>
                  <span>{correctCount} / {sessionQuestions.length} Correct</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-300"
                    style={{ width: `${((mcqIndex + 1) / sessionQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                {currentMcq.question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {currentMcq.options.map((opt, idx) => {
                  const isCorrect = idx === currentMcq.correctIndex;
                  const isSelected = selectedOption === idx;
                  let cls = "border-white/10 bg-slate-800/40 text-slate-200 hover:bg-slate-700/60";

                  if (isCurrentAnswered) {
                    if (isCorrect) {
                      cls = "border-emerald-500/70 bg-emerald-500/15 text-emerald-200 font-semibold";
                    } else if (isSelected) {
                      cls = "border-rose-500/70 bg-rose-500/15 text-rose-200";
                    } else {
                      cls = "border-white/5 bg-slate-800/20 text-slate-500";
                    }
                  } else if (isSelected) {
                    cls = "border-cyan-400 bg-cyan-500/15 text-cyan-200 font-semibold ring-1 ring-cyan-400";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => !isCurrentAnswered && setSelectedOption(idx)}
                      disabled={isCurrentAnswered}
                      className={`w-full rounded-2xl border p-4 text-left text-sm md:text-base transition flex items-center gap-3.5 ${cls}`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-xs font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCurrentAnswered && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
                      {isCurrentAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Solution Explanation */}
              {isCurrentAnswered && (
                <div
                  className={`rounded-2xl border p-4 text-sm leading-relaxed ${
                    answeredMap[currentMcq.id]
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                  }`}
                >
                  <p className="font-bold mb-1">
                    {answeredMap[currentMcq.id] ? "🎉 Correct! +15 verified XP" : "❌ Incorrect"}
                  </p>
                  <p className="text-xs text-slate-300">{currentMcq.explanation}</p>
                </div>
              )}

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  disabled={mcqIndex === 0 || isCurrentAnswered}
                  onClick={() => {
                    setMcqIndex((p) => p - 1);
                    setSelectedOption(null);
                  }}
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-30 transition"
                >
                  ← Previous
                </button>

                {!isCurrentAnswered ? (
                  <button
                    onClick={handleSubmitMcq}
                    disabled={selectedOption === null}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 disabled:opacity-40 transition"
                  >
                    Confirm Answer
                  </button>
                ) : (
                  <button
                    disabled={mcqIndex >= sessionQuestions.length - 1}
                    onClick={() => {
                      setMcqIndex((p) => p + 1);
                      setSelectedOption(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-30 transition"
                  >
                    Next Question <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Col: Question Grid & Session Summary */}
            <div className="rounded-[28px] border border-white/10 bg-slate-900/90 p-6 flex flex-col gap-5 shadow-2xl justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Question Navigator</h3>
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {sessionQuestions.map((q, idx) => {
                    const state = answeredMap[q.id];
                    let cls = "border-white/10 bg-slate-800 text-slate-400";
                    if (state === true) cls = "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold";
                    if (state === false) cls = "border-rose-500 bg-rose-500/20 text-rose-300";
                    if (idx === mcqIndex && state === undefined)
                      cls = "border-cyan-400 bg-cyan-500/20 text-cyan-200 font-bold ring-1 ring-cyan-400";

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setMcqIndex(idx);
                          setSelectedOption(null);
                        }}
                        className={`h-10 rounded-xl border text-xs font-semibold transition ${cls}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-2 rounded-2xl border border-white/5 bg-slate-950/60 p-4 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Answered:</span>
                    <span className="font-bold text-white">
                      {Object.keys(answeredMap).length} / {sessionQuestions.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Correct:</span>
                    <span className="font-bold text-emerald-400">{correctCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MCQ XP:</span>
                    <span className="font-bold text-yellow-300">+{correctCount * 15} XP</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                {mcqDone && (
                  <button
                    onClick={() => setActiveMode("coding")}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
                  >
                    Go to Coding Challenge →
                  </button>
                )}

                <button
                  onClick={handleFinishSession}
                  className="w-full rounded-xl border border-yellow-500/40 bg-yellow-500/10 py-3 text-xs font-bold text-yellow-300 hover:bg-yellow-500/20 transition"
                >
                  🏆 Finish Session & Save Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            CODING BATTLE MODE (HackerRank-Grade Competitive Programming IDE)
            ════════════════════════════════════════════════════════════════════ */}
        {activeMode === "coding" && (
          <div className="space-y-4">
            {/* Mobile Tab Switcher for Coding Mode (Problem / Code / Results) */}
            <div className="flex lg:hidden gap-1 rounded-xl border border-white/10 bg-slate-900/90 p-1 text-xs font-semibold">
              <button
                onClick={() => setMobileCodingTab("problem")}
                className={`flex-1 py-2 rounded-lg transition ${
                  mobileCodingTab === "problem" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400"
                }`}
              >
                1. Problem
              </button>
              <button
                onClick={() => setMobileCodingTab("code")}
                className={`flex-1 py-2 rounded-lg transition ${
                  mobileCodingTab === "code" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400"
                }`}
              >
                2. Code Editor
              </button>
              <button
                onClick={() => setMobileCodingTab("results")}
                className={`flex-1 py-2 rounded-lg transition ${
                  mobileCodingTab === "results" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400"
                }`}
              >
                3. Console & Results
              </button>
            </div>

            {/* Main IDE Workspace: Split Screen on Desktop */}
            <div className="grid gap-4 lg:grid-cols-12 min-h-[72vh]">
              {/* Left Pane: Problem Statement (Visible on Desktop OR when mobileCodingTab === 'problem') */}
              <div
                className={`lg:col-span-5 rounded-[24px] border border-white/10 bg-[#0d1424] flex flex-col overflow-hidden shadow-2xl ${
                  mobileCodingTab === "problem" ? "block" : "hidden lg:flex"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 bg-[#11192e] px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        sessionProblem.difficulty === "Easy"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : sessionProblem.difficulty === "Medium"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                      }`}
                    >
                      {sessionProblem.difficulty}
                    </span>
                    {sessionProblem.company && (
                      <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                        🏢 {sessionProblem.company}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-yellow-300">+{sessionProblem.xpReward} XP</span>
                </div>

                {/* Problem Body */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 text-sm text-slate-300">
                  <div>
                    <h2 className="text-xl font-bold text-white">{sessionProblem.title}</h2>
                    <p className="mt-3 whitespace-pre-wrap leading-relaxed">{sessionProblem.description}</p>
                  </div>

                  {/* Examples */}
                  <div className="space-y-3">
                    <p className="font-bold text-white text-xs uppercase tracking-wider">Examples</p>
                    {sessionProblem.examples.map((ex, i) => (
                      <div key={i} className="rounded-xl border border-white/5 bg-slate-950/60 p-3.5 font-mono text-xs space-y-1">
                        <p className="text-slate-400 font-sans font-bold text-[11px] text-cyan-300">Example {i + 1}:</p>
                        <p><span className="text-slate-500">Input:</span> {ex.input}</p>
                        <p><span className="text-slate-500">Output:</span> {ex.output}</p>
                        {ex.explanation && <p className="text-slate-400 font-sans text-[11px] mt-1">{ex.explanation}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Constraints */}
                  <div>
                    <p className="font-bold text-white text-xs uppercase tracking-wider mb-2">Constraints</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                      {sessionProblem.constraints.map((c, i) => (
                        <li key={i}><code className="rounded bg-white/10 px-1.5 py-0.5 text-slate-200">{c}</code></li>
                      ))}
                    </ul>
                  </div>

                  {/* Mobile Shortcut to Code */}
                  <div className="lg:hidden pt-4">
                    <button
                      onClick={() => setMobileCodingTab("code")}
                      className="w-full rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white"
                    >
                      Open Editor →
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Pane: Editor & Output (Visible on Desktop OR when mobileCodingTab in ('code', 'results')) */}
              <div
                className={`lg:col-span-7 flex flex-col gap-4 ${
                  mobileCodingTab !== "problem" ? "flex" : "hidden lg:flex"
                }`}
              >
                {/* Editor Container (visible on desktop or mobileCodingTab === 'code') */}
                <div
                  className={`rounded-[24px] border border-white/10 bg-[#0a0f1c] flex flex-col overflow-hidden shadow-2xl flex-1 ${
                    mobileCodingTab === "results" ? "hidden lg:flex" : "flex"
                  }`}
                >
                  {/* Editor Toolbar */}
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#0e1628] px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300">
                        <FileCode size={14} className="text-cyan-400" />
                        <span>Language</span>
                      </div>
                      <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      >
                        <option value="python">Python 3</option>
                        <option value="javascript">JavaScript (Node)</option>
                        <option value="cpp">C++ (GCC)</option>
                        <option value="java">Java (OpenJDK)</option>
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRunCode}
                        disabled={running || submitting}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-800/90 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition"
                      >
                        <Play size={12} className={running ? "animate-spin" : "text-emerald-400"} />
                        {running ? "Running..." : "Run"}
                      </button>

                      <button
                        onClick={handleSubmitCode}
                        disabled={running || submitting || codingSolved || problemCatalogLoading || canonicalProblems.length === 0}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-1.5 text-xs font-bold text-slate-950 hover:brightness-110 disabled:opacity-50 transition shadow-md shadow-emerald-500/20"
                      >
                        <CheckCircle2 size={13} />
                        {submitting ? "Evaluating..." : codingSolved ? "Solved ✓" : "Submit"}
                      </button>
                    </div>
                  </div>

                  {/* Code Editor Textarea with Line Numbers */}
                  <div className="relative flex-1 min-h-[360px] bg-[#070b14]">
                    <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#050810] border-r border-white/5 flex flex-col items-end pt-4 pr-2 text-xs font-mono text-slate-600 select-none">
                      {code.split("\n").map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      spellCheck={false}
                      className="w-full h-full bg-transparent pl-12 pr-4 py-4 font-mono text-xs md:text-sm text-slate-200 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Console & Test Cases Panel */}
                <div
                  className={`rounded-[24px] border border-white/10 bg-[#0a0f1c] flex flex-col overflow-hidden shadow-2xl min-h-[220px] ${
                    mobileCodingTab === "code" ? "hidden lg:flex" : "flex"
                  }`}
                >
                  {/* Console Header Tabs */}
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#0e1628] px-4 py-2 text-xs font-semibold">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setActiveConsoleTab("testcase")}
                        className={`inline-flex items-center gap-1.5 pb-1 border-b-2 transition ${
                          activeConsoleTab === "testcase"
                            ? "border-cyan-400 text-white"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <BookOpen size={12} />
                        Testcase & Input
                      </button>
                      <button
                        onClick={() => setActiveConsoleTab("result")}
                        className={`inline-flex items-center gap-1.5 pb-1 border-b-2 transition ${
                          activeConsoleTab === "result"
                            ? "border-cyan-400 text-white"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Terminal size={12} />
                        Console Output {submissionVerdict && `(${submissionVerdict})`}
                      </button>
                    </div>

                    {activeConsoleTab === "testcase" && (
                      <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCustomInput}
                          onChange={(e) => setUseCustomInput(e.target.checked)}
                          className="rounded border-white/20 bg-slate-800 text-cyan-500 focus:ring-0"
                        />
                        <span>Custom Input</span>
                      </label>
                    )}
                  </div>

                  {/* Console Body */}
                  <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
                    {activeConsoleTab === "testcase" ? (
                      useCustomInput ? (
                        <textarea
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="Enter custom standard input..."
                          className="w-full h-28 rounded-xl border border-white/10 bg-slate-950 p-3 text-slate-200 focus:outline-none font-mono text-xs resize-none"
                        />
                      ) : (
                        <div className="space-y-2">
                          <p className="text-slate-400 font-sans text-xs">Default Sample Input:</p>
                          <pre className="rounded-xl border border-white/5 bg-slate-950/80 p-3 text-slate-200 whitespace-pre-wrap">
                            {sessionProblem.testInput}
                          </pre>
                        </div>
                      )
                    ) : (
                      <div>
                        {submissionVerdict && (
                          <div
                            className={`mb-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold border ${
                              submissionVerdict === "Accepted"
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                            }`}
                          >
                            {submissionVerdict === "Accepted" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            <span>Verdict: {submissionVerdict}</span>
                            {passedTests !== null && (
                              <span className="text-slate-400 font-normal">
                                ({passedTests}/{totalTests} test cases passed)
                              </span>
                            )}
                          </div>
                        )}
                        <pre
                          className={`whitespace-pre-wrap leading-relaxed ${
                            output.includes("Error") || output.includes("❌")
                              ? "text-rose-300"
                              : output.includes("ACCEPTED") || output.includes("✅")
                              ? "text-emerald-300"
                              : "text-slate-300"
                          }`}
                        >
                          {output || "Click 'Run' to test your code or 'Submit' for full judgment."}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Finish Button in Coding Mode */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-slate-400">
                    {codingSolved ? "Evaluation and any eligible XP are already recorded." : "Solve the problem to receive a verified evaluation."}
                  </span>
                  <button
                    onClick={handleFinishSession}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-yellow-500/20 hover:brightness-110 transition"
                  >
                    <Award size={14} />
                    End Coding Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function SoloBattlePage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-400">Loading battle arena...</p>}>
      <SoloBattleContent />
    </Suspense>
  );
}
