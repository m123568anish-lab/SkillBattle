"""
=========================================================
SkillBattle Placement Service
=========================================================
"""

import uuid
from typing import List, Dict, Any, Optional

from app.modules.placement.schemas import (
    CompanySpeedrunTrack,
    MCQQuestion,
    MCQOption,
    MCQSubmission,
    MCQEvaluateResponse,
    PlacementScorecardResponse,
)

COMPANY_TRACKS: List[CompanySpeedrunTrack] = [
    CompanySpeedrunTrack(
        id="amazon_sde1",
        company_name="Amazon",
        logo_symbol="📦",
        tier="FAANG",
        duration_minutes=60,
        mcq_count=5,
        coding_problem_count=2,
        tags=["Arrays", "Sliding Window", "Trees", "Graphs"],
        description="Official Amazon SDE-1 Online Assessment Simulator featuring 2 Coding Questions & 5 Technical CS MCQs.",
        recommended_min_rating=1400,
    ),
    CompanySpeedrunTrack(
        id="tcs_nqt",
        company_name="TCS NQT",
        logo_symbol="🏢",
        tier="Service",
        duration_minutes=45,
        mcq_count=10,
        coding_problem_count=1,
        tags=["Core CS", "Basic Math", "Strings", "Sorting"],
        description="Standard TCS National Qualifier Test pattern focusing on speed, accuracy, and foundational DSA.",
        recommended_min_rating=1000,
    ),
    CompanySpeedrunTrack(
        id="google_swe",
        company_name="Google",
        logo_symbol="🔍",
        tier="FAANG",
        duration_minutes=60,
        mcq_count=5,
        coding_problem_count=2,
        tags=["Dynamic Programming", "Graphs", "Tries", "Segment Trees"],
        description="Google Software Engineer screening round with complex algorithmic challenges and optimal space-time constraints.",
        recommended_min_rating=1600,
    ),
    CompanySpeedrunTrack(
        id="infosys_hackwithinfy",
        company_name="Infosys HackWithInfy",
        logo_symbol="💻",
        tier="Unicorn",
        duration_minutes=50,
        mcq_count=5,
        coding_problem_count=2,
        tags=["Recursion", "Greedy", "Data Structures"],
        description="High-speed contest style problem set used for Power Programmer roles at Infosys.",
        recommended_min_rating=1200,
    ),
    CompanySpeedrunTrack(
        id="microsoft_sde",
        company_name="Microsoft",
        logo_symbol="🪟",
        tier="FAANG",
        duration_minutes=60,
        mcq_count=5,
        coding_problem_count=2,
        tags=["System Design", "Linked Lists", "DP", "Concurrency"],
        description="Microsoft Codility style test focusing on robust edge-case handling and clean code structure.",
        recommended_min_rating=1450,
    ),
]

MCQ_BANK: List[Dict[str, Any]] = [
    {
        "id": "mcq_dbms_1",
        "topic": "DBMS",
        "question": "Which isolation level prevents Dirty Reads but allows Non-Repeatable Reads in SQL databases?",
        "options": [
            {"id": "opt_a", "text": "Read Uncommitted"},
            {"id": "opt_b", "text": "Read Committed"},
            {"id": "opt_c", "text": "Repeatable Read"},
            {"id": "opt_d", "text": "Serializable"},
        ],
        "correct_option_id": "opt_b",
        "explanation": "Read Committed isolation ensures that uncommitted dirty data cannot be read by other transactions."
    },
    {
        "id": "mcq_os_1",
        "topic": "Operating Systems",
        "question": "What happens when a process experiences a Page Fault?",
        "options": [
            {"id": "opt_a", "text": "The process is immediately terminated by OS."},
            {"id": "opt_b", "text": "OS traps to kernel mode and fetches missing page from secondary storage to RAM."},
            {"id": "opt_c", "text": "CPU cache is cleared and rebooted."},
            {"id": "opt_d", "text": "Virtual address space is doubled."},
        ],
        "correct_option_id": "opt_b",
        "explanation": "A Page Fault triggers a hardware interrupt, causing the OS kernel to load the requested page from disk."
    },
    {
        "id": "mcq_cn_1",
        "topic": "Computer Networks",
        "question": "Which TCP mechanism handles flow control to prevent sender from overwhelming a slow receiver?",
        "options": [
            {"id": "opt_a", "text": "Congestion Window (cwnd)"},
            {"id": "opt_b", "text": "Sliding Window (Receive Window - rwnd)"},
            {"id": "opt_c", "text": "Three-way Handshake"},
            {"id": "opt_d", "text": "NAT Translation"},
        ],
        "correct_option_id": "opt_b",
        "explanation": "The TCP Sliding Window (rwnd) notifies the sender how much buffer space is currently available at the receiver."
    },
    {
        "id": "mcq_dsa_1",
        "topic": "Data Structures",
        "question": "What is the worst-case time complexity of lookup in a balanced Hash Table with bad hash functions causing collisions?",
        "options": [
            {"id": "opt_a", "text": "O(1)"},
            {"id": "opt_b", "text": "O(log N)"},
            {"id": "opt_c", "text": "O(N)"},
            {"id": "opt_d", "text": "O(N log N)"},
        ],
        "correct_option_id": "opt_c",
        "explanation": "When all elements collide in the same hash bucket, lookup degrades to scanning a linked list of length N."
    },
    {
        "id": "mcq_oops_1",
        "topic": "OOPs",
        "question": "Which principle of Object-Oriented Programming is violated by using global public mutable state?",
        "options": [
            {"id": "opt_a", "text": "Polymorphism"},
            {"id": "opt_b", "text": "Encapsulation"},
            {"id": "opt_c", "text": "Inheritance"},
            {"id": "opt_d", "text": "Abstraction"},
        ],
        "correct_option_id": "opt_b",
        "explanation": "Encapsulation requires hiding internal data representation within class boundaries."
    }
]


class PlacementService:

    def get_company_tracks(self) -> List[CompanySpeedrunTrack]:
        return COMPANY_TRACKS

    def get_hybrid_mcqs(self, count: int = 5) -> List[MCQQuestion]:
        mcq_list = []
        for q in MCQ_BANK[:count]:
            mcq_list.append(
                MCQQuestion(
                    id=q["id"],
                    topic=q["topic"],
                    question=q["question"],
                    options=[MCQOption(**opt) for opt in q["options"]],
                    code_snippet=q.get("code_snippet"),
                )
            )
        return mcq_list

    def evaluate_mcqs(self, battle_id: str, submissions: List[MCQSubmission]) -> MCQEvaluateResponse:
        sub_map = {s.question_id: s.selected_option_id for s in submissions}
        correct_count = 0
        details = []

        for q in MCQ_BANK:
            q_id = q["id"]
            if q_id in sub_map:
                user_choice = sub_map[q_id]
                is_correct = (user_choice == q["correct_option_id"])
                if is_correct:
                    correct_count += 1

                details.append({
                    "question_id": q_id,
                    "topic": q["topic"],
                    "is_correct": is_correct,
                    "user_selected": user_choice,
                    "correct_option_id": q["correct_option_id"],
                    "explanation": q["explanation"],
                })

        total = len(submissions) or len(MCQ_BANK)
        score = int((correct_count / max(total, 1)) * 100)

        return MCQEvaluateResponse(
            battle_id=battle_id,
            score=score,
            total_mcqs=total,
            correct_count=correct_count,
            details=details,
        )

    def generate_scorecard(self, user_id: str, total_xp: int = 1500, rating: int = 1350, battles_won: int = 12) -> PlacementScorecardResponse:
        readiness = min(100, int((rating / 1800) * 100) + 15)
        
        if readiness >= 90:
            grade = "S"
            eligibility = ["Google", "Amazon", "Microsoft", "Uber", "Flipkart"]
        elif readiness >= 75:
            grade = "A+"
            eligibility = ["Amazon", "Microsoft", "Paytm", "Swiggy", "TCS Digital"]
        elif readiness >= 60:
            grade = "A"
            eligibility = ["Infosys Power Programmer", "Wipro Turbo", "Cognizant GenC Next"]
        else:
            grade = "B"
            eligibility = ["TCS NQT", "Infosys System Engineer", "Capgemini"]

        return PlacementScorecardResponse(
            user_id=user_id,
            overall_readiness_score=readiness,
            grade=grade,
            dsa_proficiency=min(100, readiness + 5),
            system_design_grade="A",
            core_cs_score=min(100, readiness - 3),
            total_battles_won=battles_won,
            top_company_eligibility=eligibility,
            recommendations=[
                "Focus on Dynamic Programming memoization speed in 1v1 battles.",
                "Practice DBMS Isolation levels & SQL Join queries for technical rounds.",
                "Maintain your 5+ daily battle streak to boost your Placement Ranking."
            ]
        )


placement_service = PlacementService()
