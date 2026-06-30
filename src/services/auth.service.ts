import { api } from "@/lib/api";
import { LoginFormData } from "@/lib/validation";

export async function login(data: LoginFormData) {
  const response = await api.post("/auth/login", data);

  return response.data;
}