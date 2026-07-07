class WeaknessDetector:

    def detect(

        self,

        topics,

    ):

        return sorted(

            topics,

            key=lambda topic: topic["accuracy"]

        )[:5]


weakness_detector = WeaknessDetector()