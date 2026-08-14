"use client";

import { useState } from "react";
import { authService } from "@/services/auth.service";

interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
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