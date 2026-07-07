"use client";

import { useState } from "react";
import { login } from "@/services/auth.service";

export function useLogin() {
  const [loading, setLoading] = useState(false);

  async function signIn(data: {
    email: string;
    password: string;
  }) {
    try {
      setLoading(true);

      const response = await login(data);

      localStorage.setItem(
        "accessToken",
        response.tokens.access_token
      );

      localStorage.setItem(
        "access_token",
        response.tokens.access_token
      );

      localStorage.setItem(
        "refreshToken",
        response.tokens.refresh_token
      );

      return response;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    signIn,
  };
}