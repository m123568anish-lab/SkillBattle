package com.skillbattle.api;

import okhttp3.*;

import java.io.IOException;

public class BattleApi {

    private final OkHttpClient client;

    private final String baseUrl;

    private final String apiKey;

    public BattleApi(

            OkHttpClient client,

            String baseUrl,

            String apiKey){

        this.client=client;

        this.baseUrl=baseUrl;

        this.apiKey=apiKey;

    }

    public String list() throws IOException{

        Request request=new Request.Builder()

                .url(baseUrl+"/battle")

                .addHeader("X-API-Key",apiKey)

                .build();

        Response response=client.newCall(request).execute();

        return response.body().string();

    }

}