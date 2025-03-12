
import { z } from "zod";
import { pgTable, serial, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

// Database schema
export const features = pgTable('features', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  story: text('story').notNull(),
  scenarios: text('scenarios').notNull(),
  deleted: boolean('deleted').default(false).notNull(),
  generatedContent: text('generated_content'),
  manuallyEdited: boolean('manually_edited').default(false),
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
  id: z.string(),
  title: z.string(),
  story: z.string(),
  scenarios: z.array(z.string()),
  deleted: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

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
