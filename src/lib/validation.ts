import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email("Enter a valid email"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters"),

    email: z
      .string()
      .email("Enter a valid email"),

    password: z
      .string()
      .min(8, "Minimum 8 characters"),

    confirmPassword: z.string(),

    acceptTerms: z.boolean().refine((v) => v === true, {
      message: "Accept Terms & Conditions",
    }),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Passwords do not match",
    }
  );

export type LoginFormData = z.infer<
  typeof loginSchema
>;

export type RegisterFormData = z.infer<
  typeof registerSchema
>;