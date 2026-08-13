class StrengthDetector:

    def detect(

        self,

        topics,

    ):

        return sorted(

            topics,

            key=lambda topic: topic["accuracy"],

            reverse=True,

        )[:5]


strength_detector = StrengthDetector()