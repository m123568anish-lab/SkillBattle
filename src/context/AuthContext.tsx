"use client";

import {
    createContext,
    useContext,
    useEffect,
    ReactNode,
} from "react";

import { useAuthStore } from "../store/authStore";

interface AuthContextType {
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    loading: true,
});

export function AuthProvider({

    children,

}:{

    children: ReactNode;

}) {

    const {

        loading,

        loadUser,

    } = useAuthStore();

    useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
        loadUser();
    } else {
        useAuthStore.setState({
            loading: false,
            user: null,
            isAuthenticated: false,
        });
    }
}, [loadUser]);

    return (

        <AuthContext.Provider
            value={{
                loading,
            }}
        >

            {children}

        </AuthContext.Provider>

    );

}

export function useAuthContext() {

    return useContext(AuthContext);

}