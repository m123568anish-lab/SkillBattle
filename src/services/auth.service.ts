import { api } from "@/lib/api";

import {
  LoginFormData,
  RegisterFormData,
} from "@/lib/validation";

export async function login(
  data: LoginFormData
) {
  const response = await api.post(
    "/auth/login",
    data
  );

  return response.data;
}

export async function register(
  data: RegisterFormData
) {
  const response = await api.post(
    "/auth/register",
    data
  );

  return response.data;
}