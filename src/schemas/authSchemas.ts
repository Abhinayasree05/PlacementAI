/**
 * schemas/authSchemas.ts
 * Zod schemas backing every auth form via @hookform/resolvers/zod.
 */
import { z } from "zod";

const passwordRule = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[a-z]/, "At least one lowercase letter")
  .regex(/[0-9]/, "At least one number")
  .regex(/[^A-Za-z0-9]/, "At least one special character");

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    phoneNumber: z
      .string()
      .min(10, "Enter a valid phone number")
      .regex(/^\+?[0-9]{10,13}$/, "Digits only, 10–13 characters"),
    password: passwordRule,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    college: z.string().min(1, "College name is required"),
    department: z.string().min(1, "Department is required"),
    year: z.string().min(1, "Select your year"),
    rollNumber: z.string().min(1, "Roll number is required"),
    gender: z.string().optional(),
    acceptTerms: z.boolean().refine((v) => v === true, "You must accept the Terms & Conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SignupFormValues = z.infer<typeof signupSchema>;

export const forgotPasswordEmailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});
export type ForgotPasswordEmailValues = z.infer<typeof forgotPasswordEmailSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: passwordRule,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const phoneNumberSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, "Enter a valid phone number")
    .regex(/^\+?[0-9]{10,13}$/, "Digits only, 10–13 characters"),
});
export type PhoneNumberValues = z.infer<typeof phoneNumberSchema>;

/** Used by the password-strength meter — same rules as passwordRule, scored 0-4. */
export function scorePassword(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0-4
}
