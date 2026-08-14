import { AxiosInstance } from "axios";

export class AIAPI {

    constructor(
        private client: AxiosInstance,
    ) {}

    async codeReview(payload: any) {

        return (

            await this.client.post(

                "/code-review/review",

                payload,

            )

        ).data;

    }

    async battleCoach(payload: any) {

        return (

            await this.client.post(

                "/battle-coach/analyze",

                payload,

            )

        ).data;

    }

    async learningPlan(payload: any) {

        return (

            await this.client.post(

                "/learning-engine/generate",

                payload,

            )

        ).data;

    }

}