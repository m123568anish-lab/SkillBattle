package com.skillbattle;

import okhttp3.OkHttpClient;

import com.skillbattle.api.*;

public class Client {

    private final OkHttpClient client;

    private final String baseUrl;

    private final String apiKey;

    public final BattleApi battle;

    public final TournamentApi tournament;

    public final LeaderboardApi leaderboard;

    public final InterviewApi interview;

    public final AiApi ai;

    public Client(String apiKey){

        this(apiKey,"http://localhost:8001/api/v1");

    }

    public Client(String apiKey,String baseUrl){

        this.client=new OkHttpClient();

        this.baseUrl=baseUrl;

        this.apiKey=apiKey;

        battle=new BattleApi(client,baseUrl,apiKey);

        tournament=new TournamentApi(client,baseUrl,apiKey);

        leaderboard=new LeaderboardApi(client,baseUrl,apiKey);

        interview=new InterviewApi(client,baseUrl,apiKey);

        ai=new AiApi(client,baseUrl,apiKey);

    }

}