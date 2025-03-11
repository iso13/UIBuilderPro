import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  story: text("story").notNull(),
  scenarioCount: integer("scenario_count").notNull(),
  generatedContent: text("generated_content"),
  manuallyEdited: boolean("manually_edited").default(false).notNull(),
  deleted: boolean("deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  scenarioCount: integer("scenario_count"),
  successful: boolean("successful").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = loginSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertFeatureSchema = createInsertSchema(features)
  .pick({
    title: true,
    story: true,
    scenarioCount: true,
  })
  .extend({
    title: z.string().min(1, "Title is required"),
    story: z.string().min(10, "Story must be at least 10 characters"),
    scenarioCount: z.number().min(1).max(10),
    generatedContent: z.string().optional(),
  });

export const updateFeatureSchema = insertFeatureSchema.partial().extend({
  generatedContent: z.string().min(1, "Feature content is required"),
});

export const insertAnalyticsSchema = createInsertSchema(analytics)
  .pick({
    eventType: true,
    scenarioCount: true,
    successful: true,
    errorMessage: true,
  });

export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type UpdateFeature = z.infer<typeof updateFeatureSchema>;
export type Feature = typeof features.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type User = typeof users.$inferSelect;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export type SortOption = "title" | "date";

export type FeatureFilter = "all" | "active" | "deleted";