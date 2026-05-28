import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name field is required" })
      .min(2, "Name must be at least 2 characters long")
      .max(50, "Name cannot exceed 50 characters")
      .trim(),
    email: z
      .string({ required_error: "Email field is required" })
      .email("Invalid email address format")
      .trim(),
    password: z
      .string({ required_error: "Password field is required" })
      .min(8, "Password must be at least 8 characters long")
      .max(64, "Password cannot exceed 64 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email field is required" })
      .email("Invalid email address format")
      .trim(),
    password: z
      .string({ required_error: "Password field is required" })
      .min(1, "Password cannot be blank"),
  }),
});

// Infer the TypeScript types directly from schemas for type safety in your controllers
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
