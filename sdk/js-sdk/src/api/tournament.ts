import { AxiosInstance } from "axios";

export class TournamentAPI {

    constructor(
        private client: AxiosInstance,
    ) {}

    async list() {

        return (

            await this.client.get("/tournament")

        ).data;

    }

    async create(payload: any) {

        return (

            await this.client.post(

                "/tournament",

                payload,

            )

        ).data;

    }

}