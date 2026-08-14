import { AxiosInstance } from "axios";

export class LeaderboardAPI {

    constructor(
        private client: AxiosInstance,
    ) {}

    async global() {

        return (

            await this.client.get("/leaderboard")

        ).data;

    }

}