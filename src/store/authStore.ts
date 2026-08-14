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

    ): Promise<void>;

    logout(): Promise<void>;

    loadUser(): Promise<void>;
    updateUserPartial(fields: Partial<User>): void;
}

export const useAuthStore = create<AuthState>(

(set)=>({

    user:null,

    loading:true,

    isAuthenticated:false,

    async login(data){

        set({

            loading:true,

        });

        try{

            const user=

                await authService.login(

                    data,

                );

            set({

                user,

                loading:false,

                isAuthenticated:true,

            });

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

        set({

            user:null,

            isAuthenticated:false,

        });

    },

    async loadUser(){

        set({ loading: true });

        try{

            const user=

                await authService.getCurrentUser();

            set({

                user,

                isAuthenticated:true,

            });

        }

        catch{

            set({

                user:null,

                isAuthenticated:false,

            });

        }

        finally{
            set({ loading: false });
        }
    },
    updateUserPartial(fields) {
        set((state) => ({
            user: state.user ? { ...state.user, ...fields } : null
        }));
    }
}));