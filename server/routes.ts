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

      // If scenarioCount changed or title changed, always regenerate
      if ((data.scenarioCount && data.scenarioCount !== currentFeature.scenarioCount) ||
          (data.title && data.title !== currentFeature.title)) {
        console.log(`Regenerating content for feature ${id} with title: ${data.title || currentFeature.title} and ${data.scenarioCount || currentFeature.scenarioCount} scenarios`);

        // First update the feature's basic info
        await storage.updateFeature(id, {
          title: data.title,
          story: data.story,
          scenarioCount: data.scenarioCount,
        });

        // Then regenerate content with updated information
        const generatedContent = await generateFeature(
          data.title || currentFeature.title,
          data.story || currentFeature.story,
          data.scenarioCount || currentFeature.scenarioCount
        );

        const feature = await storage.updateFeature(id, {
          generatedContent,
          manuallyEdited: false,
        });

        return res.json(feature);
      }

      // Regular update without regenerating content
      const feature = await storage.updateFeature(id, {
        ...data,
        manuallyEdited: data.generatedContent ? true : currentFeature.manuallyEdited,
      });

      res.json(feature);
    } catch (error: any) {
      console.error('Error updating feature:', error);
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