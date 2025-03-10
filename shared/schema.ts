import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type FeatureStatus = "DRAFT" | "APPROVED" | "REJECTED" | "EXPORTED";

export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  story: text("story").notNull(),
  scenarioCount: integer("scenario_count").notNull(),
  generatedContent: text("generated_content"),
  manuallyEdited: boolean("manually_edited").default(false).notNull(),
  deleted: boolean("deleted").default(false).notNull(),
  status: text("status").notNull().$type<FeatureStatus>().default("DRAFT"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  scenarioCount: integer("scenario_count"),
  successful: boolean("successful").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
    status: z.enum(["DRAFT", "APPROVED", "REJECTED", "EXPORTED"]).default("DRAFT"),
  });

export const updateFeatureSchema = insertFeatureSchema.partial().extend({
  generatedContent: z.string().min(1, "Feature content is required"),
  status: z.enum(["DRAFT", "APPROVED", "REJECTED", "EXPORTED"]).optional(),
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

// Sorting options
export type SortOption = "title" | "date";

// Filter options for features
export type FeatureFilter = "all" | "active" | "deleted";