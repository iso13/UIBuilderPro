import { z } from "zod";

// Feature schema and types
export const featureSchema = z.object({
  id: z.string(),
  title: z.string(),
  story: z.string(),
  scenarios: z.array(z.string()),
  deleted: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type Feature = z.infer<typeof featureSchema>;

export type FeatureFilter = "active" | "deleted" | "all";

// Authentication schemas
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  isAdmin: z.boolean().default(false),
});

export type User = z.infer<typeof userSchema>;

// OpenAI schema
export const featureGenRequestSchema = z.object({
  title: z.string(),
  description: z.string(),
});

// Analytics schema
export const analyticsEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  eventType: z.enum(["feature_generation", "feature_view"]),
  featureId: z.string().nullable(),
  successful: z.boolean(),
  errorMessage: z.string().nullable(),
  scenarioCount: z.number().nullable(),
  createdAt: z.string(),
});

export type Analytics = z.infer<typeof analyticsEventSchema>;