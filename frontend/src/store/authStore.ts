import { create } from "zustand";

import {

    LoginRequest,

    User,

} from "@/types/auth";

import {

    authService,

} from "@/services/auth.service";

interface AuthState {

    user: User | null;

    loading: boolean;

    isAuthenticated: boolean;

    login(

        data: LoginRequest,

    ): Promise<User>;

    logout(): Promise<void>;

    loadUser(): Promise<void>;
    updateUserPartial(fields: Partial<User>): void;
}

function getInitialUser(): User | null {
    if (typeof window === "undefined") return null;
    try {
        const stored = localStorage.getItem("skillbattle_user_cache");
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {
        // Ignore JSON parse errors in localStorage
    }
    return null;
}

const initialCachedUser = getInitialUser();

let activeLoadUserPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>(
(set)=>({

    user: initialCachedUser,

    loading: !initialCachedUser,

    isAuthenticated: Boolean(initialCachedUser),

    async login(data){

        set({

            loading:true,

        });

        try{

            const user=

                await authService.login(

                    data,

                );

            if (typeof window !== "undefined") {
                try {
                    localStorage.setItem("skillbattle_user_cache", JSON.stringify(user));
                } catch {}
            }

            set({

                user,

                loading:false,

                isAuthenticated:true,

            });
            return user;

        }

        catch(e){

            set({

                loading:false,

            });

            throw e;

        }

    },

    async logout(){

        await authService.logout();

        if (typeof window !== "undefined") {
            try {
                localStorage.removeItem("skillbattle_user_cache");
                localStorage.removeItem("skillbattle_dashboard_cache");
            } catch {}
        }

        set({

            user:null,

            isAuthenticated:false,

            loading:false,

        });

    },

    async loadUser(){
        if (activeLoadUserPromise) {
            return activeLoadUserPromise;
        }

        // If we don't have a cached user, show loading. If we do, validate in background.
        set((state) => ({ loading: !state.user }));

        activeLoadUserPromise = (async () => {
            try {
                const user = await authService.getCurrentUser();
                if (typeof window !== "undefined") {
                    try {
                        localStorage.setItem("skillbattle_user_cache", JSON.stringify(user));
                    } catch {}
                }
                set({
                    user,
                    isAuthenticated: true,
                });
            } catch {
                if (typeof window !== "undefined") {
                    try {
                        localStorage.removeItem("skillbattle_user_cache");
                    } catch {}
                }
                set({
                    user: null,
                    isAuthenticated: false,
                });
            } finally {
                set({ loading: false });
                activeLoadUserPromise = null;
            }
        })();

        return activeLoadUserPromise;
    },
    updateUserPartial(fields) {
        set((state) => {
            if (!state.user) return { user: null };
            const updated = {
                ...state.user,
                ...fields,
                avatar_url: fields.avatar_url ?? fields.avatar ?? state.user.avatar_url ?? state.user.avatar ?? null,
            };
            if (typeof window !== "undefined") {
                try {
                    localStorage.setItem("skillbattle_user_cache", JSON.stringify(updated));
                } catch {}
            }
            return { user: updated };
        });
    }
}));