"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { LoginRequest } from "@/types/auth";
import { toast } from "react-hot-toast";

export function useLogin() {

    const login = useAuthStore((state) => state.login);

    const [loading, setLoading] = useState(false);

    async function signIn(data: LoginRequest) {

        console.log("=================================");
        console.log("🚀 Login button clicked");
        console.log("Login Data:", data);
        console.log("=================================");

        setLoading(true);

        try {

            await login(data);

            console.log("✅ Login Success");

            console.log(
                "Access Token:",
                localStorage.getItem("access_token")
            );

            console.log(
                "Refresh Token:",
                localStorage.getItem("refresh_token")
            );

            return {
                success: true,
                tokens: {
                    access_token: localStorage.getItem("access_token"),
                },
            };

        } catch (error: any) {

            console.error("❌ Login Failed");
            console.error(error);

            const msg = error?.response?.data?.detail || error?.message || "Login failed";
            toast.error(msg);

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