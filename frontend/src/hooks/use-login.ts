"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { LoginRequest } from "@/types/auth";
import { toast } from "react-hot-toast";

export function useLogin() {

    const login = useAuthStore((state) => state.login);

    const [loading, setLoading] = useState(false);

    async function signIn(data: LoginRequest) {
        setLoading(true);

        try {
            await login(data);

            return {
                success: true,
                tokens: {
                    access_token: localStorage.getItem("access_token"),
                },
            };
        } catch (error: any) {
            const detail = error?.response?.data?.detail;
            const msg =
                typeof detail === "string"
                    ? detail
                    : Array.isArray(detail)
                    ? detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(", ")
                    : error?.message || "Login failed";

            let userFacingMsg = "Login failed. Please check your credentials.";

            if (msg.toLowerCase().includes("timeout") || error?.code === "ECONNABORTED") {
                userFacingMsg = "Server is waking up (Render cold-start). Retrying automatically, please wait a few seconds...";
            } else if (msg.includes("Network Error") || msg.includes("ECONNREFUSED") || error?.code === "ERR_NETWORK") {
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