import { z } from "zod";
import { pgTable, serial, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

// Database schema
export const features = pgTable('features', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  story: text('story').notNull(),
  scenarios: text('scenarios'),
  deleted: boolean('deleted').default(false).notNull(),
  generatedContent: text('generated_content'),
  manuallyEdited: boolean('manually_edited').default(false),
  scenarioCount: integer('scenario_count'),
  userId: integer('user_id'),
  activeEditor: text('active_editor'),
  activeEditorTimestamp: timestamp('active_editor_timestamp'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isAdmin: boolean('is_admin').default(false).notNull(),
});

export const analytics = pgTable('analytics', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  eventType: text('event_type').notNull(),
  featureId: integer('feature_id').references(() => features.id),
  successful: boolean('successful').default(true).notNull(),
  errorMessage: text('error_message'),
  scenarioCount: integer('scenario_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types
export type Feature = typeof features.$inferSelect;
export type InsertFeature = typeof features.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;

// Feature schema and types
export const featureSchema = z.object({
  id: z.number(),
  title: z.string(),
  story: z.string(),
  scenarios: z.string().optional(),
  deleted: z.boolean().default(false),
  generatedContent: z.string().nullable(),
  manuallyEdited: z.boolean().default(false),
  scenarioCount: z.number().nullable(),
  userId: z.number().nullable(),
  activeEditor: z.string().nullable(),
  activeEditorTimestamp: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const createFeatureSchema = featureSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  activeEditor: true,
  activeEditorTimestamp: true,
});

export type FeatureFilter = "active" | "deleted" | "all";

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof signupSchema>;

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