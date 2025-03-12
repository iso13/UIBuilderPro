
import { features, analytics, users, type Feature, type InsertFeature, type Analytics, type InsertAnalytics, type User } from "@shared/schema";
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
  // User management
  createUser(user: { email: string; passwordHash: string; isAdmin: boolean }): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Feature management
  createFeature(feature: InsertFeature & { generatedContent: string, manuallyEdited?: boolean }): Promise<Feature>;
  getFeature(id: number): Promise<Feature | undefined>;
  getAllFeatures(includeDeleted?: boolean): Promise<Feature[]>;
  updateFeature(id: number, feature: Partial<InsertFeature & { generatedContent?: string, manuallyEdited?: boolean }>): Promise<Feature>;
  softDeleteFeature(id: number): Promise<Feature>;
  restoreFeature(id: number): Promise<Feature>;
  findFeatureByTitle(title: string): Promise<Feature | undefined>;
  permanentlyDeleteFeature(id: number): Promise<boolean>;

  // Analytics
  trackEvent(event: InsertAnalytics): Promise<Analytics>;
  getAnalytics(userId?: number): Promise<Analytics[]>;
}

export class PostgresStorage implements IStorage {
  // User management methods
  async createUser(user: { email: string; passwordHash: string; isAdmin: boolean }): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Feature management methods
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
    const query = db.select().from(features);
    if (!includeDeleted) {
      return await query.where(eq(features.deleted, false));
    }
    return await query;
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
    return feature || null;
  }

  async permanentlyDeleteFeature(id: number): Promise<boolean> {
    const result = await db
      .delete(features)
      .where(eq(features.id, id));

    return result.rowCount > 0;
  }

  async findFeatureByTitle(title: string): Promise<Feature | undefined> {
    const [feature] = await db
      .select()
      .from(features)
      .where(ilike(features.title, title))
      .limit(1);
    return feature;
  }

  // Analytics methods
  async trackEvent(event: InsertAnalytics): Promise<Analytics> {
    const [analytic] = await db.insert(analytics).values(event).returning();
    return analytic;
  }

  async getAnalytics(userId?: number): Promise<Analytics[]> {
    if (userId) {
      return await db.select().from(analytics).where(eq(analytics.userId, userId)).orderBy(analytics.createdAt);
    }
    return await db.select().from(analytics).orderBy(analytics.createdAt);
  }
}

export const storage = new PostgresStorage();
