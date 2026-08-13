import axios, { AxiosInstance } from "axios";

import { BattleAPI } from "./api/battle";
import { TournamentAPI } from "./api/tournament";
import { LeaderboardAPI } from "./api/leaderboard";
import { InterviewAPI } from "./api/interview";
import { AIAPI } from "./api/ai";

export class SkillBattle {

    private client: AxiosInstance;

    battle: BattleAPI;

    tournament: TournamentAPI;

    leaderboard: LeaderboardAPI;

    interview: InterviewAPI;

    ai: AIAPI;

    constructor(
        apiKey: string,
        baseURL = "http://localhost:8001/api/v1",
    ) {

        this.client = axios.create({

            baseURL,

            headers: {

                "X-API-Key": apiKey,

            },

        });

        this.battle = new BattleAPI(this.client);

        this.tournament = new TournamentAPI(this.client);

        this.leaderboard = new LeaderboardAPI(this.client);

        this.interview = new InterviewAPI(this.client);

        this.ai = new AIAPI(this.client);

    }

}