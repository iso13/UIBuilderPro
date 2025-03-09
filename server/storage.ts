import { features, analytics, type Feature, type InsertFeature, type Analytics, type InsertAnalytics } from "@shared/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString!);
const db = drizzle(client);

export interface IStorage {
  createFeature(feature: InsertFeature & { generatedContent: string }): Promise<Feature>;
  getFeature(id: number): Promise<Feature | undefined>;
  getAllFeatures(): Promise<Feature[]>;
  trackEvent(event: InsertAnalytics): Promise<Analytics>;
  getAnalytics(): Promise<Analytics[]>;
}

export class PostgresStorage implements IStorage {
  async createFeature(
    insertFeature: InsertFeature & { generatedContent: string }
  ): Promise<Feature> {
    const [feature] = await db.insert(features).values(insertFeature).returning();
    return feature;
  }

  async getFeature(id: number): Promise<Feature | undefined> {
    const [feature] = await db.select().from(features).where(eq(features.id, id));
    return feature;
  }

  async getAllFeatures(): Promise<Feature[]> {
    return await db.select().from(features).orderBy(features.id);
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