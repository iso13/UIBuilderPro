import { features, analytics, users, type Feature, type InsertFeature, type Analytics, type User } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Create a new postgres client with SSL configuration for Replit
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString!, {
  ssl: 'require',
});
const db = drizzle(client);

type FeatureFilter = "active" | "deleted" | "all";

export class PostgresStorage {
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
    console.log("Getting all features, includeDeleted:", includeDeleted);
    try {
      let query = db.select().from(features);

      if (!includeDeleted) {
        query = query.where(eq(features.deleted, false));
      }

      const result = await query;
      console.log("Features query result:", result);

      return result || [];
    } catch (error) {
      console.error("Error in getAllFeatures:", error);
      return [];
    }
  }

  async updateFeature(id: number, updateData: Partial<InsertFeature & { generatedContent?: string, manuallyEdited?: boolean }>): Promise<Feature> {
    console.log('Updating feature:', id, 'with data:', updateData);
    try {
      const [feature] = await db
        .update(features)
        .set({ 
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(features.id, id))
        .returning();

      console.log('Updated feature:', feature);
      if (!feature) {
        throw new Error('Feature not found or update failed');
      }
      return feature;
    } catch (error) {
      console.error('Error updating feature:', error);
      throw error;
    }
  }

  async softDeleteFeature(id: number): Promise<Feature> {
    const [feature] = await db
      .update(features)
      .set({ deleted: true, updatedAt: new Date() })
      .where(eq(features.id, id))
      .returning();
    return feature;
  }

  async restoreFeature(id: number): Promise<Feature> {
    const [feature] = await db
      .update(features)
      .set({ 
        deleted: false, 
        updatedAt: new Date() 
      })
      .where(eq(features.id, id))
      .returning();
    return feature;
  }

  async findFeatureByTitle(title: string): Promise<Feature | undefined> {
    const [feature] = await db
      .select()
      .from(features)
      .where(eq(features.title, title)) 
      .limit(1);
    return feature;
  }

  async permanentlyDeleteFeature(id: number): Promise<boolean> {
    const result = await db
      .delete(features)
      .where(eq(features.id, id))
      .returning();
    return result.length > 0;
  }

  async getFeatures(userId: number, filter: FeatureFilter = "active"): Promise<Feature[]> {
    try {
      console.log(`Getting features for userId: ${userId} with filter: ${filter}`);
      let conditions = [];

      if (filter === "active") {
        conditions.push(eq(features.deleted, false));
      } else if (filter === "deleted") {
        conditions.push(eq(features.deleted, true));
      }
      // filter === "all" doesn't need additional conditions

      const result = await db
        .select()
        .from(features)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(features.createdAt);

      console.log(`Retrieved ${result?.length || 0} features for filter: ${filter}`);
      return result || [];
    } catch (error) {
      console.error("Error in getFeatures:", error);
      return [];
    }
  }

  // Analytics methods
  async trackEvent(event: Analytics): Promise<Analytics> {
    const [analytic] = await db.insert(analytics).values(event).returning();
    return analytic;
  }

  async getAnalytics(userId?: number): Promise<Analytics[]> {
    console.log("Getting analytics for user:", userId);
    try {
      if (userId) {
        const results = await db
          .select({
            id: analytics.id,
            userId: analytics.userId,
            eventType: analytics.eventType,
            featureId: analytics.featureId,
            successful: analytics.successful,
            errorMessage: analytics.errorMessage,
            scenarioCount: analytics.scenarioCount,
            createdAt: analytics.createdAt,
            featureTitle: features.title
          })
          .from(analytics)
          .leftJoin(features, eq(analytics.featureId, features.id))
          .where(eq(analytics.userId, userId))
          .orderBy(analytics.createdAt);

        return results;
      }

      const results = await db
        .select({
          id: analytics.id,
          userId: analytics.userId,
          eventType: analytics.eventType,
          featureId: analytics.featureId,
          successful: analytics.successful,
          errorMessage: analytics.errorMessage,
          scenarioCount: analytics.scenarioCount,
          createdAt: analytics.createdAt,
          featureTitle: features.title
        })
        .from(analytics)
        .leftJoin(features, eq(analytics.featureId, features.id))
        .orderBy(analytics.createdAt);

      return results;
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return [];
    }
  }

  async logAnalyticsEvent(event: {
    userId: number;
    eventType: string;
    featureId: number;
    successful: boolean;
    errorMessage: string | null;
    scenarioCount: number | null;
  }): Promise<Analytics> {
    const analyticsEvent = {
      userId: event.userId,
      eventType: event.eventType,
      featureId: event.featureId,
      successful: event.successful,
      errorMessage: event.errorMessage,
      scenarioCount: event.scenarioCount,
      createdAt: new Date(),
    };

    const [analytic] = await db.insert(analytics).values(analyticsEvent).returning();
    return analytic;
  }
}

export const storage = new PostgresStorage();