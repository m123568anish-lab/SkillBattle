import random


class QuestionEngine:

    def next_question(

        self,

        questions,

    ):

        return random.choice(

            questions

        )


question_engine = QuestionEngine()