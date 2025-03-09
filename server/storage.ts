import { features, type Feature, type InsertFeature } from "@shared/schema";

export interface IStorage {
  createFeature(feature: InsertFeature & { generatedContent: string }): Promise<Feature>;
  getFeature(id: number): Promise<Feature | undefined>;
  getAllFeatures(): Promise<Feature[]>;
}

export class MemStorage implements IStorage {
  private features: Map<number, Feature>;
  private currentId: number;

  constructor() {
    this.features = new Map();
    this.currentId = 1;
  }

  async createFeature(
    insertFeature: InsertFeature & { generatedContent: string }
  ): Promise<Feature> {
    const id = this.currentId++;
    const feature: Feature = { ...insertFeature, id };
    this.features.set(id, feature);
    return feature;
  }

  async getFeature(id: number): Promise<Feature | undefined> {
    return this.features.get(id);
  }

  async getAllFeatures(): Promise<Feature[]> {
    return Array.from(this.features.values()).sort((a, b) => b.id - a.id);
  }
}

export const storage = new MemStorage();