import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFeature } from "./openai";
import { insertFeatureSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/features/generate", async (req, res) => {
    try {
      const data = insertFeatureSchema.parse(req.body);

      const generatedContent = await generateFeature(
        data.title,
        data.story,
        data.scenarioCount
      );

      const feature = await storage.createFeature({
        ...data,
        generatedContent,
      });

      res.json(feature);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}