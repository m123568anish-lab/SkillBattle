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
            const msg = error?.response?.data?.detail || error?.message || "Login failed";
            toast.error(typeof msg === "string" ? msg : "Login failed. Please check your credentials.");
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