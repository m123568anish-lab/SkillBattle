import { AxiosInstance } from "axios";

export class InterviewAPI {

    constructor(
        private client: AxiosInstance,
    ) {}

    async create(payload: any) {

        return (

            await this.client.post(

                "/interview",

                payload,

            )

        ).data;

    }

}