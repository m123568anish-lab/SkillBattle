"""
=========================================================
SkillBattle - Placement-Focused AI Coach Chat Router
=========================================================
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/coach", tags=["AI Coach Chat"])


class ChatRequest(BaseModel):
    message: str


PLACEMENT_KNOWLEDGE_BASE = {
    "dp": (
        "### 🧠 Dynamic Programming (Placement Guide)\n\n"
        "**Core Concept:** Solving problems by breaking them into overlapping subproblems and storing intermediate results.\n\n"
        "**Standard Patterns & Templates:**\n"
        "1. **0/1 Knapsack & Subset Sum:** Choice of take/skip item at index `i`.\n"
        "2. **Longest Common Subsequence (LCS):** String matching dp `dp[i][j]`.\n"
        "3. **Longest Increasing Subsequence (LIS):** `O(N log N)` with binary search or `O(N²)` DP.\n"
        "4. **Grid DP:** Path counting, min/max path sum (`dp[r][c]`).\n\n"
        "**Template (Top-Down Memoization):**\n"
        "```python\n"
        "memo = {}\n"
        "def solve(state):\n"
        "    if is_base_case(state): return 0\n"
        "    if state in memo: return memo[state]\n"
        "    ans = min/max(solve(next_state) + cost)\n"
        "    memo[state] = ans\n"
        "    return ans\n"
        "```\n\n"
        "**Tip for Placement Tests:** First write a brute-force recursive state function `f(i)`, identify repeating parameters, and add `@lru_cache(None)`."
    ),
    "graph": (
        "### 🕸️ Graph Algorithms (Placement Masterclass)\n\n"
        "**Key Graph Traversals:**\n"
        "• **BFS (Queue):** Shortest path in unweighted graphs. Time: `O(V + E)`, Space: `O(V)`.\n"
        "• **DFS (Stack/Recursion):** Cycle detection, connected components, topological sort.\n"
        "• **Dijkstra (Min-Heap):** Shortest path with non-negative edge weights. Time: `O(E log V)`.\n"
        "• **Kruskal / Prim:** Minimum Spanning Tree (MST).\n\n"
        "**Topological Sort Template (Kahn's Algorithm):**\n"
        "```python\n"
        "from collections import deque\n"
        "in_degree = [0] * V\n"
        "# Populate in_degree from edges\n"
        "q = deque([u for u in range(V) if in_degree[u] == 0])\n"
        "order = []\n"
        "while q:\n"
        "    curr = q.popleft()\n"
        "    order.append(curr)\n"
        "    for nxt in adj[curr]:\n"
        "        in_degree[nxt] -= 1\n"
        "        if in_degree[nxt] == 0: q.append(nxt)\n"
        "```\n"
        "If `len(order) != V`, graph contains a cycle!"
    ),
    "binary search": (
        "### 🔍 Binary Search on Answer Space\n\n"
        "**When to apply:** Search space is monotonic (`[True, True, False, False]`).\n\n"
        "**Universal Placement Template:**\n"
        "```python\n"
        "lo, hi = min_possible, max_possible\n"
        "ans = -1\n"
        "while lo <= hi:\n"
        "    mid = (lo + hi) // 2\n"
        "    if is_valid(mid):\n"
        "        ans = mid        # Store potential answer\n"
        "        hi = mid - 1     # Try to find smaller/better\n"
        "    else:\n"
        "        lo = mid + 1\n"
        "return ans\n"
        "```\n\n"
        "**Common Problems:** Capacity to ship packages within D days, Koko eating bananas, Painter's partition problem."
    ),
    "system design": (
        "### 🏗️ System Design Interview Checklist\n\n"
        "**5-Step Interview Strategy:**\n"
        "1. **Requirements Gathering:** Functional (e.g. short link) vs Non-Functional (High availability, low latency < 100ms, 100M DAU).\n"
        "2. **Capacity Estimation:** Storage: `100M * 500B = 50GB/day`. Throughput: `100M / 86400 ≈ 1200 QPS`.\n"
        "3. **API Design:** `POST /api/v1/shorten`, `GET /{short_code}`.\n"
        "4. **Database & Caching Schema:** SQL vs NoSQL (Key-Value Redis for hot URLs).\n"
        "5. **Scalability Bottlenecks:** Load Balancers (Nginx), Consistent Hashing, DB Replication & Sharding."
    ),
    "dbms": (
        "### 🗄️ DBMS & SQL Placement Essentials\n\n"
        "**ACID Properties:**\n"
        "• **Atomicity:** All transactions succeed or roll back completely.\n"
        "• **Consistency:** Database transitions from one valid state to another.\n"
        "• **Isolation:** Concurrent transactions don't interfere (`READ COMMITTED`, `SERIALIZABLE`).\n"
        "• **Durable:** Committed data survives hardware failure.\n\n"
        "**SQL Window Functions:**\n"
        "```sql\n"
        "SELECT emp_name, dept_id, salary,\n"
        "       DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) as rank\n"
        "FROM employees;\n"
        "```"
    ),
    "os": (
        "### 🖥️ Operating Systems Placement Core\n\n"
        "**Process vs Thread:**\n"
        "• **Process:** Independent execution unit with isolated memory space.\n"
        "• **Thread:** Lightweight segment of process; shares heap & static memory.\n\n"
        "**Deadlock 4 Necessary Conditions:**\n"
        "1. Mutual Exclusion\n"
        "2. Hold and Wait\n"
        "3. No Preemption\n"
        "4. Circular Wait\n\n"
        "**Paging & Virtual Memory:** Virtual addresses mapped to Physical Memory pages via Page Table (handled by MMU & TLB)."
    ),
    "network": (
        "### 🌐 Computer Networks Placement Cheat Sheet\n\n"
        "**TCP vs UDP:**\n"
        "• **TCP:** Connection-oriented (3-way handshake SYN-SYNACK-ACK), reliable, ordered, flow control.\n"
        "• **UDP:** Connectionless, fast, unreliable, ideal for streaming/gaming.\n\n"
        "**HTTP/1.1 vs HTTP/2 vs HTTP/3:**\n"
        "• HTTP/1.1: Head-of-line blocking, plain text.\n"
        "• HTTP/2: Multiplexing over single TCP connection, binary frames, header compression.\n"
        "• HTTP/3: Uses QUIC over UDP for zero-RTT connection establishment."
    ),
    "hr": (
        "### 🎯 HR & Behavioral Interview Strategy (STAR Method)\n\n"
        "Structure every answer using **S-T-A-R**:\n"
        "• **Situation:** Context of project or challenge.\n"
        "• **Task:** Your responsibility or goal.\n"
        "• **Action:** Specific technical/leadership steps YOU took.\n"
        "• **Result:** Quantifiable outcome (e.g. reduced load time by 35%, fixed 12 critical bugs).\n\n"
        "**Sample Question: 'Tell me about a difficult bug you solved'**\n"
        "Highlight debugging steps, root cause analysis, and preventive measures implemented."
    ),
}


def generate_placement_ai_response(message: str, username: str) -> str:
    m = message.lower()
    for key, reply in PLACEMENT_KNOWLEDGE_BASE.items():
        if key in m:
            return reply

    # Dynamic fallback structured response for student query
    return (
        f"### 🤖 SkillBattle AI Placement Coach Response\n\n"
        f"Hello **{username}**! Here is the expert placement breakdown for your query regarding: **\"{message}\"**\n\n"
        "#### 1. Technical Framework\n"
        "• **Problem Classification:** Identify if this query belongs to Data Structures, System Architecture, Core CS, or HR behavioral rounds.\n"
        "• **Core Objective:** Placement interviewers test your problem-solving approach, clean code structure, and trade-off analysis.\n\n"
        "#### 2. Key Steps for Solution\n"
        "1. **Define Input / Output Constraints:** Clarify constraints (e.g., $N \\le 10^5$ implies an $O(N \\log N)$ or $O(N)$ solution).\n"
        "2. **Optimal Data Structure Selection:** Choose between Hash Table ($O(1)$ lookup), Priority Queue ($O(\\log N)$ max/min element), or Disjoint Set.\n"
        "3. **Dry Run Edge Cases:** Always test empty arrays, single elements, negative numbers, and duplicates.\n\n"
        "#### 3. Time & Space Complexity Goal\n"
        "• **Time Complexity:** Aim for optimal asymptotic time (e.g. $O(N \\log N)$ over $O(N^2)$).\n"
        "• **Space Complexity:** Optimize in-place memory where possible.\n\n"
        "💡 *Need a detailed code template, SQL query, or mock interview drill on this topic? Just ask me!*"
    )


@router.post("/chat")
async def chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reply = generate_placement_ai_response(req.message, current_user.full_name or current_user.username)
    return {"reply": reply, "user": current_user.username}
