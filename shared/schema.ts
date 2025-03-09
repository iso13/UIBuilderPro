import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  story: text("story").notNull(),
  scenarioCount: integer("scenario_count").notNull(),
  generatedContent: text("generated_content"),
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

export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type Feature = typeof features.$inferSelect;
