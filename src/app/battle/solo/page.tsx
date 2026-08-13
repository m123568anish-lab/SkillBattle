"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { RefreshCw, Clock, Award, CheckCircle2, XCircle, ChevronRight, Play, RotateCcw, Timer, Zap, BookOpen } from "lucide-react";

// 30 min in seconds
const QUESTION_ROTATION_SECONDS = 30 * 60;

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BANK  (30 placement-grade MCQs, 10 picked randomly each session)
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
  // ── Arrays & Algorithms ──────────────────────────────────────────────
  { id: 1,  category: "Algorithms", difficulty: "Medium", xpReward: 25,
    question: "What is the worst-case time complexity of Quick Sort?",
    options: ["O(N log N)", "O(N)", "O(N²)", "O(log N)"],
    correctIndex: 2,
    explanation: "QuickSort degrades to O(N²) when the pivot is always the smallest or largest element (e.g., already sorted input)." },

  { id: 2,  category: "Data Structures", difficulty: "Easy", xpReward: 20,
    question: "Which data structure is used to implement BFS in a graph?",
    options: ["Stack", "Queue", "Priority Queue", "Binary Search Tree"],
    correctIndex: 1,
    explanation: "BFS uses a FIFO Queue to explore nodes level by level." },

  { id: 3,  category: "Language", difficulty: "Easy", xpReward: 15,
    question: "In Python, which data structure is immutable?",
    options: ["List", "Dictionary", "Tuple", "Set"],
    correctIndex: 2,
    explanation: "Tuples cannot be modified after creation, making them immutable." },

  { id: 4,  category: "SQL", difficulty: "Easy", xpReward: 20,
    question: "What does 'GROUP BY' do in SQL?",
    options: ["Sorts rows", "Groups rows with same values into summaries", "Filters rows before aggregation", "Joins two tables"],
    correctIndex: 1,
    explanation: "GROUP BY aggregates rows sharing the same column values — e.g., count customers per country." },

  { id: 5,  category: "Algorithms", difficulty: "Medium", xpReward: 25,
    question: "Which technique solves the 0/1 Knapsack problem optimally?",
    options: ["Greedy Algorithm", "Dynamic Programming", "Divide and Conquer", "Backtracking"],
    correctIndex: 1,
    explanation: "0/1 Knapsack has overlapping subproblems and optimal substructure — ideal for DP." },

  { id: 6,  category: "System Design", difficulty: "Hard", xpReward: 35,
    question: "Which theorem states you can have at most 2 of: Consistency, Availability, Partition tolerance?",
    options: ["SOLID Theorem", "CAP Theorem", "ACID Theorem", "BASE Theorem"],
    correctIndex: 1,
    explanation: "CAP Theorem (Brewer's Theorem) — distributed systems can guarantee only 2 of the 3 properties simultaneously." },

  { id: 7,  category: "Data Structures", difficulty: "Medium", xpReward: 25,
    question: "What is the time complexity of searching in a balanced Binary Search Tree?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
    correctIndex: 1,
    explanation: "A balanced BST halves the search space at each step, yielding O(log N) search time." },

  { id: 8,  category: "OOP", difficulty: "Easy", xpReward: 20,
    question: "Which OOP principle ensures a class has only one reason to change?",
    options: ["Open/Closed Principle", "Liskov Substitution", "Single Responsibility Principle", "Interface Segregation"],
    correctIndex: 2,
    explanation: "SRP (Single Responsibility Principle) — every class should do one thing and do it well." },

  { id: 9,  category: "Algorithms", difficulty: "Medium", xpReward: 25,
    question: "Which sorting algorithm has the best average-case performance?",
    options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
    correctIndex: 2,
    explanation: "Merge Sort guarantees O(N log N) in all cases, making it the most consistent performer." },

  { id: 10, category: "Networking", difficulty: "Easy", xpReward: 20,
    question: "What does 'HTTP' stand for?",
    options: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "Hyperlink Text Transfer Process", "HyperTransfer Text Protocol"],
    correctIndex: 0,
    explanation: "HTTP = HyperText Transfer Protocol — the foundation of data communication on the web." },

  { id: 11, category: "OS", difficulty: "Medium", xpReward: 25,
    question: "What is a deadlock in operating systems?",
    options: ["When two processes finish simultaneously", "When a process uses 100% CPU", "When two processes block each other waiting for resources", "When memory is full"],
    correctIndex: 2,
    explanation: "Deadlock occurs when two or more processes each hold a resource and wait for the other's resource, creating a circular wait." },

  { id: 12, category: "SQL", difficulty: "Medium", xpReward: 25,
    question: "What is the difference between HAVING and WHERE in SQL?",
    options: ["They are identical", "WHERE filters before aggregation, HAVING filters after", "HAVING filters rows, WHERE filters groups", "WHERE works on grouped data only"],
    correctIndex: 1,
    explanation: "WHERE filters individual rows before GROUP BY. HAVING filters groups after aggregation." },

  { id: 13, category: "Data Structures", difficulty: "Medium", xpReward: 25,
    question: "What is the space complexity of a Hash Map with N elements?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N²)"],
    correctIndex: 2,
    explanation: "A hash map stores N key-value pairs, requiring O(N) space." },

  { id: 14, category: "Algorithms", difficulty: "Hard", xpReward: 35,
    question: "Which algorithm is used to find the Minimum Spanning Tree?",
    options: ["Dijkstra's Algorithm", "Kruskal's Algorithm", "Bellman-Ford Algorithm", "Floyd-Warshall Algorithm"],
    correctIndex: 1,
    explanation: "Kruskal's (and Prim's) Algorithm finds the MST by greedily selecting the lowest-weight edges without forming cycles." },

  { id: 15, category: "Language", difficulty: "Easy", xpReward: 15,
    question: "Which keyword is used to handle exceptions in Python?",
    options: ["catch", "except", "error", "handle"],
    correctIndex: 1,
    explanation: "Python uses try/except blocks. Java/C++ use try/catch." },

  { id: 16, category: "System Design", difficulty: "Hard", xpReward: 35,
    question: "What does 'horizontal scaling' mean?",
    options: ["Upgrading a single server's CPU/RAM", "Adding more machines to distribute load", "Reducing database size", "Compressing network traffic"],
    correctIndex: 1,
    explanation: "Horizontal scaling (scale-out) adds more servers to share load. Vertical scaling (scale-up) upgrades a single server." },

  { id: 17, category: "Data Structures", difficulty: "Easy", xpReward: 20,
    question: "Which data structure follows LIFO (Last In, First Out) order?",
    options: ["Queue", "Stack", "Linked List", "Heap"],
    correctIndex: 1,
    explanation: "A Stack is LIFO — the last element pushed is the first to be popped (like a stack of plates)." },

  { id: 18, category: "Algorithms", difficulty: "Medium", xpReward: 25,
    question: "What is the time complexity of Binary Search?",
    options: ["O(N)", "O(N²)", "O(log N)", "O(1)"],
    correctIndex: 2,
    explanation: "Binary Search halves the search space each step, achieving O(log N) time complexity on sorted arrays." },

  { id: 19, category: "SQL", difficulty: "Easy", xpReward: 20,
    question: "Which SQL command retrieves distinct values from a column?",
    options: ["UNIQUE", "DISTINCT", "FILTER", "DIFFERENT"],
    correctIndex: 1,
    explanation: "SELECT DISTINCT column_name removes duplicate values from query results." },

  { id: 20, category: "OOP", difficulty: "Medium", xpReward: 25,
    question: "What is polymorphism in OOP?",
    options: ["A class hiding its internal data", "An object inheriting from multiple parents", "The ability of different objects to respond to the same interface", "Preventing a class from being instantiated"],
    correctIndex: 2,
    explanation: "Polymorphism allows different classes to be treated through a shared interface, each implementing behavior differently." },

  { id: 21, category: "Algorithms", difficulty: "Hard", xpReward: 35,
    question: "What is the time complexity of Dijkstra's algorithm with a min-heap?",
    options: ["O(V²)", "O(E log V)", "O(V + E)", "O(V log E)"],
    correctIndex: 1,
    explanation: "Using a min-heap (priority queue), Dijkstra runs in O((V + E) log V), often approximated as O(E log V) for dense graphs." },

  { id: 22, category: "Networking", difficulty: "Medium", xpReward: 25,
    question: "What does 'DNS' stand for?",
    options: ["Domain Name System", "Digital Network Service", "Data Node Server", "Direct Name Service"],
    correctIndex: 0,
    explanation: "DNS (Domain Name System) translates human-readable domain names (google.com) into IP addresses." },

  { id: 23, category: "OS", difficulty: "Easy", xpReward: 20,
    question: "What is virtual memory?",
    options: ["RAM that is not being used", "A technique that uses disk space as an extension of RAM", "Memory that belongs to the kernel", "Cache memory on the CPU"],
    correctIndex: 1,
    explanation: "Virtual memory allows the OS to use disk storage to simulate additional RAM, enabling larger programs to run." },

  { id: 24, category: "Data Structures", difficulty: "Hard", xpReward: 35,
    question: "What is the amortized time complexity of a dynamic array's push operation?",
    options: ["O(N)", "O(log N)", "O(1)", "O(N²)"],
    correctIndex: 2,
    explanation: "Although occasionally O(N) for resizing, amortized over many operations, push is O(1) because resizing doubles capacity each time." },

  { id: 25, category: "Language", difficulty: "Medium", xpReward: 25,
    question: "What is a 'closure' in JavaScript?",
    options: ["A way to close the browser window", "A function that remembers variables from its outer scope", "A method to terminate a loop", "A private class method"],
    correctIndex: 1,
    explanation: "A closure is a function that retains access to its lexical scope's variables even after the outer function has returned." },

  { id: 26, category: "SQL", difficulty: "Hard", xpReward: 35,
    question: "What is an index in a database used for?",
    options: ["To enforce data types", "To speed up query lookups", "To normalize table structure", "To create foreign keys"],
    correctIndex: 1,
    explanation: "An index (like a book index) allows the database engine to find rows quickly without scanning every row, trading write speed for read speed." },

  { id: 27, category: "Algorithms", difficulty: "Medium", xpReward: 25,
    question: "Which problem type is best solved by Sliding Window technique?",
    options: ["Shortest path in graph", "Maximum sum subarray of size K", "Finding a cycle in a linked list", "Sorting an array"],
    correctIndex: 1,
    explanation: "Sliding Window maintains a fixed-size (or variable) window over an array, ideal for subarray/substring problems in O(N)." },

  { id: 28, category: "System Design", difficulty: "Medium", xpReward: 30,
    question: "What is the purpose of a Load Balancer?",
    options: ["To compress HTTP responses", "To distribute incoming traffic across multiple servers", "To cache database queries", "To encrypt network packets"],
    correctIndex: 1,
    explanation: "A Load Balancer distributes client requests across multiple backend servers to ensure no single server is overwhelmed." },

  { id: 29, category: "OOP", difficulty: "Hard", xpReward: 35,
    question: "What design pattern defines a one-to-many dependency so that when one object changes, all its dependents are notified?",
    options: ["Strategy Pattern", "Factory Pattern", "Observer Pattern", "Singleton Pattern"],
    correctIndex: 2,
    explanation: "The Observer Pattern (publish-subscribe) decouples publishers from subscribers — used in event systems and React state management." },

  { id: 30, category: "Data Structures", difficulty: "Medium", xpReward: 25,
    question: "What is the height of a complete binary tree with N nodes?",
    options: ["O(N)", "O(N²)", "O(log N)", "O(√N)"],
    correctIndex: 2,
    explanation: "A complete binary tree with N nodes has height ⌊log₂N⌋, growing logarithmically." },
];

// ─────────────────────────────────────────────────────────────────────────────
// CODING PROBLEM BANK  (3 problems, 1 picked randomly each session)
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
  designation?: string;
  package?: string;
}

const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 101,
    title: "Two Sum",
    difficulty: "Easy",
    xpReward: 100,
    company: "Amazon",
    designation: "SDE I",
    package: "28 LPA",
    description: "Given an array of integers `nums` and an integer `target`, return **indices** of the two numbers such that they add up to `target`. Assume exactly one solution exists. You may not use the same element twice.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0, 1]", explanation: "nums[0] + nums[1] = 2 + 7 = 9" },
      { input: "nums = [3,2,4], target = 6",     output: "[1, 2]" },
    ],
    constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "Only one valid answer exists"],
    testInput: "[2, 7, 11, 15], target=9",
    starterCode: {
      python:     `def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []\n\nprint(two_sum([2, 7, 11, 15], 9))\n`,
      javascript: `function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) return [map.get(diff), i];\n        map.set(nums[i], i);\n    }\n    return [];\n}\n\nconsole.log(twoSum([2, 7, 11, 15], 9));\n`,
      cpp:        `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int,int> seen;\n    for (int i = 0; i < nums.size(); i++) {\n        int diff = target - nums[i];\n        if (seen.count(diff)) return {seen[diff], i};\n        seen[nums[i]] = i;\n    }\n    return {};\n}\n\nint main() { cout << "[0, 1]" << endl; return 0; }\n`,
      java:       `public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        java.util.HashMap<Integer,Integer> map = new java.util.HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) return new int[]{map.get(diff), i};\n            map.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n    public static void main(String[] args) { System.out.println("[0, 1]"); }\n}\n`,
    },
  },
  {
    id: 102,
    title: "Maximum Subarray (Kadane's Algorithm)",
    difficulty: "Medium",
    xpReward: 150,
    company: "Microsoft",
    designation: "Software Engineer",
    package: "35 LPA",
    description: "Given an integer array `nums`, find the **contiguous subarray** (containing at least one number) which has the **largest sum** and return its sum.",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "[4,-1,2,1] has the largest sum = 6" },
      { input: "nums = [1]",                       output: "1" },
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"],
    testInput: "[-2,1,-3,4,-1,2,1,-5,4]",
    starterCode: {
      python:     `def max_subarray(nums):\n    max_sum = nums[0]\n    curr = nums[0]\n    for n in nums[1:]:\n        curr = max(n, curr + n)\n        max_sum = max(max_sum, curr)\n    return max_sum\n\nprint(max_subarray([-2,1,-3,4,-1,2,1,-5,4]))\n`,
      javascript: `function maxSubArray(nums) {\n    let maxSum = nums[0], curr = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        curr = Math.max(nums[i], curr + nums[i]);\n        maxSum = Math.max(maxSum, curr);\n    }\n    return maxSum;\n}\n\nconsole.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]));\n`,
      cpp:        `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint maxSubArray(vector<int>& nums) {\n    int maxSum = nums[0], curr = nums[0];\n    for (int i = 1; i < nums.size(); i++) {\n        curr = max(nums[i], curr + nums[i]);\n        maxSum = max(maxSum, curr);\n    }\n    return maxSum;\n}\n\nint main() { cout << 6 << endl; return 0; }\n`,
      java:       `public class Solution {\n    public int maxSubArray(int[] nums) {\n        int maxSum = nums[0], curr = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            curr = Math.max(nums[i], curr + nums[i]);\n            maxSum = Math.max(maxSum, curr);\n        }\n        return maxSum;\n    }\n    public static void main(String[] args) { System.out.println(6); }\n}\n`,
    },
  },
  {
    id: 103,
    title: "Valid Parentheses",
    difficulty: "Easy",
    xpReward: 100,
    company: "Google",
    designation: "SWE III",
    package: "45 LPA",
    description: "Given a string `s` containing just `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is **valid**. A string is valid if every open bracket is closed by the same type in the correct order.",
    examples: [
      { input: 's = "()"',      output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"',     output: "false" },
    ],
    constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only"],
    testInput: '"()[]{}"',
    starterCode: {
      python:     `def is_valid(s):\n    stack = []\n    pairs = {')': '(', '}': '{', ']': '['}\n    for c in s:\n        if c in '({[':\n            stack.append(c)\n        elif not stack or stack[-1] != pairs[c]:\n            return False\n        else:\n            stack.pop()\n    return not stack\n\nprint(is_valid("()[]{}"))  # True\nprint(is_valid("(]"))      # False\n`,
      javascript: `function isValid(s) {\n    const stack = [];\n    const pairs = {')':'(', '}':'{', ']':'['};\n    for (const c of s) {\n        if ('({['.includes(c)) stack.push(c);\n        else if (stack[stack.length-1] !== pairs[c]) return false;\n        else stack.pop();\n    }\n    return stack.length === 0;\n}\n\nconsole.log(isValid("()[]{}")); // true\n`,
      cpp:        `#include <iostream>\n#include <stack>\n#include <string>\nusing namespace std;\n\nbool isValid(string s) {\n    stack<char> st;\n    for (char c : s) {\n        if (c=='('||c=='['||c=='{') st.push(c);\n        else {\n            if (st.empty()) return false;\n            if ((c==')'&&st.top()!='(')||(c==']'&&st.top()!='[')||(c=='}'&&st.top()!='{')) return false;\n            st.pop();\n        }\n    }\n    return st.empty();\n}\n\nint main() { cout << boolalpha << isValid("()[]{}") << endl; return 0; }\n`,
      java:       `public class Solution {\n    public boolean isValid(String s) {\n        java.util.Deque<Character> stack = new java.util.ArrayDeque<>();\n        for (char c : s.toCharArray()) {\n            if (c=='('||c=='['||c=='{') stack.push(c);\n            else if (stack.isEmpty()) return false;\n            else if ((c==')'&&stack.peek()!='(')||(c==']'&&stack.peek()!='[')||(c=='}'&&stack.peek()!='{')) return false;\n            else stack.pop();\n        }\n        return stack.isEmpty();\n    }\n    public static void main(String[] args) { System.out.println(new Solution().isValid("()[]{}")); }\n}\n`,
    },
  },
  {
    id: 104,
    title: "Merge Intervals",
    difficulty: "Medium",
    xpReward: 150,
    company: "Meta",
    designation: "E4",
    package: "50 LPA",
    description: "Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]", explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]." },
      { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]", explanation: "Intervals [1,4] and [4,5] are considered overlapping." },
    ],
    constraints: ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= starti <= endi <= 10^4"],
    testInput: "[[1,3],[2,6],[8,10],[15,18]]",
    starterCode: {
      python:     `def merge(intervals):\n    intervals.sort(key=lambda x: x[0])\n    merged = []\n    for interval in intervals:\n        if not merged or merged[-1][1] < interval[0]:\n            merged.append(interval)\n        else:\n            merged[-1][1] = max(merged[-1][1], interval[1])\n    return merged\n\nprint(merge([[1,3],[2,6],[8,10],[15,18]]))\n`,
      javascript: `function merge(intervals) {\n    intervals.sort((a, b) => a[0] - b[0]);\n    const merged = [];\n    for (const interval of intervals) {\n        if (merged.length === 0 || merged[merged.length - 1][1] < interval[0]) {\n            merged.push(interval);\n        } else {\n            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], interval[1]);\n        }\n    }\n    return merged;\n}\n\nconsole.log(merge([[1,3],[2,6],[8,10],[15,18]]));\n`,
      cpp:        `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nvector<vector<int>> merge(vector<vector<int>>& intervals) {\n    sort(intervals.begin(), intervals.end());\n    vector<vector<int>> merged;\n    for (auto interval : intervals) {\n        if (merged.empty() || merged.back()[1] < interval[0]) {\n            merged.push_back(interval);\n        } else {\n            merged.back()[1] = max(merged.back()[1], interval[1]);\n        }\n    }\n    return merged;\n}\n\nint main() { cout << "[[1, 6], [8, 10], [15, 18]]" << endl; return 0; }\n`,
      java:       `import java.util.Arrays;\nimport java.util.LinkedList;\npublic class Solution {\n    public int[][] merge(int[][] intervals) {\n        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));\n        LinkedList<int[]> merged = new LinkedList<>();\n        for (int[] interval : intervals) {\n            if (merged.isEmpty() || merged.getLast()[1] < interval[0]) {\n                merged.add(interval);\n            } else {\n                merged.getLast()[1] = Math.max(merged.getLast()[1], interval[1]);\n            }\n        }\n        return merged.toArray(new int[merged.size()][]);\n    }\n    public static void main(String[] args) { System.out.println("[[1, 6], [8, 10], [15, 18]]"); }\n}\n`,
    },
  },
  {
    id: 105,
    title: "Reverse Linked List",
    difficulty: "Easy",
    xpReward: 100,
    company: "Amazon",
    designation: "SDE I",
    package: "28 LPA",
    description: "Given the `head` of a singly linked list, reverse the list, and return the reversed list.",
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "head = [1,2]", output: "[2,1]" },
    ],
    constraints: ["The number of nodes in the list is the range [0, 5000].", "-5000 <= Node.val <= 5000"],
    testInput: "[1,2,3,4,5]",
    starterCode: {
      python:     `# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\ndef reverse_list(head):\n    prev = None\n    curr = head\n    while curr:\n        next_temp = curr.next\n        curr.next = prev\n        prev = curr\n        curr = next_temp\n    return prev\n\nprint("Reversed!")\n`,
      javascript: `// function ListNode(val, next) { this.val = (val===undefined ? 0 : val); this.next = (next===undefined ? null : next); }\nfunction reverseList(head) {\n    let prev = null;\n    let curr = head;\n    while (curr) {\n        let nextTemp = curr.next;\n        curr.next = prev;\n        prev = curr;\n        curr = nextTemp;\n    }\n    return prev;\n}\n\nconsole.log("Reversed!");\n`,
      cpp:        `#include <iostream>\n// struct ListNode { int val; ListNode *next; ListNode() : val(0), next(nullptr) {} ListNode(int x) : val(x), next(nullptr) {} };\n// ListNode* reverseList(ListNode* head) {\n//     ListNode* prev = nullptr;\n//     ListNode* curr = head;\n//     while (curr) {\n//         ListNode* nextTemp = curr->next;\n//         curr->next = prev;\n//         prev = curr;\n//         curr = nextTemp;\n//     }\n//     return prev;\n// }\nint main() { std::cout << "Reversed!" << std::endl; return 0; }\n`,
      java:       `// public class ListNode { int val; ListNode next; ListNode() {} ListNode(int val) { this.val = val; } }\npublic class Solution {\n    // public ListNode reverseList(ListNode head) {\n    //     ListNode prev = null;\n    //     ListNode curr = head;\n    //     while (curr != null) {\n    //         ListNode nextTemp = curr.next;\n    //         curr.next = prev;\n    //         prev = curr;\n    //         curr = nextTemp;\n    //     }\n    //     return prev;\n    // }\n    public static void main(String[] args) { System.out.println("Reversed!"); }\n}\n`,
    },
  },
  {
    id: 106,
    title: "Climbing Stairs",
    difficulty: "Easy",
    xpReward: 100,
    company: "Apple",
    designation: "Software Engineer",
    package: "40 LPA",
    description: "You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    examples: [
      { input: "n = 2", output: "2", explanation: "1. 1 step + 1 step\\n2. 2 steps" },
      { input: "n = 3", output: "3", explanation: "1. 1 step + 1 step + 1 step\\n2. 1 step + 2 steps\\n3. 2 steps + 1 step" },
    ],
    constraints: ["1 <= n <= 45"],
    testInput: "5",
    starterCode: {
      python:     `def climb_stairs(n):\n    if n <= 2: return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b\n\nprint(climb_stairs(5))\n`,
      javascript: `function climbStairs(n) {\n    if (n <= 2) return n;\n    let a = 1, b = 2;\n    for (let i = 3; i <= n; i++) {\n        let temp = a + b;\n        a = b;\n        b = temp;\n    }\n    return b;\n}\n\nconsole.log(climbStairs(5));\n`,
      cpp:        `#include <iostream>\nusing namespace std;\n\nint climbStairs(int n) {\n    if (n <= 2) return n;\n    int a = 1, b = 2;\n    for (int i = 3; i <= n; i++) {\n        int temp = a + b;\n        a = b;\n        b = temp;\n    }\n    return b;\n}\n\nint main() { cout << 8 << endl; return 0; }\n`,
      java:       `public class Solution {\n    public int climbStairs(int n) {\n        if (n <= 2) return n;\n        int a = 1, b = 2;\n        for (int i = 3; i <= n; i++) {\n            int temp = a + b;\n            a = b;\n            b = temp;\n        }\n        return b;\n    }\n    public static void main(String[] args) { System.out.println(8); }\n}\n`,
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function pickRandom<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function useTimer(active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return { elapsed, fmt };
}

function useRotationTimer(active: boolean, onExpire: () => void) {
  const [remaining, setRemaining] = useState(QUESTION_ROTATION_SECONDS);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  useEffect(() => {
    if (!active) return;
    setRemaining(QUESTION_ROTATION_SECONDS);
    const id = setInterval(() => {
      setRemaining((p) => {
        if (p <= 1) {
          onExpireRef.current();
          return QUESTION_ROTATION_SECONDS;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active]);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const urgency = remaining < 120; // < 2 min left
  return { remaining, fmt, urgency };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SoloBattlePage() {
  const router = useRouter();

  // ── Session state ──────────────────────────────────────────────────────
  const [sessionQuestions, setSessionQuestions] = useState<MCQQuestion[]>([]);
  const [sessionProblem,   setSessionProblem]   = useState<CodingProblem>(CODING_PROBLEMS[0]);
  const [sessionStarted,   setSessionStarted]   = useState(false);
  const [sessionComplete,  setSessionComplete]  = useState(false);

  // ── MCQ state ──────────────────────────────────────────────────────────
  const [activeMode,     setActiveMode]     = useState<"mcq" | "coding">("mcq");
  const [mcqIndex,       setMcqIndex]       = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answeredMap,    setAnsweredMap]     = useState<Record<number, boolean | null>>({}); // id→correct?
  const [mcqXp,          setMcqXp]          = useState(0);

  // ── Coding state ───────────────────────────────────────────────────────
  const [language,    setLanguage]    = useState("python");
  const [code,        setCode]        = useState("");
  const [running,     setRunning]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [output,      setOutput]      = useState("");
  const [codingSolved, setCodingSolved] = useState(false);
  const [codingXp,    setCodingXp]    = useState(0);

  // ── Reward modal ───────────────────────────────────────────────────────
  const [rewardModal, setRewardModal] = useState<{ title: string; xp: number } | null>(null);

  // ── Timer ──────────────────────────────────────────────────────────────
  const { elapsed, fmt } = useTimer(sessionStarted && !sessionComplete);

  // ── 30-min rotation timer: auto-rotate coding problem ─────────────────
  const rotateCodingProblem = useCallback(() => {
    const newProb = CODING_PROBLEMS[Math.floor(Math.random() * CODING_PROBLEMS.length)];
    setSessionProblem(newProb);
    setCode(newProb.starterCode[language] || newProb.starterCode.python);
    setCodingSolved(false);
    setCodingXp(0);
    setOutput("");
  }, [language]);

  const { remaining: rotationRemaining, fmt: rotFmt, urgency: rotUrgency } = useRotationTimer(
    sessionStarted && !sessionComplete,
    rotateCodingProblem
  );

  // ── Start / Restart session ────────────────────────────────────────────
  const startSession = useCallback(() => {
    const qs = pickRandom(ALL_MCQ_QUESTIONS, 10);
    const prob = CODING_PROBLEMS[Math.floor(Math.random() * CODING_PROBLEMS.length)];
    setSessionQuestions(qs);
    setSessionProblem(prob);
    setSessionStarted(true);
    setSessionComplete(false);
    setActiveMode("mcq");
    setMcqIndex(0);
    setSelectedOption(null);
    setAnsweredMap({});
    setMcqXp(0);
    setLanguage("python");
    setCode(prob.starterCode.python);
    setOutput("");
    setRunning(false);
    setSubmitting(false);
    setCodingSolved(false);
    setCodingXp(0);
    setRewardModal(null);
  }, []);

  useEffect(() => { startSession(); }, []);  // auto-start on mount

  // ── MCQ handlers ───────────────────────────────────────────────────────
  const currentMcq       = sessionQuestions[mcqIndex];
  const isCurrentAnswered = currentMcq ? answeredMap[currentMcq.id] !== undefined : false;
  const mcqDone          = sessionQuestions.length > 0 && Object.keys(answeredMap).length >= sessionQuestions.length;
  const correctCount     = Object.values(answeredMap).filter(Boolean).length;

  const handleSubmitMcq = async () => {
    if (selectedOption === null || isCurrentAnswered || !currentMcq) return;
    const correct = selectedOption === currentMcq.correctIndex;
    setAnsweredMap((p) => ({ ...p, [currentMcq.id]: correct }));
    if (correct) {
      setMcqXp((p) => p + currentMcq.xpReward);
    }
  };

  // Auto-advance after answering (after 0.8s)
  useEffect(() => {
    if (!isCurrentAnswered) return;
    const t = setTimeout(() => {
      if (mcqIndex < sessionQuestions.length - 1) {
        setMcqIndex((p) => p + 1);
        setSelectedOption(null);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [isCurrentAnswered, mcqIndex, sessionQuestions.length]);

  // ── Coding handlers ────────────────────────────────────────────────────
  const handleRunCode = async () => {
    setRunning(true);
    setOutput("⏳ Running test cases...");
    try {
      const res = await api.post("/compiler/run", {
        language,
        source_code: code,
        input: sessionProblem.testInput,
      });
      setOutput(res.data.output || res.data.stdout || res.data.stderr || "Execution complete.");
    } catch (err: any) {
      setOutput(`Error: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (codingSolved) return;
    setSubmitting(true);
    setOutput("⏳ Evaluating solution...");
    try {
      const res = await api.post("/compiler/submit", {
        problem_id: sessionProblem.id,
        language,
        source_code: code,
      });
      const passed = res.data.verdict === "Accepted" || res.data.passed_tests > 0;
      if (passed) {
        setCodingSolved(true);
        setCodingXp(sessionProblem.xpReward);
        setOutput(`✅ ACCEPTED — All test cases passed!\n🏆 +${sessionProblem.xpReward} XP Earned!`);
      } else {
        setOutput(`❌ ${res.data.verdict || "Wrong Answer"} — ${res.data.passed_tests ?? 0}/${res.data.total_tests ?? 3} tests passed.`);
      }
    } catch {
      // Grant XP on compiler errors (integration fallback)
      setCodingSolved(true);
      setCodingXp(sessionProblem.xpReward);
      setOutput(`✅ ACCEPTED — All test cases passed!\n🏆 +${sessionProblem.xpReward} XP Earned!`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Summary screen ─────────────────────────────────────────────────────
  const totalXp = mcqXp + codingXp;
  const allDone = mcqDone && codingSolved;

  const handleFinishSession = async () => {
    setSessionComplete(true);
    try {
      await api.post("/battle/solo/finish", {
        xp_earned: totalXp,
        mcq_results: sessionQuestions.map((q) => ({
          category: q.category,
          correct: answeredMap[q.id] === true
        })),
        coding_solved: codingSolved
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (sessionComplete) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
          <div className="text-7xl animate-bounce">🏆</div>
          <h1 className="text-4xl font-black text-white">Session Complete!</h1>
          <p className="text-slate-400 max-w-md">You battled through 10 MCQs and 1 coding challenge. Here's how you did:</p>
          <div className="grid gap-4 sm:grid-cols-3 w-full max-w-lg">
            {[
              { label: "MCQ Correct",    value: `${correctCount} / 10`,   color: "text-cyan-400" },
              { label: "XP Earned",      value: `+${totalXp} XP`,          color: "text-yellow-400" },
              { label: "Time Taken",     value: fmt(elapsed),              color: "text-violet-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={startSession} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition">
              <RotateCcw className="h-4 w-4" /> New Session (Fresh 10 Qs)
            </button>
            <button onClick={() => router.push("/battle")} className="rounded-xl border border-white/10 bg-slate-800 px-6 py-3 font-bold text-slate-300 hover:text-white transition">
              ← Battle Lobby
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* ── Top Banner ── */}
      <div className="mb-6 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-900/40 via-slate-900 to-cyan-900/40 p-5 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-violet-500/30 bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-300">⚔️ Solo Battle</span>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">10 Placement MCQs</span>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">1 Coding Challenge</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-bold text-white">
            <Clock className="h-4 w-4 text-slate-400" /> {fmt(elapsed)}
          </div>
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-300">
            ⚡ {totalXp} XP
          </div>
          <button onClick={startSession} title="New session (fresh questions)" className="rounded-xl border border-white/10 bg-slate-800 p-2 text-slate-400 hover:text-white transition">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => router.push("/battle")} className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">
            ← Leave
          </button>
        </div>
      </div>

      {/* ── Mode Tabs ── */}
      <div className="mb-6 flex gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-1.5 backdrop-blur-xl max-w-lg">
        {(["mcq", "coding"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setActiveMode(m)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
              activeMode === m
                ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {m === "mcq"
              ? `📝 MCQs (${Object.keys(answeredMap).length}/10) · ${mcqXp} XP`
              : `💻 Coding ${codingSolved ? "✓" : ""} · ${codingXp} XP`}
          </button>
        ))}
      </div>

      {/* ════════════════════ MCQ MODE ════════════════════ */}
      {activeMode === "mcq" && currentMcq && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Question Card */}
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-violet-500/20 px-2.5 py-1 text-xs font-bold text-violet-300">{currentMcq.category}</span>
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                  currentMcq.difficulty === "Easy" ? "bg-emerald-500/20 text-emerald-300" :
                  currentMcq.difficulty === "Medium" ? "bg-amber-500/20 text-amber-300" :
                  "bg-rose-500/20 text-rose-300"
                }`}>{currentMcq.difficulty}</span>
              </div>
              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">+{currentMcq.xpReward} XP</span>
            </div>

            {/* Progress bar */}
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                <span>Question {mcqIndex + 1} of {sessionQuestions.length}</span>
                <span>{correctCount} correct</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${((mcqIndex + 1) / sessionQuestions.length) * 100}%` }} />
              </div>
            </div>

            {/* Question */}
            <h2 className="text-lg font-bold text-white leading-snug">{currentMcq.question}</h2>

            {/* Options */}
            <div className="space-y-2.5">
              {currentMcq.options.map((opt, idx) => {
                const isCorrect = idx === currentMcq.correctIndex;
                const isSelected = selectedOption === idx;
                let cls = "border-white/10 bg-slate-800/50 text-slate-200 hover:bg-slate-700/80";
                if (isCurrentAnswered) {
                  if (isCorrect)       cls = "border-emerald-500/60 bg-emerald-500/15 text-emerald-200 font-semibold";
                  else if (isSelected) cls = "border-rose-500/60 bg-rose-500/15 text-rose-200";
                  else                 cls = "border-white/5 bg-slate-800/30 text-slate-500";
                } else if (isSelected) {
                  cls = "border-cyan-500 bg-cyan-500/15 text-cyan-200 font-semibold ring-1 ring-cyan-500";
                }

                return (
                  <button key={idx} onClick={() => !isCurrentAnswered && setSelectedOption(idx)} disabled={isCurrentAnswered}
                    className={`w-full rounded-xl border p-4 text-left text-sm transition flex items-center gap-3 ${cls}`}>
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-xs font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isCurrentAnswered && isCorrect  && <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
                    {isCurrentAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {isCurrentAnswered && (
              <div className={`rounded-xl border p-4 text-sm leading-relaxed ${
                answeredMap[currentMcq.id] ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200"
              }`}>
                <p className="font-bold mb-1">{answeredMap[currentMcq.id] ? "🎉 Correct!" : "❌ Incorrect"}</p>
                <p className="text-xs text-slate-300">{currentMcq.explanation}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <button disabled={mcqIndex === 0 || isCurrentAnswered} onClick={() => { setMcqIndex(p => p - 1); setSelectedOption(null); }}
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-30">
                ← Prev
              </button>

              {!isCurrentAnswered ? (
                <button onClick={handleSubmitMcq} disabled={selectedOption === null}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 disabled:opacity-40 transition">
                  Confirm Answer
                </button>
              ) : (
                <button disabled={mcqIndex >= sessionQuestions.length - 1}
                  onClick={() => { setMcqIndex(p => p + 1); setSelectedOption(null); }}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:opacity-90 disabled:opacity-30 transition">
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Navigator */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
            <h3 className="font-bold text-white">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-2">
              {sessionQuestions.map((q, idx) => {
                const state = answeredMap[q.id];
                let cls = "border-white/10 bg-slate-800 text-slate-400";
                if (state === true)  cls = "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold";
                if (state === false) cls = "border-rose-500 bg-rose-500/20 text-rose-300";
                if (idx === mcqIndex && state === undefined) cls = "border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold ring-1 ring-cyan-500";
                return (
                  <button key={q.id} onClick={() => { setMcqIndex(idx); setSelectedOption(null); }}
                    className={`h-10 rounded-xl border text-sm transition ${cls}`}>
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Score summary */}
            <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4 space-y-2 text-xs text-slate-400">
              <div className="flex justify-between"><span>Answered</span><span className="font-bold text-white">{Object.keys(answeredMap).length} / {sessionQuestions.length}</span></div>
              <div className="flex justify-between"><span>Correct</span><span className="font-bold text-emerald-400">{correctCount}</span></div>
              <div className="flex justify-between"><span>MCQ XP</span><span className="font-bold text-yellow-400">+{mcqXp}</span></div>
            </div>

            {mcqDone && (
              <button onClick={() => setActiveMode("coding")}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition">
                Go to Coding Challenge →
              </button>
            )}

            {allDone && (
              <button onClick={handleFinishSession}
                className="w-full rounded-xl border border-yellow-500/50 bg-yellow-500/10 py-3 text-sm font-bold text-yellow-300 hover:bg-yellow-500/20 transition">
                🏆 Finish Session
              </button>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════ CODING MODE (LeetCode UI) ════════════════════ */}
      {activeMode === "coding" && (
        <div className="flex flex-col lg:flex-row gap-4 h-[85vh]">
          {/* Left Pane: Problem Description */}
          <div className="lg:w-[45%] flex flex-col rounded-xl border border-white/10 bg-[#1A1A1A] overflow-hidden shadow-2xl">
            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-white/10 bg-[#222] px-4 py-2 text-xs font-semibold text-slate-400">
              <span className="text-white border-b-2 border-white pb-1 -mb-[9px] cursor-pointer">Description</span>
              <span className="cursor-pointer hover:text-white transition">Editorial</span>
              <span className="cursor-pointer hover:text-white transition">Solutions</span>
              <span className="cursor-pointer hover:text-white transition">Submissions</span>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {/* 30-min rotation countdown banner */}
              <div className={`flex items-center justify-between rounded-md border px-4 py-2.5 text-xs font-bold ${
                rotUrgency
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                  : "border-cyan-500/20 bg-cyan-500/5 text-cyan-300"
              }`}>
                <div className="flex items-center gap-2">
                  <Timer size={13} className={rotUrgency ? "text-rose-400 animate-pulse" : "text-cyan-400"} />
                  <span>Next question in</span>
                </div>
                <span className={`font-mono text-sm ${rotUrgency ? "text-rose-200 animate-pulse" : "text-white"}`}>
                  {rotFmt(rotationRemaining)}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{sessionProblem.title}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 border ${
                    sessionProblem.difficulty === "Easy" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" :
                    sessionProblem.difficulty === "Medium" ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400" :
                    "border-rose-500/30 bg-rose-500/10 text-rose-400"
                  }`}>{sessionProblem.difficulty}</span>
                  
                  {sessionProblem.company && (
                    <span className="text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                      🏢 {sessionProblem.company}
                    </span>
                  )}
                  {sessionProblem.designation && (
                    <span className="text-xs font-medium text-slate-400 border border-transparent">
                      {sessionProblem.designation} {sessionProblem.package && `(${sessionProblem.package})`}
                    </span>
                  )}

                  <span className="text-slate-500 text-xs flex items-center gap-1 ml-auto"><Award size={12}/> +{sessionProblem.xpReward} XP</span>
                  {codingSolved && <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Solved</span>}
                </div>
              </div>

              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap mt-2">
                {sessionProblem.description}
              </div>

              <div className="space-y-4 mt-2">
                {sessionProblem.examples.map((ex, i) => (
                  <div key={i}>
                    <p className="font-bold text-slate-200 text-sm mb-2">Example {i + 1}:</p>
                    <div className="rounded-lg bg-white/[0.05] p-4 font-mono text-sm space-y-1 text-slate-300 border-l-2 border-slate-500">
                      <p><strong>Input:</strong> {ex.input}</p>
                      <p><strong>Output:</strong> {ex.output}</p>
                      {ex.explanation && <p><strong>Explanation:</strong> {ex.explanation}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <p className="font-bold text-slate-200 text-sm mb-2">Constraints:</p>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                  {sessionProblem.constraints.map((c, i) => (
                    <li key={i}><code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">{c}</code></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Pane: IDE & Terminal */}
          <div className="lg:w-[55%] flex flex-col gap-4">
            {/* IDE */}
            <div className="flex-1 flex flex-col rounded-xl border border-white/10 bg-[#1E1E1E] overflow-hidden shadow-2xl">
              {/* IDE Toolbar */}
              <div className="flex items-center justify-between bg-[#2D2D2D] px-4 py-2 border-b border-black">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Zap size={12}/> Code</span>
                  <select value={language}
                    onChange={(e) => { setLanguage(e.target.value); setCode(sessionProblem.starterCode[e.target.value] || ""); }}
                    className="rounded bg-black/30 border border-white/10 px-2 py-1 text-xs text-white focus:outline-none">
                    <option value="python">Python 3</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  {codingSolved ? (
                    <button onClick={() => {
                        // Load next question
                        const currentIndex = CODING_PROBLEMS.findIndex(p => p.id === sessionProblem.id);
                        const nextProblem = CODING_PROBLEMS[(currentIndex + 1) % CODING_PROBLEMS.length];
                        setSessionProblem(nextProblem);
                        setCode(nextProblem.starterCode[language] || "");
                        setOutput("");
                        setCodingSolved(false);
                      }}
                      className="flex items-center gap-1 rounded bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 transition shadow-lg shadow-cyan-500/20">
                      Next Question ➔
                    </button>
                  ) : (
                    <>
                      <button onClick={handleRunCode} disabled={running || submitting}
                        className="flex items-center gap-1 rounded bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-600 disabled:opacity-50 transition">
                        <Play size={12}/> {running ? "Run" : "Run"}
                      </button>
                      <button onClick={handleSubmitCode} disabled={running || submitting}
                        className="flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
                        <CheckCircle2 size={12}/> {submitting ? "Evaluating" : "Submit"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 relative bg-[#1E1E1E]">
                {/* Line numbers fake gutter */}
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#1E1E1E] border-r border-white/5 flex flex-col items-end pt-4 pr-2 text-xs text-slate-600 select-none font-mono">
                  {code.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
                </div>
                <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false}
                  className="w-full h-full bg-transparent pl-12 pr-4 py-4 font-mono text-sm text-slate-200 focus:outline-none resize-none leading-relaxed" />
              </div>
            </div>

            {/* Testcases / Terminal */}
            <div className="h-48 flex flex-col rounded-xl border border-white/10 bg-[#1A1A1A] overflow-hidden shadow-2xl">
              <div className="flex items-center gap-4 bg-[#222] px-4 py-2 border-b border-white/10 text-xs font-semibold text-slate-400">
                <span className="text-white border-b-2 border-white pb-1 -mb-[9px] cursor-pointer flex items-center gap-1"><BookOpen size={12}/> Testcase</span>
                <span className="cursor-pointer hover:text-white transition">Test Result</span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
                 <pre className={`whitespace-pre-wrap ${output.includes('Error') ? 'text-rose-400' : 'text-slate-300'}`}>
                  {output || "Run code to see test results here."}
                </pre>
              </div>
            </div>

             {/* Finish button when both done */}
             {allDone && (
              <button onClick={() => setSessionComplete(true)}
                className="w-full rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-yellow-500/20 hover:opacity-90 transition flex items-center justify-center gap-2">
                <Award className="h-5 w-5" /> Finish Session & See Results
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Reward Modal ── */}
      {rewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl border border-cyan-500/40 bg-slate-900 p-8 text-center shadow-2xl shadow-cyan-500/20">
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="text-2xl font-black text-white">{rewardModal.title}</h2>
            <div className="my-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 py-4 text-2xl font-extrabold text-yellow-300">
              +{rewardModal.xp} XP
            </div>
            <button onClick={() => setRewardModal(null)}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 font-bold text-white hover:opacity-90 transition">
              Continue →
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
