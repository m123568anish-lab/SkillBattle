from .strength_detector import (
    strength_detector,
)

from .weakness_detector import (
    weakness_detector,
)


class SkillAnalyzer:

    def analyze(

        self,

        topics,

    ):

        return {

            "strengths":

            strength_detector.detect(topics),

            "weaknesses":

            weakness_detector.detect(topics),

        }


skill_analyzer = SkillAnalyzer()