from __future__ import annotations

from typing import Any

DEFAULT_COMPANY_CATALOG: list[dict[str, Any]] = [
    {
        "name": "Google",
        "industry": "Product",
        "role_families": ["Software Development Engineer", "Full Stack Developer", "Cloud Engineer"],
        "official_resources": [
            "Google Engineering Interview Guide",
            "Google SDE Interview Preparation",
        ],
        "assessment_structure": "Coding + DSA + system design + behavioral review",
        "relevant_topics": ["Arrays", "Graphs", "Dynamic Programming", "System Design", "SQL"],
        "evidence_quality": "High",
        "last_verified_at": "2025-01-15",
    },
    {
        "name": "Microsoft",
        "industry": "Product",
        "role_families": ["Software Development Engineer", "Backend Developer", "Data Engineer"],
        "official_resources": ["Microsoft Interviewing Guide", "Microsoft Learn Career Resources"],
        "assessment_structure": "Coding round + technical interview + behavioral panel",
        "relevant_topics": ["Trees", "Greedy Algorithms", "OOP", "DBMS", "Java"],
        "evidence_quality": "High",
        "last_verified_at": "2025-01-10",
    },
    {
        "name": "Amazon",
        "industry": "Product",
        "role_families": ["Software Development Engineer", "Graduate Engineer Trainee", "Backend Developer"],
        "official_resources": ["Amazon interview prep page", "Amazon online assessment prep"],
        "assessment_structure": "OA + technical rounds + leadership principles",
        "relevant_topics": ["Hashing", "Sorting", "Graphs", "System Design", "SQL"],
        "evidence_quality": "High",
        "last_verified_at": "2025-01-20",
    },
    {
        "name": "Adobe",
        "industry": "Product",
        "role_families": ["Software Development Engineer", "Frontend Developer", "Full Stack Developer"],
        "official_resources": ["Adobe interview resources"],
        "assessment_structure": "Coding + MCQ + technical discussion",
        "relevant_topics": ["Arrays", "Strings", "React", "JavaScript", "DBMS"],
        "evidence_quality": "Medium",
        "last_verified_at": "2025-01-08",
    },
    {
        "name": "Meta",
        "industry": "Product",
        "role_families": ["Software Development Engineer", "Frontend Developer", "Data Analyst"],
        "official_resources": ["Meta engineering interview prep"],
        "assessment_structure": "Coding + metrics + design + communication",
        "relevant_topics": ["Graphs", "Dynamic Programming", "System Design", "Statistics"],
        "evidence_quality": "High",
        "last_verified_at": "2025-01-18",
    },
    {
        "name": "Apple",
        "industry": "Product",
        "role_families": ["Software Development Engineer", "Machine Learning Engineer"],
        "official_resources": ["Apple engineering interviews"],
        "assessment_structure": "Coding + algorithmic + problem solving + design",
        "relevant_topics": ["Recursion", "Bit Manipulation", "Graphs", "Machine Learning"],
        "evidence_quality": "High",
        "last_verified_at": "2025-01-12",
    },
    {
        "name": "Oracle",
        "industry": "Product",
        "role_families": ["Backend Developer", "Database Engineer", "Software Development Engineer"],
        "official_resources": ["Oracle hiring resources"],
        "assessment_structure": "Coding + database + Java/DBMS rounds",
        "relevant_topics": ["SQL", "DBMS", "Java", "Trees", "Operating Systems"],
        "evidence_quality": "Medium",
        "last_verified_at": "2024-12-30",
    },
    {
        "name": "Salesforce",
        "industry": "Product",
        "role_families": ["Full Stack Developer", "Frontend Developer", "Cloud Engineer"],
        "official_resources": ["Salesforce Interview Prep"],
        "assessment_structure": "Coding + technical + project discussion",
        "relevant_topics": ["JavaScript", "React", "REST APIs", "OOP", "Cloud Computing"],
        "evidence_quality": "Medium",
        "last_verified_at": "2024-12-28",
    },
    {
        "name": "Atlassian",
        "industry": "Product",
        "role_families": ["Software Development Engineer", "Frontend Developer"],
        "official_resources": ["Atlassian interview prep"],
        "assessment_structure": "Coding + design + teamwork review",
        "relevant_topics": ["Strings", "Graphs", "System Design", "JavaScript"],
        "evidence_quality": "Medium",
        "last_verified_at": "2024-12-26",
    },
    {
        "name": "Uber",
        "industry": "Product",
        "role_families": ["Backend Developer", "Software Development Engineer", "Data Analyst"],
        "official_resources": ["Uber engineering interview resources"],
        "assessment_structure": "Problem solving + systems + cross-functional interviews",
        "relevant_topics": ["Dynamic Programming", "System Design", "Probability", "Statistics"],
        "evidence_quality": "Medium",
        "last_verified_at": "2024-12-25",
    },
    {
        "name": "Walmart",
        "industry": "Product",
        "role_families": ["Backend Developer", "Data Analyst", "Software Development Engineer"],
        "official_resources": ["Walmart interview prep"],
        "assessment_structure": "OA + coding + ML/analyst rounds as applicable",
        "relevant_topics": ["SQL", "Arrays", "Statistics", "Data Interpretation"],
        "evidence_quality": "Medium",
        "last_verified_at": "2024-12-24",
    },
    {
        "name": "PayPal",
        "industry": "Product",
        "role_families": ["Backend Developer", "Full Stack Developer", "Security Engineer"],
        "official_resources": ["PayPal candidate preparation"],
        "assessment_structure": "DSA + system design + technical interview",
        "relevant_topics": ["DBMS", "Trees", "Graphs", "REST APIs", "Authentication"],
        "evidence_quality": "Medium",
        "last_verified_at": "2024-12-20",
    },
    {
        "name": "NVIDIA",
        "industry": "Product",
        "role_families": ["Software Development Engineer", "AI/ML Engineer", "GPU Engineer"],
        "official_resources": ["NVIDIA interview prep"],
        "assessment_structure": "Coding + computer architecture + ML/AI sections",
        "relevant_topics": ["Computer Architecture", "Operating Systems", "Deep Learning", "C++"],
        "evidence_quality": "Medium",
        "last_verified_at": "2024-12-15",
    },
    {
        "name": "TCS",
        "industry": "Service",
        "role_families": ["Graduate Engineer Trainee", "Software Development Engineer"],
        "official_resources": ["TCS NQT prep", "TCS code challenge"],
        "assessment_structure": "Aptitude + coding + communication rounds",
        "relevant_topics": ["Quantitative Aptitude", "Logical Reasoning", "Programming Output Prediction", "C++"],
        "evidence_quality": "Medium",
        "last_verified_at": "2024-12-18",
    },
    {
        "name": "Infosys",
        "industry": "Service",
        "role_families": ["Graduate Engineer Trainee", "System Engineer"],
        "official_resources": ["Infosys recruitment prep"],
        "assessment_structure": "Aptitude + coding + interview",
        "relevant_topics": ["Verbal Ability", "Data Interpretation", "Debugging", "Java"],
        "evidence_quality": "Medium",
        "last_verified_at": "2024-12-12",
    },
]

TOPIC_TAXONOMY: dict[str, list[str]] = {
    "Programming and DSA": [
        "Arrays",
        "Strings",
        "Hashing",
        "Sorting",
        "Searching",
        "Recursion",
        "Backtracking",
        "Linked Lists",
        "Stacks",
        "Queues",
        "Trees",
        "Binary Search Trees",
        "Heaps",
        "Tries",
        "Graphs",
        "Greedy Algorithms",
        "Dynamic Programming",
        "Sliding Window",
        "Two Pointers",
        "Bit Manipulation",
        "Complexity Analysis",
    ],
    "Core Computer Science": [
        "Operating Systems",
        "Computer Networks",
        "DBMS",
        "SQL",
        "Object-Oriented Programming",
        "Computer Architecture",
        "Software Engineering",
        "Data Structures",
        "Compiler Fundamentals",
    ],
    "Programming Languages": [
        "C",
        "C++",
        "Java",
        "Python",
        "JavaScript",
        "TypeScript",
        "Go",
        "Other supported languages",
    ],
    "Development and Engineering": [
        "HTML/CSS",
        "JavaScript",
        "React",
        "Next.js",
        "Node.js",
        "Backend Development",
        "REST APIs",
        "Authentication",
        "System Design",
        "Low-Level Design",
        "Distributed Systems",
        "Database Design",
        "Cloud Computing",
        "DevOps",
    ],
    "AI and Data": [
        "Artificial Intelligence",
        "Machine Learning",
        "Deep Learning",
        "Statistics",
        "Probability",
        "Data Analysis",
        "NumPy",
        "Pandas",
        "Model Evaluation",
        "Generative AI",
    ],
    "Placement aptitude": [
        "Quantitative Aptitude",
        "Logical Reasoning",
        "Verbal Ability",
        "Data Interpretation",
        "Analytical Reasoning",
        "Pseudocode",
        "Flowcharts",
        "Programming Output Prediction",
        "Debugging",
        "Code Tracing",
    ],
    "Interview preparation": [
        "Technical MCQs",
        "Coding Assessments",
        "Debugging",
        "SQL Queries",
        "System Design Scenarios",
        "Technical Fundamentals",
        "Role-specific Questions",
    ],
}

QUESTION_SOURCE_CATALOG: list[dict[str, str]] = [
    {
        "id": "verified-public-material",
        "label": "Verified public placement material",
        "description": "Official company pages, public assessment samples, and licensed preparation resources.",
        "verification_status": "verified",
    },
    {
        "id": "community-reported",
        "label": "Community-reported placement questions",
        "description": "Candidate reports from prior placement and assessment experiences; marked as candidate-reported.",
        "verification_status": "candidate-reported",
    },
    {
        "id": "ai-generated",
        "label": "Original AI-generated placement questions",
        "description": "Original generated practice sets based on official company prep patterns and topics.",
        "verification_status": "ai-generated",
    },
    {
        "id": "existing-inventory",
        "label": "Existing Qubira question inventory",
        "description": "Validated internal MCQs and coding problems reused for battle and study flows.",
        "verification_status": "existing-inventory",
    },
]


def get_company_catalog(custom_catalog: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    return list(custom_catalog or DEFAULT_COMPANY_CATALOG)


def get_company_profile(company_name: str, custom_catalog: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    catalog = get_company_catalog(custom_catalog)
    for company in catalog:
        if company.get("name", "").lower() == company_name.lower():
            return {
                "company_name": company.get("name"),
                "industry": company.get("industry"),
                "role_families": company.get("role_families", []),
                "official_preparation_resources": company.get("official_resources", []),
                "public_assessment_structure": company.get("assessment_structure"),
                "relevant_topics": company.get("relevant_topics", []),
                "evidence_quality": company.get("evidence_quality", "Unknown"),
                "last_verified_date": company.get("last_verified_at"),
            }
    return {
        "company_name": company_name,
        "industry": "Unknown",
        "role_families": [],
        "official_preparation_resources": [],
        "public_assessment_structure": "Not yet documented.",
        "relevant_topics": [],
        "evidence_quality": "Unknown",
        "last_verified_date": None,
    }


def get_topic_taxonomy() -> dict[str, list[str]]:
    return {category: list(topics) for category, topics in TOPIC_TAXONOMY.items()}


def get_question_source_catalog() -> list[dict[str, str]]:
    return [{**source} for source in QUESTION_SOURCE_CATALOG]


def normalize_question_tags(tags: list[str] | None) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for tag in tags or []:
        clean = str(tag).strip()
        if not clean or clean.lower() in seen:
            continue
        seen.add(clean.lower())
        normalized.append(clean)
    return normalized
