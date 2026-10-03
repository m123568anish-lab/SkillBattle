"use client";

import { useState } from "react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/auth";

interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    avatar: string;
    account_type: "STUDENT" | "COLLEGE" | "COMPANY";
    organization_name: string;
    organization_code: string;
    industry: string;
    website: string;
    headquarters: string;
}

export function useRegister() {

    const [loading, setLoading] = useState(false);
    const login = useAuthStore((state) => state.login);

    async function signUp(data: RegisterFormData) {

        setLoading(true);

        try {
            const currentUser = useAuthStore.getState().user;
            if (currentUser && currentUser.email.toLowerCase() !== data.email.toLowerCase()) {
                await useAuthStore.getState().logout();
            }

            const emailPrefix = data.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") || "player";
            const username = (emailPrefix.length >= 3 ? emailPrefix : `${emailPrefix}_usr`).slice(0, 30);

            let registrationResult: unknown;
            if (data.account_type === "COLLEGE") {
                registrationResult = await authService.registerCollege({
                    name: data.organization_name,
                    code: data.organization_code,
                    domain: data.email.split("@")[1] ?? "",
                    admin_name: data.name,
                    admin_email: data.email,
                    admin_password: data.password,
                });
            } else {
                registrationResult = await authService.register({
                    username,
                    full_name: data.name,
                    email: data.email,
                    password: data.password,
                    avatar_url: data.avatar,
                    account_type: data.account_type,
                });
            }

            let authenticatedUser: User | null = null;

            try {
                authenticatedUser = await login({
                    email: data.email,
                    password: data.password,
                    role: data.account_type,
                });
            } catch {
                // Registration can succeed even when sign-in must happen separately.
            }

            if (data.account_type === "COMPANY" && authenticatedUser) {
                await authService.registerCompany({
                    name: data.organization_name,
                    slug: data.organization_name
                        .trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, ""),
                    industry: data.industry,
                    website: data.website,
                    headquarters: data.headquarters,
                });
            }

            return { user: registrationResult, authenticatedUser };
        } finally {
            setLoading(false);
        }


    }

    return {

        loading,

        signUp,

    };

}