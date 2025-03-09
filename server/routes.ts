import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFeature } from "./openai";
import { insertFeatureSchema, updateFeatureSchema, insertAnalyticsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/features", async (_req, res) => {
    try {
      const features = await storage.getAllFeatures();
      res.json(features);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/features/generate", async (req, res) => {
    try {
      const data = insertFeatureSchema.parse(req.body);

      // Track generation attempt
      const analyticsEvent = {
        eventType: "feature_generation",
        scenarioCount: data.scenarioCount,
        successful: false,
        errorMessage: null,
      };

      try {
        const generatedContent = await generateFeature(
          data.title,
          data.story,
          data.scenarioCount
        );

        const feature = await storage.createFeature({
          ...data,
          generatedContent,
          manuallyEdited: false,
        });

        // Update analytics with success
        analyticsEvent.successful = true;
        await storage.trackEvent(analyticsEvent);

        res.json(feature);
      } catch (error: any) {
        // Update analytics with error
        analyticsEvent.errorMessage = error.message;
        await storage.trackEvent(analyticsEvent);
        throw error;
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/features/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = updateFeatureSchema.parse(req.body);

      // Get the current feature
      const currentFeature = await storage.getFeature(id);
      if (!currentFeature) {
        return res.status(404).json({ message: "Feature not found" });
      }

      // Check if scenario count has changed and feature wasn't manually edited
      const scenarioCountChanged = data.scenarioCount && data.scenarioCount !== currentFeature.scenarioCount;
      const shouldRegenerateContent = scenarioCountChanged && !currentFeature.manuallyEdited;

      if (shouldRegenerateContent) {
        // Regenerate content with new scenario count
        const generatedContent = await generateFeature(
          currentFeature.title,
          currentFeature.story,
          data.scenarioCount!
        );

        const feature = await storage.updateFeature(id, {
          ...data,
          generatedContent,
          manuallyEdited: false,
        });
        res.json(feature);
      } else {
        // Regular update without regenerating content
        const feature = await storage.updateFeature(id, {
          ...data,
          manuallyEdited: data.generatedContent ? true : currentFeature.manuallyEdited,
        });
        res.json(feature);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/analytics", async (_req, res) => {
    try {
      const analyticsData = await storage.getAnalytics();
      res.json(analyticsData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}