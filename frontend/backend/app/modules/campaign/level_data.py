LEVEL_DATA = {
    "dsa": [
        {
            "level_id": 1,
            "title": "Arrays & Strings Mastery",
            "description": "Learn array indexing, slice techniques, and two-pointer traversals.",
            "questions": [
                {
                    "id": 101,
                    "text": "What is the time complexity of accessing an element in an array by index?",
                    "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
                    "correct": 0
                },
                {
                    "id": 102,
                    "text": "In a two-pointer array reversal technique, how many array elements are swapped in total for size N?",
                    "options": ["N swaps", "N/2 swaps", "2N swaps", "log N swaps"],
                    "correct": 1
                },
                {
                    "id": 103,
                    "text": "Which of the following operations on a dynamic array (like std::vector) has an O(N) worst-case time complexity?",
                    "options": ["Accessing first element", "Pushing to the back (average)", "Inserting at index 0", "Pop from the back"],
                    "correct": 2
                }
            ]
        },
        {
            "level_id": 2,
            "title": "Linked Lists Foundations",
            "description": "Explore Singly and Doubly Linked Lists and pointer manipulations.",
            "questions": [
                {
                    "id": 201,
                    "text": "What is the worst-case time complexity of inserting a node at the head of a Singly Linked List?",
                    "options": ["O(N)", "O(1)", "O(log N)", "O(N log N)"],
                    "correct": 1
                },
                {
                    "id": 202,
                    "text": "Which algorithm is used to detect a cycle in a linked list in O(1) space?",
                    "options": ["Binary Search", "Dijkstra's Algorithm", "Floyd's Tortoise and Hare", "Kruskal's Algorithm"],
                    "correct": 2
                },
                {
                    "id": 203,
                    "text": "Compared to single linked lists, what additional pointer does a doubly linked list node contain?",
                    "options": ["Next pointer", "Child pointer", "Previous pointer", "Parent pointer"],
                    "correct": 2
                }
            ]
        },
        {
            "level_id": 3,
            "title": "Stacks & Queues Operations",
            "description": "Master LIFO and FIFO properties and buffer queues.",
            "questions": [
                {
                    "id": 301,
                    "text": "Which data structure follows the Last-In-First-Out (LIFO) protocol?",
                    "options": ["Queue", "Stack", "Min Heap", "Binary Search Tree"],
                    "correct": 1
                },
                {
                    "id": 302,
                    "text": "In a circular queue implemented using an array of size N, what condition checks if the queue is full?",
                    "options": ["(rear + 1) % N == front", "rear == front", "rear == N - 1", "front == 0"],
                    "correct": 0
                },
                {
                    "id": 303,
                    "text": "Which stack operation is used to view the top element without removing it?",
                    "options": ["pop()", "push()", "peek()", "clear()"],
                    "correct": 2
                }
            ]
        },
        {
            "level_id": 4,
            "title": "Sorting & Searching Arena",
            "description": "Examine QuickSort, MergeSort, and Binary Search algorithms.",
            "questions": [
                {
                    "id": 401,
                    "text": "What is the time complexity of Binary Search in a sorted array?",
                    "options": ["O(N)", "O(log N)", "O(N log N)", "O(1)"],
                    "correct": 1
                },
                {
                    "id": 402,
                    "text": "Which of the following sorting algorithms is NOT stable in its standard implementation?",
                    "options": ["Merge Sort", "Insertion Sort", "Bubble Sort", "Quick Sort"],
                    "correct": 3
                },
                {
                    "id": 403,
                    "text": "What is the worst-case time complexity of Quick Sort?",
                    "options": ["O(N log N)", "O(N^2)", "O(N)", "O(2^N)"],
                    "correct": 1
                }
            ]
        },
        {
            "level_id": 5,
            "title": "Binary Trees Exploration",
            "description": "Traverse trees and learn properties of Binary Search Trees.",
            "questions": [
                {
                    "id": 501,
                    "text": "Which traversal of a Binary Search Tree (BST) yields the keys in sorted order?",
                    "options": ["Pre-order", "Post-order", "In-order", "Level-order"],
                    "correct": 2
                },
                {
                    "id": 502,
                    "text": "What is the maximum number of nodes at level 'L' of a binary tree (root is level 0)?",
                    "options": ["2^L", "2^(L+1) - 1", "L^2", "2 * L"],
                    "correct": 0
                },
                {
                    "id": 503,
                    "text": "What is the height of a balanced Binary Search Tree containing N nodes?",
                    "options": ["O(N)", "O(log N)", "O(N log N)", "O(sqrt(N))"],
                    "correct": 1
                }
            ]
        },
        {
            "level_id": 6,
            "title": "Binary Heaps & Priority Queues",
            "description": "Understand min-heaps, max-heaps, and element extractions.",
            "questions": [
                {
                    "id": 601,
                    "text": "What is the time complexity to insert a new element into a Max Heap of size N?",
                    "options": ["O(1)", "O(N)", "O(log N)", "O(N log N)"],
                    "correct": 2
                },
                {
                    "id": 602,
                    "text": "Where is the minimum value located in a Max-Heap?",
                    "options": ["At the root", "Always in the left child of root", "In one of the leaf nodes", "At the last index only"],
                    "correct": 2
                },
                {
                    "id": 603,
                    "text": "What is the time complexity of building a heap from N elements (heapify process)?",
                    "options": ["O(N)", "O(N log N)", "O(log N)", "O(N^2)"],
                    "correct": 0
                }
            ]
        },
        {
            "level_id": 7,
            "title": "Graphs & Tree Traversals",
            "description": "Practice BFS, DFS, and adjacency lists vs matrices.",
            "questions": [
                {
                    "id": 701,
                    "text": "Which data structure is typically used to implement Breadth-First Search (BFS)?",
                    "options": ["Stack", "Queue", "Priority Queue", "BST"],
                    "correct": 1
                },
                {
                    "id": 702,
                    "text": "What is the time complexity of DFS traversal on a graph with V vertices and E edges using adjacency list?",
                    "options": ["O(V)", "O(V + E)", "O(V * E)", "O(V^2)"],
                    "correct": 1
                },
                {
                    "id": 703,
                    "text": "Which algorithm is used to find the shortest path in a weighted graph with positive weights?",
                    "options": ["DFS", "Kruskal's", "Dijkstra's", "Prim's"],
                    "correct": 2
                }
            ]
        },
        {
            "level_id": 8,
            "title": "Dynamic Programming Intro",
            "description": "Learn memoization, tabulation, and overlapping subproblems.",
            "questions": [
                {
                    "id": 801,
                    "text": "What is the primary difference between Memoization and Tabulation?",
                    "options": [
                        "Memoization is Top-Down, Tabulation is Bottom-Up",
                        "Memoization is Bottom-Up, Tabulation is Top-Down",
                        "Memoization uses no arrays, Tabulation uses only stacks",
                        "Tabulation is slower than Memoization in all cases"
                    ],
                    "correct": 0
                },
                {
                    "id": 802,
                    "text": "Which of the following is a classic problem solved using Dynamic Programming?",
                    "options": ["Binary Search", "0/1 Knapsack", "Merge Sort", "Linear Search"],
                    "correct": 1
                },
                {
                    "id": 803,
                    "text": "What is the time complexity to solve the standard Longest Common Subsequence (LCS) problem of two strings of lengths M and N?",
                    "options": ["O(2^(M+N))", "O(M + N)", "O(M * N)", "O(log(M*N))"],
                    "correct": 2
                }
            ]
        },
        {
            "level_id": 9,
            "title": "Greedy Algorithms Quest",
            "description": "Understand greedy choices, optimal substructure, and activity selection.",
            "questions": [
                {
                    "id": 901,
                    "text": "In Huffman Coding, what type of tree is constructed to find optimal prefix codes?",
                    "options": ["Binary Search Tree", "AVL Tree", "Binary Trie / Greedy Tree", "Red-Black Tree"],
                    "correct": 2
                },
                {
                    "id": 902,
                    "text": "Which of the following problems can be solved optimally using a Greedy approach?",
                    "options": ["Fractional Knapsack", "0/1 Knapsack", "Longest Common Subsequence", "Traveling Salesman Problem"],
                    "correct": 0
                },
                {
                    "id": 903,
                    "text": "What is the time complexity of the standard Activity Selection problem (sorted by finish times)?",
                    "options": ["O(N^2)", "O(N log N)", "O(N)", "O(1)"],
                    "correct": 2
                }
            ]
        },
        {
            "level_id": 10,
            "title": "Advanced Trie Structures",
            "description": "Explore Prefix Trees and rapid word dictionary matches.",
            "questions": [
                {
                    "id": 1001,
                    "text": "What is the search time complexity for a word of length K in a Trie?",
                    "options": ["O(K)", "O(log N)", "O(N)", "O(N * K)"],
                    "correct": 0
                },
                {
                    "id": 1002,
                    "text": "What is another common name for a Trie data structure?",
                    "options": ["Segment Tree", "Suffix Automaton", "Prefix Tree", "Binary Index Tree"],
                    "correct": 2
                },
                {
                    "id": 1003,
                    "text": "What is a main disadvantage of Tries compared to Hash Tables for vocabulary storage?",
                    "options": ["Slower lookup", "No prefix matching", "High memory overhead for empty node pointers", "Unstable performance"],
                    "correct": 2
                }
            ]
        }
    ],
    "os": [
        {
            "level_id": 1,
            "title": "OS & Processes Basics",
            "description": "Understand operating system architectures and process states.",
            "questions": [
                {
                    "id": 1101,
                    "text": "Which of the following contains the process state, program counter, and CPU registers?",
                    "options": ["Process Control Block (PCB)", "Virtual Memory Map", "System Call Registry", "Buffer Cache Table"],
                    "correct": 0
                },
                {
                    "id": 1102,
                    "text": "What state does a process transition to immediately when its CPU execution time slice expires?",
                    "options": ["Waiting State", "Ready State", "Terminated State", "Blocked State"],
                    "correct": 1
                },
                {
                    "id": 1103,
                    "text": "What is the role of a short-term scheduler (CPU Scheduler)?",
                    "options": ["Selects processes from disk to load into memory", "Selects from ready queue to execute on CPU", "Swaps processes in and out of memory", "Kills zombie processes"],
                    "correct": 1
                }
            ]
        },
        {
            "level_id": 2,
            "title": "CPU Scheduling Algorithms",
            "description": "Examine Round Robin, SJF, and Priority Scheduling.",
            "questions": [
                {
                    "id": 1201,
                    "text": "Which scheduling algorithm is non-preemptive by default and executes processes in order of arrival?",
                    "options": ["Round Robin", "First-Come First-Served (FCFS)", "Shortest Remaining Time First", "Multilevel Feedback Queue"],
                    "correct": 1
                },
                {
                    "id": 1202,
                    "text": "What scheduling algorithm yields the minimum average waiting time for a constant set of processes?",
                    "options": ["FCFS", "Priority Scheduling", "Shortest Job First (SJF)", "Round Robin"],
                    "correct": 2
                },
                {
                    "id": 1203,
                    "text": "What issue can occur in Priority Scheduling where low-priority processes wait indefinitely?",
                    "options": ["Thrashing", "Starvation", "Belady's Anomaly", "Deadlock"],
                    "correct": 1
                }
            ]
        },
        {
            "level_id": 3,
            "title": "Threads & Concurrency",
            "description": "Understand user-level threads, kernel threads, and race conditions.",
            "questions": [
                {
                    "id": 1301,
                    "text": "Which resources are shared among all threads of a single process?",
                    "options": ["Register values", "Stack memory", "Code and Global variables", "Program counter"],
                    "correct": 2
                },
                {
                    "id": 1302,
                    "text": "What is a race condition?",
                    "options": [
                        "Two processes executing in parallel at high speed",
                        "Multiple processes accessing/manipulating shared data concurrently with outcome depending on order",
                        "A CPU execution deadlock",
                        "Low priority scheduler blocks high priority threads"
                    ],
                    "correct": 1
                },
                {
                    "id": 1303,
                    "text": "What synchronization mechanism is an integer variable accessed via wait() and signal()?",
                    "options": ["Mutex Lock", "Semaphore", "Condition Variable", "Monitor"],
                    "correct": 1
                }
            ]
        },
        {
            "level_id": 4,
            "title": "Memory Management",
            "description": "Examine paging, segmentation, and fragmentation.",
            "questions": [
                {
                    "id": 1401,
                    "text": "What is the purpose of the Memory Management Unit (MMU)?",
                    "options": [
                        "Translate virtual addresses to physical addresses",
                        "Allocate heap memory in runtime",
                        "Perform garbage collection",
                        "Pre-fetch CPU instructions"
                    ],
                    "correct": 0
                },
                {
                    "id": 1402,
                    "text": "Which phenomenon refers to unused memory spaces scattered between allocated blocks?",
                    "options": ["Internal Fragmentation", "External Fragmentation", "Compaction", "Thrashing"],
                    "correct": 1
                },
                {
                    "id": 1403,
                    "text": "What is paging in memory management?",
                    "options": [
                        "Swapping files between directories",
                        "Dividing logical memory into fixed-size blocks (pages) and physical memory into frames",
                        "Dividing memory based on segment names",
                        "Dynamic memory expansion on hard disk"
                    ],
                    "correct": 1
                }
            ]
        },
        {
            "level_id": 5,
            "title": "Deadlocks Prevention",
            "description": "Learn the 4 Coffman conditions and the Banker's algorithm.",
            "questions": [
                {
                    "id": 1501,
                    "text": "Which of the following is NOT one of the four Coffman conditions required for a deadlock?",
                    "options": ["Mutual Exclusion", "Hold and Wait", "No Preemption", "Resource Preemption"],
                    "correct": 3
                },
                {
                    "id": 1502,
                    "text": "What algorithm is used for deadlock avoidance by verifying if resource allocation leads to a safe state?",
                    "options": ["Dijkstra's Algorithm", "Banker's Algorithm", "Kruskal's Algorithm", "Round Robin"],
                    "correct": 1
                },
                {
                    "id": 1503,
                    "text": "How can you prevent the 'Circular Wait' condition in deadlock prevention?",
                    "options": [
                        "Impose a global ordering on all resource allocations",
                        "Allow resources to be shared freely",
                        "Preempt resources instantly from waiting processes",
                        "Disable locks entirely"
                    ],
                    "correct": 0
                }
            ]
        },
        {
            "level_id": 6,
            "title": "Virtual Memory & Page Faults",
            "description": "Explore page replacement algorithms and demand paging.",
            "questions": [
                {
                    "id": 1601,
                    "text": "What happens during a page fault?",
                    "options": [
                        "A program tries to read memory it doesn't own (segfault)",
                        "A page referenced is not present in physical RAM (requires disk fetch)",
                        "The page table corrupts",
                        "Memory allocation limit exceeded"
                    ],
                    "correct": 1
                },
                {
                    "id": 1602,
                    "text": "Which page replacement algorithm suffers from Belady's Anomaly (page faults increase when frames increase)?",
                    "options": ["LRU (Least Recently Used)", "Optimal Page Replacement", "FIFO (First-In First-Out)", "LFU (Least Frequently Used)"],
                    "correct": 2
                },
                {
                    "id": 1603,
                    "text": "What state is an OS in when it spends more time swapping pages in/out than executing processes?",
                    "options": ["Deadlock", "Segmentation fault", "Thrashing", "Starvation"],
                    "correct": 2
                }
            ]
        },
        {
            "level_id": 7,
            "title": "File Systems Architecture",
            "description": "Examine directories, inodes, allocation methods, and directory structures.",
            "questions": [
                {
                    "id": 1701,
                    "text": "In a Unix file system, what is an inode?",
                    "options": [
                        "A pointer to the file name",
                        "A data structure storing file metadata and pointers to disk blocks",
                        "The system call used to delete files",
                        "An encrypted system key"
                    ],
                    "correct": 1
                },
                {
                    "id": 1702,
                    "text": "Which allocation method suffers from severe external fragmentation?",
                    "options": ["Contiguous Allocation", "Linked Allocation", "Indexed Allocation", "FAT Allocation"],
                    "correct": 0
                },
                {
                    "id": 1703,
                    "text": "What is the role of a directory in an operating system?",
                    "options": [
                        "Map file names to their corresponding metadata/inode index",
                        "Store the binary code of the application",
                        "Keep track of CPU thread scheduling",
                        "Perform file encryption"
                    ],
                    "correct": 0
                }
            ]
        },
        {
            "level_id": 8,
            "title": "Disk Scheduling Algorithms",
            "description": "Contrast FCFS, SSTF, SCAN, and C-LOOK.",
            "questions": [
                {
                    "id": 1801,
                    "text": "Which disk scheduling algorithm selects requests closest to the current head position?",
                    "options": ["FCFS", "SSTF (Shortest Seek Time First)", "SCAN", "C-LOOK"],
                    "correct": 1
                },
                {
                    "id": 1802,
                    "text": "What is another name for the SCAN disk scheduling algorithm?",
                    "options": ["Elevator Algorithm", "Priority Search", "Greedy Disk Search", "LIFO Search"],
                    "correct": 0
                },
                {
                    "id": 1803,
                    "text": "How does C-SCAN differ from standard SCAN?",
                    "options": [
                        "It returns to the beginning without servicing requests on the return pass",
                        "It reverses direction midway",
                        "It handles only priority files",
                        "It schedules sector execution randomly"
                    ],
                    "correct": 0
                }
            ]
        },
        {
            "level_id": 9,
            "title": "System Calls interface",
            "description": "Understand kernel mode, user mode, and context switching.",
            "questions": [
                {
                    "id": 1901,
                    "text": "Which instruction forces the CPU to switch from User Mode to Kernel Mode?",
                    "options": ["System Call (Software Interrupt)", "Page Fault", "ALU operation", "Context switch"],
                    "correct": 0
                },
                {
                    "id": 1902,
                    "text": "In UNIX/Linux, which system call is used to create a new process?",
                    "options": ["exec()", "fork()", "wait()", "pipe()"],
                    "correct": 1
                },
                {
                    "id": 1903,
                    "text": "What value does fork() return in the parent process upon successful execution?",
                    "options": ["0", "The PID of the newly created child process", "-1 (error value)", "1"],
                    "correct": 1
                }
            ]
        },
        {
            "level_id": 10,
            "title": "System Protection & Security",
            "description": "Master access control matrices, capability lists, and user permissions.",
            "questions": [
                {
                    "id": 2001,
                    "text": "What is an Access Control List (ACL) in protection?",
                    "options": [
                        "A list associated with a resource specifying users and their allowed actions",
                        "A list of resources a user can access",
                        "A list of running kernel services",
                        "A network firewall ruleset"
                    ],
                    "correct": 0
                },
                {
                    "id": 2002,
                    "text": "What security principle suggests giving users only the access they strictly need for their job?",
                    "options": ["Principle of Minimum Coverage", "Principle of Least Privilege", "Separation of Concerns", "Open Security Strategy"],
                    "correct": 1
                },
                {
                    "id": 2003,
                    "text": "Which mechanism acts as a capability list stored with each subject (user)?",
                    "options": ["Access Control Matrix", "ACL", "Capability List / Token", "Locking Vector"],
                    "correct": 2
                }
            ]
        }
    ],
    "dbms": [
        {
            "level_id": 1,
            "title": "Intro to Relational Databases",
            "description": "Understand Relational Models, Tables, Schemas, and Keys.",
            "questions": [
                {
                    "id": 2101,
                    "text": "What type of key uniquely identifies a row in a table and cannot contain NULL values?",
                    "options": ["Primary Key", "Foreign Key", "Alternate Key", "Candidate Key (without Null limit)"],
                    "correct": 0
                },
                {
                    "id": 2102,
                    "text": "What is referential integrity?",
                    "options": [
                        "Making sure all primary key columns contain unique numbers",
                        "A rule requiring foreign key values to match primary key values in a referenced table",
                        "Encrypting password fields",
                        "Running backup routines daily"
                    ],
                    "correct": 1
                },
                {
                    "id": 2103,
                    "text": "Which database model represents data as mathematical relations (tables)?",
                    "options": ["Hierarchical Model", "Network Model", "Relational Model", "Object-Oriented Model"],
                    "correct": 2
                }
            ]
        },
        {
            "level_id": 2,
            "title": "SELECT Queries & Filtering",
            "description": "Examine SQL syntax, SELECT, WHERE, GROUP BY, and aggregates.",
            "questions": [
                {
                    "id": 2201,
                    "text": "Which SQL clause is used to filter group results (after aggregation)?",
                    "options": ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
                    "correct": 1
                },
                {
                    "id": 2202,
                    "text": "Which SQL wildcard character represents zero or more characters in a LIKE comparison?",
                    "options": ["_", "%", "*", "?"],
                    "correct": 1
                },
                {
                    "id": 2203,
                    "text": "In SQL, what is the default sorting order when using ORDER BY?",
                    "options": ["Ascending (ASC)", "Descending (DESC)", "Unsorted", "Indexed Order"],
                    "correct": 0
                }
            ]
        },
        {
            "level_id": 3,
            "title": "SQL Joins & Subqueries",
            "description": "Contrast INNER, LEFT, RIGHT, and FULL outer joins.",
            "questions": [
                {
                    "id": 2301,
                    "text": "Which join returns all matching rows from both tables, plus unmatched rows from the left table?",
                    "options": ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"],
                    "correct": 1
                },
                {
                    "id": 2302,
                    "text": "In a nested subquery, what operator evaluates to TRUE if the subquery returns at least one row?",
                    "options": ["IN", "EXISTS", "ANY", "ALL"],
                    "correct": 1
                },
                {
                    "id": 2303,
                    "text": "Which operation combines the result-set of two or more SELECT statements (excluding duplicates by default)?",
                    "options": ["JOIN", "UNION", "INTERSECT", "EXCEPT"],
                    "correct": 1
                }
            ]
        },
        {
            "level_id": 4,
            "title": "Database Indexing",
            "description": "Understand B-Trees, Clustered Indexes, and query optimizations.",
            "questions": [
                {
                    "id": 2401,
                    "text": "How does a Clustered Index differ from a Non-Clustered Index?",
                    "options": [
                        "Clustered index physically sorts the rows in the table; Non-clustered index stores index structure separately",
                        "Clustered index stores key values only; Non-clustered index is stored on the disk",
                        "Clustered index is slower than Non-clustered index",
                        "There is no difference"
                    ],
                    "correct": 0
                },
                {
                    "id": 2402,
                    "text": "What data structure is most commonly used for relational database indexes?",
                    "options": ["B+ Tree / B-Tree", "Binary Search Tree", "Linked List", "Min Heap"],
                    "correct": 0
                },
                {
                    "id": 2403,
                    "text": "What is a disadvantage of having too many indexes on a table?",
                    "options": [
                        "Slower SELECT queries",
                        "Slower INSERT, UPDATE, and DELETE operations",
                        "Unstable database connections",
                        "Normal form validation failure"
                    ],
                    "correct": 1
                }
            ]
        },
        {
            "level_id": 5,
            "title": "Transactions & ACID",
            "description": "Master Atomicity, Consistency, Isolation, and Durability.",
            "questions": [
                {
                    "id": 2501,
                    "text": "Which ACID property guarantees that all operations in a transaction either complete or are fully rolled back?",
                    "options": ["Atomicity", "Consistency", "Isolation", "Durability"],
                    "correct": 0
                },
                {
                    "id": 2502,
                    "text": "What isolation issue occurs when a transaction reads uncommitted changes written by another transaction?",
                    "options": ["Dirty Read", "Non-Repeatable Read", "Phantom Read", "Lost Update"],
                    "correct": 0
                },
                {
                    "id": 2503,
                    "text": "Which SQL command permanently saves changes made in a transaction to the database?",
                    "options": ["ROLLBACK", "COMMIT", "SAVEPOINT", "MERGE"],
                    "correct": 1
                }
            ]
        },
        {
            "level_id": 6,
            "title": "Database Normalization",
            "description": "Learn 1NF, 2NF, 3NF, and BCNF.",
            "questions": [
                {
                    "id": 2601,
                    "text": "What condition is required for a table to be in Second Normal Form (2NF)?",
                    "options": [
                        "Must be in 1NF and have no partial dependencies",
                        "Must be in 1NF and have no transitive dependencies",
                        "Must contain only atomic values",
                        "Must have a composite key"
                    ],
                    "correct": 0
                },
                {
                    "id": 2602,
                    "text": "Transitive dependency removal is the main focus of which normal form?",
                    "options": ["1NF", "2NF", "3NF", "BCNF"],
                    "correct": 2
                },
                {
                    "id": 2603,
                    "text": "What normal form requires that for every functional dependency X -> Y, X must be a super key?",
                    "options": ["3NF", "BCNF (Boyce-Codd)", "4NF", "5NF"],
                    "correct": 1
                }
            ]
        },
        {
            "level_id": 7,
            "title": "Relational Algebra",
            "description": "Learn projection, selection, cartesian product, and division.",
            "questions": [
                {
                    "id": 2701,
                    "text": "Which relational algebra operator filters rows based on a condition?",
                    "options": ["Projection (pi)", "Selection (sigma)", "Cartesian Product (x)", "Join (bowtie)"],
                    "correct": 1
                },
                {
                    "id": 2702,
                    "text": "Which relational algebra operator filters columns?",
                    "options": ["Projection (pi)", "Selection (sigma)", "Union", "Intersection"],
                    "correct": 0
                },
                {
                    "id": 2703,
                    "text": "What is the cardinality of the Cartesian Product of relation R (m rows) and S (n rows)?",
                    "options": ["m + n", "m * n", "m ^ n", "max(m, n)"],
                    "correct": 1
                }
            ]
        },
        {
            "level_id": 8,
            "title": "Storage & Buffer Management",
            "description": "Examine blocks, sectors, buffer pools, and LRU page replacement.",
            "questions": [
                {
                    "id": 2801,
                    "text": "What is a buffer pool in a DBMS?",
                    "options": [
                        "An area of physical memory used to cache disk pages",
                        "A temporary table storing transaction logs",
                        "The backup drive array",
                        "An array of SQL connections"
                    ],
                    "correct": 0
                },
                {
                    "id": 2802,
                    "text": "What does it mean if a page in the buffer pool is marked as 'dirty'?",
                    "options": [
                        "It has been corrupted by a crash",
                        "It has been modified in memory but not yet written to disk",
                        "It contains temporary intermediate calculations",
                        "It belongs to a deleted table"
                    ],
                    "correct": 1
                },
                {
                    "id": 2803,
                    "text": "Why does DBMS use its own buffer management policies instead of relying solely on OS virtual memory?",
                    "options": [
                        "DBMS understands page access patterns (like sequential scans) and can predict future references better",
                        "OS buffer memory is too slow",
                        "DBMS cannot access OS virtual memory",
                        "DBMS requires encrypted pages"
                    ],
                    "correct": 0
                }
            ]
        },
        {
            "level_id": 9,
            "title": "NoSQL vs SQL databases",
            "description": "Compare SQL Relational systems with Document, Key-Value, Column, and Graph databases.",
            "questions": [
                {
                    "id": 2901,
                    "text": "Which database type stores data as key-value pairs or JSON document structures without strict foreign key constraints?",
                    "options": ["SQL Database", "NoSQL Database", "Relational Database", "Network Database"],
                    "correct": 1
                },
                {
                    "id": 2902,
                    "text": "What theorem states that a distributed database can only support two out of Consistency, Availability, and Partition Tolerance?",
                    "options": ["CAP Theorem", "ACID Theorem", "BASE Theorem", "Boyce-Codd Theorem"],
                    "correct": 0
                },
                {
                    "id": 2903,
                    "text": "Which of the following database models is optimized for scaling write throughput and storing sparse data?",
                    "options": ["Relational Model", "Document Store", "Wide-Column / Columnar Store", "Hierarchical Store"],
                    "correct": 2
                }
            ]
        },
        {
            "level_id": 10,
            "title": "Procedures, Triggers & Views",
            "description": "Understand stored routines, database events, and virtual tables.",
            "questions": [
                {
                    "id": 3001,
                    "text": "What is a database Trigger?",
                    "options": [
                        "A pre-compiled SQL query",
                        "A procedural code block executed automatically in response to insert/update/delete events",
                        "A backup configuration key",
                        "An index search key"
                    ],
                    "correct": 1
                },
                {
                    "id": 3002,
                    "text": "What is a view in SQL?",
                    "options": [
                        "A physical copy of table columns",
                        "A virtual table defined by a SELECT query",
                        "An administration control panel",
                        "A database performance report"
                    ],
                    "correct": 1
                },
                {
                    "id": 3003,
                    "text": "What is a benefit of using Stored Procedures?",
                    "options": [
                        "Reduces network traffic by packing multiple SQL statements together",
                        "Allows databases to bypass indexes",
                        "Eliminates the need for transactions",
                        "Allows storing files on disk directly"
                    ],
                    "correct": 0
                }
            ]
        }
    ]
}
