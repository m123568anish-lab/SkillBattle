"""
=========================================================

Interview Engine

=========================================================
"""

from __future__ import annotations

from app.modules.interview.generator import (
    interview_generator,
)


class InterviewEngine:

    async def next_question(

        self,

        interview,

    ):

        interview.current_question += 1

        topic = self._topic_for_question(

            interview.current_question,

        )

        return await interview_generator.generate_question(

            difficulty=interview.difficulty,

            language=interview.language,

            topic=topic,

        )

    async def finish(

        self,

        interview,

    ):

        interview.status = "completed"

        return interview

    def _topic_for_question(

        self,

        number: int,

    ):

        topics = [

            "arrays",

            "strings",

            "hashmaps",

            "trees",

            "graphs",

            "dynamic programming",

        ]

        return topics[

            (number - 1)

            % len(topics)

        ]


interview_engine = InterviewEngine()