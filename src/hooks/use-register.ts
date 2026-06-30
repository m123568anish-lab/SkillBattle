"use client";

import { useState } from "react";

import { register } from "@/services/auth.service";

import { RegisterFormData } from "@/lib/validation";

export function useRegister() {
  const [loading, setLoading] = useState(false);

  async function signUp(
    data: RegisterFormData
  ) {
    try {
      setLoading(true);

      return await register(data);
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    signUp,
  };
}