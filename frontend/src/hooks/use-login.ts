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

            const userFacingMsg =
                msg.includes("Network Error") || msg.includes("ECONNREFUSED") || error?.code === "ERR_NETWORK"
                    ? "Network Error: Unable to reach SkillBattle backend server. Please check your internet connection."
                    : typeof msg === "string"
                    ? msg
                    : "Login failed. Please check your credentials.";

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