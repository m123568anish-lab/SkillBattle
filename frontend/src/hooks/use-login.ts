"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { LoginRequest } from "@/types/auth";
import { toast } from "react-hot-toast";
import { isAxiosError } from "axios";

export function useLogin() {

    const login = useAuthStore((state) => state.login);

    const [loading, setLoading] = useState(false);

    async function signIn(data: LoginRequest) {
        setLoading(true);

        try {
            const user = await login(data);

            return {
                success: true,
                user,
                tokens: {
                    access_token: localStorage.getItem("access_token"),
                },
            };
        } catch (error: unknown) {
            const detail: unknown = isAxiosError(error) ? error.response?.data?.detail : undefined;
            const detailMessage = Array.isArray(detail)
                ? detail.map((item: unknown) => {
                    if (typeof item === "object" && item !== null && "msg" in item && typeof item.msg === "string") return item.msg;
                    return JSON.stringify(item);
                }).join(", ")
                : undefined;
            const msg = typeof detail === "string"
                ? detail
                : detailMessage || (error instanceof Error ? error.message : "Login failed");
            const code = isAxiosError(error) ? error.code : undefined;

            let userFacingMsg = "Login failed. Please check your credentials.";

            if (msg.toLowerCase().includes("timeout") || code === "ECONNABORTED") {
                userFacingMsg = "Server is waking up (Render cold-start). Retrying automatically, please wait a few seconds...";
            } else if (msg.includes("Network Error") || msg.includes("ECONNREFUSED") || code === "ERR_NETWORK") {
                userFacingMsg = "Network Error: Unable to reach SkillBattle backend server. Please check your connection.";
            } else if (typeof msg === "string" && msg.trim()) {
                userFacingMsg = msg;
            }

            toast.error(userFacingMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    }


    return {

        loading,

        signIn,

    };

}