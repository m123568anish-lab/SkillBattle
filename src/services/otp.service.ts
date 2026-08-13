import { api } from "@/lib/api";

export async function verifyOTP(code: string) {
  const response = await api.post("/auth/verify-email", {
    code,
  });

  return response.data;
}

export async function resendOTP() {
  const response = await api.post("/auth/resend-otp");

  return response.data;
}