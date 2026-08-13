import { create } from "zustand";
import { User } from "@/types/user";

interface AuthStore {

    user: User | null;

    token: string | null;

    setUser: (user: User | null) => void;

    setToken: (token: string | null) => void;

    logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({

    user: null,

    token: null,

    setUser: (user) => set({ user }),

    setToken: (token) => {

        if (typeof window !== "undefined") {

            if (token) {

                localStorage.setItem("access_token", token);

            } else {

                localStorage.removeItem("access_token");

            }

        }

        set({ token });

    },

    logout: () => {

        if (typeof window !== "undefined") {

            localStorage.removeItem("access_token");

        }

        set({

            user: null,

            token: null,

        });

    },

}));