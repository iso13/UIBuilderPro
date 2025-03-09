import { features, analytics, type Feature, type InsertFeature, type Analytics, type InsertAnalytics } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Create a new postgres client with SSL configuration for Replit
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString!, {
  ssl: 'require',
});
const db = drizzle(client);

export interface IStorage {
  createFeature(feature: InsertFeature & { generatedContent: string, manuallyEdited?: boolean }): Promise<Feature>;
  getFeature(id: number): Promise<Feature | undefined>;
  getAllFeatures(includeDeleted?: boolean): Promise<Feature[]>;
  updateFeature(id: number, feature: Partial<InsertFeature & { generatedContent?: string, manuallyEdited?: boolean }>): Promise<Feature>;
  softDeleteFeature(id: number): Promise<Feature>;
  restoreFeature(id: number): Promise<Feature>;
  trackEvent(event: InsertAnalytics): Promise<Analytics>;
  getAnalytics(): Promise<Analytics[]>;
  findFeatureByTitle(title: string): Promise<Feature | undefined>;
}

export class PostgresStorage implements IStorage {
  async createFeature(
    insertFeature: InsertFeature & { generatedContent: string, manuallyEdited?: boolean }
  ): Promise<Feature> {
    const [feature] = await db.insert(features).values(insertFeature).returning();
    return feature;
  }

  async getFeature(id: number): Promise<Feature | undefined> {
    const [feature] = await db.select().from(features).where(eq(features.id, id));
    return feature;
  }

  async getAllFeatures(includeDeleted: boolean = false): Promise<Feature[]> {
    let query = db.select().from(features);
    if (!includeDeleted) {
      query = query.where(eq(features.deleted, false));
    }
    return await query.orderBy(features.id);
  }

  async updateFeature(id: number, updateData: Partial<InsertFeature & { generatedContent?: string, manuallyEdited?: boolean }>): Promise<Feature> {
    const [feature] = await db
      .update(features)
      .set(updateData)
      .where(eq(features.id, id))
      .returning();
    return feature;
  }

  async softDeleteFeature(id: number): Promise<Feature> {
    const [feature] = await db
      .update(features)
      .set({ deleted: true })
      .where(eq(features.id, id))
      .returning();
    return feature;
  }

  async restoreFeature(id: number): Promise<Feature> {
    const [feature] = await db
      .update(features)
      .set({ deleted: false })
      .where(eq(features.id, id))
      .returning();
    return feature;
  }

  async findFeatureByTitle(title: string): Promise<Feature | undefined> {
    const [feature] = await db
      .select()
      .from(features)
      .where(ilike(features.title, title))
      .limit(1);
    return feature;
  }

  async trackEvent(event: InsertAnalytics): Promise<Analytics> {
    const [analytic] = await db.insert(analytics).values(event).returning();
    return analytic;
  }

  async getAnalytics(): Promise<Analytics[]> {
    return await db.select().from(analytics).orderBy(analytics.createdAt);
  }
}

export const storage = new PostgresStorage();