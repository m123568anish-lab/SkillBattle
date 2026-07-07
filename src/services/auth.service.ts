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
    {
      email: data.email,
      password: data.password,
    }
  );

  return response.data;
}

export async function register(
  data: RegisterFormData
) {
  const response = await api.post(
    "/auth/register",
    {
      username: data.name.trim().toLowerCase().replace(/\s+/g, "_"),
      email: data.email,
      full_name: data.name,
      password: data.password,
    }
  );

  return response.data;
}