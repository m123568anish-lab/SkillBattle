"use client";

import { useState } from "react";
import { authService } from "@/services/auth.service";

interface RegisterFormData {
    account_type?: "STUDENT" | "COLLEGE" | "COMPANY";
    organization_name?: string;
    organization_code?: string;
    industry?: string;
    website?: string;
    headquarters?: string;
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    avatar: string;
}

export function useRegister() {

    const [loading, setLoading] = useState(false);

    async function signUp(data: RegisterFormData) {

        setLoading(true);

        try {

            const payload = {

                username: data.email.split("@")[0],

                full_name: data.name,

                email: data.email,

                password: data.password,

                avatar_url: data.avatar,

                account_type: data.account_type || "STUDENT",

            };

            console.log("Register Payload:", payload);

            return await authService.register(payload);

        } finally {

            setLoading(false);

        }

    }

    return {

        loading,

        signUp,

    };

}