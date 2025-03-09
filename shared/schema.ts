import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  story: text("story").notNull(),
  scenarioCount: integer("scenario_count").notNull(),
  generatedContent: text("generated_content"),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // 'feature_generation', 'feature_view'
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
  });

export const insertAnalyticsSchema = createInsertSchema(analytics)
  .pick({
    eventType: true,
    scenarioCount: true,
    successful: true,
    errorMessage: true,
  });

export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type Feature = typeof features.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;