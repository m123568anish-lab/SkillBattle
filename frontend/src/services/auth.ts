import { api } from "@/lib/api";

import {
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    User,
} from "@/types/user";

class AuthService {

    login(data: LoginRequest) {

        return api.post<TokenResponse>(

            "/auth/login",

            data,

        );

    }

    register(data: RegisterRequest) {

        return api.post<User>(

            "/auth/register",

            data,

        );

    }

    me() {

        return api.get<User>(

            "/auth/me",

        );

    }

    logout() {

        localStorage.removeItem(

            "access_token",

        );
    }

}

export const authService = new AuthService();