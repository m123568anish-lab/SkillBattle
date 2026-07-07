import { AxiosInstance } from "axios";

export class BattleAPI {

    constructor(
        private client: AxiosInstance,
    ) {}

    async list() {

        return (

            await this.client.get("/battle")

        ).data;

    }

    async get(id: string) {

        return (

            await this.client.get(`/battle/${id}`)

        ).data;

    }

    async create(payload: any) {

        return (

            await this.client.post(

                "/battle",

                payload,

            )

        ).data;

    }

}