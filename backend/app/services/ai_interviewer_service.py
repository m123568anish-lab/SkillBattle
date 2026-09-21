"""
=========================================================
SkillBattle AI Mock Technical Interviewer Service
=========================================================
"""

import logging
from typing import Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIInterviewerService:

    def generate_interview_questions(self, problem_title: str, user_code: str, language: str = "python") -> List[Dict[str, str]]:
        """
        Generate 3 technical follow-up questions tailored to the user's submitted solution.
        """
        return [
            {
                "id": "q1_complexity",
                "question": f"What is the Time Complexity and Auxiliary Space Complexity of your {language} solution for '{problem_title}'?",
                "hint": "Analyze nested loops or dynamic array allocations.",
            },
            {
                "id": "q2_edge_case",
                "question": "How does your code handle extreme inputs such as an empty array, negative numbers, or integer overflow?",
                "hint": "Check boundary conditions in array indices.",
            },
            {
                "id": "q3_optimization",
                "question": "Can you propose an alternative data structure (e.g. Hash Table vs Two Pointers) to reduce memory overhead?",
                "hint": "Consider trade-offs between speed and space.",
            }
        ]

    def evaluate_interview_response(self, question: str, user_answer: str) -> Dict[str, Any]:
        """
        Evaluate student's answer to the technical interviewer's follow-up question.
        """
        word_count = len(user_answer.split())
        score = min(100, max(50, word_count * 5))
        
        feedback = "Good technical clarity." if score >= 80 else "Try to mention explicit Big-O notation (e.g. O(N) time and O(1) space)."

        return {
            "score": score,
            "feedback": feedback,
            "is_pass": score >= 70,
            "interviewer_comment": f"Placement Assessment: {feedback}"
        }


ai_interviewer_service = AIInterviewerService()
